# 🔧 Connection Error Fix - Development & Production Guide

## ❌ The Problem

You were getting this error:
```
GET http://3.110.159.197/tournaments/tournaments/ net::ERR_CONNECTION_TIMED_OUT
```

### Why This Happened:
1. Frontend `.env` was configured for **production server** (3.110.159.197)
2. But you're trying to run it on your **local development** machine
3. The remote server might be down, unreachable, or behind a firewall
4. Backend on your local machine is on `localhost:8000`, not the remote IP

---

## ✅ The Solution

I've created **separate environment files** for development and production, plus **easy scripts** to switch between them.

### New Files Created:

| File | Purpose |
|------|---------|
| `.env.development` | For LOCAL development (localhost:8000) |
| `.env.production` | For PRODUCTION server (3.110.159.197) |
| `switch_to_dev.bat` | Quick switch to development mode |
| `switch_to_prod.bat` | Quick switch to production mode |

---

## 🚀 How to Work in Development (Your Local Computer)

### Option 1: Automatic (Easiest) ✨

Just run these commands in **two separate terminals**:

**Terminal 1 - Start Backend:**
```bash
start_backend.bat
```

**Terminal 2 - Start Frontend:**
```bash
start_frontend.bat
```

The `start_frontend.bat` script will **automatically** use `.env.development` (localhost) if `.env` doesn't exist.

### Option 2: Manual Switch

If your `.env` is still set to production, switch to development mode:

```bash
switch_to_dev.bat
```

Then start backend and frontend:
```bash
# Terminal 1
start_backend.bat

# Terminal 2
start_frontend.bat
```

### What Happens in Development:
- Frontend connects to: `http://localhost:8000`
- WebSockets connect to: `ws://localhost:8000/ws/`
- Everything runs on your local machine
- **No need for remote server**

---

## 🌐 How to Work in Production (Remote Server)

### Step 1: Switch to Production Mode

```bash
switch_to_prod.bat
```

This copies `.env.production` to `.env`, which has:
```
VITE_API_BASE_URL=http://3.110.159.197
VITE_WS_URL=ws://3.110.159.197/ws/
```

### Step 2: Update Production Server IP (If Different)

Edit `frontend/.env.production` and change the IP to your actual server:
```bash
VITE_API_BASE_URL=http://YOUR_SERVER_IP
VITE_WS_URL=ws://YOUR_SERVER_IP/ws/
```

### Step 3: Build for Production

```bash
cd frontend
npm run build
```

### Step 4: Deploy to Server

Upload the `dist` folder and backend to your server following `SIMPLE_DEPLOYMENT_GUIDE.md`.

---

## 🔄 Quick Environment Switching

### Switch to Development (Local):
```bash
switch_to_dev.bat
```
- Sets API URL to `http://localhost:8000`
- Use for local development
- No remote server needed

### Switch to Production (Remote):
```bash
switch_to_prod.bat
```
- Sets API URL to `http://3.110.159.197` (or your server IP)
- Use before building for deployment
- Requires remote server to be running

---

## 📝 Current Configuration

### Development Environment (`.env.development`)
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/
```
✅ **Use when:** Working on your local computer

### Production Environment (`.env.production`)
```bash
VITE_API_BASE_URL=http://3.110.159.197
VITE_WS_URL=ws://3.110.159.197/ws/
```
✅ **Use when:** Building for remote server deployment

### Active Environment (`.env`)
This is the **active** environment file that Vite uses. 
- It's created automatically by `start_frontend.bat`
- Or you can switch it using `switch_to_dev.bat` / `switch_to_prod.bat`

---

## 🛠️ Troubleshooting

### Still Getting Connection Timeout?

#### For Development (Local):
1. **Check if backend is running:**
   ```bash
   # In browser, visit:
   http://localhost:8000/admin/
   
   # If you see Django admin login, backend is running ✅
   # If you see "connection refused", backend is NOT running ❌
   ```

2. **Make sure you're in development mode:**
   ```bash
   switch_to_dev.bat
   ```

3. **Check frontend .env:**
   ```bash
   cd frontend
   type .env
   # Should show: VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Restart frontend after changing .env:**
   ```bash
   # Stop the frontend (Ctrl+C)
   # Then restart:
   npm run dev
   ```

#### For Production (Remote):
1. **Verify server is accessible:**
   ```bash
   # Try to ping the server
   ping 3.110.159.197
   
   # Try to access the backend
   # In browser, visit:
   http://3.110.159.197/admin/
   ```

2. **Check if backend is running on server:**
   ```bash
   # SSH into server
   ssh user@3.110.159.197
   
   # Check supervisor status
   sudo supervisorctl status
   
   # Should show: tournament_backend    RUNNING
   ```

3. **Check firewall rules:**
   ```bash
   # On server
   sudo ufw status
   
   # Make sure ports 80 and 8000 are allowed
   sudo ufw allow 80
   sudo ufw allow 8000
   ```

4. **Check Nginx logs:**
   ```bash
   # On server
   sudo tail -f /var/log/nginx/tournamentArena_error.log
   ```

---

## 🎯 Quick Commands Reference

```bash
# DEVELOPMENT (Local Computer)
start_backend.bat          # Start backend on localhost:8000
start_frontend.bat         # Start frontend, connects to localhost:8000
switch_to_dev.bat          # Switch .env to development mode

# PRODUCTION (Remote Server)
switch_to_prod.bat         # Switch .env to production mode
build_production.bat       # Build everything for production

# CHECK CONFIGURATION
cd frontend
type .env                  # See current environment settings
type .env.development      # See development settings
type .env.production       # See production settings
```

---

## 📊 How Environment Files Work

```
┌─────────────────────────────────────────┐
│  Frontend Environment Files             │
├─────────────────────────────────────────┤
│                                         │
│  .env.development          (Template)   │
│    → localhost:8000                     │
│                                         │
│  .env.production           (Template)   │
│    → 3.110.159.197                      │
│                                         │
│  .env                      (Active)     │
│    → Used by Vite/npm                   │
│    → Copy of dev or prod                │
│                                         │
└─────────────────────────────────────────┘

Switch Scripts:
  switch_to_dev.bat    → Copies .env.development to .env
  switch_to_prod.bat   → Copies .env.production to .env
```

---

## ✅ Fixed Configuration Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Environment Files** | Single `.env` with production URL | Separate `.env.development` and `.env.production` |
| **Switching** | Manual editing | One-click scripts (`switch_to_dev.bat`, `switch_to_prod.bat`) |
| **Default Mode** | Production (remote server) | Development (localhost) |
| **Error** | Connection timeout to remote server | Works with local backend |

---

## 🎓 Understanding the Error

### Original Error Breakdown:
```
GET http://3.110.159.197/tournaments/tournaments/ 
net::ERR_CONNECTION_TIMED_OUT
```

This means:
- ❌ Frontend tried to connect to `3.110.159.197`
- ❌ Server didn't respond (timeout after waiting)
- ❌ Could be: server down, firewall blocking, wrong IP, network issue

### The Fix:
For **local development**, we changed the URL to:
```
GET http://localhost:8000/tournaments/tournaments/
```

Now:
- ✅ Frontend connects to local backend
- ✅ No network/firewall issues
- ✅ Instant response (same computer)

---

## 🎉 You're All Set!

### To Start Development Right Now:

1. **Open Terminal 1:**
   ```bash
   start_backend.bat
   ```
   Wait for "Uvicorn running on http://0.0.0.0:8000"

2. **Open Terminal 2:**
   ```bash
   start_frontend.bat
   ```
   Wait for "Local: http://localhost:5173"

3. **Open Browser:**
   ```
   http://localhost:5173
   ```

4. **Start coding!** 🚀

---

## 📚 Next Steps

- **Development:** Use the scripts to start local development
- **Production:** When ready to deploy, use `switch_to_prod.bat` and `build_production.bat`
- **Documentation:** See `SIMPLE_DEPLOYMENT_GUIDE.md` for server deployment

---

**Need More Help?**

Check these files:
- `QUICK_START.md` - Quick reference
- `SIMPLE_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `DEPLOYMENT_SUMMARY.md` - Configuration summary
