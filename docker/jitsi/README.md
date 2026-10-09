# TrueLern Jitsi Production Deployment

This archive contains the standalone production Jitsi infrastructure for TrueLern live classes.

## Prerequisites
- Docker & Docker Compose
- Network Exposure:
  - `80/tcp` (Web UI/HTTP Proxy)
  - `443/tcp` (HTTPS Proxy)
  - `10000/udp` (JVB Media)
- Authoritative Domain: `livetl.visital.in`

## Deployment Steps
1. Extract this archive into a dedicated deployment directory (e.g. `/www/wwwroot/livetl.visital.in`).
2. Copy `.env.example` to `.env`.
3. Open `.env` and fill in all placeholders marked with `<CHANGE_ME...>`, especially the `JWT_APP_SECRET`. **This secret must match the Next.js LMS configuration exactly.**
4. Start the stack:
   ```bash
   docker compose up -d
   ```
5. Verify services are running:
   ```bash
   docker compose ps
   ```

## Note on Recordings
Recordings are saved to the `./recordings` directory mounted in the `jibri` container. Ensure this directory has appropriate write permissions.
