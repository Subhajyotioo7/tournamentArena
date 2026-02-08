@echo off
REM Quick Start Script for Windows Development
REM This script helps you run the backend and provides instructions for frontend

echo ========================================
echo   Tournament Arena - Quick Start
echo ========================================
echo.

echo Checking if virtual environment exists...
if not exist "backend\venv" (
    echo Creating virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

echo.
echo Installing/Updating backend dependencies...
cd backend
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo.
echo Running database migrations...
python manage.py makemigrations
python manage.py migrate

echo.
echo Collecting static files...
python manage.py collectstatic --noinput

echo.
echo ========================================
echo   Backend Setup Complete!
echo ========================================
echo.
echo Starting backend on port 8000...
echo Backend URL: http://localhost:8000
echo Admin Panel: http://localhost:8000/admin
echo.
echo IMPORTANT: Open a NEW terminal for frontend!
echo.
echo In the new terminal, run:
echo   cd frontend
echo   npm install
echo   npm run dev
echo.
echo Press Ctrl+C to stop the backend server
echo ========================================
echo.

uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --reload
