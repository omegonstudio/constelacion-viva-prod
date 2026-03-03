# Constelación Viva - Documentation Index

## 🎯 Getting Started

Start here if you're new to the project:

1. **[QUICK_START.md](./QUICK_START.md)** - One-command setup
   - `bash start.sh` to run everything
   - Service URLs (frontend, backend, database admin)
   - Common tasks

## 📚 Core Documentation

### Backend Architecture

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and database schema
  - Domain models (11 total)
  - API endpoints (18 total)
  - Service layer architecture
  - Authentication system (JWT + Refresh tokens)
  - Role-based access control (5 roles)

### Frontend Integration

- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - API integration guide
  - Authentication flow
  - API client setup
  - Error handling
  - Data fetching patterns

### Deployment & Docker

- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Complete deployment guide
  - Local development setup
  - Production deployment
  - Database management
  - CI/CD pipeline
  - Troubleshooting (12+ common issues)
  - Performance optimization
  - Security best practices

### Reference Guides

- **[DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)** - Docker command reference (200+ commands)

  - Compose management
  - Database operations
  - Backend/Frontend commands
  - Image management
  - Debugging

- **[DOCKERIZATION_COMPLETE.md](./DOCKERIZATION_COMPLETE.md)** - Project status & summary
  - What was created (16 files)
  - Architecture overview
  - Verification checklist

## 🚀 Quick Navigation by Task

### I want to...

**...start developing locally**
→ Run `bash start.sh` or read [QUICK_START.md](./QUICK_START.md)

**...understand the API**
→ Read [ARCHITECTURE.md](./ARCHITECTURE.md) or visit http://localhost:8000/docs

**...integrate frontend with API**
→ Read [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)

**...deploy to production**
→ Read [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md#production-deployment)

**...find a Docker command**
→ Search [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)

**...fix an error**
→ Check [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md#troubleshooting)

**...understand the full project**
→ Read [DOCKERIZATION_COMPLETE.md](./DOCKERIZATION_COMPLETE.md)

## 📋 File Structure

```
Constelacion-viva/
├── README.md                          # Project overview
├── QUICK_START.md                    # Getting started (read this first!)
├── ARCHITECTURE.md                   # System design
├── FRONTEND_INTEGRATION.md           # API integration guide
├── DOCKER_DEPLOYMENT.md              # Complete Docker guide
├── DOCKER_COMMANDS.md                # Command reference
├── DOCKERIZATION_COMPLETE.md         # Project status
│
├── docker-compose.yml                # Development orchestration
├── docker-compose.prod.yml           # Production orchestration
│
├── .env.example                      # Reference template
├── .env.development                  # Development config
├── .env.production                   # Production template
│
├── start.sh                          # One-command startup
├── cleanup.sh                        # Cleanup script
│
├── .github/workflows/
│   ├── ci.yml                        # Continuous Integration
│   └── cd.yml                        # Continuous Deployment
│
├── backend/
│   ├── Dockerfile                    # Production image
│   ├── Dockerfile.dev                # Development image
│   ├── .dockerignore                 # Build optimization
│   ├── requirements.txt              # Python dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI app
│   │   ├── core/
│   │   │   ├── config.py             # Settings
│   │   │   └── security.py           # Auth logic
│   │   ├── db/
│   │   │   └── database.py           # SQLAlchemy setup
│   │   ├── models/
│   │   │   └── models.py             # 11 ORM models
│   │   ├── schemas/
│   │   │   └── __init__.py           # Pydantic schemas
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── course_service.py
│   │   │   └── external_services.py
│   │   ├── routes/
│   │   │   ├── auth.py               # Auth endpoints
│   │   │   ├── users.py              # User endpoints
│   │   │   ├── courses.py            # Course endpoints
│   │   │   └── admin.py              # Admin endpoints
│   │   └── middlewares/
│   │       ├── auth.py               # JWT extraction
│   │       └── tenancy.py            # Tenant isolation
│   ├── migrations/
│   │   ├── alembic.ini               # Alembic config
│   │   ├── env.py                    # Migration env
│   │   └── versions/
│   │       └── 001_initial.py        # Initial schema
│   └── manage.py                     # CLI commands
│
└── Constelacion-viva/
    ├── Dockerfile                    # Production image
    ├── Dockerfile.dev                # Development image
    ├── .dockerignore                 # Build optimization
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   └── api/
    ├── components/
    │   ├── atoms/
    │   ├── molecules/
    │   ├── organisms/
    │   └── templates/
    ├── lib/
    │   ├── strapi.ts                 # API client
    │   └── utils.ts
    ├── styles/
    ├── public/
    └── next.config.mjs
```

## 🔍 Quick Reference

| What              | Where    | Command                                                                 |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| Start development | Terminal | `bash start.sh`                                                         |
| View logs         | Terminal | `docker-compose logs -f`                                                |
| Access frontend   | Browser  | http://localhost:3000                                                   |
| API docs          | Browser  | http://localhost:8000/docs                                              |
| Database admin    | Browser  | http://localhost:8080                                                   |
| DB shell          | Terminal | `docker-compose exec postgres psql -U cv_user -d constelacion_viva_dev` |
| Backend shell     | Terminal | `docker-compose exec backend python`                                    |
| Run migrations    | Terminal | `docker-compose exec backend alembic upgrade head`                      |
| Stop services     | Terminal | `docker-compose down`                                                   |

## 📖 Documentation Levels

**📍 Quick Start (5 min)**
→ [QUICK_START.md](./QUICK_START.md)

**📍 Learning Path (30 min)**
→ [ARCHITECTURE.md](./ARCHITECTURE.md) → [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)

**📍 Complete Reference (60 min)**
→ [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) → [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)

**📍 Project Overview (20 min)**
→ [DOCKERIZATION_COMPLETE.md](./DOCKERIZATION_COMPLETE.md)

## 🎯 Common Workflows

### Development Workflow

```
1. bash start.sh                    # Start all services
2. Open http://localhost:3000       # Frontend
3. Open http://localhost:8000/docs  # API testing
4. Edit code → Auto-reload          # Changes are immediate
5. Check logs: docker-compose logs -f
6. Ctrl+C to stop
```

### Production Workflow

```
1. Update .env.production           # Set real credentials
2. docker build -f backend/Dockerfile -t myapp/backend:latest ./backend
3. docker build -f Constelacion-viva/Dockerfile -t myapp/frontend:latest ./Constelacion-viva
4. docker push myapp/backend:latest
5. docker push myapp/frontend:latest
6. docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Debugging Workflow

```
1. Check service status: docker-compose ps
2. View logs: docker-compose logs service-name
3. Access database: docker-compose exec postgres psql -U cv_user -d constelacion_viva_dev
4. Run health check: curl http://localhost:8000/health
5. See [DOCKER_DEPLOYMENT.md#troubleshooting](./DOCKER_DEPLOYMENT.md#troubleshooting) for more
```

## 🔐 Security Checklist

- [ ] Never commit `.env` files with real secrets
- [ ] Use `.env.example` as template only
- [ ] Store production secrets in secure vault
- [ ] Enable HTTPS in production (use reverse proxy)
- [ ] Restrict CORS to your domain
- [ ] Keep dependencies updated
- [ ] Scan for vulnerabilities regularly
- [ ] Monitor logs for suspicious activity
- [ ] Use strong SECRET_KEY (32+ chars)
- [ ] Rotate tokens and keys regularly

See [DOCKER_DEPLOYMENT.md#security-best-practices](./DOCKER_DEPLOYMENT.md#security-best-practices) for details.

## 💡 Tips & Tricks

**Hot reload not working?**
→ Make sure you're using `Dockerfile.dev` in docker-compose.yml

**Port already in use?**
→ Change ports in docker-compose.yml or stop conflicting service

**Database won't migrate?**
→ Check logs: `docker-compose logs backend` and ensure DB is healthy

**API returning 503?**
→ Health check failed, run: `docker-compose logs backend`

**Frontend can't reach backend?**
→ Verify NEXT_PUBLIC_API_URL and test: `docker-compose exec frontend curl http://backend:8000`

See [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md) for 200+ more commands!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes (auto-reload works during development)
4. Push to branch
5. Create Pull Request
6. GitHub Actions runs CI checks automatically
7. Once approved, merge triggers CD to push images

## 📞 Support Resources

| Issue                | Solution                                                                            |
| -------------------- | ----------------------------------------------------------------------------------- |
| Services won't start | Read [DOCKER_DEPLOYMENT.md#troubleshooting](./DOCKER_DEPLOYMENT.md#troubleshooting) |
| Can't find command   | Search [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)                                   |
| Docker not installed | Install from https://docker.com                                                     |
| Port conflicts       | Check lsof or change docker-compose.yml ports                                       |
| Secrets exposed      | Never commit .env files, use GitHub Secrets                                         |

## 🎓 Learning Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📊 Project Stats

- **Backend:** Python + FastAPI, 35+ files, ~3000 lines
- **Frontend:** Next.js + React, 40+ npm packages
- **Database:** PostgreSQL + Alembic, 11 models
- **Docker:** 4 Dockerfiles, 2 compose files, 2 CI/CD workflows
- **Documentation:** 5 comprehensive guides, 200+ commands
- **Scripts:** 2 automation scripts
- **Config Files:** 3 env templates, 2 .dockerignore files

**Total:** 70+ files, production-ready infrastructure

---

**Last Updated:** 2024
**Status:** ✅ Fully Dockerized & Production Ready
**Version:** 1.0

**Ready to get started?** → Run `bash start.sh` 🚀
