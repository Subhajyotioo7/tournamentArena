# AWS EC2 Deployment Guide - Tournament Arena

This guide provides step-by-step instructions to deploy the Tournament Arena application on AWS EC2 with Nginx, Uvicorn, and automated GitHub deployment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [Server Initial Configuration](#server-initial-configuration)
4. [Application Deployment](#application-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL Certificate (Optional)](#ssl-certificate-optional)
7. [GitHub Auto-Deployment Setup](#github-auto-deployment-setup)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Prerequisites

- AWS Account with EC2 access
- Domain name (optional, can use EC2 public IP)
- GitHub account with private repository access
- Local machine with SSH client

---

## AWS EC2 Setup

### Step 1: Launch EC2 Instance

1. **Login to AWS Console** → EC2 Dashboard
2. Click **"Launch Instance"**
3. Configure instance:
   - **Name**: `tournament-arena-server`
   - **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   - **Instance Type**: `t2.medium` or `t3.medium` (minimum recommended)
   - **Key Pair**: Create new or select existing (download `.pem` file)
   - **Network Settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
     - Allow Custom TCP (port 8000) from anywhere (for WebSocket)
   - **Storage**: 20GB gp3 (minimum)
4. Click **"Launch Instance"**

### Step 2: Elastic IP (Recommended)

1. Go to **EC2 → Elastic IPs**
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the new IP → **Actions → Associate Elastic IP address**
5. Select your instance and associate

### Step 3: Connect to Your Instance

```bash
# Change permissions on your key file
chmod 400 your-key.pem

# SSH into your instance
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Server Initial Configuration

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Required Packages

```bash
# Install Python and dependencies
sudo apt install python3-pip python3-venv python3-dev -y

# Install Nginx
sudo apt install nginx -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Install git
sudo apt install git -y

# Install supervisor (for process management)
sudo apt install supervisor -y

# Install PostgreSQL (recommended for production)
sudo apt install postgresql postgresql-contrib -y
```

### Step 3: Configure PostgreSQL (Recommended)

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE DATABASE tournament_arena;
CREATE USER tournament_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
ALTER ROLE tournament_user SET client_encoding TO 'utf8';
ALTER ROLE tournament_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE tournament_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE tournament_arena TO tournament_user;
\q
```

### Step 4: Install Redis (for WebSocket Channel Layer)

```bash
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

---

## Application Deployment

### Step 1: Create Application User

```bash
sudo useradd -m -s /bin/bash tournament
sudo usermod -aG www-data tournament
```

### Step 2: Setup SSH Key for GitHub (Private Repo)

```bash
# Switch to tournament user
sudo su - tournament

# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519 -N ""

# Display public key
cat ~/.ssh/id_ed25519.pub
```

**Copy the output and add to GitHub:**
1. Go to your GitHub repository
2. **Settings → Deploy keys → Add deploy key**
3. Paste the public key
4. Check **"Allow write access"** (if you want to push from server)
5. Click **"Add key"**

**Configure SSH for GitHub:**

```bash
# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

# Test connection
ssh -T git@github.com
# Should see: "Hi username! You've successfully authenticated..."
```

### Step 3: Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/tournamentArena
sudo chown tournament:www-data /var/www/tournamentArena
cd /var/www/tournamentArena

# Clone repository (replace with your repo URL)
git clone git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git .
```

### Step 4: Setup Backend

```bash
cd /var/www/tournamentArena/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn uvicorn[standard] channels-redis psycopg2-binary

# Create .env file
nano .env
```

**Add to `.env`:**

```env
DJANGO_SECRET_KEY=your-super-secret-key-here-change-this
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com,YOUR_EC2_PUBLIC_IP
DATABASE_URL=postgresql://tournament_user:YOUR_STRONG_PASSWORD@localhost:5432/tournament_arena
REDIS_URL=redis://localhost:6379/0
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://YOUR_EC2_PUBLIC_IP
```

```bash
# Generate a secret key
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
# Copy this and replace DJANGO_SECRET_KEY in .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Exit tournament user
exit
```

### Step 5: Setup Frontend

```bash
# Switch back to tournament user
sudo su - tournament
cd /var/www/tournamentArena/frontend

# Create production .env file
nano .env.production
```

**Add to `.env.production`:**

```env
VITE_API_BASE_URL=http://YOUR_EC2_PUBLIC_IP:8000
```

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Exit tournament user
exit
```

---

## Nginx Configuration

### Step 1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/conf.d/tournamentArena.conf
```

**Add the following configuration:**

```nginx
# WebSocket upgrade headers
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

upstream backend_server {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP your-domain.com www.your-domain.com;

    client_max_body_size 100M;

    # Frontend - Serve React build
    location / {
        root /var/www/tournamentArena/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://backend_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Other backend endpoints
    location ~ ^/(wallet|tournaments|payments|chat)/ {
        proxy_pass http://backend_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket connections
    location /ws/ {
        proxy_pass http://backend_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Static files
    location /static/ {
        alias /var/www/tournamentArena/backend/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /var/www/tournamentArena/backend/media/;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Step 2: Test and Restart Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Supervisor Configuration (Backend Process Management)

### Step 1: Create Supervisor Configuration

```bash
sudo nano /etc/supervisor/conf.d/tournamentArena.conf
```

**Add the following:**

```ini
[program:tournament_backend]
directory=/var/www/tournamentArena/backend
command=/var/www/tournamentArena/backend/venv/bin/uvicorn backend.asgi:application --host 127.0.0.1 --port 8000 --workers 4
user=tournament
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/tournament_backend.log
stderr_logfile=/var/log/tournament_backend_error.log
environment=PATH="/var/www/tournamentArena/backend/venv/bin"
```

### Step 2: Update and Start Supervisor

```bash
# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Start the application
sudo supervisorctl start tournament_backend

# Check status
sudo supervisorctl status

# View logs
sudo tail -f /var/log/tournament_backend.log
```

---

## SSL Certificate (Optional but Recommended)

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

**After SSL is installed, update your `.env.production`:**

```env
VITE_API_BASE_URL=https://your-domain.com
```

**Rebuild frontend:**

```bash
sudo su - tournament
cd /var/www/tournamentArena/frontend
npm run build
exit
```

---

## GitHub Auto-Deployment Setup

### Step 1: Create Deployment Script

```bash
sudo nano /var/www/tournamentArena/deploy.sh
```

**Add the following:**

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/tournamentArena

# Pull latest changes
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Backend deployment
echo "🔧 Deploying backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# Frontend deployment
echo "🎨 Deploying frontend..."
cd ../frontend
npm ci
npm run build

# Restart services
echo "♻️ Restarting services..."
sudo supervisorctl restart tournament_backend
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
```

```bash
# Make executable
sudo chmod +x /var/www/tournamentArena/deploy.sh
sudo chown tournament:www-data /var/www/tournamentArena/deploy.sh
```

### Step 2: Configure Sudoers for Deployment

```bash
sudo visudo
```

**Add at the end:**

```
tournament ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart tournament_backend
tournament ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
```

### Step 3: Test Deployment

```bash
sudo su - tournament
cd /var/www/tournamentArena
./deploy.sh
```

### Step 4: Create Makefile for Easy Deployment

See `Makefile` in the root directory of the project.

---

## Monitoring and Maintenance

### Check Application Status

```bash
# Check backend status
sudo supervisorctl status tournament_backend

# Check nginx status
sudo systemctl status nginx

# View backend logs
sudo tail -f /var/log/tournament_backend.log

# View nginx access logs
sudo tail -f /var/log/nginx/access.log

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Common Commands

```bash
# Restart backend
sudo supervisorctl restart tournament_backend

# Restart nginx
sudo systemctl restart nginx

# Deploy updates
cd /var/www/tournamentArena && sudo -u tournament ./deploy.sh
```

### Database Backup

```bash
# Backup database
sudo -u postgres pg_dump tournament_arena > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
sudo -u postgres psql tournament_arena < backup_file.sql
```

---

## Troubleshooting

### WebSocket Not Working

1. Check if port 8000 is open in EC2 Security Group
2. Verify WebSocket endpoint in frontend `.env.production`
3. Check nginx WebSocket configuration
4. View logs: `sudo tail -f /var/log/tournament_backend.log`

### Static Files Not Loading

```bash
cd /var/www/tournamentArena/backend
source venv/bin/activate
python manage.py collectstatic --noinput
sudo systemctl reload nginx
```

### Database Connection Issues

1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify database credentials in backend `.env`
3. Check database exists: `sudo -u postgres psql -l`

### Permission Issues

```bash
# Fix ownership
sudo chown -R tournament:www-data /var/www/tournamentArena
sudo chmod -R 755 /var/www/tournamentArena
```

---

## Security Checklist

- [ ] Change Django SECRET_KEY
- [ ] Set DEBUG=False in production
- [ ] Use strong PostgreSQL password
- [ ] Enable firewall (ufw)
- [ ] Configure SSL/TLS certificate
- [ ] Restrict SSH access to specific IPs
- [ ] Enable automatic security updates
- [ ] Regular database backups
- [ ] Monitor server resources
- [ ] Keep dependencies updated

---

## Next Steps

1. Set up monitoring (e.g., CloudWatch, Grafana)
2. Configure CloudFront for CDN
3. Set up automated backups to S3
4. Implement log rotation
5. Set up alerting for errors

---

**Deployment Guide Version:** 1.0  
**Last Updated:** 2026-02-07  
**Author:** Deployment Team
