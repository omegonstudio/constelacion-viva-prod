"""Therapist membership gating (Objetivo 2)."""

from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.middlewares.auth import get_current_user
from app.models import TherapistMembership, TherapistMembershipStatusEnum, User


async def get_membership(db: AsyncSession, user_id: int) -> TherapistMembership | None:
    result = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == user_id))
    return result.scalar_one_or_none()


def require_therapist_access():
    """
    Access rule:
    - active: allow
    - pending within grace: allow + warning in request.state.membership_warning
    - inactive or pending grace expired: block
    """

    async def checker(
        request: Request,
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> TherapistMembership:
        membership = await get_membership(db, user.id)
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership required")

        now = datetime.now(timezone.utc)

        if membership.status == TherapistMembershipStatusEnum.ACTIVE:
            if membership.expires_at and membership.expires_at <= now:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership expired")
            return membership

        if membership.status == TherapistMembershipStatusEnum.PENDING:
            if membership.grace_until and membership.grace_until >= now:
                request.state.membership_warning = True
                return membership
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership inactive")

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership inactive")

    return checker


def require_active_membership():
    """Only active (and not expired) can access."""

    async def checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> TherapistMembership:
        membership = await get_membership(db, user.id)
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership required")

        now = datetime.now(timezone.utc)

        if membership.status != TherapistMembershipStatusEnum.ACTIVE:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership inactive")

        if membership.expires_at and membership.expires_at <= now:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Membership expired")

        return membership

    return checker


