# TrueLern API Documentation & Android Integration Guide

This directory contains the production API contracts, OpenAPI specifications, and Postman collections for TrueLern. It serves as the primary technical interface for frontend clients and future Android/iOS mobile application development.

---

## 1. Overview & Base URLs

TrueLern exposes a RESTful JSON backend running on Next.js 16 (App Router) backed by MongoDB Atlas.

| Environment | Base URL | Description |
| :--- | :--- | :--- |
| **Production** | `https://360api.vnvision.in` | Live production cluster (managed on aaPanel/PM2) |
| **Local Development** | `http://localhost:3000` | Local developer instance |
| **Swagger UI** | `https://360api.vnvision.in/docs` | Interactive API Explorer |
| **OpenAPI Spec (JSON)** | `https://360api.vnvision.in/api/docs-json` | Live OpenAPI 3.0 schema |

---

## 2. Directory Contents

- **`truelern-openapi.yaml`**: Full OpenAPI 3.0.0 specification in YAML format. Can be imported directly into Android Studio, Swagger Editor, or Retrofit generators (`openapi-generator-cli`).
- **`truelern-openapi.json`**: Full OpenAPI 3.0.0 specification in JSON format.
- **`TrueLern-API.postman_collection.json`**: Complete Postman collection containing all 212 endpoints grouped into 20 modules with request bodies and test scripts.
- **`TrueLern-API.postman_environment.json`**: Pre-configured environment variables for Postman (`baseUrl`, `accessToken`, `refreshToken`, `studentToken`, etc.).

---

## 3. Authentication & Session Flow

### Header Specification
Protected endpoints require an HTTP `Authorization` header formatted as:
```http
Authorization: Bearer <accessToken>
```

### Authentication Lifecycle
1. **Login (`POST /api/auth/login`)**:
   - Accepts `{ email, password, role }`
   - Returns user profile, permissions, `accessToken` (JWT), and HTTP-only refresh cookie.
2. **Token Refresh (`POST /api/auth/refresh`)**:
   - Exchanges refresh token for a newly issued access token.
3. **Logout (`POST /api/auth/logout`)**:
   - Invalidates session cookies and revokes refresh tokens.

---

## 4. Standard Response Formats

All API responses follow a consistent envelope structure:

### Success Response (`200 OK` or `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`)
```json
{
  "success": false,
  "error": "Validation failed or resource not found",
  "code": "VALIDATION_ERROR",
  "details": []
}
```

---

## 5. Modules Inventory (212 Endpoints)

1. **Public Catalog & Inquiries** (`/api/public/*`):
   - Categories, Courses, Events, Lead/Demo Booking, Newsletter subscription.
2. **Authentication & RBAC** (`/api/auth/*`):
   - Login, Logout, Refresh, Forgot Password, Reset Password, Handoff.
3. **Student Portal** (`/api/students/*`):
   - Dashboard, enrolled courses, timeline, attendance history.
4. **Parent Portal** (`/api/parent/*`):
   - Children academic progress, live class schedules, reports, invoices.
5. **Faculty & Coaching** (`/api/teachers/*`):
   - Cohort batches, availability, leaves, teaching logs.
6. **Cohorts & Batches** (`/api/cohorts/*`, `/api/batches/*`):
   - Batch allocation, student transfers, capacity management.
7. **Live Classes & Video Stack** (`/api/live-classes/*`):
   - Scheduling, attendance freeze, Jitsi Meet tokens, recording streams.
8. **Finance & Invoicing** (`/api/finance/*`):
   - Fee plans, invoices, receipts, payments, refunds.
9. **CRM & Lead Management** (`/api/crm/*`):
   - Pipeline tracking, lead status, followups, tasks.
10. **Reports & Analytics** (`/api/reports/*`):
    - Exporting, snapshot generation, scheduled reports.
11. **Notifications** (`/api/notifications/*`):
    - Inbox, queue, templates, delivery logs.
12. **Certificates** (`/api/certificates/*`):
    - Verification, issuance, PDF generation, approval workflows.
13. **Workflows & Automation** (`/api/workflows/*`):
    - Trigger execution, pause, template configuration.
14. **API Gateway** (`/api/gateway/*`):
    - API keys, client rotation, audit logs, webhooks.

---

## 6. Android Developer Integration Notes

### Retrofit 2 / OkHttp Setup Example
```kotlin
interface TrueLernApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginData>>

    @GET("api/parent/children/{id}/dashboard")
    suspend fun getParentChildDashboard(
        @Header("Authorization") token: String,
        @Path("id") childId: String
    ): Response<ApiResponse<ParentDashboardData>>

    @POST("api/public/lead")
    suspend fun submitLead(@Body request: LeadRequest): Response<ApiResponse<LeadResponse>>
}
```

### Automatic Token Interceptor
Android developers should implement an OkHttp `Interceptor` to automatically inject the Bearer token and handle `401 Unauthorized` token renewal via `/api/auth/refresh`.
