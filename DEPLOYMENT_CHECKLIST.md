# AWS EC2 Deployment Checklist

Use this checklist to ensure all steps are completed during deployment.

## Pre-Deployment

### AWS EC2 Setup
- [ ] EC2 instance launched (Ubuntu 22.04 LTS)
- [ ] Instance type: t2.medium or better
- [ ] Security Group configured:
  - [ ] Port 22 (SSH) - Your IP only
  - [ ] Port 80 (HTTP) - 0.0.0.0/0
  - [ ] Port 443 (HTTPS) - 0.0.0.0/0
  - [ ] Port 8000 (WebSocket) - 0.0.0.0/0
- [ ] Elastic IP allocated and associated
- [ ] SSH key pair downloaded (.pem file)

### Domain Setup (Optional)
- [ ] Domain name purchased
- [ ] DNS A record pointing to Elastic IP
- [ ] DNS propagation verified

## Server Configuration

### Initial Setup
- [ ] SSH connection tested
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Required packages installed:
  - [ ] Python 3, pip, venv
  - [ ] Nginx
  - [ ] Node.js and npm
  - [ ] Git
  - [ ] Supervisor
  - [ ] PostgreSQL
  - [ ] Redis

### Database Setup
- [ ] PostgreSQL installed and running
- [ ] Database created: `tournament_arena`
- [ ] Database user created with strong password
- [ ] Permissions granted to user
- [ ] Redis installed and running

### Application User
- [ ] User `tournament` created
- [ ] User added to `www-data` group
- [ ] SSH key generated for GitHub access
- [ ] SSH public key added to GitHub (Deploy Keys)
- [ ] GitHub connection tested

## Application Deployment

### Directory Setup
- [ ] Directory created: `/var/www/tournamentArena`
- [ ] Ownership set to `tournament:www-data`
- [ ] Repository cloned successfully

### Backend Setup
- [ ] Virtual environment created
- [ ] Dependencies installed from `requirements.txt`
- [ ] Additional packages installed: `gunicorn`, `uvicorn`, `channels-redis`, `psycopg2-binary`
- [ ] `.env` file created with:
  - [ ] `DJANGO_SECRET_KEY` (new, random key)
  - [ ] `DJANGO_DEBUG=False`
  - [ ] `DJANGO_ALLOWED_HOSTS` (domain/IP)
  - [ ] `DATABASE_URL` (PostgreSQL connection)
  - [ ] `REDIS_URL`
  - [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
  - [ ] `CORS_ALLOWED_ORIGINS`
- [ ] Database migrations run successfully
- [ ] Superuser created
- [ ] Static files collected

### Frontend Setup
- [ ] `.env.production` file created with:
  - [ ] `VITE_API_BASE_URL` (backend URL)
- [ ] Node dependencies installed
- [ ] Production build created successfully
- [ ] Build files in `frontend/dist/`

## Service Configuration

### Supervisor
- [ ] Configuration file created: `/etc/supervisor/conf.d/tournamentArena.conf`
- [ ] Configuration loaded: `sudo supervisorctl reread`
- [ ] Configuration updated: `sudo supervisorctl update`
- [ ] Backend started successfully
- [ ] Backend status verified: `sudo supervisorctl status`

### Nginx
- [ ] Configuration file created: `/etc/nginx/conf.d/tournamentArena.conf`
- [ ] Server name updated (domain/IP)
- [ ] Configuration tested: `sudo nginx -t`
- [ ] Nginx restarted: `sudo systemctl restart nginx`
- [ ] Nginx enabled on boot: `sudo systemctl enable nginx`

## Testing

### Backend Testing
- [ ] API endpoint accessible: `http://YOUR_IP:8000/api/`
- [ ] Admin panel accessible: `http://YOUR_IP:8000/admin/`
- [ ] Can login to admin panel
- [ ] Tournaments API working

### Frontend Testing
- [ ] Homepage loads successfully
- [ ] Can register new account
- [ ] Can login
- [ ] Can view tournaments
- [ ] WebSocket chat working
- [ ] Payment integration working (test mode)

### Service Health
- [ ] Backend logs clean: `sudo tail -f /var/log/tournament_backend.log`
- [ ] No Nginx errors: `sudo tail -f /var/log/nginx/error.log`
- [ ] Services auto-restart on failure

## Security Hardening

### SSL/TLS (Production)
- [ ] Certbot installed
- [ ] SSL certificate obtained: `sudo certbot --nginx -d your-domain.com`
- [ ] Certificate renewal tested: `sudo certbot renew --dry-run`
- [ ] Frontend `.env.production` updated to use HTTPS
- [ ] Frontend rebuilt with HTTPS URL

### Security Configuration
- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` set
- [ ] Database password is strong
- [ ] CORS properly configured
- [ ] CSRF protection enabled
- [ ] Security headers in Nginx config

### Firewall (Optional but Recommended)
- [ ] UFW installed
- [ ] UFW configured:
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 8000/tcp
  sudo ufw enable
  ```

## GitHub Auto-Deployment

### Deployment Script
- [ ] `deploy.sh` script created
- [ ] Script executable: `chmod +x deploy.sh`
- [ ] Script tested manually
- [ ] Sudoers configured for tournament user

### GitHub Secrets
- [ ] `EC2_HOST` secret added
- [ ] `EC2_USERNAME` secret added (tournament)
- [ ] `EC2_SSH_KEY` secret added (private key)
- [ ] `EC2_PORT` secret added (22)

### GitHub Actions
- [ ] `.github/workflows/deploy.yml` created
- [ ] Workflow tested manually
- [ ] Push to main triggers deployment
- [ ] Deployment succeeds

## Monitoring and Maintenance

### Backup Setup
- [ ] Database backup script created
- [ ] Cron job for daily backups (optional)
- [ ] Backup location: `/var/www/tournamentArena/backups/`

### Log Rotation
- [ ] Logrotate configured for application logs
- [ ] Old logs being archived/deleted

### Monitoring
- [ ] Server monitoring set up (optional: CloudWatch, Datadog, etc.)
- [ ] Error alerting configured (optional)

## Documentation

- [ ] Server IP/domain documented
- [ ] Admin credentials stored securely
- [ ] Database credentials stored securely
- [ ] API keys stored securely
- [ ] Deployment process documented
- [ ] Team members have access to necessary credentials

## Post-Deployment

### Verification
- [ ] Application accessible from multiple devices
- [ ] Mobile responsiveness verified
- [ ] All features working as expected
- [ ] Performance acceptable
- [ ] No console errors in browser

### Final Steps
- [ ] Announce deployment to team
- [ ] Update documentation with production URLs
- [ ] Share admin access with authorized users
- [ ] Set up regular maintenance schedule
- [ ] Plan for future updates

---

## Common Issues and Solutions

### Issue: "502 Bad Gateway"
**Solution**: Check backend is running with `sudo supervisorctl status`

### Issue: "WebSocket connection failed"
**Solution**: 
- Check port 8000 in security group
- Verify REDIS_URL in backend .env
- Check nginx WebSocket configuration

### Issue: "Static files not loading"
**Solution**: 
```bash
cd /var/www/tournamentArena/backend
source venv/bin/activate
python manage.py collectstatic --noinput
sudo systemctl reload nginx
```

### Issue: "Database connection error"
**Solution**: 
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL in .env
- Check database exists: `sudo -u postgres psql -l`

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Server IP**: _______________  
**Domain**: _______________
