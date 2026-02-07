# Makefile for Tournament Arena Deployment
# This Makefile provides commands for easy deployment and management

.PHONY: help deploy deploy-backend deploy-frontend restart logs status clean setup

# Default target
help:
	@echo "Tournament Arena Deployment Commands"
	@echo "====================================="
	@echo ""
	@echo "Available commands:"
	@echo "  make setup           - Initial setup on server"
	@echo "  make deploy          - Deploy both backend and frontend"
	@echo "  make deploy-backend  - Deploy only backend"
	@echo "  make deploy-frontend - Deploy only frontend"
	@echo "  make restart         - Restart all services"
	@echo "  make logs            - View backend logs"
	@echo "  make status          - Check service status"
	@echo "  make clean           - Clean temporary files"
	@echo "  make backup-db       - Backup database"
	@echo ""

# Full deployment
deploy:
	@echo "🚀 Starting full deployment..."
	@git pull origin main
	@$(MAKE) deploy-backend
	@$(MAKE) deploy-frontend
	@$(MAKE) restart
	@echo "✅ Deployment completed!"

# Deploy backend only
deploy-backend:
	@echo "🔧 Deploying backend..."
	@cd backend && \
	source venv/bin/activate && \
	pip install -r requirements.txt --quiet && \
	python manage.py migrate && \
	python manage.py collectstatic --noinput && \
	deactivate
	@echo "✅ Backend deployed!"

# Deploy frontend only
deploy-frontend:
	@echo "🎨 Deploying frontend..."
	@cd frontend && \
	npm ci --silent && \
	npm run build
	@echo "✅ Frontend deployed!"

# Restart services
restart:
	@echo "♻️ Restarting services..."
	@sudo supervisorctl restart tournament_backend
	@sudo systemctl reload nginx
	@echo "✅ Services restarted!"

# View logs
logs:
	@echo "📋 Viewing backend logs (Ctrl+C to exit)..."
	@sudo tail -f /var/log/tournament_backend.log

# Check status
status:
	@echo "📊 Service Status:"
	@echo ""
	@echo "Backend:"
	@sudo supervisorctl status tournament_backend
	@echo ""
	@echo "Nginx:"
	@sudo systemctl status nginx --no-pager | head -n 10
	@echo ""
	@echo "Redis:"
	@sudo systemctl status redis-server --no-pager | head -n 10
	@echo ""
	@echo "PostgreSQL:"
	@sudo systemctl status postgresql --no-pager | head -n 10

# Clean temporary files
clean:
	@echo "🧹 Cleaning temporary files..."
	@find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true
	@cd frontend && rm -rf node_modules/.cache 2>/dev/null || true
	@echo "✅ Cleanup completed!"

# Initial setup
setup:
	@echo "🔨 Running initial setup..."
	@cd backend && \
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install --upgrade pip && \
	pip install -r requirements.txt && \
	pip install gunicorn uvicorn[standard] channels-redis psycopg2-binary && \
	deactivate
	@cd frontend && npm install
	@echo "✅ Initial setup completed!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Configure backend/.env file"
	@echo "2. Configure frontend/.env.production file"
	@echo "3. Run: make deploy"

# Backup database
backup-db:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	@sudo -u postgres pg_dump tournament_arena > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up to backups/ directory"

# Quick push to GitHub (from local machine)
git-push:
	@echo "📤 Pushing to GitHub..."
	@git add .
	@git status
	@read -p "Commit message: " msg; \
	git commit -m "$$msg"
	@git push origin main
	@echo "✅ Pushed to GitHub!"

# Run migrations
migrate:
	@echo "🔄 Running migrations..."
	@cd backend && \
	source venv/bin/activate && \
	python manage.py migrate && \
	deactivate
	@echo "✅ Migrations completed!"

# Create superuser
createsuperuser:
	@echo "👤 Creating superuser..."
	@cd backend && \
	source venv/bin/activate && \
	python manage.py createsuperuser && \
	deactivate

# Collect static files
collectstatic:
	@echo "📦 Collecting static files..."
	@cd backend && \
	source venv/bin/activate && \
	python manage.py collectstatic --noinput && \
	deactivate
	@echo "✅ Static files collected!"

# Install SSL certificate
ssl-install:
	@echo "🔒 Installing SSL certificate..."
	@read -p "Enter your domain name: " domain; \
	sudo certbot --nginx -d $$domain -d www.$$domain
	@echo "✅ SSL certificate installed!"

# Test SSL renewal
ssl-test:
	@echo "🔒 Testing SSL certificate renewal..."
	@sudo certbot renew --dry-run
	@echo "✅ SSL test completed!"
