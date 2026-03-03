"""Webhook endpoints."""

import json
import logging
import hmac
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.database import get_db
from app.models import TherapistMembership, TherapistMembershipStatusEnum
from app.services.mercadopago import get_preapproval
from app.services.membership_service import activate_membership
from app.core.membership_plans import MP_CURRENCY_ID

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


def _parse_kv_header(value: str) -> dict[str, str]:
    """
    Parse headers like:
      - "ts=123,v1=abcdef"
      - "ts=123; v1=abcdef"
    into {"ts": "...", "v1": "..."}.
    """
    parts: list[str] = []
    for chunk in value.replace(";", ",").split(","):
        chunk = chunk.strip()
        if chunk:
            parts.append(chunk)
    out: dict[str, str] = {}
    for p in parts:
        if "=" in p:
            k, v = p.split("=", 1)
            out[k.strip().lower()] = v.strip()
    return out


def _verify_signature(
    secret: str,
    *,
    body: bytes,
    signature_header: str | None,
    request_id: str | None,
    data_id: str | None,
) -> None:
    if not secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MP_WEBHOOK_SECRET not configured")
    if not signature_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature")

    sig = signature_header.strip()

    # Variant A (common in Mercado Pago webhooks): "ts=...,v1=..." + x-request-id
    # We validate against a manifest, not against raw body.
    kv = _parse_kv_header(sig)
    if "ts" in kv and "v1" in kv:
        ts = kv.get("ts")
        v1 = kv.get("v1")
        if not ts or not v1 or not request_id or not data_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

        manifest = f"id:{data_id};request-id:{request_id};ts:{ts};".encode("utf-8")
        expected = hmac.new(secret.encode("utf-8"), manifest, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, v1):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")
        return

    # Variant B (legacy/tests): raw-body HMAC hexdigest (optionally "sha256=<hex>")
    if sig.startswith("sha256="):
        sig = sig.split("=", 1)[1]
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")


@router.post("/mercadopago")
async def mercadopago_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    settings = get_settings()
    secret = settings.mp_webhook_secret or settings.mercado_pago_webhook_token

    body = await request.body()

    # Parse payload early to support signature variants that need data.id
    payload: dict | None = None
    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception:
        payload = None

    # Best-effort extract of data.id for signature validation
    data_id = None
    if isinstance(payload, dict):
        data = payload.get("data") or {}
        if isinstance(data, dict) and data.get("id") is not None:
            data_id = str(data.get("id"))
        elif payload.get("id") is not None:
            data_id = str(payload.get("id"))
    data_id = data_id or request.query_params.get("id")

    try:
        _verify_signature(
            secret,
            body=body,
            signature_header=request.headers.get("x-signature"),
            request_id=request.headers.get("x-request-id"),
            data_id=data_id,
        )
    except HTTPException:
        # Safe debug log: never log secret nor full signature.
        logger.warning(
            "MP webhook signature invalid: has_sig=%s has_req_id=%s has_data_id=%s content_type=%s",
            bool(request.headers.get("x-signature")),
            bool(request.headers.get("x-request-id")),
            bool(data_id),
            request.headers.get("content-type"),
        )
        raise

    if payload is None:
        return {"ok": True}

    # Mercado Pago can send `type` or `topic` depending on configuration/product.
    event_kind = str(payload.get("type") or payload.get("topic") or request.query_params.get("topic") or "")

    # Only accept subscription/preapproval events for memberships; ignore everything else (always 200 OK)
    if event_kind not in ("subscription_preapproval", "preapproval"):
        return {"ok": True}

    data = payload.get("data") or {}
    subscription_id = None
    if isinstance(data, dict) and data.get("id") is not None:
        subscription_id = str(data["id"])
    elif payload.get("id") is not None:
        subscription_id = str(payload["id"])
    elif request.query_params.get("id"):
        subscription_id = str(request.query_params.get("id"))

    if not subscription_id:
        return {"ok": True}

    # Fetch subscription details from Mercado Pago (SDK). Never fail webhook on SDK errors.
    try:
        sub = get_preapproval(settings, subscription_id)
    except Exception:
        return {"ok": True}

    status_mp = str(sub.get("status") or "")
    if status_mp not in ("authorized", "cancelled", "paused"):
        return {"ok": True}

    # Validate currency when available (best-effort)
    auto = sub.get("auto_recurring") or {}
    if isinstance(auto, dict):
        currency = auto.get("currency_id")
        if currency is not None and str(currency) != MP_CURRENCY_ID:
            return {"ok": True}

    ext = sub.get("external_reference")
    if ext is None:
        return {"ok": True}

    try:
        membership_id = int(str(ext))
    except Exception:
        return {"ok": True}

    membership = await db.get(TherapistMembership, membership_id)
    if not membership:
        return {"ok": True}

    # Always record subscription id (best-effort)
    if not membership.mp_subscription_id:
        membership.mp_subscription_id = str(subscription_id)

    # payment id (if provided)
    payment_id = sub.get("payment_id")
    if payment_id is not None:
        membership.mp_payment_id = str(payment_id)

    # Idempotency: if already in the target state, do nothing.
    if status_mp == "authorized":
        if membership.status.value == "active":
            return {"ok": True}
        activate_membership(membership, now=datetime.now(timezone.utc))
    else:
        # cancelled / paused => inactive
        if membership.status.value == "inactive":
            return {"ok": True}
        membership.status = TherapistMembershipStatusEnum.INACTIVE
        membership.grace_until = None
    await db.commit()
    return {"ok": True}


