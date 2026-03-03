# TODO Backend (Objetivo 1 / Objetivo 2)

Este archivo separa claramente lo que **falta o conviene hardenizar** para cerrar Objetivo 1, y lo que **NO corresponde** (Objetivo 2).

## A) Objetivo 1 — Galería Admin + Presign S3 (estado / pendientes)

### ✅ Implementado / hardenizado en este cierre

- Endpoints Objetivo 1 montados en `app.main`:
  - `POST /admin/gallery/presign`
  - `POST /admin/gallery`
  - `PUT /admin/gallery/{id}`
  - `DELETE /admin/gallery/{id}`
  - `GET /public/gallery`
- Delete resiliente:
  - si falla S3 → **no rompe** el delete (borra DB igual)
  - idempotente (si no existe el item → `{ok: true}`)
- Tests automáticos de galería con mocks (sin S3 real):
  - `backend/tests/test_gallery_admin.py`
  - `backend/tests/test_gallery_public.py`
  - Unit tests (para cerrar ramas/errores y llegar a 100% del scope Objetivo 1):
    - `backend/tests/test_storage_service_unit.py`
    - `backend/tests/test_routes_admin_gallery_unit.py`
    - `backend/tests/test_routes_public_unit.py`
    - `backend/tests/test_auth_middleware_unit.py`
    - `backend/tests/test_auth_middleware_more_unit.py`

- Gate de coverage Objetivo 1 (estricto):
  - Comando recomendado:
    - `pytest --cov=app.routes.admin_gallery --cov=app.routes.public --cov=app.schemas.gallery --cov=app.services.storage_service --cov=app.middlewares.auth --cov-fail-under=100`

### ✅ Bugs PROD cerrados (CORS + Presign LocalStack)

- **BUG #1 (CORS con credentials / “Allow-Origin: *”)**
  - Se eliminó middleware de debug con `print` en `backend/app/main.py` (no debe existir en prod).
  - Se agregaron tests que validan que **no vuelve a aparecer `*`**:
    - `backend/tests/test_cors_headers.py` (OPTIONS `/public/gallery`, OPTIONS `/auth/login?tenant_id=1`)

- **BUG #2 (Presigned URL LocalStack inaccesible desde el browser)**
  - `create_presigned_upload` ahora reescribe `uploadUrl` para usar `S3_PUBLIC_ENDPOINT` cuando difiere de `S3_ENDPOINT`.
    - Internal (containers): `S3_ENDPOINT=http://localstack:4566`
    - Public (browser): `S3_PUBLIC_ENDPOINT=http://localhost:4566`
  - Tests: `backend/tests/test_storage_service_unit.py`

### Verificación manual (DEV)

- **CORS**:
  - Desde `http://localhost:3000`, abrir consola y ejecutar:
    - `fetch("http://localhost:8000/public/gallery", { credentials: "include" })`
  - Debe responder sin error CORS y con `Access-Control-Allow-Origin: http://localhost:3000`.

- **Upload galería (end-to-end)**:
  - `POST /admin/gallery/presign` → debe devolver `uploadUrl` con **`http://localhost:4566/...`**
  - `PUT` a ese `uploadUrl` desde el browser → **200**
  - `POST /admin/gallery` metadata → **200**
  - `GET /public/gallery` → el item aparece

### 🔍 Pendientes recomendados (hardening)

- **Aislamiento de DB en tests** (transacciones/rollback por test):
  - Hoy los tests limpian tablas con `DELETE` explícito.
  - Mejor: fixture transaccional con rollback o DB de testing dedicada.
  - **Archivos**: `backend/tests/conftest.py`
  - **Dependencia**: infra/CI + configuración DB testing

- **Unificación de implementación de galería**:
  - Hay rutas duplicadas y enfoques mezclados (sync vs async):
    - `backend/app/routes/public.py` vs `backend/app/routes/public/gallery.py`
    - `backend/app/routes/gallery.py` (MediaAsset) vs `backend/app/routes/admin/gallery.py` (GalleryItem)
  - **Acción**: definir claramente cuál es el “source of truth” de galería y remover/archivar lo legacy.
  - **Dependencia**: backend (refactor) + validación con frontend

---

## Objetivo: Integrar Users + Terapeutas + Membresías (Admin Dashboard)

### ✅ Implementado

- **Endpoints admin** (para reemplazar mockdata del tab “Membresías”):
  - `GET /admin/therapists`
  - `GET /admin/therapists/{id}`
- **Permisos**: requiere **admin/super_admin** (`require_admin_or_super`)
- **Source of truth**:
  - terapeuta = `User(role=therapist)`
  - membresía = `TherapistMembership` (status/gracia/fechas + refs Mercado Pago)
  - perfil mínimo (opcional) = `TherapistProfile` (display_name/bio)
- **Tests**: `backend/tests/test_admin_therapists.py`

### ⚠️ Parcial (con explicación)

- **`payment_status`** no existe como columna propia (se deriva):
  - `paid` si `membership_status=active` y `mp_payment_id` existe
  - `pending` si `membership_status=pending` con gracia vigente, o `active` sin `mp_payment_id`
  - `overdue` si `inactive` o `pending` con gracia vencida, o `active` vencida por `expires_at`
  - `na` si no hay row de membership (edge/dev)

### ❌ Pendiente (NO implementar ahora)

- Alta de terapeutas por admin (endpoint + UI)
- Perfil público completo (slug, terapias, ubicación, fotos, etc.)
- Historial de renovaciones / múltiples períodos (hoy es 1 row por user)

---

## Objetivo: Directorio público de terapeutas (visibilidad por membresía)

### ✅ Implementado

- `GET /public/therapists` ahora incluye:
  - `active` no vencidos (`expires_at is null` o `>= now`)
  - `pending` con gracia vigente (`grace_until >= now`)
- Nuevo endpoint mínimo:
  - `GET /public/therapists/{identifier}` (por ahora `identifier` = `user_id` numérico)
- Helper reusable:
  - `app/utils/therapist_visibility.py` (`is_membership_overdue`, `is_therapist_public_visible`)
- Tests:
  - `backend/tests/test_public_therapists_visibility.py`

### ⚠️ Parcial (con explicación)

### ✅ Slug persistido (URLs estables)

- `therapist_profiles.slug` persistido con:
  - `tenant_id + slug` único
  - backfill seguro (display_name → slug, fallback email prefix, colisiones `-2`, `-3`, …)
- `GET /public/therapists` ahora incluye `slug` (campo adicional, no rompe contrato)
- `GET /public/therapists/{identifier}` soporta:
  - `identifier` numérico → lookup por `user_id`
  - `identifier` string → lookup por `therapist_profiles.slug`
- Tests:
  - `backend/tests/test_public_therapists_slug.py`

## B) Objetivo 2 — NO implementar ahora

- **Gestión avanzada de cursos**:
  - CRUD completo, publicación, lecciones, progreso, etc.
  - **Dependencia**: backend + frontend + permisos

- **Perfil admin de terapeuta**:
  - endpoints de detalle/edición + routing frontend
  - **Dependencia**: backend + frontend

- **Analytics / reporting**:
  - métricas de uso, descargas, performance, funnels
  - **Dependencia**: backend + infra (observabilidad)

- **Pagos extendidos**:
  - suscripciones, facturación, reconciliación, webhooks robustos
  - **Dependencia**: backend + infra + negocio

## Objetivo 2 — Membresías de terapeutas (diseño / backlog)

- **Estados**: `active` / `pending` / `inactive`
- **Períodos de gracia**: días configurables antes de bloquear features
- **Planes**: 3 / 6 / 12 meses
- **Pagos y split**: 70/30 (plataforma/terapeuta)
- **Gating**:
  - visibilidad pública del perfil
  - acceso a `/therapist/*`
  - creación/publicación de cursos
  - uploads/galería del terapeuta (si aplica)

### Mercado Pago (Objetivo 2)

- **SDK**: `mercadopago` (Python) via `MP_ACCESS_TOKEN`
- **Webhook**: `POST /webhooks/mercadopago` verificado con `MP_WEBHOOK_SECRET` (header `x-signature` HMAC-SHA256 del body)
- **Idempotencia**: dedupe por `payment_id` guardado en `therapist_memberships.mp_payment_id`

### Checkout (planes y precios centralizados)

- ✅ Fuente única de verdad: `app/core/membership_plans.py` (`MEMBERSHIP_PLANS`, `GRACE_DAYS`)
- ✅ `POST /therapist/membership/checkout`:
  - el terapeuta envía **solo** `plan_months`
  - el backend resuelve `unit_price` desde `MEMBERSHIP_PLANS`
  - bloquea checkout si la membresía está **active** y no vencida
  - setea membership a **pending** + `grace_until` y limpia `mp_payment_id`
  - crea suscripción Mercado Pago (**preapproval**) y responde `checkout_url` (manteniendo `preference_id`/`init_point` por compat)
- ✅ Tests: `backend/tests/test_membership_checkout_preapproval.py`

### Webhook (activación de membresías)

- ✅ `POST /webhooks/mercadopago` es el **único** lugar donde una membresía pasa a `active`
- ✅ Firma: `x-signature` HMAC-SHA256 con `MP_WEBHOOK_SECRET`
- ✅ Procesa solo `type == "subscription_preapproval"` (suscripciones) y valida currency `ARS`
- ✅ `external_reference` = `TherapistMembership.id` (source of truth)
- ✅ Idempotente: si ya está en el estado destino (active/inactive) → no hace nada
- ✅ Tests: `backend/tests/test_mercadopago_webhook_preapproval.py`

### NO implementar ahora

- split 70/30
- pagos de sesiones
- agenda/citas



