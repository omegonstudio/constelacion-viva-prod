"""Therapist membership domain logic (Objetivo 2)."""

from __future__ import annotations

import calendar
from datetime import datetime, timezone

from app.models import TherapistMembership, TherapistMembershipStatusEnum


def add_months(dt: datetime, months: int) -> datetime:
    """Add months keeping day clamped; expects timezone-aware datetime."""
    year = dt.year + (dt.month - 1 + months) // 12
    month = (dt.month - 1 + months) % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def activate_membership(membership: TherapistMembership, *, now: datetime | None = None) -> TherapistMembership:
    now = now or datetime.now(timezone.utc)
    membership.status = TherapistMembershipStatusEnum.ACTIVE
    membership.started_at = now
    membership.expires_at = add_months(now, membership.plan_months)
    membership.grace_until = None
    return membership


