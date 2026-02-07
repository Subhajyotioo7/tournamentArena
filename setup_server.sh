#!/bin/bash
# Initial Server Setup Script for Tournament Arena
# Run this script on a fresh Ubuntu 22.04 EC2 instance

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Tournament Arena - Initial Server Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}This script should be run with sudo privileges${NC}"
   echo "Please run: sudo bash setup_server.sh"
   exit 1
fi

# Update system
echo -e "${BLUE}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Python and dependencies
echo -e "${BLUE}[2/10] Installing Python and dependencies...${NC}"
apt install python3-pip python3-venv python3-dev -y

# Install Nginx
echo -e "${BLUE}[3/10] Installing Nginx...${NC}"
apt install nginx -y
systemctl enable nginx

# Install Node.js
echo -e "${BLUE}[4/10] Installing Node.js and npm...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# Install Git
echo -e "${BLUE}[5/10] Installing Git...${NC}"
apt install git -y

# Install Supervisor
echo -e "${BLUE}[6/10] Installing Supervisor...${NC}"
apt install supervisor -y
systemctl enable supervisor

# Install PostgreSQL
echo -e "${BLUE}[7/10] Installing PostgreSQL...${NC}"
apt install postgresql postgresql-contrib -y
systemctl enable postgresql

# Install Redis
echo -e "${BLUE}[8/10] Installing Redis...${NC}"
apt install redis-server -y
systemctl enable redis-server

# Create application user
echo -e "${BLUE}[9/10] Creating application user...${NC}"
if id "tournament" &>/dev/null; then
    echo "User 'tournament' already exists"
else
    useradd -m -s /bin/bash tournament
    usermod -aG www-data tournament
    echo "User 'tournament' created"
fi

# Create application directory
echo -e "${BLUE}[10/10] Setting up application directory...${NC}"
mkdir -p /var/www/tournamentArena
chown tournament:www-data /var/www/tournamentArena
chmod 775 /var/www/tournamentArena

# Display completion message
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Server setup completed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Switch to tournament user: sudo su - tournament"
echo "2. Generate SSH key for GitHub: ssh-keygen -t ed25519 -C 'your-email@example.com'"
echo "3. Add SSH key to GitHub Deploy Keys"
echo "4. Clone repository: git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git /var/www/tournamentArena"
echo "5. Follow the deployment guide for remaining steps"
echo ""
echo -e "${YELLOW}Installed versions:${NC}"
python3 --version
node --version
npm --version
nginx -v
git --version
psql --version | head -n 1
redis-server --version
supervisord --version
echo ""
echo -e "${GREEN}Server is ready for deployment!${NC}"
