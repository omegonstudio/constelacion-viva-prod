"""Alembic migration configuration."""
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys
from urllib.parse import urlparse, urlunparse

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.base import Base
from app.models import *  # noqa

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def _to_sync_sqlalchemy_url(database_url: str) -> str:
    """
    Alembic must use a **sync** SQLAlchemy URL.

    Runtime uses async URLs like:
      postgresql+asyncpg://user:pass@host:5432/db
    For Alembic we convert to a sync driver URL:
      postgresql://user:pass@host:5432/db
    """
    if database_url.startswith("postgresql+asyncpg://"):
        # Keep everything after the scheme untouched (including credentials/host/path/query)
        parsed = urlparse(database_url)
        parsed = parsed._replace(scheme="postgresql")
        return urlunparse(parsed)
    return database_url


# Single source of truth: DATABASE_URL from environment (no hardcoding).
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set (required for Alembic migrations)")

config.set_main_option("sqlalchemy.url", _to_sync_sqlalchemy_url(DATABASE_URL))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
