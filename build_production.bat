@echo off
REM Production Build Script for Windows
REM This script prepares the project for deployment

echo ========================================
echo   Tournament Arena - Production Build
echo ========================================
echo.

REM Check if server IP or domain is provided
set SERVER_URL=%1
if "%SERVER_URL%"=="" (
    set /p SERVER_URL="Enter your server IP or domain (e.g., 192.168.1.100 or example.com): "
)

echo.
echo Building for server: %SERVER_URL%
echo.

REM ==========================================
REM Backend Preparation
REM ==========================================
echo [1/4] Preparing Backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo Installing backend dependencies...
pip install -r requirements.txt

echo Running migrations...
python manage.py makemigrations
python manage.py migrate

echo Collecting static files...
python manage.py collectstatic --noinput

echo Backend preparation complete!
cd ..

REM ==========================================
REM Frontend Preparation
REM ==========================================
echo.
echo [2/4] Preparing Frontend...
cd frontend

echo Creating production .env file...
echo VITE_API_BASE_URL=http://%SERVER_URL% > .env
echo VITE_WS_URL=ws://%SERVER_URL%/ws/ >> .env

echo Installing frontend dependencies...
call npm install

echo Building frontend for production...
call npm run build

echo Frontend build complete! (check frontend/dist folder)
cd ..

REM ==========================================
REM Configuration Summary
REM ==========================================
echo.
echo [3/4] Configuration Summary
echo ========================================
echo.
echo Backend Configuration:
echo   - Django settings updated
echo   - Database migrated
echo   - Static files collected
echo   - Ready to run on port 8000
echo.
echo Frontend Configuration:
echo   - Built for production
echo   - API URL: http://%SERVER_URL%
echo   - WebSocket URL: ws://%SERVER_URL%/ws/
echo   - Files in: frontend/dist
echo.
echo Nginx Configuration:
echo   - nginx.conf ready (server_name: _)
echo   - Listens on port 80
echo   - Proxies to backend on 127.0.0.1:8000
echo.
echo Supervisor Configuration:
echo   - supervisor.conf ready
echo   - Will auto-start backend on system boot
echo.

REM ==========================================
REM Next Steps
REM ==========================================
echo [4/4] Next Steps for Deployment
echo ========================================
echo.
echo For LOCAL Testing (Windows):
echo   1. Start Redis (if using WebSockets):
echo      Download from: https://github.com/microsoftarchive/redis/releases
echo      Or skip Redis for basic testing
echo.
echo   2. Run backend:
echo      cd backend
echo      venv\Scripts\activate
echo      uvicorn backend.asgi:application --host 0.0.0.0 --port 8000
echo.
echo   3. Serve frontend (new terminal):
echo      cd frontend
echo      npx serve -s dist -l 80
echo      (Use port 3000 if 80 requires admin: npx serve -s dist -l 3000)
echo.
echo For SERVER Deployment (Linux):
echo   1. Install requirements:
echo      sudo apt update
echo      sudo apt install python3-pip python3-venv nginx supervisor redis-server
echo.
echo   2. Upload project to server:
echo      scp -r * user@%SERVER_URL%:/var/www/tournamentArena/
echo.
echo   3. Copy configuration files:
echo      sudo cp nginx.conf /etc/nginx/sites-available/tournamentArena
echo      sudo ln -s /etc/nginx/sites-available/tournamentArena /etc/nginx/sites-enabled/
echo      sudo cp supervisor.conf /etc/supervisor/conf.d/tournamentArena.conf
echo.
echo   4. Update paths in config files to match server paths
echo.
echo   5. Start services:
echo      sudo supervisorctl reread
echo      sudo supervisorctl update
echo      sudo supervisorctl start tournament_backend
echo      sudo systemctl restart nginx
echo.
echo ========================================
echo.
echo Build complete! Check SIMPLE_DEPLOYMENT_GUIDE.md for detailed instructions.
echo.
pause
