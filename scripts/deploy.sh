#!/bin/bash

# TruGovAI Incident Tracker - Deployment Script
# This script pulls from GitHub, installs dependencies, builds, and starts the app

set -e

APP_DIR="/home/user/trugovai_incident_tracker"
REPO_URL="https://github.com/britman3/trugovai_incident_tracker.git"
BRANCH="claude/implement-spec-zdHTG"
PORT=3080

echo "========================================"
echo "TruGovAI Incident Tracker - Deployment"
echo "========================================"

# Navigate to app directory or clone if doesn't exist
if [ -d "$APP_DIR" ]; then
    echo "[1/7] Navigating to app directory..."
    cd "$APP_DIR"

    echo "[2/7] Pulling latest changes from GitHub..."
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo "[1/7] Cloning repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    echo "[2/7] Repository cloned."
fi

# Create logs directory
mkdir -p logs

# Install dependencies
echo "[3/7] Installing dependencies..."
npm install

# Generate Prisma client
echo "[4/7] Generating Prisma client..."
npx prisma generate

# Build the application
echo "[5/7] Building application..."
npm run build

# Open firewall port (requires sudo)
echo "[6/7] Configuring firewall for port $PORT..."
if command -v ufw &> /dev/null; then
    sudo ufw allow $PORT/tcp
    sudo ufw reload
    echo "UFW: Port $PORT opened"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=$PORT/tcp
    sudo firewall-cmd --reload
    echo "firewalld: Port $PORT opened"
elif command -v iptables &> /dev/null; then
    sudo iptables -A INPUT -p tcp --dport $PORT -j ACCEPT
    echo "iptables: Port $PORT opened"
else
    echo "WARNING: No firewall command found. Please manually open port $PORT"
fi

# Start/restart with PM2
echo "[7/7] Starting application with PM2..."
if pm2 list | grep -q "trugovai-incident-tracker"; then
    pm2 restart trugovai-incident-tracker
    echo "Application restarted"
else
    pm2 start ecosystem.config.js
    pm2 save
    echo "Application started"
fi

echo ""
echo "========================================"
echo "Deployment complete!"
echo "Application running on port $PORT"
echo "Access at: http://$(hostname -I | awk '{print $1}'):$PORT"
echo "========================================"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status                    - Check app status"
echo "  pm2 logs trugovai-incident-tracker  - View logs"
echo "  pm2 restart trugovai-incident-tracker - Restart app"
echo "  pm2 stop trugovai-incident-tracker    - Stop app"
