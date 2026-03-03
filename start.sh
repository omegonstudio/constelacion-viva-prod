#!/usr/bin/env bash
set -euo pipefail

echo "=================================="
echo "🚀 Constelación Viva - DEV START"
echo "=================================="

# -----------------------------
# Configuración
# -----------------------------
COMPOSE_FILE="docker-compose.yml"

# Tomamos del .env (fuente única de verdad)
BUCKET_NAME="${S3_BUCKET:-constelacion-dev}"
REGION="${AWS_REGION:-us-east-1}"

FRONTEND_ORIGINS=(
  "http://localhost:3000"
  "http://127.0.0.1:3000"
)

# -----------------------------
# Verificaciones
# -----------------------------
command -v docker >/dev/null 2>&1 || {
  echo "❌ Docker no está instalado"
  exit 1
}

command -v docker compose >/dev/null 2>&1 || {
  echo "❌ Docker Compose no está disponible"
  exit 1
}

if [ ! -f .env ]; then
  echo "❌ Falta .env"
  exit 1
fi

echo "✅ Docker y .env OK"

# -----------------------------
# Cargar variables .env
# -----------------------------
set -o allexport
source .env
set +o allexport

# -----------------------------
# Levantar servicios
# -----------------------------
echo "🐳 Build y levantando servicios..."
docker compose -f "$COMPOSE_FILE" up -d --build

# -----------------------------
# Esperar LocalStack (S3)
# -----------------------------
echo "⏳ Esperando a LocalStack..."

until docker compose -f "$COMPOSE_FILE" exec -T localstack \
  awslocal s3 ls >/dev/null 2>&1; do
  echo "  ⏳ LocalStack aún no listo..."
  sleep 3
done

echo "✅ LocalStack listo"

# -----------------------------
# Crear bucket si no existe
# -----------------------------
echo "🪣 Verificando bucket '$BUCKET_NAME'..."

docker compose -f "$COMPOSE_FILE" exec -T localstack \
  awslocal s3api head-bucket --bucket "$BUCKET_NAME" >/dev/null 2>&1 || \
docker compose -f "$COMPOSE_FILE" exec -T localstack \
  awslocal s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION"

echo "✅ Bucket OK"

# -----------------------------
# Configurar CORS (idempotente)
# -----------------------------
echo "🔐 Configurando CORS del bucket..."

CORS_JSON=$(cat <<EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "${FRONTEND_ORIGINS[0]}",
        "${FRONTEND_ORIGINS[1]}"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
)

docker compose -f "$COMPOSE_FILE" exec -T localstack \
  awslocal s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --cors-configuration "$CORS_JSON"

echo "✅ CORS configurado"

# -----------------------------
# Estado final
# -----------------------------
echo "=================================="
echo "✅ CONSTELACIÓN VIVA DEV LISTO"
echo "=================================="
echo "Frontend:   http://localhost:3000"
echo "Backend:    http://localhost:8000"
echo "LocalStack: http://localhost:4566"
echo

docker compose -f "$COMPOSE_FILE" ps
