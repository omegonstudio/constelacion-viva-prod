import os
from urllib.parse import urlparse, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def _to_sync_database_url(database_url: str) -> str:
    """
    Convert async SQLAlchemy URL (runtime) to sync URL for seeding scripts.

    Example:
      postgresql+asyncpg://...  ->  postgresql://...
    """
    if database_url.startswith("postgresql+asyncpg://"):
        parsed = urlparse(database_url)
        parsed = parsed._replace(scheme="postgresql")
        return urlunparse(parsed)
    return database_url


DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required to create SessionLocal")

engine = create_engine(_to_sync_database_url(DATABASE_URL), pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


