"""Therapist membership visibility helpers (Objetivo 2)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.models import TherapistMembership, TherapistMembershipStatusEnum


def is_membership_overdue(membership: TherapistMembership, now: Optional[datetime] = None) -> bool:
    """
    Overdue means: therapist should NOT be publicly visible.
    Mirrors the public visibility rule:
    - active is not overdue when expires_at is null or in the future
    - pending is not overdue when grace_until exists and is in the future
    - inactive is overdue
    """
    now = now or datetime.now(timezone.utc)

    if membership.status == TherapistMembershipStatusEnum.ACTIVE:
        if membership.expires_at is None:
            return False
        return membership.expires_at < now

    if membership.status == TherapistMembershipStatusEnum.PENDING:
        if membership.grace_until is None:
            return True
        return membership.grace_until < now

    return True


def is_therapist_public_visible(
    membership: TherapistMembership | None, now: Optional[datetime] = None
) -> bool:
    """
    Public visibility rule (source of truth: backend):
    Visible iff membership exists AND:
    - status == active and (expires_at is null or expires_at >= now)
      OR
    - status == pending and grace_until is not null and grace_until >= now
    """
    if membership is None:
        return False
    return not is_membership_overdue(membership, now=now)


