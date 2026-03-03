"""Mercado Pago subscriptions (preapproval) for therapist memberships.

Important:
- Memberships use **subscriptions (preapproval)**.
- Courses keep using **preferences (payments)** via `mercadopago_client.py` (do not touch).
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import Settings
from app.services.mercadopago_client import get_mp_access_token


logger = logging.getLogger(__name__)


def create_membership_preapproval(
    settings: Settings,
    *,
    payer_email: str,
    external_reference: str,
    back_url: str,
    transaction_amount: int,
    currency_id: str,
) -> dict[str, Any]:
    access_token = get_mp_access_token(settings)
    if not access_token:
        raise RuntimeError("MP_ACCESS_TOKEN is not configured")

    import mercadopago
    sdk = mercadopago.SDK(access_token)

    data = {
        "reason": "Membresía terapeuta Constelación Viva",
        "payer_email": payer_email,
        "external_reference": external_reference,
        "back_url": back_url,
        "auto_recurring": {
            "frequency": 1,
            "frequency_type": "months",
            "transaction_amount": float(transaction_amount),
            "currency_id": currency_id,
        },
        # NOTE: do NOT override account-level webhook here.
        # In local dev we rely on the webhook configured in Mercado Pago panel pointing to ngrok.
    }

    result = sdk.preapproval().create(data)
    if not isinstance(result, dict):
        raise RuntimeError("Mercado Pago SDK returned non-dict preapproval response")

    status = result.get("status")
    resp = result.get("response")

    # Helpful safe debug for real integrations (no secrets)
    if isinstance(status, int) and status >= 400:
        msg = ""
        if isinstance(resp, dict):
            msg = str(resp.get("message") or resp.get("error") or "")
        logger.warning(
            "MP preapproval create failed status=%s msg=%s external_reference=%s payer_email=%s currency=%s amount=%s",
            status,
            msg,
            external_reference,
            payer_email,
            currency_id,
            transaction_amount,
        )
        raise RuntimeError(f"Mercado Pago preapproval create failed (status={status})")

    if not isinstance(resp, dict):
        raise RuntimeError("Mercado Pago SDK returned unexpected preapproval response shape")

    return resp


def get_preapproval(settings: Settings, subscription_id: str) -> dict[str, Any]:
    access_token = get_mp_access_token(settings)
    if not access_token:
        raise RuntimeError("MP_ACCESS_TOKEN is not configured")

    import mercadopago  # official SDK

    sdk = mercadopago.SDK(access_token)
    result = sdk.preapproval().get(subscription_id)
    if not isinstance(result, dict) or "response" not in result:
        raise RuntimeError("Mercado Pago SDK returned unexpected preapproval get response")
    return result["response"]


