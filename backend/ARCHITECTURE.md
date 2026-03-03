# Constelación Viva - Complete Backend Architecture Guide

## Overview

Complete production-ready backend for Constelación Viva built with:

- **FastAPI** - Modern async web framework
- **SQLAlchemy 2.0** - Async ORM
- **PostgreSQL** - Production database
- **Alembic** - Database migrations
- **JWT** - Authentication

## What's Been Built

### ✅ Core Architecture

1. **Database Layer** (`app/db/`)

   - Async SQLAlchemy engine with connection pooling
   - Session factory for dependency injection
   - Transaction management ready

2. **Domain Models** (`app/models/`)

   - **Multitenancy**: `Tenant`, `User` (tenant_id everywhere)
   - **Users & Roles**: SUPER_ADMIN, ADMIN, THERAPIST, SPONSOR, STUDENT
   - **Memberships**: Monthly/yearly therapist subscriptions
   - **Courses**: Multilingual (es_lat, en, pt) with free/paid support
   - **Lessons**: Video, text, PDF with S3 integration ready
   - **Progress Tracking**: Per-course and per-lesson tracking
   - **CMS Content**: Editable marketing content
   - **Auth**: Password reset tokens

3. **Authentication** (`app/core/security.py` + `app/services/auth_service.py`)

   - Password hashing with bcrypt
   - JWT access tokens (30 min default)
   - Refresh tokens (7 days default)
   - Token validation and current user extraction

4. **Service Layer** (`app/services/`)

   - `AuthService` - Register, login, token refresh
   - `UserService` - User CRUD, role assignment, deactivation
   - `CourseService` - Course creation, enrollment, progress
   - `External Services` (abstracted):
     - `EmailService` (Resend ready)
     - `PaymentService` (Mercado Pago + Stripe abstraction)
     - `MediaService` (S3 presigned URLs)

5. **API Routes** (`app/routes/`)

   - Auth: `/auth/register`, `/auth/login`, `/auth/refresh`
   - Users: `/users/me`, `/users/{id}`, `/users` (list - admin)
   - Courses: `/courses` (CRUD), `/courses/{id}/enroll`, `/courses/{id}/progress`
   - Admin: `/admin/cms` (manage content), `/admin/users` (manage users)

6. **Middleware** (`app/middlewares/`)

   - `AuthMiddleware` - JWT extraction and validation
   - `TenancyMiddleware` - Tenant isolation
   - Role-based access control (RBAC) helpers

7. **Database Migrations** (`migrations/`)

   - Alembic setup with async support
   - Initial schema (001_initial.py) with all models
   - Ready for future migrations

8. **Configuration** (`app/core/config.py`)
   - Environment-based settings (development/staging/production)
   - Secrets management (SECRET_KEY, DB_URL, etc.)
   - Feature flags

## Directory Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Settings & env vars
│   │   ├── security.py            # JWT, password hashing
│   │   └── exceptions.py           # (TODO)
│   ├── db/
│   │   ├── __init__.py
│   │   └── database.py            # AsyncSession, engine
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py              # All ORM models
│   ├── schemas/
│   │   └── __init__.py            # Pydantic request/response
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── course_service.py
│   │   └── external_services.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── courses.py
│   │   └── admin.py
│   ├── middlewares/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── tenancy.py
│   └── utils/
│       └── __init__.py
├── migrations/
│   ├── env.py
│   ├── alembic.ini
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial.py
├── requirements.txt
├── .env.example
├── run.py
├── manage.py
├── README.md
└── ARCHITECTURE.md (this file)
```

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 12+
- pip or poetry

### Installation

1. **Set up environment**

```bash
cd backend
python -m venv venv
source venv/bin/activate
```

2. **Install dependencies**

```bash
pip install -r requirements.txt
```

3. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Create database**

```bash
createdb constelacion_viva
```

5. **Run migrations**

```bash
alembic upgrade head
```

6. **Create initial data**

```bash
# Create default tenant
python manage.py create_tenant

# Create admin user
python manage.py create_admin_user admin@example.com securepass123
```

7. **Start server**

```bash
python run.py
# Server at http://localhost:8000
# Docs at http://localhost:8000/docs
```

## API Documentation

### Authentication

**Register**

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass",
  "first_name": "John",
  "last_name": "Doe",
  "tenant_id": 1
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Login**

```bash
POST /auth/login?tenant_id=1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass"
}
```

**Refresh Token**

```bash
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Protected Requests

Include JWT in Authorization header:

```bash
GET /users/me
Authorization: Bearer <access_token>
```

### Courses

**Create Course** (therapist/admin)

```bash
POST /courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title_es": "Terapia Holística",
  "title_en": "Holistic Therapy",
  "description_es": "Curso completo...",
  "is_free": false,
  "price": 9900
}
```

**List Courses**

```bash
GET /courses?published_only=true&skip=0&limit=50
Authorization: Bearer <token>
```

**Enroll in Course**

```bash
POST /courses/{course_id}/enroll
Authorization: Bearer <token>
```

**Get Course Progress**

```bash
GET /courses/{course_id}/progress
Authorization: Bearer <token>
```

### Admin/CMS

**List CMS Content**

```bash
GET /admin/cms
Authorization: Bearer <admin_token>
```

**Create CMS Content**

```bash
POST /admin/cms
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "key": "hero_title",
  "content_es": "Bienvenido a Constelación Viva",
  "content_en": "Welcome to Constelación Viva",
  "content_type": "text"
}
```

## Database Schema

### Key Tables

**tenants**

- `id` (PK)
- `slug` (unique)
- `name`, `description`
- `is_active`

**users**

- `id` (PK)
- `tenant_id` (FK)
- `email`, `hashed_password`
- `role` (ENUM: super_admin, admin, therapist, sponsor, student)
- `preferred_language` (ENUM: es_lat, en, pt)
- `is_active`, `is_verified`

**courses**

- `id` (PK)
- `tenant_id`, `creator_id` (FK)
- Multilingual: `title_es`, `title_en`, `title_pt`
- `is_free`, `price`
- `is_published`

**modules**

- `id` (PK)
- `course_id` (FK)
- Multilingual: `title_es`, `title_en`, `title_pt`
- `order` (for sequencing)

**lessons**

- `id` (PK)
- `module_id` (FK)
- `content_type` (ENUM: video, text, pdf)
- `s3_key` (for media files)
- `content_text` (for text lessons)
- `duration_seconds` (for videos)

**course_progress**

- `id` (PK)
- `user_id`, `course_id` (FK)
- `completion_percentage` (0-100)
- `started_at`, `completed_at`

**lesson_progress**

- Tracks per-lesson completion
- `watched_seconds` for video progress

**memberships**

- `id` (PK)
- `tenant_id` (FK)
- `price`, `duration_days`
- `name` (Monthly Pro, Yearly Pro, etc.)

**user_memberships**

- `id` (PK)
- `user_id`, `membership_id` (FK)
- `started_at`, `expires_at`
- `is_active`

**cms_content**

- `id` (PK)
- `tenant_id` (FK)
- `key` (unique identifier)
- Multilingual: `content_es`, `content_en`, `content_pt`
- `image_url`, `content_type`

## Key Architectural Decisions

### 1. Async-First SQLAlchemy 2.0

- **Why**: Scalability for thousands of concurrent users
- **How**: AsyncSession, async_sessionmaker, asyncpg driver
- **Benefit**: Non-blocking database operations, connection pooling

### 2. Service Layer Pattern

- **Why**: Business logic separated from HTTP handlers
- **How**: Services in `app/services/`, routes just HTTP
- **Benefit**: Reusable, testable, maintainable

### 3. Multitenancy at DB Level

- **Why**: Logical first, ready for physical separation
- **How**: `tenant_id` on every model, filtered in queries
- **Benefit**: Easy migration to separate DBs/droplets later

### 4. Abstracted External Services

- **Why**: Easy to swap implementations (Resend → SendGrid, MP → Stripe)
- **How**: ABC base classes, concrete implementations
- **Benefit**: Future-proof, testable with mocks

### 5. JWT + Refresh Tokens

- **Why**: Stateless, scalable authentication
- **How**: Access token (short-lived), Refresh token (long-lived)
- **Benefit**: Secure, works with distributed systems

### 6. Role-Based Access Control

- **Why**: Never hardcode permissions
- **How**: Role enum on user, middleware checkers
- **Benefit**: Scalable, audit-friendly, easy to extend

## Integration Points

### Frontend (Next.js) Integration

```typescript
// Example: Login flow
const loginResponse = await fetch(
  "http://localhost:8000/auth/login?tenant_id=1",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com", password: "pass" }),
  }
);

const { access_token, refresh_token } = await loginResponse.json();

// Store tokens securely (httpOnly cookie or secure storage)
// Use access_token in subsequent requests
```

### Payment Integration (Mercado Pago)

```python
# In PaymentService implementation
async def create_preference(self, user_id, course_id, amount, title, description):
    # Create preference via Mercado Pago API
    # Store transaction record in DB
    # Return preference_id
```

### Email Service (Resend)

```python
# In EmailService implementation
async def send_password_reset(self, email, reset_link, name):
    # Send via Resend API
    # Log email delivery
```

### Media Service (S3)

```python
# In MediaService implementation
async def generate_presigned_url(self, s3_key, expiration=3600):
    # Generate signed URL valid for 1 hour
    # Frontend uploads directly to S3 using this URL
```

## Deployment

### DigitalOcean Setup

1. **Create Droplet**

   - Ubuntu 22.04 LTS
   - 2GB+ RAM, 2 CPU

2. **Install Dependencies**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3.11 python3.11-venv postgresql -y
```

3. **Clone & Setup**

```bash
git clone <repo> ~/constelacion-viva
cd ~/constelacion-viva/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

4. **Environment Setup**

```bash
cp .env.example .env
# Edit with production values
```

5. **Run Migrations**

```bash
alembic upgrade head
```

6. **Start with Systemd**
   Create `/etc/systemd/system/constelacion-api.service`:

```ini
[Unit]
Description=Constelación Viva API
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/root/constelacion-viva/backend
ExecStart=/root/constelacion-viva/backend/venv/bin/python run.py
Restart=always

[Install]
WantedBy=multi-user.target
```

7. **Use Nginx as Reverse Proxy**

```nginx
server {
    listen 80;
    server_name api.constelacionviva.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Testing Strategy

TODO: Add pytest fixtures for:

- Auth flows
- Service layer unit tests
- Integration tests with real DB
- API endpoint tests

## Future Enhancements

1. **Payment Integration** - Implement Mercado Pago
2. **Email Service** - Implement Resend
3. **Media Upload** - S3 presigned URLs
4. **Lesson Management** - Full CRUD
5. **Analytics** - Course completion rates
6. **WebSockets** - Real-time notifications
7. **GraphQL** - Alternative to REST
8. **API Rate Limiting** - Prevent abuse
9. **Logging & Monitoring** - APM integration
10. **White-label Ready** - Branding per tenant

## Production Checklist

- [ ] SECRET_KEY generated (random, long)
- [ ] DATABASE_URL set to production DB
- [ ] Environment set to "production"
- [ ] CORS origins restricted to frontend domain
- [ ] SSL certificates configured (Let's Encrypt)
- [ ] Database backups scheduled
- [ ] Monitoring & logging set up
- [ ] Rate limiting enabled
- [ ] Payment keys configured
- [ ] Email service keys configured
- [ ] S3 credentials configured
- [ ] Admin user created
- [ ] Initial tenants created

## Support & Questions

For issues or questions about the architecture, refer to individual files:

- Database: `app/db/database.py`
- Models: `app/models/models.py`
- Services: `app/services/`
- Routes: `app/routes/`
