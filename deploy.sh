#!/bin/bash
# Tournament Arena Deployment Script
# This script automates the deployment process on the server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/tournamentArena"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"
LOG_FILE="/var/log/tournament_deployment.log"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Start deployment
log "🚀 Starting deployment process..."

# Navigate to project directory
cd "$PROJECT_DIR" || error "Failed to navigate to project directory"

# Pull latest changes from GitHub
log "📥 Pulling latest code from GitHub..."
git fetch origin main || error "Failed to fetch from GitHub"
git reset --hard origin/main || error "Failed to reset to origin/main"
log "✅ Code updated successfully"

# Backend deployment
log "🔧 Starting backend deployment..."

cd "$BACKEND_DIR" || error "Failed to navigate to backend directory"

# Activate virtual environment
if [ ! -d "$VENV_DIR" ]; then
    error "Virtual environment not found at $VENV_DIR"
fi

source "$VENV_DIR/bin/activate" || error "Failed to activate virtual environment"

# Install/update dependencies
log "📦 Installing Python dependencies..."
pip install -r requirements.txt --quiet || error "Failed to install Python dependencies"
pip install gunicorn uvicorn[standard] channels-redis psycopg2-binary --quiet || warning "Optional dependencies installation failed"

# Run database migrations
log "🔄 Running database migrations..."
python manage.py migrate || error "Database migration failed"

# Collect static files
log "📦 Collecting static files..."
python manage.py collectstatic --noinput || error "Static files collection failed"

# Deactivate virtual environment
deactivate

log "✅ Backend deployment completed"

# Frontend deployment
log "🎨 Starting frontend deployment..."

cd "$FRONTEND_DIR" || error "Failed to navigate to frontend directory"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    log "📦 Installing Node.js dependencies (first time)..."
    npm install || error "Failed to install Node.js dependencies"
else
    # Use npm ci for faster, cleaner installs in CI/CD
    log "📦 Installing Node.js dependencies..."
    npm ci --silent || error "Failed to install Node.js dependencies"
fi

# Build frontend
log "🏗️ Building frontend for production..."
npm run build || error "Frontend build failed"

log "✅ Frontend deployment completed"

# Restart services
log "♻️ Restarting services..."

# Restart backend with supervisor
sudo supervisorctl restart tournament_backend || error "Failed to restart backend service"
log "✅ Backend service restarted"

# Reload nginx
sudo systemctl reload nginx || error "Failed to reload Nginx"
log "✅ Nginx reloaded"

# Verify services are running
log "🔍 Verifying services..."

# Check backend status
if sudo supervisorctl status tournament_backend | grep -q "RUNNING"; then
    log "✅ Backend service is running"
else
    error "Backend service is not running"
fi

# Check nginx status
if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx is running"
else
    error "Nginx is not running"
fi

# Clean up old files
log "🧹 Cleaning up temporary files..."
find "$PROJECT_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$PROJECT_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true
find "$PROJECT_DIR" -type f -name "*.pyo" -delete 2>/dev/null || true

# Deployment summary
log "════════════════════════════════════════"
log "✅ Deployment completed successfully!"
log "════════════════════════════════════════"
log ""
log "📊 Deployment Summary:"
log "  • Project: Tournament Arena"
log "  • Backend: Django + Uvicorn (ASGI)"
log "  • Frontend: React + Vite"
log "  • Web Server: Nginx"
log "  • Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
log ""
log "🔗 Access your application at: http://$(hostname -I | awk '{print $1}')"
log ""
log "📋 View logs:"
log "  • Backend: sudo tail -f /var/log/tournament_backend.log"
log "  • Nginx: sudo tail -f /var/log/nginx/tournamentArena_access.log"
log "  • Deployment: sudo tail -f $LOG_FILE"
log ""

# Exit successfully
exit 0
