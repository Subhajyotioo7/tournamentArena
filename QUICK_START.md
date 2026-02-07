# ⚡ Quick Start - AWS EC2 Deployment

This is a condensed quick-start guide. For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 🎯 Prerequisites

- AWS EC2 instance (Ubuntu 22.04)
- SSH access to EC2
- GitHub account
- Domain name (optional)

---

## 🚀 Deployment in 4 Steps

### Step 1: Initial Server Setup (5 min)

```bash
# On EC2 instance (as ubuntu user)
wget https://raw.githubusercontent.com/YOUR_REPO/main/setup_server.sh
sudo bash setup_server.sh

# Or if you already have the repo
cd /path/to/repo
sudo bash setup_server.sh
```

### Step 2: Configure Application (10 min)

```bash
# Switch to tournament user
sudo su - tournament

# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "your-email@example.com" -N "" -f ~/.ssh/id_ed25519

# Show public key (add this to GitHub Deploy Keys)
cat ~/.ssh/id_ed25519.pub

# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

# Clone repository
cd /var/www/tournamentArena
git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git .

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn uvicorn[standard] channels-redis psycopg2-binary

# Create .env file
nano .env
# Paste your configuration (see below)

# Run migrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
deactivate

# Setup frontend
cd ../frontend
npm ci
nano .env.production
# Paste: VITE_API_BASE_URL=http://YOUR_EC2_IP:8000
npm run build

exit  # Exit tournament user
```

**Backend .env template:**
```env
DJANGO_SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=YOUR_EC2_IP,your-domain.com
DATABASE_URL=postgresql://tournament_user:YOUR_PASSWORD@localhost:5432/tournament_arena
REDIS_URL=redis://localhost:6379/0
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
CORS_ALLOWED_ORIGINS=http://YOUR_EC2_IP,https://your-domain.com
```

### Step 3: Configure Services (5 min)

```bash
# Copy nginx config
sudo cp /var/www/tournamentArena/nginx.conf /etc/nginx/conf.d/tournamentArena.conf

# Edit with your IP/domain
sudo nano /etc/nginx/conf.d/tournamentArena.conf
# Replace YOUR_EC2_PUBLIC_IP with your actual IP

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx

# Copy supervisor config
sudo cp /var/www/tournamentArena/supervisor.conf /etc/supervisor/conf.d/tournamentArena.conf

# Start supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start tournament_backend
```

### Step 4: Setup Auto-Deployment (5 min)

```bash
# Make deploy script executable
sudo chmod +x /var/www/tournamentArena/deploy.sh
sudo chown tournament:www-data /var/www/tournamentArena/deploy.sh

# Configure sudoers
sudo visudo
# Add at the end:
# tournament ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart tournament_backend
# tournament ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
```

**On GitHub:**
1. Go to Repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `EC2_HOST`: Your EC2 IP
   - `EC2_USERNAME`: `tournament`
   - `EC2_SSH_KEY`: Content of `/home/tournament/.ssh/id_ed25519` (private key)
   - `EC2_PORT`: `22`

---

## ✅ Verify Deployment

```bash
# Check services
sudo supervisorctl status tournament_backend
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/tournament_backend.log

# Test endpoints
curl http://YOUR_EC2_IP/
curl http://YOUR_EC2_IP:8000/api/
curl http://YOUR_EC2_IP:8000/admin/
```

Open browser: `http://YOUR_EC2_IP`

---

## 🔄 Deploy Updates

```bash
# From your local machine
git add .
git commit -m "My changes"
git push origin main
# GitHub Actions will auto-deploy!

# Or manually on server
cd /var/www/tournamentArena
sudo -u tournament ./deploy.sh
```

---

## 🛠️ Quick Commands

```bash
# Restart backend
sudo supervisorctl restart tournament_backend

# Restart nginx
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/tournament_backend.log
sudo tail -f /var/log/nginx/tournamentArena_error.log

# Check status
sudo supervisorctl status
sudo systemctl status nginx

# Deploy
cd /var/www/tournamentArena && sudo -u tournament ./deploy.sh
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | `sudo supervisorctl restart tournament_backend` |
| Static files not loading | `cd backend && source venv/bin/activate && python manage.py collectstatic --noinput` |
| WebSocket not working | Check port 8000 in Security Group, verify REDIS_URL |
| Can't push to GitHub | Add SSH key to GitHub Deploy Keys |

---

## 📚 Full Documentation

- **Complete Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **GitHub Setup**: [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)
- **Files Summary**: [DEPLOYMENT_FILES_SUMMARY.md](./DEPLOYMENT_FILES_SUMMARY.md)

---

## 🎉 Done!

Your application should now be running at:
- **Frontend**: `http://YOUR_EC2_IP`
- **Backend API**: `http://YOUR_EC2_IP:8000/api/`
- **Admin**: `http://YOUR_EC2_IP:8000/admin/`

**Next**: Set up SSL with `sudo certbot --nginx -d your-domain.com`
