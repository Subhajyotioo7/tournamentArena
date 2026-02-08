# Simple Deployment Guide
## Backend on Port 8000 | Frontend on Port 80

This guide will help you deploy the Tournament Arena project with the backend running on port 8000 and frontend on port 80.

---

## 📋 Prerequisites

Before starting, ensure you have:
- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- **Redis** server (for WebSocket support)
- **Nginx** web server
- **Supervisor** (for process management)
- Access to your server (Linux/Ubuntu recommended)

---

## 🚀 Quick Deployment Steps

### 1️⃣ Backend Setup (Port 8000)

#### Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Backend Environment

Create a `.env` file in the `backend` folder (or set environment variables):

```bash
# backend/.env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-super-secret-key-here-change-this
DJANGO_ALLOWED_HOSTS=*
REDIS_URL=redis://localhost:6379
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**Note:** The backend is already configured to allow all hosts (`ALLOWED_HOSTS = ['*']`), so it will accept connections from any IP/domain.

#### Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
```

#### Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

#### Test Backend Locally

```bash
# Run backend on port 8000
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000

# Or use daphne
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

Visit: `http://localhost:8000/admin` to verify the backend is running.

---

### 2️⃣ Frontend Setup (Port 80 via Nginx)

#### Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install
```

#### Configure Frontend Environment

Update the `.env` file in the `frontend` folder with your server details:

```bash
# frontend/.env

# If deploying locally
VITE_API_BASE_URL=http://localhost
VITE_WS_URL=ws://localhost/ws/

# If deploying on a server (replace with your IP or domain)
VITE_API_BASE_URL=http://YOUR_SERVER_IP
VITE_WS_URL=ws://YOUR_SERVER_IP/ws/

# If using a domain
VITE_API_BASE_URL=https://yourdomain.com
VITE_WS_URL=wss://yourdomain.com/ws/
```

#### Build Frontend

```bash
npm run build
```

This creates a `dist` folder with production-ready files.

---

### 3️⃣ Redis Setup (For WebSockets)

Install and start Redis:

```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

---

### 4️⃣ Nginx Configuration (Port 80)

#### Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### Configure Nginx

The project includes a `nginx.conf` file. You need to:

1. **Update server paths** in the nginx config:

Edit the `nginx.conf` file in the project root and update these paths:
- Line 19: Replace `YOUR_EC2_PUBLIC_IP` with your server IP or domain
- Line 37: Update frontend path to your actual frontend build location
- Line 131: Update static files path
- Line 138: Update media files path

2. **Copy the configuration:**

```bash
# Copy nginx config to Nginx sites-available
sudo cp nginx.conf /etc/nginx/sites-available/tournamentArena

# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/tournamentArena /etc/nginx/sites-enabled/

# Remove default nginx config (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

**Important Configuration Points in nginx.conf:**
- **Port 80**: Nginx listens on port 80 (line 18)
- **Backend Proxy**: All `/api/`, `/admin/`, `/ws/`, etc. are proxied to `127.0.0.1:8000` (line 12)
- **Frontend**: Root `/` serves React app from `dist` folder (line 36-45)

---

### 5️⃣ Supervisor Configuration (Auto-start Backend)

#### Install Supervisor

```bash
sudo apt update
sudo apt install supervisor
```

#### Configure Supervisor

The project includes a `supervisor.conf` file. You need to:

1. **Update paths** in `supervisor.conf`:
   - Line 6: Update to your actual backend path and virtualenv path
   - Line 9: Update working directory
   - Line 12: Update user (or use your username)

2. **Copy the configuration:**

```bash
# Copy supervisor config
sudo cp supervisor.conf /etc/supervisor/conf.d/tournamentArena.conf

# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Start the backend service
sudo supervisorctl start tournament_backend

# Check status
sudo supervisorctl status
```

---

## 🔧 Configuration Summary

Here's what each component does:

| Component | Port | Purpose |
|-----------|------|---------|
| **Backend (Uvicorn)** | 8000 | Django REST API + WebSockets (runs on 127.0.0.1:8000) |
| **Nginx** | 80 | Reverse proxy + serves frontend static files |
| **Redis** | 6379 | Channel layer for WebSocket messages |
| **Frontend** | - | Static files served by Nginx from `/dist` folder |

---

## 🌐 Access Your Application

After deployment:

- **Frontend**: `http://YOUR_SERVER_IP/` or `http://yourdomain.com/`
- **Backend API**: `http://YOUR_SERVER_IP/api/` or `http://yourdomain.com/api/`
- **Admin Panel**: `http://YOUR_SERVER_IP/admin/` or `http://yourdomain.com/admin/`
- **WebSockets**: `ws://YOUR_SERVER_IP/ws/` or `wss://yourdomain.com/ws/`

---

## 🛠️ Manual Deployment (Without Nginx/Supervisor)

If you want to test locally without setting up Nginx and Supervisor:

### Backend (Terminal 1):
```bash
cd backend
source venv/bin/activate
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000
```

### Redis (Terminal 2):
```bash
redis-server
```

### Frontend (Terminal 3):
```bash
cd frontend

# Update .env to point to localhost:8000
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
echo "VITE_WS_URL=ws://localhost:8000/ws/" >> .env

# Run in development mode
npm run dev

# OR build and serve with a simple HTTP server:
npm run build
npx serve -s dist -l 80
```

**Note:** You'll need admin/sudo privileges to use port 80. Alternatively, use port 3000 or 5173 for testing.

---

## 🔍 Troubleshooting

### Backend not starting?
```bash
# Check backend logs
sudo supervisorctl tail -f tournament_backend

# Or check manually
cd backend
source venv/bin/activate
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000
```

### Nginx errors?
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/tournamentArena_error.log

# Check nginx config syntax
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Redis not working?
```bash
# Check if Redis is running
sudo systemctl status redis

# Test Redis connection
redis-cli ping

# Start Redis
sudo systemctl start redis
```

### Frontend not connecting to backend?
- Verify the `.env` file in `frontend` has the correct `VITE_API_BASE_URL`
- Rebuild the frontend after changing `.env`: `npm run build`
- Clear browser cache
- Check browser console for errors (F12)

### WebSocket connection failed?
- Ensure Redis is running: `redis-cli ping`
- Check backend logs for WebSocket errors
- Verify `VITE_WS_URL` in frontend `.env` is correct
- Nginx must properly proxy `/ws/` to backend

---

## 📦 Project Structure

```
fix-frontend-main/
├── backend/
│   ├── backend/
│   │   └── settings.py          # ALLOWED_HOSTS = ['*']
│   ├── manage.py
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   ├── dist/                     # Build output (created by npm run build)
│   ├── .env                      # Frontend environment variables
│   └── package.json
├── nginx.conf                    # Nginx configuration (port 80)
├── supervisor.conf               # Backend process manager (port 8000)
└── SIMPLE_DEPLOYMENT_GUIDE.md   # This file
```

---

## 🔐 Security Recommendations (For Production)

While `ALLOWED_HOSTS = ['*']` makes deployment easy, for production you should:

1. **Restrict ALLOWED_HOSTS**: Replace `'*'` with your specific domain/IP
   ```python
   # In backend/backend/settings.py
   ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com', 'YOUR_SERVER_IP']
   ```

2. **Enable HTTPS**: Use Let's Encrypt for SSL certificates
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Set DEBUG=False**: In production environment
   ```bash
   DJANGO_DEBUG=False
   ```

4. **Use Strong SECRET_KEY**: Generate a new secret key
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

5. **Configure CORS**: Restrict allowed origins
   ```python
   # In settings.py
   CORS_ALLOWED_ORIGINS = ['https://yourdomain.com']
   ```

---

## ✅ Deployment Checklist

- [ ] Backend dependencies installed
- [ ] Database migrations completed
- [ ] Backend `.env` configured
- [ ] Backend running on port 8000
- [ ] Redis server installed and running
- [ ] Frontend dependencies installed
- [ ] Frontend `.env` configured with correct API URL
- [ ] Frontend built (`npm run build`)
- [ ] Nginx installed and configured
- [ ] Nginx pointing to correct frontend `dist` folder
- [ ] Nginx proxying backend requests to port 8000
- [ ] Supervisor configured and backend auto-starting
- [ ] All services running: `sudo supervisorctl status`
- [ ] Application accessible on port 80

---

## 🎉 Done!

Your Tournament Arena should now be running with:
- ✅ Backend on port 8000 (managed by Supervisor)
- ✅ Frontend on port 80 (served by Nginx)
- ✅ WebSockets working (via Redis)
- ✅ All hosts allowed (easy deployment)

Need help? Check the logs:
```bash
# Backend logs
sudo supervisorctl tail -f tournament_backend

# Nginx access logs
sudo tail -f /var/log/nginx/tournamentArena_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/tournamentArena_error.log
```
