# TrueLern API — Android Readiness Contract

This document provides Android developers with the concrete, validated details required to consume the TrueLern backend API effectively.

## API Base URL
- **Production URL**: `https://360api.vnvision.in/api`
- Note: Endpoints are mapped directly under `/api` (e.g., `/api/auth/login`). Do not prepend an extra `/v1` prefix globally unless the endpoint is specifically under `/api/v1/...` (e.g., `/api/v1/public/portal-config`).

## API Version
The API routes are primarily implicitly versioned at the controller level. However, a specific legacy subset exists under `/api/v1/`. The Swagger documentation reflects the exact paths required.

## Authentication
- **Mechanism**: JWT (JSON Web Token)
- The backend relies heavily on **HttpOnly cookies** for web sessions (`accessToken`, `refreshToken`), but for Android development, tokens will need to be explicitly managed if standard HTTP cookie jars are not used. 
- **Security Scheme**: `BearerAuth` (Standard Authorization header).

## Token Handling
- Upon calling `/api/auth/login`, the response returns the `accessToken` and `refreshToken` directly in the payload, alongside setting them as cookies.
- **Header format**: `Authorization: Bearer <accessToken>`
- Expired tokens will return a `401 Unauthorized`. The app should then hit `/api/auth/refresh` using the refresh token to obtain a new access token.

## Common Response Format
The backend wraps successful responses in a standard envelope:
```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": { ... } // Or an array
}
```

## Common Error Format
Error responses follow a similar structure:
```json
{
  "success": false,
  "message": "Human-readable error description or validation message",
  "data": null
}
```
Validation errors (from Zod) may return specific field-level messages inside the `message` string or an `errors` array, depending on the specific endpoint configuration.

## Pagination
Paginated endpoints generally accept `page` and `limit` via query parameters. 
The standard response includes metadata:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  }
}
```

## File Uploads
File uploads (e.g., for CMS media or profile pictures) use `multipart/form-data`.
- Field names are specific to the endpoint (often `file` or `image`).
- The response returns the uploaded file URL (usually mapped to the `storage/` directory or an S3 bucket).

## Date/Time Format
- **Format**: All timestamps are returned as standard **ISO 8601** strings (e.g., `2026-09-05T10:00:00.000Z`).
- Android clients should parse these into native `Instant` or `ZonedDateTime` objects.

## Important Enums
- Ensure enums match backend definitions strictly (e.g., roles like `STUDENT`, `TEACHER`, `PARENT`, `ADMIN`). The Swagger UI defines these exactly per endpoint.

## HTTP Status Handling
- `200 OK`: Standard success.
- `201 Created`: Resource created.
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Missing or expired token.
- `403 Forbidden`: Insufficient role/permissions.
- `404 Not Found`: Resource does not exist.
- `500 Internal Server Error`: Backend crash.

## Swagger URL
- **Production Documentation**: `https://360api.vnvision.in/docs`
- **Development Documentation**: `http://localhost:3000/docs`

## OpenAPI JSON URL
- **Machine-readable Spec**: `/api/docs-json`

## Android Integration Notes
- Ensure your HTTP client (e.g., Retrofit, Ktor) correctly serializes requests matching the documented Zod schemas.
- Do not append trailing slashes to API requests.
- Pay attention to `path` parameters vs `query` parameters as defined in the Swagger UI.
