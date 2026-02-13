#!/bin/bash
# Fix Static Files - Run this on AWS EC2

echo "=========================================="
echo "  Fixing Static Files for Django Admin"
echo "=========================================="
echo

# Navigate to project
cd /var/www/tournamentArena/backend || exit

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Check if static files were created
if [ -d "staticfiles" ]; then
    echo "✅ Static files collected successfully!"
    echo "Location: /var/www/tournamentArena/backend/staticfiles"
    echo
    ls -la staticfiles/admin/ | head -10
else
    echo "❌ Static files directory not found!"
    exit 1
fi

# Set proper permissions
echo
echo "Setting proper permissions..."
sudo chown -R www-data:www-data staticfiles/
sudo chmod -R 755 staticfiles/

# Test nginx configuration
echo
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart services
echo
echo "Restarting services..."
sudo systemctl restart nginx
sudo supervisorctl restart tournament_backend

echo
echo "=========================================="
echo "  ✅ Static Files Fixed!"
echo "=========================================="
echo
echo "Test your admin panel now:"
echo "  http://13.235.24.56/admin/"
echo
echo "If still having issues, check:"
echo "  1. Nginx logs: sudo tail -f /var/log/nginx/tournamentArena_error.log"
echo "  2. Backend logs: sudo supervisorctl tail -f tournament_backend"
echo
