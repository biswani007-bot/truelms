# TrueLern / LMSCA — Production Environment Checklist

This checklist documents all required and optional environment variables for deploying the TrueLern Next.js LMS backend on a production web hosting panel (e.g. cPanel Node.js App Manager, CloudPanel, Plesk, Render, DigitalOcean App Platform, or custom VPS).

---

## 1. Core Production Environment Variables

| Variable | Purpose | Required? | Example / Format | Where Used in Codebase |
|---|---|:---:|---|---|
| `NODE_ENV` | Sets production runtime mode for Next.js optimizations | **REQUIRED** | `production` | Next.js runtime, build scripts, middleware |
| `PORT` | Local port for Node.js process to bind | **REQUIRED** | `3000` | Server startup, reverse proxy upstream |
| `MONGODB_URI` | Production MongoDB Atlas connection string with replica set & auth | **REQUIRED** | `mongodb+srv://<user>:<password>@cluster0.9rxjj.mongodb.net/lmsca?retryWrites=true&w=majority` | `config/db.ts`, Mongoose database connection |
| `JWT_SECRET` | Secret key for signing 1-day JWT access tokens | **REQUIRED** | `256-bit+ secure random alphanumeric string` | `helpers/jwt.ts`, `middleware/auth.middleware.ts` |
| `JWT_REFRESH_SECRET` | Secret key for signing 7-day JWT refresh tokens | **REQUIRED** | `256-bit+ secure random alphanumeric string` | `helpers/jwt.ts`, `services/auth.service.ts` |
| `NEXT_PUBLIC_APP_URL` | Authoritative public domain URL of the deployed Next.js LMS | **REQUIRED** | `https://lms.truelern.com` (no trailing slash) | `app/api/calendar/ics/route.ts`, public links, callbacks |
| `PUBLIC_WEB_ORIGINS` | Comma-separated list of authorized CORS origins | **REQUIRED** | `https://truelern.com,https://lms.truelern.com` | `middleware/cors.middleware.ts` |

---

## 2. Live Class & Self-Hosted Jitsi Meet Variables

| Variable | Purpose | Required? | Example / Format | Where Used in Codebase |
|---|---|:---:|---|---|
| `JITSI_DOMAIN` | Hostname of the Jitsi Meet server instance | **REQUIRED** | `meet.truelern.com` or `localhost:8443` | `lib/jitsi/token.ts`, `app/api/live-classes/[id]/token/route.ts` |
| `JITSI_SERVER_URL` | Full HTTPS URL of the Jitsi Meet server | **REQUIRED** | `https://meet.truelern.com` | `lib/jitsi/token.ts` |
| `JITSI_APP_ID` | Application ID configured in Prosody JWT auth module | **REQUIRED** | `truelern-lms` | `lib/jitsi/token.ts`, `docker/jitsi/.env` |
| `JITSI_APP_SECRET` | Shared secret key for signing Jitsi classroom JWT tokens | **REQUIRED** | `secure_jitsi_jwt_secret_key` | `lib/jitsi/token.ts`, `docker/jitsi/.env` |
| `RECORDINGS_STORAGE_PATH` | Server filesystem path for storing recorded lecture MP4s | Optional | `/var/www/lmsca/storage/recordings` or `./storage/recordings` | `app/api/recordings/[id]/stream/route.ts` |

---

## 3. Deferred / Third-Party Provider Variables (Intentionally Not Required in Phase 1)

| Variable | Provider | Status | Notes |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Payments | **DEFERRED** | Core invoices/receipts work provider-neutrally. |
| `SMTP_HOST`, `SMTP_PASS` | External Mailer | **DEFERRED** | In-app notification queue handles all alerts locally. |
| `TWILIO_ACCOUNT_SID` | SMS / WhatsApp | **DEFERRED** | Notification engine runs provider-neutrally. |
| `AWS_S3_BUCKET` | AWS Cloud Storage | **DEFERRED** | Local/Docker disk storage active for recordings. |

---

## 4. Security & Safety Rules

1. **NEVER** commit `.env` or `.env.production` files containing plain-text passwords into Git.
2. Ensure MongoDB Atlas Network Access has the production server's public IP address whitelisted (or `0.0.0.0/0` with strong database user credentials).
3. Generate high-entropy strings for `JWT_SECRET` and `JWT_REFRESH_SECRET` using `openssl rand -base64 48`.
