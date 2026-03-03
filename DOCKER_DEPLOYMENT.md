# Docker & Deployment Guide

## Overview

This guide covers containerization, orchestration, and deployment of Constelación Viva using Docker, Docker Compose, and GitHub Actions.

## Table of Contents

1. [Local Development with Docker Compose](#local-development)
2. [Production Deployment](#production-deployment)
3. [Docker Images](#docker-images)
4. [Environment Configuration](#environment-configuration)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Troubleshooting](#troubleshooting)

---

## Local Development with Docker Compose

### Quick Start

```bash
# Clone repository and navigate to project
cd Constelacion-viva

# Copy development environment file
cp .env.development .env

# Start all services (frontend, backend, postgres, adminer)
docker-compose up --build

# In a separate terminal, run migrations
docker-compose exec backend alembic upgrade head

# Access services
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Backend Docs: http://localhost:8000/docs
- Database Admin: http://localhost:8080 (Adminer)
- Database: localhost:5432
```

### Development Setup Details

**docker-compose.yml** orchestrates:

| Service  | Image              | Port | Purpose                            |
| -------- | ------------------ | ---- | ---------------------------------- |
| frontend | Node 20-alpine     | 3000 | Next.js dev server with hot reload |
| backend  | Python 3.11-slim   | 8000 | FastAPI dev server with reload     |
| postgres | postgres:15-alpine | 5432 | PostgreSQL database                |
| adminer  | adminer:latest     | 8080 | Database admin UI (optional)       |

**Key Features:**

- Hot reload for both frontend and backend
- Automatic database initialization
- Health checks for all services
- Volumes for development persistence
- Internal Docker network for service communication
- Adminer for database management (accessible with `docker-compose --profile dev up`)

### Managing Services

```bash
# View running services
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in container
docker-compose exec backend python manage.py shell
docker-compose exec frontend npm run build

# Stop services
docker-compose stop

# Remove containers and volumes
docker-compose down -v

# Restart a specific service
docker-compose restart backend
```

### Database Management

```bash
# Access PostgreSQL via psql
docker-compose exec postgres psql -U cv_user -d constelacion_viva_dev

# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Add new table"

# Rollback last migration
docker-compose exec backend alembic downgrade -1

# View migration status
docker-compose exec backend alembic current
```

### Development Workflow

1. **Start development environment:**

   ```bash
   docker-compose up --build
   ```

2. **Make code changes** - both frontend and backend will auto-reload

3. **Check backend API docs:**

   - Navigate to http://localhost:8000/docs
   - Test endpoints directly from Swagger UI

4. **View logs for debugging:**

   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

5. **Access database:**
   ```bash
   # Option 1: Adminer at http://localhost:8080
   # Option 2: Direct psql connection
   docker-compose exec postgres psql -U cv_user -d constelacion_viva_dev
   ```

---

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed
- Environment variables configured in `.env.production`
- DNS configured for your domain
- SSL certificate (for HTTPS)

### Production Compose File

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or load environment from specific file
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**Production Differences:**

- No volumes (immutable containers)
- Pre-built images (from registry)
- Minimal health checks
- `restart: always` policy
- No development tools or hot reload

### Production Checklist

- [ ] `.env.production` configured with real credentials
- [ ] Database backups configured
- [ ] SSL certificate installed (via nginx/caddy reverse proxy)
- [ ] Secrets stored securely (not in .env file)
- [ ] Monitoring and logging configured
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] Database connection pooling optimized

### Reverse Proxy Setup (Nginx Example)

```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 443 ssl http2;
    server_name api.constelacion-viva.com;

    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name constelacion-viva.com;

    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Docker Images

### Backend Image

**Dockerfile:** Multi-stage build for production optimization

```dockerfile
# Production image: ~250MB
# Python 3.11-slim base
# Non-root user (appuser)
# Health check on /health endpoint
# Uvicorn with 4 workers

# Build:
docker build -f backend/Dockerfile -t constelacion-backend:latest ./backend

# Run:
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  -e SECRET_KEY=your-secret \
  constelacion-backend:latest
```

**Dockerfile.dev:** Development image with hot reload

```dockerfile
# Development image: ~450MB (includes dev tools)
# Single stage, uvicorn --reload
# Volume-friendly for source code mounting

# Build:
docker build -f backend/Dockerfile.dev -t constelacion-backend:dev ./backend

# Run with hot reload:
docker run -p 8000:8000 \
  -v ./backend/app:/app/app \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  constelacion-backend:dev
```

### Frontend Image

**Dockerfile:** Multi-stage Next.js build

```dockerfile
# Production image: ~300MB
# 3 stages: deps -> builder -> runner
# Node 20-alpine base
# Non-root user (nodejs)
# Standalone export for minimal footprint

# Build:
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -f Constelacion-viva/Dockerfile \
  -t constelacion-frontend:latest \
  ./Constelacion-viva

# Run:
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  constelacion-frontend:latest
```

**Dockerfile.dev:** Development image with hot reload

```dockerfile
# Development image: ~600MB
# Single stage, npm run dev
# Volume-friendly with node_modules persistence

# Build:
docker build -f Constelacion-viva/Dockerfile.dev -t constelacion-frontend:dev ./Constelacion-viva

# Run with hot reload:
docker run -p 3000:3000 \
  -v ./Constelacion-viva:/app \
  -v /app/node_modules \
  constelacion-frontend:dev
```

### Image Registry

Push to GitHub Container Registry:

```bash
# Login
docker login ghcr.io

# Tag images
docker tag constelacion-backend:latest ghcr.io/your-org/constelacion/backend:latest
docker tag constelacion-frontend:latest ghcr.io/your-org/constelacion/frontend:latest

# Push
docker push ghcr.io/your-org/constelacion/backend:latest
docker push ghcr.io/your-org/constelacion/frontend:latest

# Pull
docker pull ghcr.io/your-org/constelacion/backend:latest
```

---

## Environment Configuration

### .env File Precedence

1. `.env.production` (production deployments)
2. `.env.development` (development with docker-compose)
3. `.env.example` (reference template)

### Required Variables

**Backend:**

```
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/dbname
SECRET_KEY=your-32-char-minimum-secret-key
ENVIRONMENT=production
FRONTEND_URL=https://constelacion-viva.com
```

**Frontend:**

```
NEXT_PUBLIC_API_URL=https://api.constelacion-viva.com
NODE_ENV=production
```

**Optional (External Services):**

```
S3_BUCKET=your-bucket
S3_ACCESS_KEY=your-key
MERCADO_PAGO_ACCESS_TOKEN=your-token
RESEND_API_KEY=your-key
```

### Secrets Management

**Development:**

- Use `.env` file (gitignored)
- Store in `~/.env.development` locally

**Production:**

- Use environment variables from container orchestrator
- Store in GitHub Secrets for CI/CD
- Use HashiCorp Vault or AWS Secrets Manager for runtime

```bash
# Export secrets to environment
export DATABASE_URL="postgresql://..."
export SECRET_KEY="..."

# Or use --env-file
docker-compose --env-file .env.production up
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

**ci.yml** (Continuous Integration)

- Trigger: Push to main/develop, pull requests
- Jobs:
  - Backend linting (flake8, pylint)
  - Backend type checking (mypy)
  - Backend tests (pytest with PostgreSQL)
  - Frontend linting
  - Frontend type checking (tsc)
  - Frontend build (next build)
  - Docker build validation (no push)
  - Security scanning (Trufflehog)

**cd.yml** (Continuous Deployment)

- Trigger: Push to main, tags, manual trigger
- Jobs:
  - Build backend image, push to registry
  - Build frontend image, push to registry
  - Tag with git sha, branch, semver
  - Use GitHub Actions cache for faster builds

### Running CI/CD Locally

```bash
# Install act (GitHub Actions local runner)
brew install act

# Run CI workflow
act -j backend-lint
act -j frontend-build
act -j backend-docker-build

# Run all jobs
act
```

### Setting Up Secrets

In GitHub repository settings → Secrets:

```
PRODUCTION_API_URL=https://api.constelacion-viva.com
REGISTRY_USERNAME=your-registry-user
REGISTRY_PASSWORD=your-registry-token
DATABASE_PASSWORD=production-db-password
SECRET_KEY=production-secret-key
S3_ACCESS_KEY=aws-access-key
S3_SECRET_KEY=aws-secret-key
```

### Deployment Pipeline

```
Code Push
    ↓
CI Tests (lint, type-check, unit tests)
    ↓
Docker Build Validation
    ↓
Security Scan
    ↓
Approval (if production)
    ↓
Build & Push Docker Images
    ↓
Deploy to Production
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Rebuild and restart
docker-compose down
docker-compose up --build

# Remove volumes and start fresh
docker-compose down -v
docker-compose up
```

### Database Connection Issues

```bash
# Test database connectivity
docker-compose exec backend psql postgresql://cv_user:password@postgres:5432/constelacion_viva_dev

# Check PostgreSQL logs
docker-compose logs postgres

# Verify database exists
docker-compose exec postgres psql -U cv_user -l

# Check connection pooling
docker-compose exec backend python -c "from app.db.database import engine; print(engine.pool)"
```

### API Not Responding

```bash
# Check backend health
curl http://localhost:8000/health

# Check logs for errors
docker-compose logs -f backend

# Verify database URL
docker-compose exec backend env | grep DATABASE_URL

# Test API endpoint
curl http://localhost:8000/api/health
```

### Frontend Can't Connect to Backend

```bash
# Check frontend environment variable
docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL

# Verify backend is running
docker-compose exec backend curl http://localhost:8000/health

# Test connectivity between containers
docker-compose exec frontend curl http://backend:8000/health

# Check Docker network
docker network inspect constelacion_network
```

### Out of Disk Space

```bash
# Clean up Docker resources
docker system prune -a

# Remove all volumes (careful!)
docker volume prune -a

# Check disk usage
docker system df
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8000
lsof -i :3000
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
ports:
  - "8001:8000"  # Changed from 8000:8000
```

### Migration Issues

```bash
# Check migration status
docker-compose exec backend alembic current

# List all migrations
docker-compose exec backend alembic history

# Rollback to specific revision
docker-compose exec backend alembic downgrade <revision>

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec backend alembic upgrade head
```

---

## Performance Optimization

### Database Connection Pooling

Edit `backend/app/db/database.py`:

```python
engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool,  # or AsyncioPool for persistent connections
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,  # Validate connections before using
)
```

### Frontend Build Optimization

Edit `Constelacion-viva/next.config.mjs`:

```javascript
const config = {
  compress: true,
  experimental: {
    optimizePackageImports: ["lodash-es", "@mui/icons-material"],
  },
};
```

### Docker Layer Caching

- Place frequently changing files last in Dockerfile
- Use .dockerignore to exclude unnecessary files
- Multi-stage builds reduce final image size

---

## Security Best Practices

1. **Never commit secrets** - use environment variables
2. **Use non-root users** - backend (appuser), frontend (nodejs)
3. **Keep images minimal** - use alpine/slim base images
4. **Scan for vulnerabilities** - use Trivy or similar
5. **Update dependencies regularly** - pin versions in requirements.txt and package.json
6. **Use HTTPS in production** - configure SSL certificate
7. **Restrict CORS** - set ALLOWED_ORIGINS env variable
8. **Implement rate limiting** - use FastAPI middleware
9. **Validate all inputs** - use Pydantic schemas
10. **Monitor logs** - use centralized logging (ELK, CloudWatch, etc.)

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL in Docker](https://hub.docker.com/_/postgres)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
