#!/bin/bash

# Quick start script - pulls latest and restarts

set -e

APP_DIR="/home/user/trugovai_incident_tracker"
BRANCH="claude/implement-spec-zdHTG"

cd "$APP_DIR"

echo "Pulling latest changes..."
git pull origin "$BRANCH"

echo "Installing any new dependencies..."
npm install

echo "Rebuilding..."
npm run build

echo "Restarting PM2 process..."
pm2 restart trugovai-incident-tracker

echo "Done! Checking status..."
pm2 status
