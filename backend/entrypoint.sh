#!/bin/sh
set -e

echo "⏳ Waiting for database..."
until alembic -c migrations/alembic.ini upgrade head; do
  echo "DB not ready, retrying..."
  sleep 2
done

echo "✅ Migrations done"

echo "🌱 Running seed (idempotent)..."
python -m app.scripts.seed || true

echo "🚀 Starting API"
exec python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload
