# TrueLern — Enterprise Live Cohort Academy Platform

Production-grade Next.js enterprise learning management system and live cohort academy platform. TrueLern powers public discovery, admissions, student/parent portals, faculty operations, interactive live classes with self-hosted WebRTC video, automated assessments, and financial administration.

---

## 1. Project Overview

TrueLern operates as an end-to-end digital academy delivering skill-based cohort education for children (Junior Foundation, Ages 6–10; Future-Ready Builders, Ages 9–14). The application architecture unifies:
- **Public & Marketing Funnel**: High-conversion landing, program details, dynamic CAD pricing, lead capture, and free demo booking.
- **Portals**: Dedicated dashboards for Students, Parents, Faculty, and Administrators.
- **Academics & Operations Engine**: 36-session cohorts, batch scheduling, automated attendance, homework evaluation, and milestone tracking.
- **Live Class Video Stack**: Integrated self-hosted Jitsi Meet WebRTC room generation with secure JWT session tokens.
- **Enterprise API Surface**: 212 RESTful API route handlers powering web portals and future native Android mobile applications.

---

## 2. Technology Stack

- **Framework**: Next.js 16.2.10 (App Router, Standalone Server Output)
- **UI Library**: React 19.2.4
- **Language**: TypeScript 5 (Strict Mode, 0 compile errors)
- **Styling**: Tailwind CSS v4, Vanilla CSS design tokens, Glassmorphism UI
- **Animations**: Framer Motion 13 (Optimized with `prefers-reduced-motion` compliance)
- **Database & Modeling**: MongoDB Atlas via Mongoose 8
- **Authentication**: JWT (Access Token + HTTP-Only Refresh Cookie) with Role-Based Access Control (RBAC)
- **API Documentation**: OpenAPI 3.0.0 via `next-swagger-doc` + `swagger-ui-react` at `/docs`
- **Video Conferencing**: Self-hosted Jitsi Meet WebRTC stack with RS256/HS256 JWT tokens

---

## 3. Installation & Setup

### Prerequisites
- Node.js >= 20.x LTS
- npm >= 10.x
- MongoDB Atlas cluster URI

### Setup Steps
```bash
# 1. Clone repository
git clone <repository-url>
cd lmsca

# 2. Configure environment variables
cp .env.example .env.local

# 3. Install dependencies
npm install
```

---

## 4. Environment Variables

Configure required parameters in `.env.local` (local) or `.env` (production server). See `.env.example` for the sanitized template:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` or `development` |
| `PORT` | HTTP port | `3000` |
| `NEXT_PUBLIC_APP_URL` | Canonical application domain | `https://truelern.visital.in` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | High-entropy JWT signing key (64+ chars) | `...` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `...` |
| `CRON_SECRET` | Authentication secret for cron triggers | `...` |
| `JITSI_APP_ID` | Jitsi JWT App ID | `truelern-lms` |
| `JITSI_APP_SECRET` | Jitsi JWT signing secret | `...` |
| `JITSI_DOMAIN` | Video server domain | `livetl.visital.in` |

---

## 5. Local Development

Start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- Public site: `http://localhost:3000/`
- Interactive Swagger UI: `http://localhost:3000/docs`
- Pricing (CAD): `http://localhost:3000/pricing`
- Book Demo: `http://localhost:3000/book-demo`

---

## 6. Production Build & Verification

Validate TypeScript types and build the production bundle:
```bash
# Typecheck
npx tsc --noEmit

# Production build (Generates .next/standalone + copies static assets via postbuild)
npm run build
```

---

## 7. Production Deployment

### Option A: aaPanel / PM2 (Recommended)
1. Deploy the project folder to `/www/wwwroot/truelern.visital.in`.
2. Configure environment variables in aaPanel Node.js project manager.
3. Build or upload the standalone bundle.
4. Set execution start file: `.next/standalone/server.js`.
5. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full commands and Nginx reverse-proxy setup.

### Option B: Standalone Node.js Runner
```bash
node .next/standalone/server.js
```

---

## 8. API Documentation & OpenAPI Specification

- **Interactive Explorer**: Available in the browser at `/docs` (or `https://360api.vnvision.in/docs` in production).
- **OpenAPI 3.0 YAML**: [docs/api/truelern-openapi.yaml](docs/api/truelern-openapi.yaml)
- **OpenAPI 3.0 JSON**: [docs/api/truelern-openapi.json](docs/api/truelern-openapi.json)
- **Dynamic OpenAPI Route**: `GET /api/docs-json`

---

## 9. API Collections (Postman & Bruno)

Pre-built collections are ready for immediate testing and QA:
- **Postman Collection**: [docs/api/TrueLern-API.postman_collection.json](docs/api/TrueLern-API.postman_collection.json)
- **Postman Environment**: [docs/api/TrueLern-API.postman_environment.json](docs/api/TrueLern-API.postman_environment.json)
- **Bruno Collection**: [docs/bruno/](docs/bruno/)

---

## 10. Android Developer Integration Notes

For mobile developers building the TrueLern Android app:
1. **Contract Source**: Import `docs/api/truelern-openapi.yaml` into Android Studio or use OpenAPI Generator for Retrofit 2 data classes and API interfaces.
2. **Authentication**: All user-authenticated requests require an `Authorization: Bearer <accessToken>` header.
3. **Token Refresh**: Intercept `401 Unauthorized` responses and trigger `POST /api/auth/refresh` to renew tokens transparently.
4. **Detailed Mobile Specs**: Read [docs/api/README.md](docs/api/README.md) and [docs/API_ANDROID_READINESS.md](docs/API_ANDROID_READINESS.md).
