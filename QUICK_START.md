# 🚀 Tournament Arena - Quick Deployment

Backend on **Port 8000** | Frontend on **Port 80** | All Hosts Allowed ✅

---

## ⚡ Quick Start (Development on Windows)

### Option 1: Using Scripts (Easiest)

1. **Start Backend** (Terminal 1):
   ```bash
   start_backend.bat
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   start_frontend.bat
   ```

3. Open browser: `http://localhost:5173` (or the URL shown in terminal)

### Option 2: Manual Start

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Production Deployment

### Step 1: Build for Production

```bash
build_production.bat
```

Enter your server IP or domain when prompted.

### Step 2: Deploy to Server (Linux/Ubuntu)

**Prerequisites:**
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx supervisor redis-server nodejs npm
```

**Transfer files to server:**
```bash
# From your local machine
scp -r * user@YOUR_SERVER_IP:/var/www/tournamentArena/
```

**On the server:**

1. **Setup Backend:**
```bash
cd /var/www/tournamentArena/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

2. **Setup Frontend:**
```bash
cd /var/www/tournamentArena/frontend
npm install
npm run build  # If not already built
```

3. **Configure Nginx:**
```bash
# Update paths in nginx.conf if needed
sudo cp /var/www/tournamentArena/nginx.conf /etc/nginx/sites-available/tournamentArena
sudo ln -s /etc/nginx/sites-available/tournamentArena /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Configure Supervisor:**
```bash
# Update paths in supervisor.conf for your server
sudo cp /var/www/tournamentArena/supervisor.conf /etc/supervisor/conf.d/tournamentArena.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start tournament_backend
```

5. **Start Redis:**
```bash
sudo systemctl start redis
sudo systemctl enable redis
```

6. **Verify deployment:**
```bash
# Check backend status
sudo supervisorctl status

# Check nginx status
sudo systemctl status nginx

# Check Redis
redis-cli ping
```

---

## 🔧 Configuration

### Backend (Port 8000)
- **File:** `backend/backend/settings.py`
- **ALLOWED_HOSTS:** `['*']` (accepts all hosts)
- **Port:** 8000 (configured in supervisor.conf and nginx.conf)

### Frontend (Port 80)
- **File:** `frontend/.env`
- **Development:** `VITE_API_BASE_URL=http://localhost:8000`
- **Production:** `VITE_API_BASE_URL=http://YOUR_SERVER_IP`

### Nginx (Port 80)
- **File:** `nginx.conf`
- **Listens:** Port 80
- **Serves:** Frontend from `frontend/dist`
- **Proxies:** Backend requests to `127.0.0.1:8000`
- **server_name:** `_` (accepts all)

### Supervisor
- **File:** `supervisor.conf`
- **Manages:** Backend process on port 8000
- **Auto-restart:** Yes
- **Logs:** `/var/log/tournament_backend.log`

---

## 📁 Project Structure

```
fix-frontend-main/
├── backend/                      # Django backend
│   ├── backend/settings.py      # ALLOWED_HOSTS = ['*']
│   ├── manage.py
│   └── requirements.txt
├── frontend/                     # React frontend
│   ├── src/
│   ├── dist/                    # Production build
│   ├── .env                     # API configuration
│   └── package.json
├── nginx.conf                    # Port 80 config
├── supervisor.conf               # Port 8000 backend manager
├── start_backend.bat            # Windows: Start backend
├── start_frontend.bat           # Windows: Start frontend
├── build_production.bat         # Build for production
├── SIMPLE_DEPLOYMENT_GUIDE.md   # Detailed guide
└── QUICK_START.md              # This file
```

---

## 🌍 Access URLs

| Service | Development | Production |
|---------|-------------|------------|
| **Frontend** | http://localhost:5173 | http://YOUR_SERVER_IP/ |
| **Backend API** | http://localhost:8000/api/ | http://YOUR_SERVER_IP/api/ |
| **Admin Panel** | http://localhost:8000/admin/ | http://YOUR_SERVER_IP/admin/ |
| **WebSocket** | ws://localhost:8000/ws/ | ws://YOUR_SERVER_IP/ws/ |

---

## 🔍 Troubleshooting

### Backend Issues
```bash
# Check if running
curl http://localhost:8000/admin/

# View logs (production)
sudo supervisorctl tail -f tournament_backend
```

### Frontend Issues
```bash
# Rebuild frontend
cd frontend
npm run build

# Check .env file
cat .env
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/tournamentArena_error.log

# Restart
sudo systemctl restart nginx
```

### Redis Issues
```bash
# Check if running
redis-cli ping  # Should return PONG

# Start Redis
sudo systemctl start redis
```

---

## 📚 Documentation Files

- **SIMPLE_DEPLOYMENT_GUIDE.md** - Comprehensive step-by-step deployment guide
- **QUICK_START.md** - This file (quick reference)
- **DEPLOYMENT_GUIDE.md** - Detailed production deployment with GitHub Actions
- **DEPLOYMENT_README.md** - AWS EC2 specific deployment

---

## ✅ Current Configuration Status

✅ Backend accepts all hosts (`ALLOWED_HOSTS = ['*']`)  
✅ Nginx configured for port 80  
✅ Nginx accepts all server names (`server_name _`)  
✅ Backend configured for port 8000  
✅ Supervisor ready to auto-start backend  
✅ Windows scripts created for easy development  
✅ Production build script ready  

---

## 🎯 Quick Commands Reference

```bash
# Development
start_backend.bat          # Start backend on port 8000
start_frontend.bat         # Start frontend dev server

# Production Build
build_production.bat       # Build everything for production

# Server Management (Linux)
sudo supervisorctl status              # Check backend status
sudo supervisorctl restart tournament_backend  # Restart backend
sudo systemctl restart nginx           # Restart nginx
sudo tail -f /var/log/tournament_backend.log  # View backend logs

# Testing
curl http://localhost:8000/admin/     # Test backend
curl http://localhost/                # Test frontend via nginx
redis-cli ping                        # Test Redis
```

---

## 🎉 You're Ready!

Everything is configured for easy deployment:
- ✅ No need to change ALLOWED_HOSTS
- ✅ No need to change Nginx server_name
- ✅ Backend on port 8000
- ✅ Frontend on port 80
- ✅ Simple scripts to get started

Just run the scripts or follow the deployment steps above!

For detailed instructions, see **SIMPLE_DEPLOYMENT_GUIDE.md**
