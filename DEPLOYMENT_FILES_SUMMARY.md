# 🚀 Deployment Files Summary

This document provides an overview of all deployment-related files created for AWS EC2 deployment.

## 📁 Files Created

### 1. Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **DEPLOYMENT_GUIDE.md** | Complete step-by-step deployment guide | Read first for full deployment process |
| **DEPLOYMENT_README.md** | Quick reference for deployment | Quick access to commands and troubleshooting |
| **DEPLOYMENT_CHECKLIST.md** | Checklist to track deployment progress | During deployment to ensure no steps are missed |
| **GITHUB_SECRETS_SETUP.md** | Guide for setting up GitHub Actions | When configuring auto-deployment |

### 2. Configuration Files

| File | Destination | Purpose |
|------|-------------|---------|
| **nginx.conf** | `/etc/nginx/conf.d/tournamentArena.conf` | Nginx web server configuration |
| **supervisor.conf** | `/etc/supervisor/conf.d/tournamentArena.conf` | Process manager configuration |
| **backend/.env.example** | `backend/.env` | Backend environment variables template |
| **frontend/.env.example** | `frontend/.env.production` | Frontend environment variables template |

### 3. Deployment Scripts

| File | Purpose | Executable |
|------|---------|------------|
| **deploy.sh** | Main deployment script | ✅ Yes (`chmod +x`) |
| **setup_server.sh** | Initial server setup | ✅ Yes (`chmod +x`) |
| **Makefile** | Quick deployment commands | ❌ No (used with `make`) |

### 4. GitHub Actions

| File | Purpose |
|------|---------|
| **.github/workflows/deploy.yml** | Auto-deployment workflow |

### 5. Application Files (Modified)

| File | Changes Made |
|------|--------------|
| **backend/backend/settings.py** | Added environment variable support for production |
| **backend/backend/settings_production.py** | New production-only settings file |
| **backend/backend/asgi.py** | Enhanced for production WebSocket security |
| **backend/requirements.txt** | Updated with production dependencies |
| **.gitignore** | Enhanced to exclude sensitive files |

---

## 🎯 Quick Deployment Flow

### Initial Setup (One-time)

```mermaid
graph TD
    A[Launch EC2 Instance] --> B[Run setup_server.sh]
    B --> C[Configure PostgreSQL]
    C --> D[Setup SSH Keys for GitHub]
    D --> E[Clone Repository]
    E --> F[Configure Environment Files]
    F --> G[Deploy Application]
    G --> H[Configure Nginx & Supervisor]
    H --> I[Setup GitHub Actions]
```

### Update Deployment (Ongoing)

```mermaid
graph LR
    A[Push to GitHub] --> B[GitHub Actions Triggered]
    B --> C[deploy.sh Runs on Server]
    C --> D[Backend Updated]
    C --> E[Frontend Built]
    D --> F[Services Restarted]
    E --> F
```

---

## 📖 Deployment Steps Overview

### Step 1: Server Preparation (15-20 minutes)

**Files to use:**
- `setup_server.sh` - Run this first

**What it does:**
- Updates system packages
- Installs all required software (Python, Node.js, Nginx, PostgreSQL, Redis)
- Creates application user
- Sets up directory structure

**Command:**
```bash
# On EC2 instance
sudo bash setup_server.sh
```

### Step 2: Application Setup (20-30 minutes)

**Files to use:**
- `backend/.env.example` → Create `backend/.env`
- `frontend/.env.example` → Create `frontend/.env.production`
- `DEPLOYMENT_GUIDE.md` - Follow detailed steps

**What to do:**
1. Generate SSH keys for GitHub
2. Clone repository
3. Configure environment variables
4. Set up database
5. Install dependencies
6. Run migrations
7. Collect static files
8. Build frontend

### Step 3: Service Configuration (10-15 minutes)

**Files to use:**
- `nginx.conf` → Copy to `/etc/nginx/conf.d/tournamentArena.conf`
- `supervisor.conf` → Copy to `/etc/supervisor/conf.d/tournamentArena.conf`

**What to do:**
1. Configure Nginx
2. Configure Supervisor
3. Start services
4. Verify everything works

### Step 4: Auto-Deployment Setup (5-10 minutes)

**Files to use:**
- `.github/workflows/deploy.yml` (already in repo)
- `GITHUB_SECRETS_SETUP.md` - Follow instructions
- `deploy.sh` (already in repo)

**What to do:**
1. Add GitHub Secrets
2. Test workflow
3. Verify auto-deployment works

---

## 🔧 Configuration Details

### Backend Environment Variables (`backend/.env`)

```env
DJANGO_SECRET_KEY=<generate-new-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,YOUR_EC2_IP
DATABASE_URL=postgresql://user:pass@localhost:5432/tournament_arena
REDIS_URL=redis://localhost:6379/0
RAZORPAY_KEY_ID=<your-key>
RAZORPAY_KEY_SECRET=<your-secret>
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://YOUR_EC2_IP
```

### Frontend Environment Variables (`frontend/.env.production`)

```env
VITE_API_BASE_URL=http://YOUR_EC2_IP:8000
# Or with SSL: https://your-domain.com
```

---

## 🛠️ Make Commands Reference

After deployment, use these commands on the server:

```bash
make help              # Show all available commands
make deploy            # Full deployment (backend + frontend)
make deploy-backend    # Deploy backend only
make deploy-frontend   # Deploy frontend only
make restart           # Restart all services
make logs              # View backend logs
make status            # Check service status
make clean             # Clean temporary files
make backup-db         # Backup database
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                         Client                          │
│                  (Browser / Mobile)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP/HTTPS + WebSocket
                      ▼
┌─────────────────────────────────────────────────────────┐
│                       Nginx (Port 80/443)               │
│  • Static file serving (React build)                    │
│  • Reverse proxy to backend                             │
│  • WebSocket proxy                                      │
└─────────────┬────────────────────────────┬──────────────┘
              │                            │
              │ API Requests               │ WebSocket
              ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│            Uvicorn (ASGI Server - Port 8000)            │
│                   Managed by Supervisor                 │
└─────────────┬────────────────────────────┬──────────────┘
              │                            │
              │ Django Backend             │ Channels
              ▼                            ▼
┌─────────────────────┐         ┌─────────────────────────┐
│   PostgreSQL        │         │        Redis            │
│   (Database)        │         │  (Channel Layer)        │
└─────────────────────┘         └─────────────────────────┘
```

---

## 🔐 Security Checklist

- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` generated
- [ ] Database password is strong
- [ ] `ALLOWED_HOSTS` properly configured
- [ ] CORS origins restricted
- [ ] SSL certificate installed (recommended)
- [ ] Firewall (UFW) configured
- [ ] SSH key-based authentication only
- [ ] `.env` files not committed to Git
- [ ] Regular security updates scheduled

---

## 📝 Common Commands

### On Server

```bash
# View logs
sudo tail -f /var/log/tournament_backend.log
sudo tail -f /var/log/nginx/tournamentArena_access.log

# Check services
sudo supervisorctl status
sudo systemctl status nginx

# Restart services
sudo supervisorctl restart tournament_backend
sudo systemctl reload nginx

# Manual deployment
cd /var/www/tournamentArena
./deploy.sh
```

### On Local Machine

```bash
# Push changes (triggers auto-deployment)
git add .
git commit -m "Your changes"
git push origin main

# Monitor deployment
# Go to GitHub → Actions tab
```

---

## 📚 File Locations on Server

```
/var/www/tournamentArena/          # Application root
├── backend/
│   ├── venv/                      # Virtual environment
│   ├── .env                       # Backend config (create this)
│   └── staticfiles/               # Collected static files
├── frontend/
│   ├── dist/                      # Production build
│   └── .env.production            # Frontend config (create this)
└── deploy.sh                      # Deployment script

/etc/nginx/conf.d/
└── tournamentArena.conf           # Nginx config (copy nginx.conf here)

/etc/supervisor/conf.d/
└── tournamentArena.conf           # Supervisor config (copy supervisor.conf here)

/var/log/
├── tournament_backend.log         # Backend logs
├── tournament_backend_error.log   # Backend error logs
├── tournament_deployment.log      # Deployment logs
└── nginx/
    ├── tournamentArena_access.log # Nginx access logs
    └── tournamentArena_error.log  # Nginx error logs
```

---

## 🎓 Learning Resources

1. **Django Deployment**: https://docs.djangoproject.com/en/5.0/howto/deployment/
2. **Nginx Configuration**: https://nginx.org/en/docs/
3. **Channels Deployment**: https://channels.readthedocs.io/en/stable/deploying.html
4. **GitHub Actions**: https://docs.github.com/en/actions
5. **AWS EC2**: https://docs.aws.amazon.com/ec2/

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the deployment guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Review logs**: See "Common Commands" section above
3. **Consult checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. **GitHub Actions logs**: Check failed workflow runs
5. **Test manually**: SSH into server and run commands step by step

---

## 🔄 Update Process

### For Code Changes

1. Make changes locally
2. Test locally
3. Commit and push to `main` branch
4. GitHub Actions automatically deploys
5. Verify deployment succeeded in GitHub Actions tab

### For Configuration Changes

1. SSH into server
2. Edit `.env` files as needed
3. Restart services: `make restart`
4. Verify changes took effect

---

**Created**: 2026-02-07  
**Version**: 1.0  
**Status**: Production Ready ✅
