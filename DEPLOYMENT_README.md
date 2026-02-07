# Tournament Arena - Production Deployment

Complete production deployment setup for AWS EC2 with Nginx, Uvicorn, and automated GitHub deployments.

## 📚 Documentation Files

This repository contains several documentation files to help you deploy and manage the application:

1. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment guide
2. **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)** - GitHub Actions auto-deployment setup
3. **[Makefile](./Makefile)** - Quick deployment commands
4. **[nginx.conf](./nginx.conf)** - Nginx configuration template
5. **[supervisor.conf](./supervisor.conf)** - Supervisor process manager config
6. **[deploy.sh](./deploy.sh)** - Automated deployment script

## 🚀 Quick Start

### For First-Time Deployment

1. **Read the full deployment guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Follow all steps** in order from the deployment guide
3. **Set up GitHub Actions** using [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

### For Updates (After Initial Setup)

```bash
# On your local machine
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions will automatically deploy to EC2!
```

Or manually on the server:

```bash
# SSH into your server
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Switch to tournament user
sudo su - tournament

# Run deployment
cd /var/www/tournamentArena
./deploy.sh
```

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] AWS EC2 instance running (Ubuntu 22.04 recommended)
- [ ] Security Group configured (ports 22, 80, 443, 8000)
- [ ] Domain name (optional) or Elastic IP
- [ ] SSH key pair for EC2
- [ ] GitHub repository (can be private)

## 🔧 Configuration Files

### Backend (.env)

Create `backend/.env` on the server:

```env
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,YOUR_EC2_IP
DATABASE_URL=postgresql://user:password@localhost:5432/tournament_arena
REDIS_URL=redis://localhost:6379/0
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://YOUR_EC2_IP
```

### Frontend (.env.production)

Create `frontend/.env.production` on the server:

```env
VITE_API_BASE_URL=http://YOUR_EC2_IP:8000
# Or with SSL: https://your-domain.com
```

## 📁 Server Directory Structure

```
/var/www/tournamentArena/
├── backend/
│   ├── venv/                 # Python virtual environment
│   ├── backend/              # Django settings
│   ├── api/                  # API app
│   ├── tournaments/          # Tournaments app
│   ├── wallet/               # Wallet app
│   ├── chat/                 # Chat app
│   ├── payments/             # Payments app
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                  # Environment variables
│   ├── db.sqlite3            # Database (or PostgreSQL)
│   └── staticfiles/          # Collected static files
├── frontend/
│   ├── src/                  # React source code
│   ├── dist/                 # Production build
│   ├── node_modules/
│   ├── package.json
│   └── .env.production       # Frontend environment variables
├── deploy.sh                 # Deployment script
└── Makefile                  # Make commands
```

## 🛠️ Make Commands

After initial setup, you can use these commands on the server:

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

## 🔍 Monitoring

### Check Service Status

```bash
# Backend status
sudo supervisorctl status tournament_backend

# Nginx status
sudo systemctl status nginx

# Redis status
sudo systemctl status redis-server

# PostgreSQL status
sudo systemctl status postgresql
```

### View Logs

```bash
# Backend application logs
sudo tail -f /var/log/tournament_backend.log

# Nginx access logs
sudo tail -f /var/log/nginx/tournamentArena_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/tournamentArena_error.log

# Deployment logs
sudo tail -f /var/log/tournament_deployment.log
```

## 🔄 Manual Deployment Steps

If you need to deploy manually without GitHub Actions:

```bash
# 1. SSH into server
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 2. Switch to tournament user
sudo su - tournament

# 3. Navigate to project directory
cd /var/www/tournamentArena

# 4. Pull latest changes
git pull origin main

# 5. Deploy backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# 6. Deploy frontend
cd ../frontend
npm ci
npm run build

# 7. Restart services
sudo supervisorctl restart tournament_backend
sudo systemctl reload nginx
```

## 🔒 Security Recommendations

1. **Change default secret key** - Generate a new Django secret key
2. **Set DEBUG=False** - Never run production with debug enabled
3. **Use strong passwords** - For database and admin accounts
4. **Enable SSL/TLS** - Use Let's Encrypt for free SSL certificates
5. **Configure firewall** - Use UFW to restrict access
6. **Regular backups** - Set up automated database backups
7. **Keep updated** - Regularly update dependencies and OS packages
8. **Monitor logs** - Set up log monitoring and alerts

## 📊 Technology Stack

- **Backend**: Django 5.1.6 + Django REST Framework
- **WebSocket**: Django Channels with Redis
- **Frontend**: React 19 + Vite
- **Web Server**: Nginx
- **ASGI Server**: Uvicorn with workers
- **Process Manager**: Supervisor
- **Database**: PostgreSQL (recommended) or SQLite
- **Cache/Sessions**: Redis
- **CI/CD**: GitHub Actions

## 🐛 Troubleshooting

### WebSocket Connection Failed

```bash
# Check if port 8000 is open
sudo ufw status

# Check backend logs
sudo tail -f /var/log/tournament_backend.log

# Verify WebSocket endpoint in frontend
cat frontend/.env.production
```

### Static Files Not Loading

```bash
# Recollect static files
cd /var/www/tournamentArena/backend
source venv/bin/activate
python manage.py collectstatic --noinput
sudo systemctl reload nginx
```

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l

# Check database credentials in backend/.env
```

### Service Won't Start

```bash
# Check supervisor logs
sudo supervisorctl tail tournament_backend

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo supervisorctl restart tournament_backend
sudo systemctl restart nginx
```

## 📞 Support

For issues or questions:

1. Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
2. Review logs for error messages
3. Verify all configuration files are correct
4. Ensure all services are running

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors Here]

---

**Last Updated**: 2026-02-07  
**Version**: 1.0.0
