#!/bin/bash
# Switch to Development Environment

echo "========================================"
echo "  Switching to DEVELOPMENT Mode"
echo "========================================"
echo

cd frontend

echo "Copying .env.development to .env..."
cp .env.development .env

echo
echo "========================================"
echo "Development mode activated!"
echo "========================================"
echo
echo "Backend URL: http://localhost:8000"
echo "WebSocket URL: ws://localhost:8000/ws/"
echo
echo "Next steps:"
echo "1. Make sure backend is running on port 8000"
echo "2. Run: npm run dev"
echo
echo "To start backend, run: ./start_backend.sh"
echo "========================================"
