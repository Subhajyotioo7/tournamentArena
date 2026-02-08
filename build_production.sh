#!/bin/bash
# Production Build Script (Linux/Mac/Git Bash)

echo "========================================"
echo "  Tournament Arena - Production Build"
echo "========================================"
echo

# Check if server IP or domain is provided
if [ -z "$1" ]; then
    read -p "Enter your server IP or domain (e.g., 192.168.1.100 or example.com): " SERVER_URL
else
    SERVER_URL=$1
fi

echo
echo "Building for server: $SERVER_URL"
echo

# ==========================================
# Backend Preparation
# ==========================================
echo "[1/4] Preparing Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Backend preparation complete!"
cd ..

# ==========================================
# Frontend Preparation
# ==========================================
echo
echo "[2/4] Preparing Frontend..."
cd frontend

echo "Creating production .env file..."
echo "VITE_API_BASE_URL=http://$SERVER_URL" > .env
echo "VITE_WS_URL=ws://$SERVER_URL/ws/" >> .env

echo "Installing frontend dependencies..."
npm install

echo "Building frontend for production..."
npm run build

echo "Frontend build complete! (check frontend/dist folder)"
cd ..

# ==========================================
# Configuration Summary
# ==========================================
echo
echo "[3/4] Configuration Summary"
echo "========================================"
echo
echo "Backend Configuration:"
echo "  - Django settings updated"
echo "  - Database migrated"
echo "  - Static files collected"
echo "  - Ready to run on port 8000"
echo
echo "Frontend Configuration:"
echo "  - Built for production"
echo "  - API URL: http://$SERVER_URL"
echo "  - WebSocket URL: ws://$SERVER_URL/ws/"
echo "  - Files in: frontend/dist"
echo
echo "Nginx Configuration:"
echo "  - nginx.conf ready (server_name: _)"
echo "  - Listens on port 80"
echo "  - Proxies to backend on 127.0.0.1:8000"
echo
echo "Supervisor Configuration:"
echo "  - supervisor.conf ready"
echo "  - Will auto-start backend on system boot"
echo

# ==========================================
# Next Steps
# ==========================================
echo "[4/4] Next Steps for Deployment"
echo "========================================"
echo
echo "For SERVER Deployment (Linux/AWS EC2):"
echo "  1. Install requirements:"
echo "     sudo apt update"
echo "     sudo apt install python3-pip python3-venv nginx supervisor redis-server nodejs npm"
echo
echo "  2. Upload project to server:"
echo "     scp -r * user@$SERVER_URL:/var/www/tournamentArena/"
echo
echo "  3. Copy configuration files:"
echo "     sudo cp nginx.conf /etc/nginx/sites-available/tournamentArena"
echo "     sudo ln -s /etc/nginx/sites-available/tournamentArena /etc/nginx/sites-enabled/"
echo "     sudo cp supervisor.conf /etc/supervisor/conf.d/tournamentArena.conf"
echo
echo "  4. Update paths in config files to match server paths"
echo
echo "  5. Start services:"
echo "     sudo supervisorctl reread"
echo "     sudo supervisorctl update"
echo "     sudo supervisorctl start tournament_backend"
echo "     sudo systemctl restart nginx"
echo
echo "========================================"
echo
echo "Build complete! Check SIMPLE_DEPLOYMENT_GUIDE.md for detailed instructions."
echo
