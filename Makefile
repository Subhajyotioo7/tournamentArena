.PHONY: help install-backend install-frontend dev-backend dev-frontend migrate collectstatic build-frontend clean setup-server build-prod

PYTHON ?= python3
BACKEND_DIR := backend
FRONTEND_DIR := frontend

help:
	@echo "Tournament Arena"
	@echo "================"
	@echo ""
	@echo "Available commands:"
	@echo "  make install-backend   - Create backend venv and install Python dependencies"
	@echo "  make install-frontend  - Install frontend dependencies"
	@echo "  make dev-backend       - Run Django development server on port 8000"
	@echo "  make dev-frontend      - Run Vite frontend development server"
	@echo "  make migrate           - Apply Django migrations"
	@echo "  make collectstatic     - Collect frontend/backend static assets"
	@echo "  make build-frontend    - Create production frontend build"
	@echo "  make setup-server      - Run Ubuntu server setup helper"
	@echo "  make build-prod        - Run the production build script"
	@echo "  make clean             - Remove temporary Python cache files"
	@echo ""

install-backend:
	@echo "Installing backend dependencies..."
	@cd $(BACKEND_DIR) && $(PYTHON) -m venv venv && . venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt && deactivate
	@echo "Backend setup complete."

install-frontend:
	@echo "Installing frontend dependencies..."
	@cd $(FRONTEND_DIR) && npm install
	@echo "Frontend setup complete."

setup:
	@$(MAKE) install-backend
	@$(MAKE) install-frontend
	@echo "Project setup complete."

# Local development servers
dev-backend:
	@cd $(BACKEND_DIR) && . venv/bin/activate && python manage.py runserver 0.0.0.0:8000

dev-frontend:
	@cd $(FRONTEND_DIR) && npm install && npm run dev -- --host 0.0.0.0

migrate:
	@cd $(BACKEND_DIR) && . venv/bin/activate && python manage.py migrate

collectstatic:
	@cd $(BACKEND_DIR) && . venv/bin/activate && python manage.py collectstatic --noinput

build-frontend:
	@cd $(FRONTEND_DIR) && npm install && npm run build

build-prod:
	@bash ./build_production.sh

setup-server:
	@bash ./setup_server.sh

clean:
	@echo "Cleaning Python cache files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@echo "Cleanup complete."

