# TrueLern — aaPanel Linux Deployment Guide

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js LTS | **20.x** (Minimum 20.19+) |
| npm | 10.x+ |
| OS | Linux x64 (glibc) |
| aaPanel | 7.x or later |

> **Important**: This application uses `@tailwindcss/node` which requires native bindings from `lightningcss-linux-x64-gnu`. Only **Node 20.x LTS** (glibc-based Linux) is tested and supported. Node 22 has **not** been validated.

---

## 1. Upload the Package

Upload `TrueLern-production-final-linux-20260826-v2.zip` to your server and extract it:

```bash
cd /www/wwwroot/TrueLern.visital.in
unzip TrueLern-production-final-linux-20260826-v2.zip
```

---

## 2. Set Up Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in ALL required values:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_strong_secret_here
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_APP_URL=https://TrueLern.visital.in
JITSI_APP_ID=...
JITSI_APP_SECRET=...
```

---

## 3. Install Dependencies

```bash
npm ci
```

This will automatically install the correct platform-native bindings:
- `lightningcss-linux-x64-gnu` (for Tailwind CSS compilation)
- `@tailwindcss/oxide-linux-x64-gnu` (for Tailwind CSS processing)

> **Do NOT use** `npm install --force` or `npm install --legacy-peer-deps`. Use only `npm ci` with the provided `package-lock.json`.

---

## 4. Build the Application

```bash
npm run build
```

Expected output: `✓ Compiled successfully` with route generation.

---

## 5. Start the Application

### Option A: Direct (for testing)

```bash
npm start
```

### Option B: PM2 (recommended for production)

```bash
npm install -g pm2
pm2 start npm --name "truelearn" -- start
pm2 save
pm2 startup
```

---

## 6. Configure aaPanel

In aaPanel → Node.js Projects:
- **Startup File**: `node_modules/.bin/next`
- **Startup Command**: `start`
- **Node Version**: 20.x
- **Port**: 3000 (or your preferred port)

Then set up a reverse proxy in aaPanel → Website → Reverse Proxy:
- **Target**: `http://127.0.0.1:3000`

---

## 7. Verify Deployment

```bash
# Check lightningcss Linux binding is installed
ls node_modules/@tailwindcss/node/node_modules/lightningcss-linux-x64-gnu/

# Check application health
curl http://localhost:3000
```

---

## Troubleshooting

### `Cannot find module lightningcss.linux-x64-gnu.node`

This means `npm ci` did not install the native binding. Run:

```bash
npm ci
```

Ensure you are running Node 20.x on a glibc-based Linux (not Alpine/musl).

### `Module not found: framer-motion`

Run `npm ci` again from the project root.

### Build fails with TypeScript errors

Run `npx tsc --noEmit` and review the output. Most Framer Motion type errors are suppressed with `@ts-nocheck` in client components.

---

## Node Version Check

```bash
node --version  # Must be v20.x.x
npm --version   # Must be 10.x.x
```
