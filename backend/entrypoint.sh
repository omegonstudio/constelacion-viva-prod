#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Extract host/port/user/db for pg_isready from DATABASE_URL (supports async scheme).
eval "$(python - <<'PY'
import os, shlex
from urllib.parse import urlparse, urlunparse

url = os.getenv("DATABASE_URL", "")
if url.startswith("postgresql+asyncpg://"):
    p = urlparse(url)
    p = p._replace(scheme="postgresql")
    url = urlunparse(p)

p = urlparse(url)
host = p.hostname or "postgres"
port = str(p.port or 5432)
user = p.username or "postgres"
password = p.password or ""
db = (p.path or "/postgres").lstrip("/")

print(f"DB_HOST={shlex.quote(host)}")
print(f"DB_PORT={shlex.quote(port)}")
print(f"DB_USER={shlex.quote(user)}")
print(f"DB_NAME={shlex.quote(db)}")
print(f"PGPASSWORD={shlex.quote(password)}")
PY
)"

echo "⏳ Waiting for Postgres at ${DB_HOST}:${DB_PORT} (db=${DB_NAME}, user=${DB_USER})..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  echo "DB not ready, retrying..."
  sleep 2
done

echo "🔧 Running Alembic migrations..."
alembic -c migrations/alembic.ini upgrade head
echo "✅ Migrations done"

if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "🌱 Running seed (idempotent)..."
  python -m app.scripts.seed || true
fi

echo "🚀 Starting API"
exec "$@"
