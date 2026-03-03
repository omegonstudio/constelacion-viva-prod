# TODO Frontend (Objetivo 2)

Este archivo lista **botones/acciones presentes en UI** que hoy no tienen endpoint / routing / feature implementada.  
**No se eliminaron**: quedaron **deshabilitados** con tooltip para no romper UX ni generar falsas expectativas.

## Admin Dashboard

### Membresías

- **Botón**: `Ver perfil` (tabla terapeutas)  
  **Ubicación**: `Constelacion-viva/app/(admin)/admin/dashboard/page.tsx`  
  **Acción esperada**: navegar a perfil/detalle del terapeuta (lectura + acciones administrativas)  
  **Dependencia**: routing + endpoint(s) de detalle/gestión de terapeuta (backend /admin/therapists/:id o similar)

### Cursos

- **Botón**: `Ver` (tabla cursos)  
  **Ubicación**: `Constelacion-viva/app/(admin)/admin/dashboard/page.tsx`  
  **Acción esperada**: navegar a detalle del curso  
  **Dependencia**: routing + endpoint(s) de cursos (backend)

- **Botón**: `Gestionar` (tabla cursos)  
  **Ubicación**: `Constelacion-viva/app/(admin)/admin/dashboard/page.tsx`  
  **Acción esperada**: CRUD/gestión del curso (estado, lecciones, alumnos, etc.)  
  **Dependencia**: routing + endpoints + permisos (backend)

---

## Objetivo 2 — Frontend (Membresías terapeutas)

### ✅ Implementado

- **Therapist dashboard**: `Constelacion-viva/app/(therapist)/therapist/dashboard/page.tsx`
  - consume `GET /therapist/membership`
  - estados **active/pending/inactive** con gating visual claro
  - CTA **Pagar membresía**: `POST /therapist/membership/checkout` + redirect a Mercado Pago (loading + toast error)
  - sin botones muertos (lo no implementado queda disabled + tooltip)

- **Listado público**: `Constelacion-viva/app/nuestrosterapeutas/page.tsx`
  - consume **exclusivamente** `GET /public/therapists` (backend decide visibilidad por membresía)
  - skeleton loading + empty state
  - el frontend **no recalcula** estado de membresía: solo renderiza lo que devuelve el backend
  - filtros UI: solo búsqueda por campos existentes (nombre/email/bio)

### ⚠️ Parcial (con explicación)

- **Perfil público por slug**: `Constelacion-viva/app/terapeutas/[slug]/page.tsx`
  - CTA **Agendar sesión** visible pero **no implementado**: abre modal “próximamente” (sin pagos/agenda)
  - CTA **Consultar disponibilidad**: **disabled + tooltip** (sin backend)

### ❌ Pendiente (NO implementar ahora)

- **Editar perfil del terapeuta (público)**:
  - **Ubicación**: `Constelacion-viva/app/(therapist)/therapist/dashboard/page.tsx` (CTA “Editar perfil”)
  - **Dependencia**: endpoints/modelo de perfil en backend + ruta de edición en frontend

- **Ver perfil** en cards del listado público:
  - **Ubicación**: `Constelacion-viva/app/nuestrosterapeutas/page.tsx`
  - **Estado actual**: navega a `/terapeutas/[slug]` usando `user_id` y pasa `name/bio/email` por query como fallback
  - **Dependencia**: backend debe proveer `slug` y campos públicos (foto/terapias/ubicación) o endpoint de detalle por ID/slug para un perfil real

- **Agenda + pagos de sesión** (Mercado Pago):
  - **Ubicación**: `Constelacion-viva/app/terapeutas/[slug]/page.tsx` (CTA “Agendar sesión”)
  - **Dependencia**: Objetivo futuro (no implementar ahora)

---

## Admin Dashboard — Tab “Membresías” (integración con backend)

- **Backend listo**:
  - `GET /admin/therapists`
  - `GET /admin/therapists/{id}`
- **✅ Implementado frontend**:
  - reemplazo de mockdata por fetch real en `Constelacion-viva/app/(admin)/admin/dashboard/page.tsx`
  - hook: `Constelacion-viva/hooks/useAdminTherapist.ts` (`useAdminTherapists`)
  - mapping:
    - `membership_status` (`active|pending|inactive`) → `Activa|Pendiente|Inactiva`
    - `payment_status` (`paid|pending|overdue|na`) → `Pagado|Pendiente|Vencido|N/A`
  - botón **“Ver perfil”** se mantiene **disabled** (pendiente routing/UX)


