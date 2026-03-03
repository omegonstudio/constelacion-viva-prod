"""Database utility commands (development)."""
import asyncio
from sqlalchemy import select
from app.db.database import engine, Base, AsyncSessionLocal
from app.core.config import get_settings
from app.models import User, Tenant, RoleEnum
from app.core.security import hash_password


async def create_tables():
    """Create all tables (for development only)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created")


async def drop_tables():
    """Drop all tables (DANGEROUS - development only)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("✓ Tables dropped")


async def create_admin_user(email: str, password: str, tenant_id: int = 1):
    """Create superadmin user."""
    async with AsyncSessionLocal() as db:
        user = User(
            tenant_id=tenant_id,
            email=email,
            hashed_password=hash_password(password),
            first_name="Admin",
            last_name="User",
            role=RoleEnum.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        print(f"✓ Admin user created: {email}")


async def seed():
    """Idempotent seed: creates tenant, admin, and base user if missing."""
    admin_email = "admin@local.dev"
    user_email = "user@local.dev"
    admin_password = "admin12345!"
    user_password = "user12345!"
    tenant_slug = "dev"

    async with AsyncSessionLocal() as db:
        # Tenant
        result = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
        tenant = result.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(slug=tenant_slug, name="Development")
            db.add(tenant)
            await db.flush()
            print("✓ Tenant created:", tenant.slug)
        tenant_id = tenant.id

        # Admin user
        result = await db.execute(select(User).where(User.email == admin_email, User.tenant_id == tenant_id))
        admin = result.scalar_one_or_none()
        if not admin:
            admin = User(
                tenant_id=tenant_id,
                email=admin_email,
                hashed_password=hash_password(admin_password),
                first_name="Admin",
                last_name="User",
                role=RoleEnum.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            print("✓ Admin user created:", admin_email)

        # Base user
        result = await db.execute(select(User).where(User.email == user_email, User.tenant_id == tenant_id))
        base_user = result.scalar_one_or_none()
        if not base_user:
            base_user = User(
                tenant_id=tenant_id,
                email=user_email,
                hashed_password=hash_password(user_password),
                first_name="User",
                last_name="Demo",
                role=RoleEnum.STUDENT,
                is_active=True,
                is_verified=True,
            )
            db.add(base_user)
            print("✓ Base user created:", user_email)

        await db.commit()
        print("✓ Seed completed (idempotent)")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python manage.py [create_tables|drop_tables|create_admin_user <email> <password> [tenant_id]|seed]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "create_tables":
        asyncio.run(create_tables())
    elif command == "drop_tables":
        asyncio.run(drop_tables())
    elif command == "create_admin_user":
        if len(sys.argv) < 4:
            print("Usage: python manage.py create_admin_user <email> <password> [tenant_id]")
            sys.exit(1)
        email = sys.argv[2]
        password = sys.argv[3]
        tenant_id = int(sys.argv[4]) if len(sys.argv) > 4 else 1
        asyncio.run(create_admin_user(email, password, tenant_id))
    elif command == "seed":
        asyncio.run(seed())
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
