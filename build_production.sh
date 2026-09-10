#!/bin/bash
# Production Build Script (Linux / macOS / Git Bash)

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [ -z "$1" ]; then
    read -p "Enter your server IP or domain (for example: 192.168.1.100 or example.com): " SERVER_URL
else
    SERVER_URL="$1"
fi

echo "========================================"
echo "  Tournament Arena - Production Build"
echo "========================================"
echo

echo "Building for server: $SERVER_URL"
echo

# Backend

echo "[1/4] Preparing backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

echo "Backend preparation complete."

echo

echo "[2/4] Preparing frontend..."
cd "$FRONTEND_DIR"

cat > .env <<EOF
VITE_API_BASE_URL=http://$SERVER_URL
VITE_WS_URL=ws://$SERVER_URL/ws/
EOF

npm install
npm run build

echo "Frontend build complete. Output is available in frontend/dist"
echo

echo "[3/4] Configuration summary"
echo "========================================"
echo

echo "Backend configuration:"
echo "  - Django project ready for the configured host"
echo "  - Database migrations applied"
echo "  - Static files collected"
echo "  - API runs on the backend service"
echo

echo "Frontend configuration:"
echo "  - Production build generated"
echo "  - API URL: http://$SERVER_URL"
echo "  - WebSocket URL: ws://$SERVER_URL/ws/"
echo "  - Files in: frontend/dist"
echo

echo "[4/4] Next steps"
echo "========================================"
echo

echo "1. Deploy the backend with your preferred server setup:"
echo "   - Django + Gunicorn / Uvicorn + Nginx"
echo "   - Or use the supplied deployment assets in this repo"
echo
echo "2. Serve the frontend build from the generated frontend/dist output"
echo
echo "3. Set environment variables for production, such as:"
echo "   DJANGO_SECRET_KEY, DJANGO_ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, REDIS_URL"
echo
echo "4. Review the project instructions in README.md and Makefile"
echo

echo "========================================"
echo "Build complete."
echo
