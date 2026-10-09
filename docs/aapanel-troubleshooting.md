# TrueLern / LMSCA — aaPanel Troubleshooting Guide

This guide covers common issues and resolutions when deploying TrueLern on aaPanel.

---

## 1. 502 Bad Gateway
- **Cause**: Next.js process is not running on port 3000 or crashed on startup.
- **Diagnostics**:
  ```bash
  pm2 status
  pm2 logs truelern-lms --lines 50
  netstat -tlpn | grep 3000
  ```
- **Fix**: Check `.env` for invalid syntax or missing `MONGODB_URI` / `JWT_SECRET`. Run `npm run start` manually in the directory to inspect startup error.

---

## 2. MongoDB Atlas Connection Timeout / Auth Failed
- **Cause**: Server IP address is not whitelisted in MongoDB Atlas Network Access.
- **Diagnostics**: Run `node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(console.error)"`
- **Fix**: Open MongoDB Atlas → **Security** → **Network Access** → Add your aaPanel server's Public IP (or `0.0.0.0/0`).

---

## 3. Build Failure during `npm run build`
- **Cause**: Memory exhaustion on smaller VPS or incompatible Node version.
- **Diagnostics**: Check swap space with `free -m`.
- **Fix**:
  - Add 2GB–4GB Swap file via aaPanel **Linux Tools** plugin.
  - Ensure Node version is `v20.x LTS` or `v22.x LTS`.

---

## 4. Jitsi Live Class Room Connection Issues
- **Cause**: `JITSI_APP_ID`, `JITSI_APP_SECRET`, or `JITSI_DOMAIN` mismatch between LMS and Prosody.
- **Diagnostics**: Inspect token route output: `curl -X POST http://localhost:3000/api/live-classes/<id>/token -H "Authorization: Bearer <token>"`.
- **Fix**: Ensure `JITSI_DOMAIN` points to the reachable Jitsi domain (e.g. `live.TrueLern.visital.in`) and `JITSI_APP_SECRET` matches the Prosody JWT secret.

---

## 5. Permission Denied on File / Storage Writes
- **Cause**: Storage directory owned by root rather than `www` user.
- **Fix**:
  ```bash
  chown -R www:www /www/wwwroot/TrueLern.visital.in/storage
  chmod -R 755 /www/wwwroot/TrueLern.visital.in/storage
  ```
