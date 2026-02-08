#!/bin/bash
# Quick Start Script for Backend (Linux/Mac/Git Bash)

echo "========================================"
echo "  Tournament Arena - Backend Start"
echo "========================================"
echo

echo "Checking if virtual environment exists..."
if [ ! -d "backend/venv" ]; then
    echo "Creating virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

echo
echo "Installing/Updating backend dependencies..."
cd backend
source venv/bin/activate
pip install -r requirements.txt

echo
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

echo
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo
echo "========================================"
echo "  Backend Setup Complete!"
echo "========================================"
echo
echo "Starting backend on port 8000..."
echo "Backend URL: http://localhost:8000"
echo "Admin Panel: http://localhost:8000/admin"
echo
echo "Press Ctrl+C to stop the backend server"
echo "========================================"
echo

uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --reload
