from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from uuid import uuid4

from app.db.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import (
    RoleEnum,
    TherapistMembership,
    TherapistMembershipStatusEnum,
    User,
)

def _unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:10]}@local.dev"


async def _create_therapist(email: str) -> int:
    async with AsyncSessionLocal() as db:
        u = User(
            tenant_id=1,
            email=email,
            hashed_password=hash_password("x123456!"),
            role=RoleEnum.THERAPIST,
            is_active=True,
            is_verified=True,
        )
        db.add(u)
        await db.commit()
        await db.refresh(u)
        return u.id


async def _set_membership(user_id: int, **values):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == user_id))
        m = result.scalar_one_or_none()
        if not m:
            m = TherapistMembership(user_id=user_id, plan_months=3, **values)
            db.add(m)
        else:
            for k, v in values.items():
                setattr(m, k, v)
        await db.commit()


@pytest.mark.asyncio
async def test_public_therapists_visibility_active_not_expired(async_client):
    uid = await _create_therapist(_unique_email("t-active"))
    now = datetime.now(timezone.utc)
    await _set_membership(
        uid,
        status=TherapistMembershipStatusEnum.ACTIVE,
        expires_at=now + timedelta(days=10),
        grace_until=None,
    )

    resp = await async_client.get("/public/therapists")
    assert resp.status_code == 200
    assert any(t["user_id"] == uid for t in resp.json())


@pytest.mark.asyncio
async def test_public_therapists_visibility_active_expired_not_visible(async_client):
    uid = await _create_therapist(_unique_email("t-expired"))
    now = datetime.now(timezone.utc)
    await _set_membership(
        uid,
        status=TherapistMembershipStatusEnum.ACTIVE,
        expires_at=now - timedelta(seconds=1),
        grace_until=None,
    )

    resp = await async_client.get("/public/therapists")
    assert resp.status_code == 200
    assert all(t["user_id"] != uid for t in resp.json())


@pytest.mark.asyncio
async def test_public_therapists_visibility_pending_with_grace_visible(async_client):
    uid = await _create_therapist(_unique_email("t-pending-grace"))
    now = datetime.now(timezone.utc)
    await _set_membership(
        uid,
        status=TherapistMembershipStatusEnum.PENDING,
        grace_until=now + timedelta(days=3),
        expires_at=None,
    )

    resp = await async_client.get("/public/therapists")
    assert resp.status_code == 200
    assert any(t["user_id"] == uid for t in resp.json())


@pytest.mark.asyncio
async def test_public_therapists_visibility_pending_grace_expired_not_visible(async_client):
    uid = await _create_therapist(_unique_email("t-pending-expired"))
    now = datetime.now(timezone.utc)
    await _set_membership(
        uid,
        status=TherapistMembershipStatusEnum.PENDING,
        grace_until=now - timedelta(seconds=1),
        expires_at=None,
    )

    resp = await async_client.get("/public/therapists")
    assert resp.status_code == 200
    assert all(t["user_id"] != uid for t in resp.json())


@pytest.mark.asyncio
async def test_public_therapists_visibility_inactive_not_visible(async_client):
    uid = await _create_therapist(_unique_email("t-inactive"))
    await _set_membership(uid, status=TherapistMembershipStatusEnum.INACTIVE, grace_until=None, expires_at=None)

    resp = await async_client.get("/public/therapists")
    assert resp.status_code == 200
    assert all(t["user_id"] != uid for t in resp.json())


@pytest.mark.asyncio
async def test_public_therapists_visibility_no_membership_not_visible(async_client):
    uid = await _create_therapist(_unique_email("t-nomem"))
    resp = await async_client.get("/public/therapists")
    assert resp.status_code == 200
    assert all(t["user_id"] != uid for t in resp.json())


@pytest.mark.asyncio
async def test_public_therapists_detail_visible_by_id(async_client):
    email = _unique_email("t-detail-ok")
    uid = await _create_therapist(email)
    now = datetime.now(timezone.utc)
    await _set_membership(
        uid,
        status=TherapistMembershipStatusEnum.PENDING,
        grace_until=now + timedelta(days=1),
        expires_at=None,
    )

    resp = await async_client.get(f"/public/therapists/{uid}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == uid
    assert body["email"] == email


@pytest.mark.asyncio
async def test_public_therapists_detail_not_visible_returns_404(async_client):
    uid = await _create_therapist(_unique_email("t-detail-no"))
    now = datetime.now(timezone.utc)
    await _set_membership(
        uid,
        status=TherapistMembershipStatusEnum.PENDING,
        grace_until=now - timedelta(seconds=1),
        expires_at=None,
    )

    resp = await async_client.get(f"/public/therapists/{uid}")
    assert resp.status_code == 404


