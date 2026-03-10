#!/usr/bin/env bash
set -euo pipefail

echo "=================================="
echo "🚀 CONSTELACIÓN VIVA - PROD START"
echo "=================================="

COMPOSE_FILE="docker-compose.prod.yml"

# -----------------------------
# Verificaciones
# -----------------------------

command -v docker >/dev/null 2>&1 || {
  echo "❌ Docker no está instalado"
  exit 1
}

command -v docker compose >/dev/null 2>&1 || {
  echo "❌ Docker Compose no disponible"
  exit 1
}

if [ ! -f .env ]; then
  echo "❌ Falta archivo .env"
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ Falta $COMPOSE_FILE"
  exit 1
fi

echo "✅ Docker y archivos OK"

# -----------------------------
# Cargar variables
# -----------------------------

set -o allexport
source .env
set +o allexport

# -----------------------------
# Pull repo (opcional)
# -----------------------------

echo ""
echo "📥 Actualizando repo"

git fetch origin
git reset --hard origin/main

# -----------------------------
# Build + start
# -----------------------------

echo ""
echo "🐳 Build y levantando contenedores"

docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

# -----------------------------
# Esperar backend
# -----------------------------

echo ""
echo "⏳ Esperando backend..."

until docker exec cv_backend curl -s http://localhost:8000/api/health >/dev/null; do
  echo "  ⏳ backend aún no listo..."
  sleep 3
done

echo "✅ Backend listo"

# -----------------------------
# Estado contenedores
# -----------------------------

echo ""
echo "📦 Estado contenedores"

docker compose -f "$COMPOSE_FILE" ps

# -----------------------------
# Health check público
# -----------------------------

echo ""
echo "🌐 Health check público"

curl -f https://constelacionviva.com/api/health || {
  echo "❌ Health check público falló"
  exit 1
}

echo ""
echo "=================================="
echo "✅ CONSTELACIÓN VIVA PROD LISTO"
echo "=================================="