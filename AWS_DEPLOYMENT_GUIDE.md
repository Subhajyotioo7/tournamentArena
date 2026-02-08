# 🚀 AWS EC2 Deployment Guide
## Server IP: 13.235.24.56

---

## ✅ Configuration Updated

All files have been updated with your new AWS EC2 IP address: **13.235.24.56**

### Files Updated:
- ✅ `frontend/.env.production` - Production frontend environment
- ✅ `backend/backend/settings_production.py` - Production backend settings
- ✅ `switch_to_prod.bat` - Windows production switch script
- ✅ `switch_to_prod.sh` - Linux production switch script

---

## 📋 Quick Deployment Steps

### Step 1: Build on Your Windows Computer

```bash
# Switch to production mode
switch_to_prod.bat

# Or manually update if needed
cd frontend
# The .env.production already has: VITE_API_BASE_URL=http://13.235.24.56

# Build the frontend
npm run build
```

### Step 2: Upload to AWS EC2

```bash
# Using SCP (Secure Copy)
scp -r * ubuntu@13.235.24.56:/var/www/tournamentArena/

# Or using SFTP, rsync, etc.
```

### Step 3: SSH to AWS EC2

```bash
ssh ubuntu@13.235.24.56
```

### Step 4: Install System Dependencies (First Time Only)

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv nginx supervisor redis-server nodejs npm

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### Step 5: Setup Backend

```bash
cd /var/www/tournamentArena/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### Step 6: Configure Nginx

```bash
cd /var/www/tournamentArena

# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/tournamentArena

# Enable the site
sudo ln -s /etc/nginx/sites-available/tournamentArena /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 7: Configure Supervisor

```bash
# Copy supervisor config
sudo cp supervisor.conf /etc/supervisor/conf.d/tournamentArena.conf

# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Start backend
sudo supervisorctl start tournament_backend

# Check status
sudo supervisorctl status
```

### Step 8: Configure AWS Security Group

**Important:** Make sure your AWS EC2 Security Group allows:

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 22 | TCP | Your IP | SSH access |
| 80 | TCP | 0.0.0.0/0 | HTTP (Nginx) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (if using SSL) |

**To configure:**
1. Go to AWS Console → EC2 → Security Groups
2. Select your instance's security group
3. Edit Inbound Rules
4. Add rules for ports 22, 80, and 443

### Step 9: Verify Deployment

```bash
# Check backend status
sudo supervisorctl status
# Should show: tournament_backend    RUNNING

# Check nginx status
sudo systemctl status nginx
# Should show: active (running)

# Check Redis
redis-cli ping
# Should return: PONG

# Test backend API
curl http://localhost:8000/admin/
# Should return HTML

# Test via Nginx
curl http://localhost/admin/
# Should return HTML
```

### Step 10: Access Your Application

Open your browser and visit:
- **Frontend:** http://13.235.24.56/
- **API:** http://13.235.24.56/api/
- **Admin:** http://13.235.24.56/admin/

---

## 🔧 Configuration Files Summary

### Frontend Production Environment
**File:** `frontend/.env.production`
```bash
VITE_API_BASE_URL=http://13.235.24.56
VITE_WS_URL=ws://13.235.24.56/ws/
```

### Backend Production Settings
**File:** `backend/backend/settings_production.py`
```python
ALLOWED_HOSTS = ['13.235.24.56', 'localhost', '127.0.0.1', '*']
CORS_ALLOWED_ORIGINS = ['http://13.235.24.56']
CSRF_TRUSTED_ORIGINS = ['http://13.235.24.56']
```

### Nginx Configuration
**File:** `nginx.conf`
- Listens on port 80
- Accepts all server names (`server_name _`)
- Proxies backend to 127.0.0.1:8000
- Serves frontend from `/var/www/tournamentArena/frontend/dist`

### Supervisor Configuration
**File:** `supervisor.conf`
- Runs: `uvicorn backend.asgi:application --host 127.0.0.1 --port 8000`
- Auto-start: Yes
- Auto-restart: Yes
- Logs: `/var/log/tournament_backend.log`

---

## 🔍 Common Issues & Solutions

### Issue: Can't connect to 13.235.24.56

**Check:**
1. AWS Security Group allows port 80
2. Instance is running
3. Nginx is running: `sudo systemctl status nginx`

**Solution:**
```bash
# Restart nginx
sudo systemctl restart nginx

# Check firewall (if using UFW)
sudo ufw allow 80
sudo ufw allow 22
```

### Issue: Backend not starting

**Check logs:**
```bash
sudo supervisorctl tail -f tournament_backend
```

**Common fixes:**
```bash
# Restart backend
sudo supervisorctl restart tournament_backend

# Check if port 8000 is already in use
sudo lsof -i :8000

# If needed, kill the process
sudo kill -9 <PID>
```

### Issue: Frontend shows connection errors

**Check:**
1. Backend is running on port 8000
2. Nginx is proxying correctly
3. CORS settings allow the origin

**Fix:**
```bash
# Check backend
curl http://localhost:8000/admin/

# Check nginx proxy
curl http://localhost/api/

# Restart both
sudo supervisorctl restart tournament_backend
sudo systemctl restart nginx
```

### Issue: WebSocket connection failed

**Check:**
1. Redis is running: `redis-cli ping`
2. Nginx WebSocket proxy configured
3. Backend using Uvicorn (supports WebSockets)

**Fix:**
```bash
# Start Redis
sudo systemctl start redis

# Check WebSocket config in nginx.conf
# Should have location /ws/ block

# Restart services
sudo supervisorctl restart tournament_backend
sudo systemctl restart nginx
```

---

## 📝 Useful Commands

### Check Service Status
```bash
# All services at once
sudo supervisorctl status
sudo systemctl status nginx
sudo systemctl status redis
```

### View Logs
```bash
# Backend logs
sudo supervisorctl tail -f tournament_backend

# Nginx access logs
sudo tail -f /var/log/nginx/tournamentArena_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/tournamentArena_error.log
```

### Restart Services
```bash
# Backend
sudo supervisorctl restart tournament_backend

# Nginx
sudo systemctl restart nginx

# Redis
sudo systemctl restart redis
```

### Update Application
```bash
# Pull latest code (if using Git)
cd /var/www/tournamentArena
git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Update frontend (if rebuilt)
cd ../frontend
npm run build

# Restart backend
sudo supervisorctl restart tournament_backend
```

---

## 🔐 Security Recommendations

### 1. Change ALLOWED_HOSTS
Edit `backend/backend/settings_production.py`:
```python
ALLOWED_HOSTS = ['13.235.24.56', 'yourdomain.com']  # Remove '*'
```

### 2. Set Strong SECRET_KEY
```bash
# Generate new secret key
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Set in environment or settings
```

### 3. Enable HTTPS (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (requires a domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Update frontend .env.production
VITE_API_BASE_URL=https://yourdomain.com
VITE_WS_URL=wss://yourdomain.com/ws/
```

### 4. Enable Firewall
```bash
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

### 5. Regular Updates
```bash
sudo apt update
sudo apt upgrade -y
```

---

## 🎉 Deployment Complete!

Your Tournament Arena is now deployed on AWS EC2!

**Access URLs:**
- Frontend: http://13.235.24.56/
- Admin: http://13.235.24.56/admin/
- API: http://13.235.24.56/api/

**Next Steps:**
1. Create a superuser to access admin panel
2. Configure domain name (optional)
3. Setup SSL certificate (recommended)
4. Configure automated backups
5. Setup monitoring (optional)

---

## 📞 Need Help?

Check the documentation:
- `SIMPLE_DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `CONNECTION_FIX_GUIDE.md` - Troubleshooting connection issues
- `SCRIPT_FILES_GUIDE.md` - Understanding .bat and .sh files

---

**Your server is ready to go! 🚀**
