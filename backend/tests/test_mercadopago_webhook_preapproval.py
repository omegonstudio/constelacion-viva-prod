import json
import hmac
import hashlib
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models import TherapistMembership, TherapistMembershipStatusEnum, User


def sign(body: bytes) -> str:
    return hmac.new(b"test_webhook_secret", body, hashlib.sha256).hexdigest()


async def get_membership_id() -> int:
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == "therapist@local.dev"))
        u = res.scalar_one()
        res = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == u.id))
        m = res.scalar_one()
        return m.id


@pytest.mark.asyncio
async def test_preapproval_webhook_invalid_signature_401(async_client):
    payload = {"type": "subscription_preapproval", "data": {"id": "sub_bad_sig"}}
    raw = json.dumps(payload).encode("utf-8")
    resp = await async_client.post(
        "/webhooks/mercadopago",
        content=raw,
        headers={"Content-Type": "application/json", "x-signature": "bad"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_preapproval_webhook_authorized_activates(monkeypatch, async_client):
    membership_id = await get_membership_id()
    sub_id = "sub_auth_1"

    # Ensure pending
    async with AsyncSessionLocal() as db:
        m = await db.get(TherapistMembership, membership_id)
        assert m is not None
        m.status = TherapistMembershipStatusEnum.PENDING
        m.grace_until = datetime.now(timezone.utc) + timedelta(days=3)
        m.mp_payment_id = None
        m.started_at = None
        m.expires_at = None
        await db.commit()

    def fake_get_preapproval(settings, subscription_id: str):
        assert subscription_id == sub_id
        return {
            "id": sub_id,
            "status": "authorized",
            "external_reference": str(membership_id),
            "payment_id": "pay_1",
            "auto_recurring": {"currency_id": "ARS"},
        }

    monkeypatch.setattr("app.routes.webhooks.get_preapproval", fake_get_preapproval)

    payload = {"type": "subscription_preapproval", "data": {"id": sub_id}}
    raw = json.dumps(payload).encode("utf-8")
    resp = await async_client.post(
        "/webhooks/mercadopago",
        content=raw,
        headers={"Content-Type": "application/json", "x-signature": sign(raw)},
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}

    async with AsyncSessionLocal() as db:
        m = await db.get(TherapistMembership, membership_id)
        assert m is not None
        assert m.status == TherapistMembershipStatusEnum.ACTIVE
        assert m.mp_payment_id == "pay_1"
        assert m.mp_subscription_id == sub_id
        assert m.started_at is not None
        assert m.expires_at is not None
        assert m.grace_until is None


@pytest.mark.asyncio
async def test_preapproval_webhook_duplicate_authorized_is_idempotent(monkeypatch, async_client):
    membership_id = await get_membership_id()
    sub_id = "sub_dup_1"

    def fake_get_preapproval(settings, subscription_id: str):
        return {
            "id": sub_id,
            "status": "authorized",
            "external_reference": str(membership_id),
            "payment_id": "pay_dup",
            "auto_recurring": {"currency_id": "ARS"},
        }

    monkeypatch.setattr("app.routes.webhooks.get_preapproval", fake_get_preapproval)

    payload = {"type": "subscription_preapproval", "data": {"id": sub_id}}
    raw = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json", "x-signature": sign(raw)}

    r1 = await async_client.post("/webhooks/mercadopago", content=raw, headers=headers)
    assert r1.status_code == 200

    async with AsyncSessionLocal() as db:
        m = await db.get(TherapistMembership, membership_id)
        assert m is not None
        started1 = m.started_at
        expires1 = m.expires_at

    r2 = await async_client.post("/webhooks/mercadopago", content=raw, headers=headers)
    assert r2.status_code == 200

    async with AsyncSessionLocal() as db:
        m = await db.get(TherapistMembership, membership_id)
        assert m is not None
        assert m.started_at == started1
        assert m.expires_at == expires1


@pytest.mark.asyncio
async def test_preapproval_webhook_cancelled_sets_inactive(monkeypatch, async_client):
    membership_id = await get_membership_id()
    sub_id = "sub_cancel_1"

    # Ensure active first
    async with AsyncSessionLocal() as db:
        m = await db.get(TherapistMembership, membership_id)
        assert m is not None
        m.status = TherapistMembershipStatusEnum.ACTIVE
        m.started_at = datetime.now(timezone.utc) - timedelta(days=1)
        m.expires_at = datetime.now(timezone.utc) + timedelta(days=10)
        await db.commit()

    def fake_get_preapproval(settings, subscription_id: str):
        return {
            "id": sub_id,
            "status": "cancelled",
            "external_reference": str(membership_id),
            "auto_recurring": {"currency_id": "ARS"},
        }

    monkeypatch.setattr("app.routes.webhooks.get_preapproval", fake_get_preapproval)

    payload = {"type": "subscription_preapproval", "data": {"id": sub_id}}
    raw = json.dumps(payload).encode("utf-8")
    resp = await async_client.post(
        "/webhooks/mercadopago",
        content=raw,
        headers={"Content-Type": "application/json", "x-signature": sign(raw)},
    )
    assert resp.status_code == 200

    async with AsyncSessionLocal() as db:
        m = await db.get(TherapistMembership, membership_id)
        assert m is not None
        assert m.status == TherapistMembershipStatusEnum.INACTIVE


