#!/bin/bash
# Switch to Production Environment

echo "========================================"
echo "  Switching to PRODUCTION Mode"
echo "========================================"
echo

cd frontend

echo "Copying .env.production to .env..."
cp .env.production .env

echo
echo "========================================"
echo "Production mode activated!"
echo "========================================"
echo
echo "Backend URL: http://13.235.24.56"
echo "WebSocket URL: ws://13.235.24.56/ws/"
echo
echo "IMPORTANT: Update .env.production with your server IP/domain"
echo
echo "Next steps:"
echo "1. Update .env.production with your server details"
echo "2. Run: npm run build"
echo "3. Deploy dist folder to server"
echo
echo "To build for production, run: ./build_production.sh"
echo "========================================"
