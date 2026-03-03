from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import AsyncSessionLocal
from app.models import (
    RoleEnum,
    TherapistMembership,
    TherapistMembershipStatusEnum,
    TherapistProfile,
    User,
)
from app.utils.slug import generate_unique_slug, slugify
from uuid import uuid4


def _unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:10]}@local.dev"


def _unique_slug(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:10]}"


async def _create_therapist_with_profile(email: str, display_name: str | None = None) -> int:
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

        p = TherapistProfile(
            user_id=u.id,
            tenant_id=u.tenant_id,
            display_name=display_name,
            bio=None,
            is_public=True,
        )
        db.add(p)
        await db.commit()
        await db.refresh(p)
        return u.id


async def _set_membership_visible(user_id: int):
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == user_id))
        m = result.scalar_one_or_none()
        if not m:
            m = TherapistMembership(
                user_id=user_id,
                status=TherapistMembershipStatusEnum.ACTIVE,
                plan_months=3,
                started_at=now,
                expires_at=now + timedelta(days=30),
            )
            db.add(m)
        else:
            m.status = TherapistMembershipStatusEnum.ACTIVE
            m.expires_at = now + timedelta(days=30)
            m.grace_until = None
        await db.commit()


async def _set_membership_not_visible(user_id: int):
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == user_id))
        m = result.scalar_one_or_none()
        if not m:
            m = TherapistMembership(
                user_id=user_id,
                status=TherapistMembershipStatusEnum.PENDING,
                plan_months=3,
                grace_until=now - timedelta(days=1),
            )
            db.add(m)
        else:
            m.status = TherapistMembershipStatusEnum.PENDING
            m.grace_until = now - timedelta(days=1)
        await db.commit()


async def _set_profile_slug(user_id: int, slug: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TherapistProfile).where(TherapistProfile.user_id == user_id))
        p = result.scalar_one()
        p.slug = slug
        await db.commit()


async def login(async_client, email: str, password: str) -> str:
    resp = await async_client.post("/auth/login?tenant_id=1", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_lookup_by_slug_visible_200(async_client):
    uid = await _create_therapist_with_profile(_unique_email("slug-ok"), display_name="María González")
    await _set_membership_visible(uid)
    slug = _unique_slug("maria-gonzalez")
    await _set_profile_slug(uid, slug)

    resp = await async_client.get(f"/public/therapists/{slug}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == uid
    assert body["slug"] == slug


@pytest.mark.asyncio
async def test_lookup_by_slug_not_visible_404(async_client):
    uid = await _create_therapist_with_profile(_unique_email("slug-no"), display_name="Carlos Méndez")
    await _set_membership_not_visible(uid)
    slug = _unique_slug("carlos-mendez")
    await _set_profile_slug(uid, slug)

    resp = await async_client.get(f"/public/therapists/{slug}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_lookup_by_slug_inexistent_404(async_client):
    resp = await async_client.get("/public/therapists/slug-que-no-existe")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_lookup_by_numeric_id_still_works(async_client):
    uid = await _create_therapist_with_profile(_unique_email("id-ok"), display_name="Lucía Fernández")
    await _set_membership_visible(uid)
    await _set_profile_slug(uid, _unique_slug("lucia-fernandez"))

    resp = await async_client.get(f"/public/therapists/{uid}")
    assert resp.status_code == 200
    assert resp.json()["user_id"] == uid


@pytest.mark.asyncio
async def test_slug_collision_generation():
    async with AsyncSessionLocal() as db:
        # create two therapist profiles in same tenant
        u1 = User(tenant_id=1, email=_unique_email("c1"), hashed_password=hash_password("x123456!"), role=RoleEnum.THERAPIST, is_active=True, is_verified=True)
        u2 = User(tenant_id=1, email=_unique_email("c2"), hashed_password=hash_password("x123456!"), role=RoleEnum.THERAPIST, is_active=True, is_verified=True)
        db.add_all([u1, u2])
        await db.commit()
        await db.refresh(u1)
        await db.refresh(u2)

        base = _unique_slug("ana-maria")
        p1 = TherapistProfile(user_id=u1.id, tenant_id=1, display_name="Ana María", slug=base, is_public=True)
        p2 = TherapistProfile(user_id=u2.id, tenant_id=1, display_name="Ana María", is_public=True)
        db.add_all([p1, p2])
        await db.commit()
        await db.refresh(p2)

        unique = await generate_unique_slug(base, db, tenant_id=1, exclude_profile_id=p2.id)
        assert unique == f"{base}-2"


