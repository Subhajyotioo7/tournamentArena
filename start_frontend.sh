#!/bin/bash
# Frontend Start Script (Linux/Mac/Git Bash)

echo "========================================"
echo "  Tournament Arena - Frontend Start"
echo "========================================"
echo

cd frontend

echo "Checking .env file..."
if [ ! -f ".env" ]; then
    echo ".env file not found. Creating from .env.development..."
    if [ -f ".env.development" ]; then
        cp .env.development .env
        echo ".env file created for DEVELOPMENT (localhost)"
    else
        echo "Creating .env file with default localhost settings..."
        echo "VITE_API_BASE_URL=http://localhost:8000" > .env
        echo "VITE_WS_URL=ws://localhost:8000/ws/" >> .env
    fi
    echo
else
    echo ".env file found. Current settings:"
    cat .env
    echo
    echo "NOTE: To switch between dev/prod, use switch_to_dev.sh or switch_to_prod.sh"
    echo
fi

echo "Installing/Updating frontend dependencies..."
npm install

echo
echo "========================================"
echo "  Frontend Setup Complete!"
echo "========================================"
echo
echo "Starting frontend development server..."
echo "Frontend will be available at the URL shown below"
echo
echo "Make sure backend is running on port 8000!"
echo "Press Ctrl+C to stop the frontend server"
echo "========================================"
echo

npm run dev
