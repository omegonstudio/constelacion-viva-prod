import os
import pytest
import pytest_asyncio
from httpx import AsyncClient

os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("TESTING", "1")
# In CI/dev containers these vars may exist but be empty; force values for tests.
if not os.environ.get("MP_ACCESS_TOKEN"):
    os.environ["MP_ACCESS_TOKEN"] = "test_mp_token"
if not os.environ.get("MP_WEBHOOK_SECRET"):
    os.environ["MP_WEBHOOK_SECRET"] = "test_webhook_secret"

from app.main import app
from app.db.database import AsyncSessionLocal
from datetime import datetime, timedelta, timezone
from app.models import User, TherapistMembership, TherapistMembershipStatusEnum
from sqlalchemy import select

@pytest_asyncio.fixture(scope="function")
async def seed_data():
    from app.scripts import seed

    await seed.run()
    yield


@pytest_asyncio.fixture(scope="function")
async def async_client(seed_data):
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
        yield client


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture(scope="function", autouse=True)
async def reset_therapist_membership(seed_data):
    """
    Mantener tests aislados: muchos casos cambian grace/status.
    Reseteamos a pending + gracia vigente antes de cada test.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "therapist@local.dev"))
        therapist = result.scalar_one()

        result = await db.execute(select(TherapistMembership).where(TherapistMembership.user_id == therapist.id))
        membership = result.scalar_one_or_none()

        now = datetime.now(timezone.utc)
        if not membership:
            membership = TherapistMembership(
                user_id=therapist.id,
                status=TherapistMembershipStatusEnum.PENDING,
                plan_months=3,
                grace_until=now + timedelta(days=7),
            )
            db.add(membership)
        else:
            membership.status = TherapistMembershipStatusEnum.PENDING
            membership.plan_months = 3
            membership.started_at = None
            membership.expires_at = None
            membership.grace_until = now + timedelta(days=7)
            membership.mp_preference_id = None
            membership.mp_subscription_id = None
            membership.mp_checkout_url = None
            membership.mp_payment_id = None

        await db.commit()
    yield

