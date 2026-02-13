# 🔧 Static Files Fix Guide - Django Admin Panel

## ❌ The Problem

You're seeing these errors:
```
GET http://13.235.24.56/static/admin/css/base.css net::ERR_ABORTED 404 (Not Found)
GET http://13.235.24.56/static/admin/js/theme.js net::ERR_ABORTED 404 (Not Found)
```

**Cause:** Django's static files haven't been collected or aren't accessible.

---

## ✅ Quick Fix (On AWS EC2 Server)

### Step 1: Upload the Fix Script

From your Windows computer:
```bash
scp fix_static_files.sh ubuntu@13.235.24.56:/var/www/tournamentArena/
```

### Step 2: SSH to Server

```bash
ssh ubuntu@13.235.24.56
```

### Step 3: Run the Fix Script

```bash
cd /var/www/tournamentArena
chmod +x fix_static_files.sh
./fix_static_files.sh
```

**That's it!** The script will:
- ✅ Collect all static files
- ✅ Set proper permissions
- ✅ Restart Nginx and backend
- ✅ Fix your admin panel

---

## 🛠️ Manual Fix (If Script Doesn't Work)

### Step 1: Collect Static Files

```bash
cd /var/www/tournamentArena/backend
source venv/bin/activate
python manage.py collectstatic --noinput
```

You should see output like:
```
Copying '/path/to/admin/css/base.css'
Copying '/path/to/admin/js/theme.js'
...
120 static files copied to '/var/www/tournamentArena/backend/staticfiles'
```

### Step 2: Verify Static Files Exist

```bash
ls -la staticfiles/admin/css/
```

You should see files like:
```
base.css
login.css
dark_mode.css
responsive.css
...
```

### Step 3: Set Permissions

```bash
sudo chown -R www-data:www-data staticfiles/
sudo chmod -R 755 staticfiles/
```

### Step 4: Verify Nginx Configuration

```bash
# Check if the static location is configured
grep -A 5 "location /static/" /etc/nginx/sites-available/tournamentArena

# Should show:
# location /static/ {
#     alias /var/www/tournamentArena/backend/staticfiles/;
#     ...
# }
```

### Step 5: Test Nginx Config

```bash
sudo nginx -t
```

Should show:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 6: Restart Services

```bash
sudo systemctl restart nginx
sudo supervisorctl restart tournament_backend
```

### Step 7: Test Static Files

```bash
# Test if static file is accessible
curl http://localhost/static/admin/css/base.css

# Should return CSS content, NOT 404
```

---

## 🔍 Verify the Fix

### Test 1: Check Static Files Directory

```bash
cd /var/www/tournamentArena/backend
ls -la staticfiles/

# Should show:
# admin/    <- Django admin static files
# (your other static files if any)
```

### Test 2: Check File Permissions

```bash
ls -la staticfiles/admin/css/base.css

# Should show something like:
# -rwxr-xr-x 1 www-data www-data 16547 ... base.css
```

### Test 3: Access Admin Panel

Open browser and visit:
```
http://13.235.24.56/admin/
```

The admin panel should now have proper styling! 🎨

---

## 🐛 Still Not Working? Advanced Troubleshooting

### Issue 1: Nginx Not Serving Static Files

**Check Nginx error log:**
```bash
sudo tail -f /var/log/nginx/tournamentArena_error.log
```

**Common errors:**
- "Permission denied" → Fix with: `sudo chmod -R 755 staticfiles/`
- "No such file or directory" → Run: `python manage.py collectstatic`

### Issue 2: STATIC_ROOT Not Set Correctly

**Check Django settings:**
```bash
cd /var/www/tournamentArena/backend
source venv/bin/activate
python manage.py shell

# In Python shell:
from django.conf import settings
print(settings.STATIC_ROOT)
# Should print: /var/www/tournamentArena/backend/staticfiles

print(settings.STATIC_URL)
# Should print: /static/
```

**If STATIC_ROOT is wrong, edit settings.py:**
```python
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

### Issue 3: Wrong Nginx Path

**Edit nginx.conf:**
```bash
sudo nano /etc/nginx/sites-available/tournamentArena
```

**Make sure this line is correct:**
```nginx
location /static/ {
    alias /var/www/tournamentArena/backend/staticfiles/;
    # NOT /staticfiles/ (without backend/)
    # NOT /static/ (wrong directory name)
}
```

### Issue 4: SELinux Blocking (If enabled)

```bash
# Check if SELinux is enabled
getenforce

# If "Enforcing", temporarily disable to test
sudo setenforce 0

# If this fixes it, configure SELinux properly:
sudo chcon -Rt httpd_sys_content_t /var/www/tournamentArena/backend/staticfiles/
```

---

## 📋 Complete Settings Verification

### Check settings.py

Your `backend/backend/settings.py` should have:

```python
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# If you have additional static directories
STATICFILES_DIRS = [
    # BASE_DIR / 'static',  # Only if you have custom static files
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### Check nginx.conf

Your nginx configuration should have:

```nginx
# Static files (Django)
location /static/ {
    alias /var/www/tournamentArena/backend/staticfiles/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Media files (User uploads)
location /media/ {
    alias /var/www/tournamentArena/backend/media/;
    expires 7d;
    add_header Cache-Control "public";
}
```

**Important:** Note the trailing slashes in both `location` and `alias`!

---

## 🎯 One-Command Fix

If you just want a quick one-liner:

```bash
cd /var/www/tournamentArena/backend && source venv/bin/activate && python manage.py collectstatic --noinput && sudo chown -R www-data:www-data staticfiles/ && sudo chmod -R 755 staticfiles/ && sudo systemctl restart nginx && sudo supervisorctl restart tournament_backend && echo "✅ Static files fixed!"
```

---

## 📊 Understanding the Static Files Flow

```
Django Admin Static Files
         ↓
python manage.py collectstatic
         ↓
Copies to: /var/www/tournamentArena/backend/staticfiles/admin/
         ↓
Nginx serves from this location
         ↓
Browser requests: http://13.235.24.56/static/admin/css/base.css
         ↓
Nginx returns file from: /var/www/tournamentArena/backend/staticfiles/admin/css/base.css
```

---

## ⚠️ About the CORS Warning

The warning about "Cross-Origin-Opener-Policy" is **NOT critical**. It just means you're using HTTP instead of HTTPS.

**To ignore:** It won't affect functionality, just a browser warning.

**To fix (optional):** Setup HTTPS with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
# Requires a domain name, not just IP
```

---

## ✅ Success Checklist

After running the fix, verify:

- [ ] Static files collected: `ls /var/www/tournamentArena/backend/staticfiles/admin/`
- [ ] Permissions correct: `ls -la staticfiles/` (shows www-data)
- [ ] Nginx config valid: `sudo nginx -t` (shows successful)
- [ ] Services restarted: `sudo systemctl status nginx` (shows active)
- [ ] Admin panel loads: Visit `http://13.235.24.56/admin/` (has styling)
- [ ] No 404 errors: Check browser console (F12)

---

## 🎉 After the Fix

Once fixed, your admin panel at `http://13.235.24.56/admin/` will:
- ✅ Have proper styling (colors, fonts, layout)
- ✅ Have working navigation
- ✅ Show the Django admin interface correctly
- ✅ Allow you to log in and manage your data

**Login with:**
- Username: (your superuser username)
- Password: (your superuser password)

**Don't have a superuser?** Create one:
```bash
cd /var/www/tournamentArena/backend
source venv/bin/activate
python manage.py createsuperuser
```

---

## 📞 Need More Help?

**View logs in real-time:**
```bash
# Nginx errors
sudo tail -f /var/log/nginx/tournamentArena_error.log

# Backend logs
sudo supervisorctl tail -f tournament_backend

# System logs
sudo journalctl -u nginx -f
```

**Common commands:**
```bash
# Restart everything
sudo supervisorctl restart tournament_backend
sudo systemctl restart nginx

# Check status
sudo supervisorctl status
sudo systemctl status nginx
```

---

## 🚀 Quick Summary

**Problem:** Static files (CSS/JS) not found (404 errors)

**Solution:**
1. Upload `fix_static_files.sh` to server
2. Run: `./fix_static_files.sh`
3. Access: `http://13.235.24.56/admin/`

**Done!** Admin panel should now work perfectly! 🎨
