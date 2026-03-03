from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models import TherapistMembership, TherapistMembershipStatusEnum, User


async def login(async_client, email: str, password: str) -> str:
    resp = await async_client.post("/auth/login?tenant_id=1", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_checkout_preapproval_valid_plan_3(monkeypatch, async_client):
    token = await login(async_client, "therapist@local.dev", "therapist123!")

    def fake_create_sub(settings, *, payer_email: str, external_reference: str, back_url: str | None, transaction_amount: int, currency_id: str):
        assert payer_email == "therapist@local.dev"
        assert external_reference.isdigit()
        if back_url is not None:
            assert back_url.endswith("/therapist/dashboard")
        assert transaction_amount > 0
        assert currency_id == "ARS"
        return {"id": "sub_1", "init_point": "https://mp.test/subscription/checkout"}

    monkeypatch.setattr("app.routes.therapist.create_membership_preapproval", fake_create_sub)

    resp = await async_client.post(
        "/therapist/membership/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"plan_months": 3},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["checkout_url"] == "https://mp.test/subscription/checkout"
    # we keep keys stable even if internal impl changed
    assert body["preference_id"] == "sub_1"

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "therapist@local.dev"))
        therapist = result.scalar_one()
        result = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == therapist.id))
        m = result.scalar_one()
        assert m.status == TherapistMembershipStatusEnum.PENDING
        assert m.plan_months == 3
        assert m.grace_until is not None
        assert m.grace_until >= datetime.now(timezone.utc)
        assert m.mp_payment_id is None
        assert m.mp_subscription_id == "sub_1"
        assert m.mp_checkout_url == "https://mp.test/subscription/checkout"


@pytest.mark.asyncio
async def test_checkout_preapproval_invalid_plan_400(async_client):
    token = await login(async_client, "therapist@local.dev", "therapist123!")

    resp = await async_client.post(
        "/therapist/membership/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"plan_months": 9},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_checkout_preapproval_blocks_when_active(async_client):
    token = await login(async_client, "therapist@local.dev", "therapist123!")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "therapist@local.dev"))
        therapist = result.scalar_one()
        result = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == therapist.id))
        m = result.scalar_one()
        m.status = TherapistMembershipStatusEnum.ACTIVE
        m.expires_at = datetime.now(timezone.utc) + timedelta(days=10)
        await db.commit()

    resp = await async_client.post(
        "/therapist/membership/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"plan_months": 3},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_checkout_preapproval_user_not_therapist_403(async_client):
    token = await login(async_client, "admin@local.dev", "admin12345!")

    resp = await async_client.post(
        "/therapist/membership/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"plan_months": 3},
    )
    assert resp.status_code == 403


