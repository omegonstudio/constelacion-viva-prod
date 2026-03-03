# Deployment Guide - Constelación Viva

## DigitalOcean Droplet Setup

### 1. Create Droplet

**Specifications:**

- OS: Ubuntu 22.04 LTS
- RAM: 2GB minimum (4GB+ recommended)
- CPU: 2vCPU minimum
- Storage: 50GB SSD
- Region: Choose closest to users

### 2. Initial Droplet Configuration

```bash
# Connect via SSH
ssh root@<droplet_ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
  python3.11 \
  python3.11-venv \
  python3-pip \
  postgresql \
  postgresql-contrib \
  nginx \
  git \
  curl \
  wget \
  certbot \
  python3-certbot-nginx
```

### 3. PostgreSQL Setup

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE constelacion_viva;
CREATE USER cv_user WITH PASSWORD 'your_secure_password_here';
ALTER ROLE cv_user SET client_encoding TO 'utf8';
ALTER ROLE cv_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE cv_user SET default_transaction_deferrable TO on;
ALTER ROLE cv_user SET default_transaction_level TO 'read committed';
ALTER ROLE cv_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE constelacion_viva TO cv_user;
\q
EOF

# Verify connection
psql -U cv_user -d constelacion_viva -c "SELECT 1;"
```

### 4. Clone Repository

```bash
# Choose directory
cd /var/www

# Clone repo
git clone https://github.com/your-org/constelacion-viva.git
cd constelacion-viva/backend

# Set permissions
sudo chown -R www-data:www-data /var/www/constelacion-viva
```

### 5. Python Environment

```bash
cd /var/www/constelacion-viva/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Test installation
python -c "import fastapi; print(fastapi.__version__)"
```

### 6. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with production values
nano .env
```

**Production .env:**

```env
DATABASE_URL=postgresql+asyncpg://cv_user:your_secure_password@localhost:5432/constelacion_viva
SECRET_KEY=your-very-long-random-secret-key-here-min-32-chars
ENVIRONMENT=production
API_HOST=127.0.0.1
API_PORT=8000

# S3
S3_BUCKET=constelacion-viva
S3_REGION=us-east-1
S3_ACCESS_KEY=<your-key>
S3_SECRET_KEY=<your-secret>
S3_ENDPOINT=https://s3.amazonaws.com

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=<your-token>
MERCADO_PAGO_WEBHOOK_TOKEN=<your-token>

# Email
RESEND_API_KEY=<your-api-key>

# Frontend
FRONTEND_URL=https://constelacionviva.com
```

**Generate SECRET_KEY:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 7. Database Migrations

```bash
cd /var/www/constelacion-viva/backend
source venv/bin/activate

# Run migrations
alembic upgrade head

# Create initial admin user
python manage.py create_admin_user admin@constelacionviva.com your_secure_password 1
```

### 8. Create Systemd Service

Create `/etc/systemd/system/constelacion-api.service`:

```ini
[Unit]
Description=Constelación Viva FastAPI Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/constelacion-viva/backend
Environment="PATH=/var/www/constelacion-viva/backend/venv/bin"
ExecStart=/var/www/constelacion-viva/backend/venv/bin/python run.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=constelacion-api

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable constelacion-api
sudo systemctl start constelacion-api

# Verify
sudo systemctl status constelacion-api
```

### 9. Nginx Reverse Proxy

Create `/etc/nginx/sites-available/constelacion-api`:

```nginx
upstream constelacion_api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.constelacionviva.com;
    client_max_body_size 10M;

    location / {
        proxy_pass http://constelacion_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        # WebSocket support (for future features)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://constelacion_api;
        access_log off;
    }
}
```

**Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/constelacion-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d api.constelacionviva.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

This updates your Nginx config automatically to HTTPS with strong ciphers.

### 11. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verify
sudo ufw status
```

### 12. Monitoring & Logging

**View logs:**

```bash
# SystemD logs
sudo journalctl -u constelacion-api -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Check service health:**

```bash
curl https://api.constelacionviva.com/health
# Expected: {"status": "ok"}
```

### 13. Backup Strategy

**PostgreSQL backup:**

```bash
# Create backup directory
mkdir -p /backups/postgresql
sudo chown postgres:postgres /backups/postgresql

# Daily backup script: /etc/cron.daily/backup-postgresql
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U cv_user -d constelacion_viva > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Make executable:**

```bash
sudo chmod +x /etc/cron.daily/backup-postgresql
```

### 14. Monitoring Setup (Optional)

**Using Uptime Monitoring:**

```bash
curl -X POST https://monitoring.service.com/api/check \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.constelacionviva.com/health", "interval": 300}'
```

### 15. Scaling Considerations

**Load Balancing (Future):**

- Run multiple API instances behind Nginx
- Use pg_bouncer for database connection pooling

**Example with 3 instances:**

```nginx
upstream constelacion_api_cluster {
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}
```

---

## S3 Configuration

### AWS S3 Setup

**Create bucket:**

```bash
aws s3api create-bucket \
    --bucket constelacion-viva \
    --region us-east-1
```

**Enable CORS:**

```bash
# Create cors.json
cat > cors.json << 'EOF'
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST"],
            "AllowedOrigins": ["https://constelacionviva.com"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

# Apply CORS
aws s3api put-bucket-cors \
    --bucket constelacion-viva \
    --cors-configuration file://cors.json
```

**Create IAM user for the app:**

```bash
aws iam create-user --user-name constelacion-app
aws iam attach-user-policy \
    --user-name constelacion-app \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

---

## Mercado Pago Configuration

1. Create account at https://mercadopago.com
2. Get credentials:
   - Access Token (production)
   - Webhook Token
3. Configure webhook URL: `https://api.constelacionviva.com/webhooks/mercado-pago`
4. Set in `.env`

---

## Resend Email Configuration

1. Create account at https://resend.com
2. Get API key
3. Add to `.env`: `RESEND_API_KEY=<your-key>`

---

## Monitoring Dashboard Commands

```bash
# Check API is running
curl -s https://api.constelacionviva.com/health | jq .

# Check database connection
sudo -u postgres psql -d constelacion_viva -c "SELECT COUNT(*) FROM users;"

# Check disk space
df -h /var/www

# Check memory usage
free -m

# Check service status
sudo systemctl status constelacion-api

# Restart service
sudo systemctl restart constelacion-api

# View recent logs
sudo journalctl -u constelacion-api -n 50
```

---

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u constelacion-api -n 100

# Manually test
cd /var/www/constelacion-viva/backend
source venv/bin/activate
python run.py
```

### Database connection error

```bash
# Test connection
psql -U cv_user -d constelacion_viva -c "SELECT 1;"

# Check credentials in .env
grep DATABASE_URL /var/www/constelacion-viva/backend/.env
```

### Nginx not forwarding

```bash
# Test Nginx config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### High memory usage

```bash
# Check process
ps aux | grep python

# Restart service
sudo systemctl restart constelacion-api
```

---

## Production Checklist

- [ ] PostgreSQL database created
- [ ] Virtual environment setup
- [ ] Dependencies installed
- [ ] `.env` configured with secrets
- [ ] Migrations run (`alembic upgrade head`)
- [ ] Admin user created
- [ ] Systemd service created & enabled
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Firewall rules set
- [ ] Health check endpoint working
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] S3 bucket created & configured
- [ ] Mercado Pago credentials set
- [ ] Resend API key configured
- [ ] CORS origins restricted to frontend domain
- [ ] Secret key is secure (32+ chars)
- [ ] Database user has limited permissions
- [ ] Logs being collected

---

## Rollback Procedure

If something goes wrong:

```bash
# Stop service
sudo systemctl stop constelacion-api

# Restore database backup
psql -U cv_user -d constelacion_viva < /backups/postgresql/backup_20240106.sql

# Revert code
cd /var/www/constelacion-viva
git revert <commit-hash>

# Start service
sudo systemctl start constelacion-api

# Verify
curl https://api.constelacionviva.com/health
```

---

## Upgrade Procedure

```bash
# Pull latest code
cd /var/www/constelacion-viva
git pull origin main

# Activate venv
source backend/venv/bin/activate

# Install new dependencies
pip install -r requirements.txt

# Run migrations (if any)
cd backend
alembic upgrade head

# Restart service
sudo systemctl restart constelacion-api

# Verify
curl https://api.constelacionviva.com/health
```

---

**Status: Ready for Production Deployment** 🚀
