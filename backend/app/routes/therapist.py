"""Therapist routes (membership + dashboard)."""

import logging
import os
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.middlewares.auth import require_roles
from app.models import RoleEnum, User, TherapistMembership, TherapistMembershipStatusEnum
from app.middlewares.auth import get_current_user
from app.schemas import TherapistMembershipCheckoutRequest, TherapistMembershipCheckoutResponse, TherapistMembershipResponse
from app.core.config import get_settings
from app.services.mercadopago import create_membership_preapproval
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from sqlalchemy import select
from datetime import datetime, timezone
from datetime import timedelta
from app.core.membership_plans import MEMBERSHIP_PLANS, GRACE_DAYS, MP_CURRENCY_ID


router = APIRouter(prefix="/therapist", tags=["therapist"])
logger = logging.getLogger(__name__)

async def _get_membership(db: AsyncSession, user_id: int) -> TherapistMembership | None:
    result = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == user_id))
    return result.scalar_one_or_none()

@router.get("/dashboard")
async def therapist_dashboard(
    request: Request,
    user: User = Depends(get_current_user),
    _: User = Depends(require_roles(RoleEnum.THERAPIST)),
    db: AsyncSession = Depends(get_db),
) -> dict:
    membership = await _get_membership(db, user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")

    now = datetime.now(timezone.utc)
    warning = membership.status.value == "pending" and membership.grace_until is not None and membership.grace_until >= now
    blocked = membership.status.value == "inactive" or (
        membership.status.value == "pending" and membership.grace_until is not None and membership.grace_until < now
    )
    return {
        "status": "ok",
        "message": "Therapist dashboard",
        "user_id": user.id,
        "role": user.role.value,
        "membership_status": membership.status.value,
        "membership_warning": warning,
        "membership_blocked": blocked,
    }


@router.get("/membership", response_model=TherapistMembershipResponse)
async def get_membership(
    user: User = Depends(get_current_user),
    _: User = Depends(require_roles(RoleEnum.THERAPIST)),
    db: AsyncSession = Depends(get_db),
) -> TherapistMembershipResponse:
    membership = await _get_membership(db, user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")

    now = datetime.now(timezone.utc)
    warning = membership.status.value == "pending" and membership.grace_until is not None and membership.grace_until >= now

    return TherapistMembershipResponse(
        status=membership.status,
        plan_months=membership.plan_months,
        started_at=membership.started_at,
        expires_at=membership.expires_at,
        grace_until=membership.grace_until,
        warning=warning,
    )


@router.post("/membership/checkout", response_model=TherapistMembershipCheckoutResponse)
async def create_checkout(
    payload: TherapistMembershipCheckoutRequest,
    user: User = Depends(get_current_user),
    _: User = Depends(require_roles(RoleEnum.THERAPIST)),
    db: AsyncSession = Depends(get_db),
) -> TherapistMembershipCheckoutResponse:
    plan_months = payload.plan_months
    if plan_months not in MEMBERSHIP_PLANS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan_months")

    now = datetime.now(timezone.utc)

    membership = await _get_membership(db, user.id)
    if membership and membership.status.value == "active":
        if membership.expires_at is None or membership.expires_at >= now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Membership already active")

    if not membership:
        membership = TherapistMembership(user_id=user.id)
        db.add(membership)
        await db.flush()
        await db.refresh(membership)

    settings = get_settings()
    unit_price = MEMBERSHIP_PLANS[plan_months]
    # Mercado Pago Subscriptions (preapproval)

    base = settings.mp_back_url_base or settings.frontend_url
    back_url = f"{base}/therapist/dashboard"
    # Mercado Pago requires a publicly valid URL. `localhost` breaks in local dev.
    # In tests we allow localhost because Mercado Pago calls are mocked.
    if os.environ.get("TESTING") != "1" and ("localhost" in back_url or "127.0.0.1" in back_url):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Mercado Pago requires a public back_url. Set MP_BACK_URL_BASE to an https URL (e.g. ngrok pointing to the frontend).",
        )

    try:
        sub = create_membership_preapproval(
            settings,
            payer_email=user.email,
            # Source of truth for webhook: TherapistMembership.id (string)
            external_reference=str(membership.id),
            back_url=back_url,
            transaction_amount=unit_price,
            currency_id=MP_CURRENCY_ID,
        )
    except Exception as e:
        logger.exception("MP preapproval create failed (membership_id=%s)", membership.id)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Mercado Pago preapproval error") from e

    subscription_id = str(sub.get("id") or "")
    init_point = str(sub.get("init_point") or "")
    if not subscription_id or not init_point:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Mercado Pago preapproval error")

    # Always reset to pending on checkout attempt; webhook is the only activator.
    membership.status = TherapistMembershipStatusEnum.PENDING
    membership.plan_months = plan_months
    membership.started_at = None
    membership.expires_at = None
    membership.grace_until = now + timedelta(days=GRACE_DAYS)
    membership.mp_payment_id = None
    membership.mp_preference_id = None
    membership.mp_subscription_id = subscription_id
    membership.mp_checkout_url = init_point
    await db.commit()

    return TherapistMembershipCheckoutResponse(
        # Keep response keys stable even if internal implementation changed
        preference_id=subscription_id,
        init_point=init_point,
        checkout_url=init_point,
    )


