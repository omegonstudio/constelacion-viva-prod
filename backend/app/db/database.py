import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import get_settings
from app.models.base import Base

settings = get_settings()

# In tests we avoid reusing pooled asyncpg connections across event loops.
# This prevents "Future attached to a different loop" errors under pytest.
_is_testing = os.getenv("TESTING") == "1"

# Create async engine
engine_kwargs: dict = {
    "echo": settings.environment == "development",
    "future": True,
    "pool_pre_ping": (False if _is_testing else True),
}

if _is_testing:
    engine_kwargs["poolclass"] = NullPool

engine = create_async_engine(settings.database_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    future=True,
)


async def get_db() -> AsyncSession:
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        yield session
