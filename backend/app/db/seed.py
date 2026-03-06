from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models import Membership, RoleEnum, Tenant, TherapistMembership, TherapistMembershipStatusEnum, User


def seed_database() -> None:
    """
    Production-safe, idempotent seed.

    Creates:
    - default tenant (id=1)
    - admin user
    - demo therapist user
    - default membership plan (Membership)
    - demo therapist membership row (keeps existing test expectations)
    """
    print("🌱 Running database seed...")

    db = SessionLocal()
    try:
        created_any = False

        # -------------------------
        # Tenant (single source: id=1)
        # -------------------------
        tenant = db.execute(select(Tenant).where(Tenant.id == 1)).scalar_one_or_none()
        if not tenant:
            # If older environments used a slug, prefer reusing it to avoid duplicates.
            tenant = db.execute(select(Tenant).where(Tenant.slug.in_(["default", "constelacion-viva"]))).scalar_one_or_none()

        if not tenant:
            tenant = Tenant(
                id=1,
                name="Constelación Viva",
                slug="default",
                is_active=True,
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            created_any = True
            print("✔ Tenant created")

        # -------------------------
        # Default membership plan (Membership)
        # -------------------------
        plan = (
            db.execute(
                select(Membership).where(
                    Membership.tenant_id == tenant.id,
                    Membership.name == "Basic",
                )
            )
            .scalars()
            .first()
        )

        if not plan:
            plan = Membership(
                tenant_id=tenant.id,
                name="Basic",
                price=0,  # cents
                duration_days=30,
                description="Plan básico (demo)",
                is_active=True,
            )
            db.add(plan)
            db.commit()
            created_any = True
            print("✔ Plan created")

        # -------------------------
        # Admin user
        # -------------------------
        admin = (
            db.execute(
                select(User).where(
                    User.tenant_id == tenant.id,
                    User.email == "admin@local.dev",
                )
            )
            .scalars()
            .first()
        )
        if not admin:
            admin = User(
                tenant_id=tenant.id,
                email="admin@local.dev",
                hashed_password=get_password_hash("admin12345!"),
                role=RoleEnum.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
            created_any = True
            print("✔ Admin created")

        # -------------------------
        # Demo therapist user
        # -------------------------
        therapist = (
            db.execute(
                select(User).where(
                    User.tenant_id == tenant.id,
                    User.email == "therapist@local.dev",
                )
            )
            .scalars()
            .first()
        )
        if not therapist:
            therapist = User(
                tenant_id=tenant.id,
                email="therapist@local.dev",
                hashed_password=get_password_hash("therapist123!"),
                role=RoleEnum.THERAPIST,
                is_active=True,
                is_verified=True,
            )
            db.add(therapist)
            db.commit()
            db.refresh(therapist)
            created_any = True
            print("✔ Therapist created")

        # -------------------------
        # Therapist membership row (keeps existing behavior/tests)
        # -------------------------
        membership = (
            db.execute(select(TherapistMembership).where(TherapistMembership.user_id == therapist.id))
            .scalars()
            .first()
        )
        if not membership:
            now = datetime.now(timezone.utc)
            membership = TherapistMembership(
                user_id=therapist.id,
                status=TherapistMembershipStatusEnum.PENDING,
                plan_months=3,
                grace_until=now + timedelta(days=7),
            )
            db.add(membership)
            db.commit()
            created_any = True
            print("✔ Therapist membership created")

        if not created_any:
            print("ℹ Seed already applied (no changes)")
    finally:
        db.close()


