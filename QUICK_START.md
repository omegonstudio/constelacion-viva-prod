# Quick Start Guide - Docker Deployment

## 🚀 One Command Start

```bash
bash start.sh
```

This script:

1. Checks Docker installation
2. Sets up environment configuration
3. Builds all Docker images
4. Starts all services
5. Runs database migrations
6. Verifies all services are healthy

## 📋 What Gets Started

| Service      | URL                        | Purpose                              |
| ------------ | -------------------------- | ------------------------------------ |
| **Frontend** | http://localhost:3000      | Next.js web application              |
| **Backend**  | http://localhost:8000      | FastAPI REST API                     |
| **API Docs** | http://localhost:8000/docs | Swagger UI (interactive API testing) |
| **Database** | localhost:5432             | PostgreSQL database                  |
| **Adminer**  | http://localhost:8080      | Database admin (optional)            |

## 📁 Key Files

- **docker-compose.yml** - Local development orchestration (hot reload, full logging)
- **docker-compose.prod.yml** - Production configuration (optimized, minimal)
- **.env.development** - Development environment variables
- **.env.production** - Production environment variables (use secure secrets in deployment)
- **.env.example** - Reference template
- **Dockerfiles** - Production-optimized multi-stage builds
- **Dockerfile.dev** - Development with hot reload

## 🛠️ Common Tasks

### View Status

```bash
docker-compose ps
docker-compose logs -f
```

### Access Database

```bash
docker-compose exec postgres psql -U cv_user -d constelacion_viva_dev
```

### Run Migrations

```bash
docker-compose exec backend alembic upgrade head
```

### Stop Services

```bash
docker-compose down
```

### Full Cleanup

```bash
bash cleanup.sh
```

## 📖 Complete Documentation

- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Comprehensive deployment guide
- [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md) - Docker command reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) - API integration guide

## 🔐 Security

- ✅ Non-root users in containers
- ✅ Multi-stage builds (minimal images)
- ✅ Health checks for orchestration
- ✅ Environment variables for secrets (not in code)
- ✅ CORS configured by environment

**Never commit `.env` files with real secrets!**

## 📊 Infrastructure

```
┌─────────────────────────────────────────────────┐
│              Docker Network Bridge              │
├──────────────┬──────────────┬──────────────────┤
│   Frontend   │   Backend    │    Database      │
│  (port 3000) │ (port 8000)  │   (port 5432)    │
│ Next.js      │ FastAPI      │  PostgreSQL      │
└──────────────┴──────────────┴──────────────────┘
```

Services communicate via internal Docker network. Frontend and backend ports exposed to host for local development.

## 🔄 Development Workflow

1. **Start services:** `docker-compose up --build`
2. **Make changes** to code (auto-reload enabled)
3. **Check API docs:** http://localhost:8000/docs
4. **View logs:** `docker-compose logs -f`
5. **Stop services:** `Ctrl+C` or `docker-compose down`

## 📦 Production Deployment

```bash
# Build production images
docker build -f backend/Dockerfile -t constelacion-backend:latest ./backend
docker build -f Constelacion-viva/Dockerfile -t constelacion-frontend:latest ./Constelacion-viva

# Push to registry
docker push your-registry/constelacion-backend:latest
docker push your-registry/constelacion-frontend:latest

# Deploy with docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## ⚠️ Important Notes

- Database data is persisted in Docker volumes
- First run takes ~2-3 minutes to build images
- Backend waits for database health check before starting
- Migrations run automatically on first start
- Frontend needs NEXT_PUBLIC_API_URL environment variable

## 🐛 Troubleshooting

**Services won't start?**

```bash
docker-compose logs
docker-compose down -v
docker-compose up --build
```

**Database won't connect?**

```bash
docker-compose exec postgres psql -U cv_user -d constelacion_viva_dev
```

**API returning 503?**

```bash
curl http://localhost:8000/health
docker-compose logs backend
```

**Frontend can't reach backend?**

```bash
docker-compose exec frontend curl http://backend:8000/health
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed troubleshooting.

## 🎯 Next Steps

1. ✅ Run `bash start.sh` to start local development
2. ✅ Access http://localhost:3000 for frontend
3. ✅ Access http://localhost:8000/docs for API documentation
4. ✅ Make changes (auto-reload enabled)
5. ✅ Commit and push (GitHub Actions runs CI/CD)

---

**Questions?** See the comprehensive guides linked above or check [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md) for all available commands.
