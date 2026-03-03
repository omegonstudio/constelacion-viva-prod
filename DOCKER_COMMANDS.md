# Docker Commands Reference

## Quick Start

```bash
# Start services with automatic rebuild and database migrations
bash start.sh

# Or manual setup
docker-compose up --build -d
docker-compose exec backend alembic upgrade head
```

## Docker Compose Management

### View Status

```bash
docker-compose ps                    # Show running services
docker-compose logs                  # View all logs
docker-compose logs -f               # Follow logs in real-time
docker-compose logs backend          # View specific service logs
docker-compose stats                 # Show resource usage
```

### Start/Stop Services

```bash
docker-compose up                    # Start services (foreground)
docker-compose up -d                 # Start services (background)
docker-compose up --build            # Rebuild and start
docker-compose down                  # Stop and remove containers
docker-compose stop                  # Stop without removing
docker-compose restart               # Restart services
docker-compose restart backend       # Restart specific service
```

### Service Management

```bash
docker-compose pause                 # Pause services
docker-compose unpause               # Resume services
docker-compose kill                  # Force stop services
docker-compose rm                    # Remove stopped containers
docker-compose down -v               # Remove containers and volumes (DATA LOSS!)
```

## Database Operations

### Connect to Database

```bash
# PostgreSQL CLI
docker-compose exec postgres psql -U cv_user -d constelacion_viva_dev

# Or with password prompt
docker-compose exec postgres psql -U cv_user -d constelacion_viva_dev -W
```

### Database Commands (inside psql)

```sql
-- List databases
\l

-- Connect to database
\c constelacion_viva_dev

-- List tables
\dt

-- Describe table
\d users

-- Run SQL
SELECT * FROM users LIMIT 10;

-- Exit
\q
```

### Migrations

```bash
# Apply all pending migrations
docker-compose exec backend alembic upgrade head

# Rollback one migration
docker-compose exec backend alembic downgrade -1

# Rollback to specific revision
docker-compose exec backend alembic downgrade <revision>

# Generate new migration
docker-compose exec backend alembic revision --autogenerate -m "Add user roles"

# View current migration
docker-compose exec backend alembic current

# View all migrations
docker-compose exec backend alembic history --all
```

## Backend Operations

### Python Shell

```bash
docker-compose exec backend python
>>> from app.models.models import User
>>> from app.db.database import AsyncSessionLocal
>>> # Use async context manager for database operations
```

### Backend Commands

```bash
# Install new package
docker-compose exec backend pip install package-name

# Run tests
docker-compose exec backend pytest -v

# Format code
docker-compose exec backend black app/

# Lint code
docker-compose exec backend flake8 app/

# Type check
docker-compose exec backend mypy app/
```

## Frontend Operations

### NPM Commands

```bash
# Install dependencies
docker-compose exec frontend npm install

# Build for production
docker-compose exec frontend npm run build

# Run tests
docker-compose exec frontend npm test

# Format code
docker-compose exec frontend npm run format

# Lint
docker-compose exec frontend npm run lint
```

## Docker Image Management

### Build Images

```bash
# Build backend production image
docker build -f backend/Dockerfile -t constelacion-backend:latest ./backend

# Build backend development image
docker build -f backend/Dockerfile.dev -t constelacion-backend:dev ./backend

# Build frontend production image
docker build -f Constelacion-viva/Dockerfile -t constelacion-frontend:latest ./Constelacion-viva

# Build frontend development image
docker build -f Constelacion-viva/Dockerfile.dev -t constelacion-frontend:dev ./Constelacion-viva
```

### Inspect Images

```bash
docker image ls                      # List images
docker image inspect backend         # Image details
docker image history backend         # Layer history
docker image rm backend              # Remove image
```

### Push to Registry

```bash
docker login ghcr.io
docker tag constelacion-backend:latest ghcr.io/your-org/constelacion/backend:latest
docker push ghcr.io/your-org/constelacion/backend:latest
```

## Container Operations

### Execute Commands

```bash
docker-compose exec backend bash                    # Start bash shell
docker-compose exec backend python manage.py shell  # Python shell
docker-compose exec postgres bash                   # PostgreSQL shell
docker-compose exec frontend sh                     # Frontend shell
```

### View Container Info

```bash
docker-compose top backend          # View processes
docker-compose stats backend        # Resource usage
docker inspect cv_backend           # Detailed info
```

### Copy Files

```bash
# Copy from container
docker-compose cp backend:/app/file.txt ./local-file.txt

# Copy to container
docker-compose cp ./local-file.txt backend:/app/file.txt
```

## Network Operations

### Check Networking

```bash
docker network ls                   # List networks
docker network inspect constelacion_network
docker-compose exec backend getent hosts postgres  # DNS resolution
docker-compose exec backend curl http://postgres:5432
```

### Test Connectivity

```bash
docker-compose exec backend curl http://frontend:3000
docker-compose exec frontend curl http://backend:8000/health
docker-compose exec backend psql -h postgres -U cv_user -l
```

## Volume Operations

### Manage Volumes

```bash
docker volume ls                    # List volumes
docker volume inspect cv_postgres_data
docker volume rm cv_postgres_data   # Remove (DATA LOSS!)
docker volume prune                 # Remove unused volumes
```

### Backup/Restore Database

```bash
# Backup
docker-compose exec postgres pg_dump -U cv_user constelacion_viva_dev > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U cv_user -d constelacion_viva_dev
```

## System Cleanup

### Clean Up Unused Resources

```bash
docker system prune                 # Remove unused containers, networks, images
docker system prune -a              # Remove all unused resources
docker system prune -a --volumes    # Also remove unused volumes
docker system df                    # Show disk usage
```

### Remove Everything (CAUTION)

```bash
docker-compose down -v              # Remove all services and volumes
docker system prune -a --volumes    # Remove all Docker resources
```

## Debugging

### Check Logs

```bash
docker-compose logs backend         # View backend logs
docker-compose logs backend -f      # Follow backend logs
docker-compose logs backend --tail 100  # Last 100 lines
docker-compose logs backend --since 10m # Last 10 minutes
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000/

# Database
docker-compose exec backend psql -h postgres -U cv_user -c "SELECT 1"
```

### Environment Variables

```bash
docker-compose exec backend env                # View all env vars
docker-compose exec backend echo $DATABASE_URL # Specific var
```

## Useful Shortcuts

```bash
# Combine common operations
docker-compose down && docker-compose up --build

# Fresh start (with data loss)
docker-compose down -v && docker-compose up --build

# Follow all logs
docker-compose logs -f --all

# Scale a service
docker-compose up -d --scale backend=2

# Restart all
docker-compose restart

# Full cleanup and rebuild
bash cleanup.sh && bash start.sh
```

## Troubleshooting Commands

```bash
# Check if port is in use
lsof -i :8000
lsof -i :3000
lsof -i :5432

# Kill process using port
kill -9 <PID>

# Check Docker daemon
docker info

# Diagnose Docker
docker system df
docker volume ls
docker network ls

# Inspect failed container
docker logs <container_id>
docker exec <container_id> bash

# Clear Docker cache
docker builder prune
```

## Environment-Specific Commands

### Development

```bash
export COMPOSE_FILE=docker-compose.yml
docker-compose up --build
```

### Production

```bash
export COMPOSE_FILE=docker-compose.prod.yml
export ENV_FILE=.env.production
docker-compose --env-file $ENV_FILE up -d
```

## Performance Optimization

```bash
# Rebuild without cache
docker-compose build --no-cache

# Prune unused layers
docker image prune -a

# Monitor memory usage
docker stats --no-stream

# Limit resource usage (in docker-compose.yml)
# deploy:
#   resources:
#     limits:
#       cpus: '0.5'
#       memory: 512M
```
