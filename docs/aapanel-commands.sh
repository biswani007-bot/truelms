#!/usr/bin/env bash
# ==============================================================================
# TrueLern / LMSCA — aaPanel Deployment & Management Command Reference
# Target Domain: TrueLern.visital.in
# Target Directory: /www/wwwroot/TrueLern.visital.in
# ==============================================================================

set -e

APP_DIR="/www/wwwroot/TrueLern.visital.in"

echo "=== TrueLern aaPanel Command Suite ==="

# 1. Navigate to Application Directory
cd $APP_DIR

# 2. Check Node & NPM Version
echo "Node Version: $(node -v)"
echo "NPM Version:  $(npm -v)"

# 3. Install Production Dependencies
echo "[1/5] Installing dependencies with npm ci..."
npm ci

# 4. Run Deterministic Demo Dataset Seed (Non-destructive)
echo "[2/5] Running demo dataset synchronization..."
npm run seed:demo

# 5. Build Next.js Production Bundle
echo "[3/5] Building Next.js application..."
npm run build

# 6. Start / Reload with PM2
echo "[4/5] Starting PM2 process..."
if pm2 list | grep -q "truelern-lms"; then
    pm2 reload truelern-lms --update-env
else
    pm2 start npm --name "truelern-lms" -- start -- -p 3000
    pm2 save
fi

# 7. Health Check
echo "[5/5] Checking local application health..."
curl -s http://127.0.0.1:3000/api/health | grep -q "ok" && echo "SUCCESS: TrueLern LMS is healthy on port 3000." || echo "WARNING: Health check did not return ok."

echo "=== Deployment Completed Successfully ==="
