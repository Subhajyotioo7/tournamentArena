# 🖥️ Script Files Guide: .BAT vs .SH

## Understanding the Two Types

Your project now has **TWO sets of scripts** to work on different systems:

### 🪟 .BAT Files (Windows Only)
- **Extension:** `.bat`
- **Works on:** Windows Command Prompt, Windows PowerShell
- **Does NOT work on:** Linux, Mac, AWS EC2, Git Bash

### 🐧 .SH Files (Linux/Mac/Git Bash)
- **Extension:** `.sh`
- **Works on:** Linux, Mac, Git Bash, AWS EC2
- **Does NOT work on:** Windows Command Prompt/PowerShell

---

## 📋 Complete Script List

I've created **matching pairs** of scripts for both Windows and Linux:

| Windows (.bat) | Linux (.sh) | Purpose |
|----------------|-------------|---------|
| `start_backend.bat` | `start_backend.sh` | Start Django backend on port 8000 |
| `start_frontend.bat` | `start_frontend.sh` | Start React frontend |
| `switch_to_dev.bat` | `switch_to_dev.sh` | Switch to development mode (localhost) |
| `switch_to_prod.bat` | `switch_to_prod.sh` | Switch to production mode (server) |
| `build_production.bat` | `build_production.sh` | Build for production deployment |

---

## 🎯 Which Scripts to Use?

### On Your Windows Computer

#### Option A: Using Windows Command Prompt
```bash
# Use .bat files
start_backend.bat
start_frontend.bat
switch_to_dev.bat
```

#### Option B: Using Git Bash on Windows
```bash
# Use .sh files (better compatibility)
./start_backend.sh
./start_frontend.sh
./switch_to_dev.sh
```

### On AWS EC2 (Linux)
```bash
# Use .sh files ONLY
./start_backend.sh
./start_frontend.sh
./build_production.sh
```

### On Mac
```bash
# Use .sh files
./start_backend.sh
./start_frontend.sh
```

---

## 🚀 How to Run .SH Scripts

### Step 1: Make Scripts Executable (First Time Only)

**On Linux/Mac/AWS EC2:**
```bash
chmod +x *.sh
```

This gives the scripts permission to run.

**On Git Bash (Windows):**
Scripts should work without this step, but if you get permission errors:
```bash
chmod +x *.sh
```

### Step 2: Run the Scripts

**On Linux/Mac/AWS EC2:**
```bash
./start_backend.sh
./start_frontend.sh
./switch_to_dev.sh
./switch_to_prod.sh
./build_production.sh
```

**On Git Bash (Windows):**
```bash
./start_backend.sh
./start_frontend.sh
```

Note the `./` prefix - it means "run this script in the current directory"

---

## 📁 Your Project Structure Now

```
fix-frontend-main/
├── 🪟 Windows Scripts (.bat)
│   ├── start_backend.bat
│   ├── start_frontend.bat
│   ├── switch_to_dev.bat
│   ├── switch_to_prod.bat
│   └── build_production.bat
│
├── 🐧 Linux Scripts (.sh)
│   ├── start_backend.sh
│   ├── start_frontend.sh
│   ├── switch_to_dev.sh
│   ├── switch_to_prod.sh
│   └── build_production.sh
│
├── backend/
├── frontend/
├── nginx.conf
└── supervisor.conf
```

---

## 🌐 AWS EC2 Deployment Workflow

### On Your Windows Computer (Prepare)

1. **Build for production using Windows:**
   ```bash
   build_production.bat YOUR_EC2_IP
   ```

2. **Upload to EC2:**
   ```bash
   scp -r * ubuntu@YOUR_EC2_IP:/var/www/tournamentArena/
   ```

### On AWS EC2 Instance (Deploy)

1. **SSH into EC2:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP
   ```

2. **Navigate to project:**
   ```bash
   cd /var/www/tournamentArena
   ```

3. **Make scripts executable:**
   ```bash
   chmod +x *.sh
   ```

4. **Install system dependencies:**
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv nginx supervisor redis-server nodejs npm
   ```

5. **Setup backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py collectstatic --noinput
   cd ..
   ```

6. **Setup Nginx:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/tournamentArena
   sudo ln -s /etc/nginx/sites-available/tournamentArena /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup Supervisor:**
   ```bash
   sudo cp supervisor.conf /etc/supervisor/conf.d/tournamentArena.conf
   sudo supervisorctl reread
   sudo supervisorctl update
   sudo supervisorctl start tournament_backend
   ```

8. **Start Redis:**
   ```bash
   sudo systemctl start redis
   sudo systemctl enable redis
   ```

9. **Check status:**
   ```bash
   sudo supervisorctl status
   sudo systemctl status nginx
   ```

---

## 🔧 Git Bash on Windows

If you're using **Git Bash on Windows**, you have two options:

### Option 1: Use .SH Scripts (Recommended)
```bash
# In Git Bash
./start_backend.sh
./start_frontend.sh
```

### Option 2: Use .BAT Scripts
```bash
# In Git Bash
start_backend.bat
start_frontend.bat
```

**Note:** .sh scripts are more reliable in Git Bash!

---

## 🆚 Key Differences: .BAT vs .SH

### Syntax Differences

**Windows .bat:**
```batch
@echo off
cd backend
call venv\Scripts\activate.bat
```

**Linux .sh:**
```bash
#!/bin/bash
cd backend
source venv/bin/activate
```

### Path Separators

**Windows:**
- Uses backslash: `backend\venv\Scripts\activate.bat`

**Linux:**
- Uses forward slash: `backend/venv/bin/activate`

### Python Command

**Windows:**
- `python` (usually)

**Linux/Mac:**
- `python3` (to avoid Python 2)

### Virtual Environment Activation

**Windows:**
- `venv\Scripts\activate.bat`

**Linux/Mac:**
- `source venv/bin/activate`

---

## 📝 Quick Reference

### Development on Windows

**Use .bat files in Command Prompt:**
```bash
start_backend.bat
start_frontend.bat
```

**Use .sh files in Git Bash:**
```bash
./start_backend.sh
./start_frontend.sh
```

### Production on AWS EC2 (Linux)

**Always use .sh files:**
```bash
chmod +x *.sh
./build_production.sh YOUR_SERVER_IP
```

### Switching Environments

**Windows (Command Prompt):**
```bash
switch_to_dev.bat      # For local development
switch_to_prod.bat     # Before deployment
```

**Linux/Git Bash:**
```bash
./switch_to_dev.sh     # For local development
./switch_to_prod.sh    # Before deployment
```

---

## ⚡ Common Issues & Solutions

### Issue: "Permission denied" on .sh files

**Solution:**
```bash
chmod +x *.sh
```

### Issue: "Bad interpreter" or "No such file or directory"

**Solution:** File has Windows line endings (CRLF), needs Unix line endings (LF)

**Fix on Linux:**
```bash
sed -i 's/\r$//' *.sh
```

**Fix in VS Code:**
1. Click "CRLF" in bottom right
2. Select "LF"
3. Save file

### Issue: .bat files not working in Git Bash

**Solution:** Use .sh files instead:
```bash
./start_backend.sh
```

### Issue: "python: command not found" on Linux

**Solution:** Use `python3`:
```bash
# Or create an alias
alias python=python3
```

---

## 🎯 Best Practices

### For Development (Local)
- **Windows:** Use `.bat` files in Command Prompt
- **Git Bash:** Use `.sh` files
- **Mac/Linux:** Use `.sh` files

### For Production (AWS EC2)
- **Always** use `.sh` files
- Make scripts executable first: `chmod +x *.sh`
- Test scripts before deployment

### For Version Control (Git)
- **Keep both** `.bat` and `.sh` files
- This way, your project works on any system
- Add execute permissions to `.sh` files:
  ```bash
  git add --chmod=+x *.sh
  ```

---

## 📊 Summary Table

| Environment | Script Type | How to Run | Example |
|-------------|-------------|------------|---------|
| **Windows CMD** | `.bat` | Just type filename | `start_backend.bat` |
| **Windows PowerShell** | `.bat` | Type filename | `.\start_backend.bat` |
| **Git Bash (Windows)** | `.sh` | Use `./` prefix | `./start_backend.sh` |
| **AWS EC2 (Linux)** | `.sh` | Use `./` prefix | `./start_backend.sh` |
| **Mac** | `.sh` | Use `./` prefix | `./start_backend.sh` |
| **Ubuntu/Debian** | `.sh` | Use `./` prefix | `./start_backend.sh` |

---

## 🎉 You're Ready!

Now you can work on **any platform**:

✅ **Windows** → Use `.bat` files  
✅ **Git Bash** → Use `.sh` files  
✅ **AWS EC2** → Use `.sh` files  
✅ **Mac/Linux** → Use `.sh` files  

Your project is **truly cross-platform**! 🚀
