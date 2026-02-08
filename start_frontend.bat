@echo off
REM Frontend Start Script for Windows Development

echo ========================================
echo   Tournament Arena - Frontend Start
echo ========================================
echo.

cd frontend

echo Checking .env file...
if not exist ".env" (
    echo .env file not found. Creating from .env.development...
    if exist ".env.development" (
        copy .env.development .env
        echo .env file created for DEVELOPMENT (localhost)
    ) else (
        echo Creating .env file with default localhost settings...
        echo VITE_API_BASE_URL=http://localhost:8000 > .env
        echo VITE_WS_URL=ws://localhost:8000/ws/ >> .env
    )
    echo.
) else (
    echo .env file found. Current settings:
    type .env
    echo.
    echo NOTE: To switch between dev/prod, use switch_to_dev.bat or switch_to_prod.bat
    echo.
)

echo Installing/Updating frontend dependencies...
call npm install

echo.
echo ========================================
echo   Frontend Setup Complete!
echo ========================================
echo.
echo Starting frontend development server...
echo Frontend will be available at the URL shown below
echo.
echo Make sure backend is running on port 8000!
echo Press Ctrl+C to stop the frontend server
echo ========================================
echo.

call npm run dev
