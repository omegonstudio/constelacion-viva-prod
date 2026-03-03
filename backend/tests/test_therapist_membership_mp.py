from datetime import datetime, timedelta, timezone

import pytest

from app.db.database import AsyncSessionLocal
from app.models import TherapistMembership, TherapistMembershipStatusEnum, User


async def login(async_client, email: str, password: str) -> str:
    resp = await async_client.post("/auth/login?tenant_id=1", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_membership_pending_and_dashboard_warning(async_client):
    token = await login(async_client, "therapist@local.dev", "therapist123!")

    dash = await async_client.get("/therapist/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dash.status_code == 200
    assert dash.json()["membership_status"] == "pending"
    assert dash.json()["membership_warning"] is True

    mem = await async_client.get("/therapist/membership", headers={"Authorization": f"Bearer {token}"})
    assert mem.status_code == 200
    assert mem.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_grace_expired_blocks_access(async_client):
    # force grace_until in past
    async with AsyncSessionLocal() as db:
        # find therapist user id
        result = await db.execute(User.__table__.select().where(User.email == "therapist@local.dev"))
        row = result.first()
        assert row is not None
        therapist_id = row.id

        await db.execute(
            TherapistMembership.__table__.update()
            .where(TherapistMembership.user_id == therapist_id)
            .values(status=TherapistMembershipStatusEnum.PENDING, grace_until=datetime.now(timezone.utc) - timedelta(days=1))
        )
        await db.commit()

    token = await login(async_client, "therapist@local.dev", "therapist123!")
    resp = await async_client.get("/therapist/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["membership_status"] == "pending"
    assert resp.json()["membership_blocked"] is True


