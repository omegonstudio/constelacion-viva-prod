import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models import Tenant, User, RoleEnum, TherapistMembership, TherapistMembershipStatusEnum
from app.core.security import hash_password


async def run():
    async with AsyncSessionLocal() as db:

        # -------------------------
        # Tenant
        # -------------------------
        result = await db.execute(
            select(Tenant).where(Tenant.id == 1)
        )
        tenant = result.scalar_one_or_none()

        if not tenant:
            tenant = Tenant(
                id=1,
                slug="constelacion-viva",
                name="Constelación Viva",
                is_active=True,
            )
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
            print("✅ Tenant creado")

        # -------------------------
        # Admin
        # -------------------------
        result = await db.execute(
            select(User).where(
                User.email == "admin@local.dev",
                User.tenant_id == tenant.id
            )
        )
        admin = result.scalar_one_or_none()

        if not admin:
            admin = User(
                tenant_id=tenant.id,
                email="admin@local.dev",
                hashed_password=hash_password("admin12345!"),
                role=RoleEnum.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            await db.commit()
            print("✅ Admin creado")
        else:
            print("ℹ️ Admin ya existe")

        # -------------------------
        # Therapist
        # -------------------------
        result = await db.execute(
            select(User).where(
                User.email == "therapist@local.dev",
                User.tenant_id == tenant.id
            )
        )
        therapist = result.scalar_one_or_none()

        if not therapist:
            therapist = User(
                tenant_id=tenant.id,
                email="therapist@local.dev",
                hashed_password=hash_password("therapist123!"),
                role=RoleEnum.THERAPIST,
                is_active=True,
                is_verified=True,
            )
            db.add(therapist)
            await db.commit()
            await db.refresh(therapist)
            print("✅ Terapeuta creado")
        else:
            print("ℹ️ Terapeuta ya existe")

        # -------------------------
        # Therapist Membership (Objetivo 2)
        # -------------------------
        result = await db.execute(
            select(TherapistMembership).where(TherapistMembership.user_id == therapist.id)
        )
        membership = result.scalar_one_or_none()

        if not membership:
            now = datetime.now(timezone.utc)
            membership = TherapistMembership(
                user_id=therapist.id,
                status=TherapistMembershipStatusEnum.PENDING,
                plan_months=3,
                grace_until=now + timedelta(days=7),
            )
            db.add(membership)
            await db.commit()
            print("✅ Membresía terapeuta creada (pending + gracia)")
        else:
            print("ℹ️ Membresía terapeuta ya existe")


if __name__ == "__main__":
    asyncio.run(run())
