# PROJECT
- TrueLern LMS / LMSCA

# DEPLOYMENT MODEL
- Next.js (Version 16.3.5 / React 19.2.4)
- Node.js (Version 20+ LTS recommended)
- npm
- aaPanel (Node.js Project Manager / PM2)

# BUILD & RUN COMMANDS
- Build command: npm ci && npm run build
- Start command: npm start (or next start, port 3000)

# NODE VERSION
- Node.js 20.x or 22.x LTS (compatible with React 19 / Next.js 16)

# PORT
- Port: 3000 (configurable via PORT environment variable)
- aaPanel: Node project runs on port 3000; domain reverse proxy routes 80/443 -> 127.0.0.1:3000.

# ENVIRONMENT
Configure these environment variables in aaPanel Node project settings or in a secure production .env:
- NODE_ENV=production
- PORT=3000
- NEXT_PUBLIC_APP_URL=https://<your-domain>
- NEXT_PUBLIC_APP_VERSION=1.0.0
- MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lmsca?retryWrites=true&w=majority
- JWT_SECRET=<high-entropy-64-char-secret>
- JWT_REFRESH_SECRET=<high-entropy-64-char-secret>
- CRON_SECRET=<high-entropy-secret>
- PUBLIC_WEB_ORIGINS=https://<your-domain>
- JITSI_APP_ID=truelern-lms
- JITSI_APP_SECRET=<jitsi-jwt-secret>
- JITSI_DOMAIN=<jitsi-domain>
- JITSI_SERVER_URL=https://<jitsi-domain>
- RECORDINGS_STORAGE_PATH=/www/wwwroot/<jitsi-domain>/recordings
- BREVO_API_KEY=<brevo-api-key>
- BREVO_FROM_EMAIL=<verified-sender-email>
- BREVO_FROM_NAME="TrueLern"

# DEPLOYMENT STEPS
1. Upload `TrueLern_LMS_AAPanel_Deploy_20261007_1818.zip` to aaPanel (e.g., `/www/wwwroot/`).
2. Extract the archive.
3. Enter the project root directory (`TrueLern_LMS_AAPanel_Deploy_20261007_1818`).
4. In aaPanel Node.js Project Manager:
   - Node Version: Select Node 20.x+
   - Run Opt: npm
   - Run Command: start
   - Port: 3000
5. Set the required production environment variables.
6. Run the build in terminal or aaPanel execution panel:
   npm ci
   npm run build
7. Start/restart the Node application service.
8. Configure aaPanel Reverse Proxy for the domain (target: `http://127.0.0.1:3000`).
9. Enable SSL certificate (Let's Encrypt / custom cert).
10. Verify HTTPS production URL.

# ROLLBACK
- Keep a backup of the previous release directory (e.g. `/www/wwwroot/truelern_previous`).
- If issues occur, switch the aaPanel Node project path back to the previous release folder.
- Restart the Node application service in aaPanel.

# HEALTH CHECK
- Health URL: https://<your-domain>/ or https://<your-domain>/api/public/lead
- Expected response: HTTP 200 OK.
