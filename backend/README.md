# Backend Architecture Documentation

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app
│   ├── core/
│   │   ├── config.py              # Settings from env
│   │   └── security.py            # JWT, password hashing
│   ├── db/
│   │   ├── database.py            # SQLAlchemy async setup
│   │   └── __init__.py
│   ├── models/
│   │   ├── models.py              # SQLAlchemy ORM models
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py            # Pydantic models
│   ├── services/
│   │   ├── auth_service.py        # Auth logic
│   │   ├── user_service.py        # User CRUD
│   │   ├── course_service.py      # Course logic
│   │   ├── external_services.py   # Email, Payment, Media (abstracted)
│   │   └── __init__.py
│   ├── routes/
│   │   ├── auth.py                # /auth endpoints
│   │   ├── users.py               # /users endpoints
│   │   ├── courses.py             # /courses endpoints
│   │   ├── admin.py               # /admin endpoints
│   │   └── __init__.py
│   ├── middlewares/
│   │   ├── auth.py                # JWT middleware
│   │   ├── tenancy.py             # Tenant middleware
│   │   └── __init__.py
│   └── utils/
│       └── __init__.py
├── migrations/
│   ├── env.py                     # Alembic config
│   ├── alembic.ini
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial.py         # Initial schema
├── requirements.txt               # Dependencies
├── .env.example                   # Environment template
├── run.py                         # Uvicorn startup
├── manage.py                      # Admin commands
└── README.md
```

## Architecture Principles

### 1. **Service-Oriented**

- Business logic in services, not routes
- Routes are thin HTTP handlers
- Services handle complex operations

### 2. **Async-First (SQLAlchemy 2.0)**

- All DB queries are async
- Scalable for thousands of concurrent users
- Proper session management

### 3. **Multitenancy**

- `tenant_id` on every model
- Tenant data isolation at DB level
- Ready for subdomain separation (phase 2)

### 4. **Role-Based Access Control**

- Roles: `super_admin`, `admin`, `therapist`, `sponsor`, `student`
- Permission checks in services, never hardcoded
- Fine-grained access in middlewares

### 5. **Abstracted External Services**

- Email: `EmailService` (Resend ready)
- Payments: `PaymentService` (Mercado Pago + Stripe abstraction)
- Media: `MediaService` (S3 presigned URLs)

### 6. **Migrations & Schema**

- Alembic for version control
- Initial schema includes all models
- Easy rollback/forward

## API Endpoints

### Auth

- `POST /auth/register` - Register user
- `POST /auth/login` - Login (returns JWT + Refresh)
- `POST /auth/refresh` - Refresh access token

### Users

- `GET /users/me` - Current user profile
- `PUT /users/me` - Update profile
- `GET /users/{user_id}` - Get user
- `GET /users` - List users (admin)

### Courses

- `POST /courses` - Create course (therapist/admin)
- `GET /courses/{course_id}` - Get course
- `PUT /courses/{course_id}` - Update course
- `POST /courses/{course_id}/publish` - Publish
- `GET /courses` - List courses
- `POST /courses/{course_id}/enroll` - Enroll student
- `GET /courses/{course_id}/progress` - Get progress

### Admin/CMS

- `GET /admin/cms` - List CMS content
- `POST /admin/cms` - Create CMS content
- `PUT /admin/cms/{content_id}` - Update CMS
- `DELETE /admin/cms/{content_id}` - Delete CMS
- `GET /admin/users` - List all users

## Setup Instructions

### 1. Create PostgreSQL Database

```bash
createdb constelacion_viva
```

### 2. Install Python 3.11+

```bash
python --version  # 3.11+
```

### 3. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database URL, secrets, etc.
```

### 6. Run Migrations

```bash
alembic upgrade head
```

### 7. Create Admin User

```bash
python manage.py create_admin_user admin@example.com password123 1
```

### 8. Start Server

```bash
python run.py
# or
uvicorn app.main:app --reload
```

Server runs on `http://localhost:8000`
API docs: `http://localhost:8000/docs`

## Database Models

### Core Entities

- **Tenant** - Multitenancy isolation
- **User** - Students, therapists, admins
- **Membership** - Monthly/yearly plans
- **UserMembership** - Tracks therapist active membership
- **Course** - Therapy courses
- **Module** - Course sections
- **Lesson** - Video/text/PDF content
- **CourseProgress** - Student's course progress
- **LessonProgress** - Per-lesson progress
- **CMSContent** - Editable marketing content
- **PasswordReset** - Password reset tokens

### Relationships

- Tenant has many Users, Courses, Memberships
- User can be creator of many Courses
- User can enroll in many Courses (many-to-many via CourseProgress)
- Course has many Modules
- Module has many Lessons
- Each student's course progress is tracked per lesson

## Authentication Flow

1. **Register**: Create user → Hash password → Return JWT tokens
2. **Login**: Verify email/password → Generate tokens
3. **Refresh**: Validate refresh token → Issue new access token
4. **Protected Routes**: Extract JWT → Decode → Verify user is active

Tokens include:

- `sub` (user_id)
- `tenant_id`
- `role`
- `exp` (expiration)

## External Services (Abstraction)

### EmailService

```python
class EmailService(ABC):
    async def send_password_reset(email, reset_link, name)
    async def send_payment_confirmation(email, order_id, amount, course_title)
    async def send_membership_confirmation(email, membership_name, expires_at)
```

### PaymentService

```python
class PaymentService(ABC):
    async def create_preference(user_id, course_id, amount, title, description)
    async def validate_payment(payment_id, token)
    async def process_membership_payment(user_id, membership_id, amount)
```

### MediaService

```python
class MediaService(ABC):
    async def generate_presigned_url(s3_key, expiration=3600)
    async def generate_upload_presigned_url(s3_key, expiration=3600)
    async def delete_object(s3_key)
    async def get_object_metadata(s3_key)
```

## Next Steps

1. **Implement Payment Integration** - Mercado Pago preferences
2. **Implement Email Service** - Resend integration
3. **Implement Media Service** - S3 presigned URLs
4. **Add Lesson Management** - Create/update lessons
5. **Add Progress Tracking** - Update lesson progress
6. **Add Membership Management** - Purchase, renewal
7. **Frontend Integration** - Connect Next.js to API
8. **Deployment** - DigitalOcean setup
