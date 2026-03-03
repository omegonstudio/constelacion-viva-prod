# Fase 7 - Checklist de validación

## Auth
- [ ] Login (POST /auth/login)
- [ ] Refresh automático con cookie httpOnly (POST /auth/refresh)
- [ ] Logout backend (POST /auth/logout)
- [ ] Logout frontend limpia estado
- [ ] Sesión persiste con cookie de refresh

## Roles / Permisos
- [ ] Roles definidos: super_admin, admin, user
- [ ] Permisos por rol (en código):
  - super_admin: *
  - admin: users:read, users:write, content:write
  - user: content:read
- [ ] /auth/me devuelve permisos efectivos
- [ ] Backend protege endpoints de prueba (/admin/health, /admin/users) con permisos
- [ ] Frontend muestra/oculta UI con RoleGuard (ej. admin panel en /dashboard)

## Seguridad
- [ ] Expiración de refresh token (configurada en backend)
- [ ] Rotación de refresh token en /auth/refresh
- [ ] Revocación server-side pendiente (no implementado)

## Integraciones pendientes
- [ ] Emails (Resend) pendiente
- [ ] Pagos (MercadoPago) pendiente
- [ ] Auditoría / logs avanzados pendiente
- [ ] Rate limiting pendiente
- [ ] Multi-tenant real pendiente
- [ ] Panel admin real pendiente

## Endpoints de prueba (manual)
- Login admin:
  ```bash
  curl -i -c cookies.txt -X POST "http://localhost:8000/auth/login?tenant_id=1" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@local.dev","password":"admin12345!"}'
  ```
- Ver perfil:
  ```bash
  curl -b cookies.txt -H "Authorization: Bearer <access_token>" http://localhost:8000/auth/me
  ```
- Refresh (usa cookie):
  ```bash
  curl -i -b cookies.txt -X POST http://localhost:8000/auth/refresh
  ```
- Health admin (requiere admin/super_admin):
  ```bash
  curl -b cookies.txt -H "Authorization: Bearer <access_token>" http://localhost:8000/admin/health
  ```
- /admin/users (requires users:read):
  ```bash
  curl -b cookies.txt -H "Authorization: Bearer <access_token>" http://localhost:8000/admin/users
  ```

## Frontend
- [ ] /login funciona y guarda access token en memoria; refresh via cookie
- [ ] /dashboard protegido por AuthGuard
- [ ] RoleGuard oculta secciones si no cumple rol
- [ ] Logout frontend llama /auth/logout y limpia estado

