# TrueLern Production Deployment Guide

This document outlines the standard production deployment procedure for the TrueLern Enterprise Platform (Next.js 16 App Router + MongoDB Atlas + Self-Hosted Jitsi Meet Stack).

---

## 1. Hosting Architecture Overview

| Component | Target Technology | Description |
| :--- | :--- | :--- |
| **Frontend & API Gateway** | Next.js 16 (Standalone Output) | Node.js runtime managed via PM2 / aaPanel Node Project Manager |
| **Database** | MongoDB Atlas (Cluster 0) | Dedicated high-availability replica set |
| **Reverse Proxy & SSL** | Nginx | SSL termination (Let's Encrypt), HTTP/2, WebSocket proxy |
| **Video Stack** | Jitsi Meet (Self-Hosted Docker) | Subdomain `livetl.visital.in` running Prosody, Jicofo, JVB |

---

## 2. Environment Variables Checklist

Ensure these production environment variables are configured in aaPanel / PM2 or your server environment:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://truelern.visital.in
NEXT_PUBLIC_APP_VERSION=1.0.0

# Database
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.9rxjj.mongodb.net/lmsca?retryWrites=true&w=majority

# Security (64+ character random strings)
JWT_SECRET=replace_with_high_entropy_jwt_secret_64_characters_minimum
JWT_REFRESH_SECRET=replace_with_high_entropy_refresh_secret_64_characters_minimum
CRON_SECRET=replace_with_secure_cron_secret_for_automation

# CORS & Web Origins
PUBLIC_WEB_ORIGINS=https://truelern.visital.in

# Jitsi Meet Live Video Stack
JITSI_APP_ID=truelern-lms
JITSI_APP_SECRET=replace_with_jitsi_jwt_secret
JITSI_DOMAIN=livetl.visital.in
JITSI_SERVER_URL=https://livetl.visital.in
RECORDINGS_STORAGE_PATH=/www/wwwroot/livetl.visital.in/recordings
```

---

## 3. Server Deployment Steps (aaPanel / PM2)

### Step 1: Clone or Transfer Repository
```bash
cd /www/wwwroot/truelern.visital.in
git clone <repository-url> .
```

### Step 2: Install Dependencies & Build
```bash
npm install --production=false
npx tsc --noEmit
npm run build
```
The `npm run build` command invokes `scripts/postbuild.js` which automatically stages static assets to `.next/standalone`.

### Step 3: Configure PM2 Service
In aaPanel Node Project Manager:
- **Project Directory**: `/www/wwwroot/truelern.visital.in`
- **Run Opt**: `server.js` (pointing to `.next/standalone/server.js`)
- **Node Version**: `v20.x LTS`
- **Port**: `3000`

Or via command line:
```bash
pm2 start .next/standalone/server.js --name "truelern-lms" -i max
pm2 save
```

---

## 4. Nginx Reverse Proxy Configuration

Add the following location blocks to your Nginx virtual host configuration:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name truelern.visital.in;

    # SSL configuration here...

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000/_next/static;
        proxy_cache_valid 200 365d;
        access_log off;
    }
}
```

---

## 5. Post-Deployment Verification

1. Check health route: `curl https://truelern.visital.in/api/health`
2. Check Swagger UI: Open `https://truelern.visital.in/docs`
3. Verify public landing and pricing: `https://truelern.visital.in/pricing`
4. Test demo booking API: `POST /api/public/lead`
