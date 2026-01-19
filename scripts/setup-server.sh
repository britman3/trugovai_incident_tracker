#!/bin/bash

# TruGovAI Incident Tracker - Server Setup Script
# Run this first on a fresh server to install all dependencies

set -e

echo "========================================"
echo "TruGovAI - Server Setup"
echo "========================================"

# Update system
echo "[1/6] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS)
echo "[2/6] Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install PM2 globally
echo "[3/6] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "PM2 version: $(pm2 -v)"

# Install PostgreSQL
echo "[4/6] Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Create database and user
echo "[5/6] Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE trugovai_incidents;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER trugovai WITH ENCRYPTED PASSWORD 'trugovai_secure_password';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE trugovai_incidents TO trugovai;"
sudo -u postgres psql -c "ALTER DATABASE trugovai_incidents OWNER TO trugovai;"

# Configure PM2 to start on boot
echo "[6/6] Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp $HOME
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "========================================"
echo "Server setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Create .env file with DATABASE_URL:"
echo "   DATABASE_URL=\"postgresql://trugovai:trugovai_secure_password@localhost:5432/trugovai_incidents\""
echo ""
echo "2. Run the deployment script:"
echo "   ./scripts/deploy.sh"
echo ""
echo "3. Run database migrations and seed:"
echo "   npx prisma db push"
echo "   npm run db:seed"
