# TrueLern / LMSCA — aaPanel Production Deployment Guide

**Target Application**: Next.js LMS & Operations Platform  
**Target Domain**: `TrueLern.visital.in`  
**Panel**: aaPanel (Linux Node.js Project Manager / PM2)  
**Database**: MongoDB Atlas (`cluster0.9rxjj.mongodb.net/lmsca`)  

---

## 1. Prerequisites on aaPanel Server

1. **Node.js Version**: Install `Node.js v20.x LTS` or `Node.js v22.x LTS` via aaPanel **Node.js Version Manager** (or **PM2 Manager**).
2. **Web Server**: Nginx (v1.22+ or v1.24+).
3. **DNS Configuration**:
   - Point `A` record of `TrueLern.visital.in` to your server's Public IP.
   - *(Optional for Jitsi)* Point `A` record of `live.TrueLern.visital.in` to your Jitsi server IP.

---

## 2. Step-by-Step Deployment on aaPanel

### Step 1: Create Website & Directory in aaPanel
1. Open aaPanel Dashboard → **Website** → **Add Site**.
2. **Domain**: `TrueLern.visital.in`.
3. **Site Directory**: `/www/wwwroot/TrueLern.visital.in`.
4. Submit and create the site.

### Step 2: Upload Release Package
1. Open **Files** in aaPanel → Navigate to `/www/wwwroot/TrueLern.visital.in`.
2. Upload the `TrueLern-production-*.zip` release archive.
3. Extract all files into `/www/wwwroot/TrueLern.visital.in`.

### Step 3: Configure Environment Variables
1. In `/www/wwwroot/TrueLern.visital.in`, create a file named `.env.production` (or `.env`).
2. Add the production environment variables:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://TrueLern.visital.in
NEXT_PUBLIC_APP_VERSION=1.0.0

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.9rxjj.mongodb.net/lmsca?retryWrites=true&w=majority

# JWT Secrets (Use strong random strings)
JWT_SECRET=your_production_secure_jwt_secret_64_characters_minimum
JWT_REFRESH_SECRET=your_production_secure_refresh_secret_64_characters_minimum

# Security & CORS
PUBLIC_WEB_ORIGINS=https://TrueLern.visital.in

# Jitsi Live Class Stack
JITSI_APP_ID=truelern-lms
JITSI_APP_SECRET=truelern_secure_jitsi_jwt_secret_key_2026
JITSI_DOMAIN=live.TrueLern.visital.in
JITSI_SERVER_URL=https://live.TrueLern.visital.in
RECORDINGS_STORAGE_PATH=/www/wwwroot/TrueLern.visital.in/storage/recordings
```

### Step 4: Install Dependencies & Build
Open terminal via SSH (or aaPanel Web Terminal):

```bash
cd /www/wwwroot/TrueLern.visital.in

# Install clean dependencies
npm ci

# Optional: Run demo seed script to prepare demo class
npm run seed:demo

# Build production Next.js bundle
npm run build
```

### Step 5: Configure Node.js Project in aaPanel (or PM2)

#### Option A: Using aaPanel "Node Project"
1. In aaPanel → **Website** → **Node project** → **Add Node project**.
2. **Project name**: `truelern-lms`
3. **Run directory**: `/www/wwwroot/TrueLern.visital.in`
4. **Node version**: `v20.x` or `v22.x`
5. **Start command**: `npm run start` (or `npm start`)
6. **Port**: `3000`
7. Click **Submit**.

#### Option B: Using PM2 CLI
```bash
cd /www/wwwroot/TrueLern.visital.in
pm2 start npm --name "truelern-lms" -- start -- -p 3000
pm2 save
pm2 startup
```

---

## 3. Reverse Proxy & SSL Configuration in aaPanel

### Step 1: Configure Reverse Proxy
1. In aaPanel → **Website** → Click on `TrueLern.visital.in` → **Reverse proxy** → **Add reverse proxy**.
2. **Proxy name**: `nextjs-proxy`
3. **Target URL**: `http://127.0.0.1:3000`
4. **Sent Domain**: `$host`
5. Click **Submit**.

Ensure WebSocket support headers are present in the Nginx config:
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Step 2: Enable Let's Encrypt SSL
1. In aaPanel → **Website** → Click on `TrueLern.visital.in` → **SSL** → **Let's Encrypt**.
2. Select domain `TrueLern.visital.in` → Click **Apply**.
3. Toggle **Force HTTPS** to ON.

---

## 4. Verification & Health Check

Run the following checks from your terminal:
```bash
# 1. Health Endpoint Check
curl -I https://TrueLern.visital.in/api/health

# 2. Portal Config Check
curl https://TrueLern.visital.in/api/v1/public/portal-config?portalId=student-portal

# 3. View PM2 Logs
pm2 logs truelern-lms
```
