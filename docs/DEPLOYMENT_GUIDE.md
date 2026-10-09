# TrueLern / LMSCA — Web Hosting Panel Deployment Guide

This guide provides step-by-step instructions for deploying the **TrueLern Next.js LMS** on modern web hosting panels such as **cPanel Node.js Application Manager**, **CloudPanel**, **Plesk**, **RunCloud**, **CyberPanel**, or a standalone **Ubuntu/Debian VPS** with Nginx and PM2.

---

## 1. System Requirements & Architecture

- **Node.js Version**: `Node.js 18.x` or `Node.js 20.x LTS` (Recommended: `v20.19.x` or higher)
- **Package Manager**: `npm` (v9+) or `pnpm`
- **Database**: MongoDB Atlas (`mongodb+srv://...`)
- **Web Server / Reverse Proxy**: Nginx or Apache with WebSocket & reverse proxy support
- **Process Manager**: PM2, Systemd, or cPanel Phusion Passenger

---

## 2. Server Preparation & Environment Configuration

### Step A: Upload Application Files
1. Deploy the codebase to the server document root (e.g. `/var/www/lmsca` or `/home/username/lms.truelern.com`).
2. Ensure you exclude `node_modules`, `.git`, `.next`, and local `.env` files during transfer.

### Step B: Configure Environment Variables
In your hosting panel's Environment Variable Manager (or creating a secure `.env.production` file on the server), add the following:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.9rxjj.mongodb.net/lmsca?retryWrites=true&w=majority
JWT_SECRET=your_production_secure_random_jwt_secret_minimum_64_characters
JWT_REFRESH_SECRET=your_production_secure_random_refresh_jwt_secret_minimum_64_characters
NEXT_PUBLIC_APP_URL=https://lms.truelern.com
PUBLIC_WEB_ORIGINS=https://truelern.com,https://lms.truelern.com

# Jitsi Live Class Configuration
JITSI_APP_ID=truelern-lms
JITSI_APP_SECRET=truelern_secure_jitsi_jwt_secret_key_2026
JITSI_DOMAIN=meet.truelern.com
JITSI_SERVER_URL=https://meet.truelern.com
RECORDINGS_STORAGE_PATH=/var/www/lmsca/storage/recordings
```

---

## 3. Dependency Installation & Production Build

Run the following commands in the project directory on the server:

```bash
# 1. Install production dependencies
npm ci

# 2. Verify TypeScript integrity
npx tsc --noEmit

# 3. Create production Next.js build
npm run build
```

---

## 4. Process Manager Configuration (PM2 / cPanel)

### Option A: Running with PM2 (Recommended for VPS / CloudPanel)
Create `ecosystem.config.js` in the project root:
```javascript
module.exports = {
  apps: [
    {
      name: "truelern-lms",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/lmsca",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
```

Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option B: cPanel Node.js Application Manager
- **Application root**: `/home/username/lms.truelern.com`
- **Application URL**: `lms.truelern.com`
- **Application startup file**: `node_modules/next/dist/bin/next`
- **Node.js version**: `20.x`
- Add Environment variables in the cPanel UI.
- Click **Run NPM Install** and then **Restart Application**.

---

## 5. Nginx Reverse Proxy Configuration & SSL

Configure your Nginx virtual host (`/etc/nginx/sites-available/lms.truelern.com`):

```nginx
server {
    listen 80;
    server_name lms.truelern.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lms.truelern.com;

    ssl_certificate /etc/letsencrypt/live/lms.truelern.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lms.truelern.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static optimization for Next.js assets
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_bypass $http_upgrade;
        expires 365d;
        access_log off;
    }
}
```

---

## 6. Verification & Health Check

After starting the application, run:
```bash
# Verify HTTP 200 response
curl -I https://lms.truelern.com

# Verify Public Portal API
curl -I https://lms.truelern.com/api/v1/public/portal-config

# Check logs
pm2 logs truelern-lms
```

---

## 7. Rollback Procedure
If a build or deployment issue occurs:
1. Revert to the previous stable Git commit / build folder: `git checkout <previous_stable_commit>`
2. Re-run `npm run build`
3. Restart PM2: `pm2 reload truelern-lms`
