# TrueLern Mobile API Collection — Comprehensive Documentation

## 1. Overview & Architecture

The **TrueLern Mobile API** provides a complete, unified REST API surface designed for mobile client applications:
- **TrueLern Student Mobile App** (Learner portal)
- **TrueLern Parent Mobile App** (Multi-ward guardian portal)
- **TrueLern Faculty Mobile App** (Instructor live classroom & grading)
- **TrueLern Admin Mobile App** (Executive monitoring & supervisor actions)

### Technology & Architecture Standards
- **Server Framework**: Next.js App Router API Routes (`app/api/**`)
- **Database**: MongoDB Atlas via Mongoose ODM
- **Authentication**: JWT Access Token (1-day lifetime) + Refresh Token (7-day lifetime)
- **Authorization**: Role-Based Access Control (RBAC) via `withRoles()`, `withAuth()`, and specialized guards such as `getAuthenticatedParent` and `ParentStudentLink`
- **Response Format**: Strict standardized envelope via `ApiResponse<T>`:
  ```json
  {
    "success": true,
    "message": "Operation description",
    "data": { ... },
    "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
  }
  ```

---

## 2. Authentication & Header Specifications

### Standard Request Headers
```http
Authorization: Bearer <accessToken>
Content-Type: application/json
Accept: application/json
```

### Response Headers
All API responses include trace diagnostics:
- `x-request-id`: UUID trace identifier for request auditing

---

## 3. Postman & Bruno Collections

The collection is provided in two standard formats in the repository:
1. **Postman Collection**: [docs/postman/TrueLern-Mobile-API.postman_collection.json](file:///e:/Lmsca/lmsca/docs/postman/TrueLern-Mobile-API.postman_collection.json)
2. **Postman Environment**: [docs/postman/TrueLern-Mobile-Local.postman_environment.json](file:///e:/Lmsca/lmsca/docs/postman/TrueLern-Mobile-Local.postman_environment.json)
3. **Bruno Collection**: [docs/bruno/](file:///e:/Lmsca/lmsca/docs/bruno/)

### Environment Variables
| Variable | Description | Example / Default |
|---|---|---|
| `baseUrl` | Server root URL | `http://localhost:3000` |
| `mobileBaseUrl` | API base path | `http://localhost:3000/api` |
| `accessToken` | Active JWT access token | Stored automatically upon login |
| `refreshToken` | Active refresh token | Stored automatically upon login |
| `studentToken` | Student user session token | Generated from Student Login |
| `parentToken` | Parent user session token | Generated from Parent Login |
| `teacherToken` | Faculty user session token | Generated from Teacher Login |
| `adminToken` | Administrator session token | Generated from Admin Login |
| `childStudentId` | ID of selected linked child | Stored from `GET /api/parent/children` |
| `liveClassId` | ID of live classroom session | Retrieved from `/api/live-classes` |
| `recordingId` | ID of lecture recording | Retrieved from `/api/live-classes/:id/recordings` |

---

## 4. API Module Breakdown

### 01 - Public
- `POST /api/public/lead` — Submits marketing leads and demo booking requests.
- `GET /api/public/courses` — Public course catalog.
- `GET /api/public/categories` — Course categories for navigation.
- `GET /api/v1/public/portal-config` — App bootstrap, feature flags, maintenance message, version check.
- `GET /api/public/search` — Catalog search.

### 02 - Authentication
- `POST /api/auth/login` — Issues access and refresh tokens.
- `POST /api/auth/refresh` — Silent token rotation.
- `POST /api/auth/logout` — Invalidation of server-side session.
- `GET /api/auth/handoff` — Single-use verification of checkout token.
- `POST /api/auth/change-password` — Password update with session revocation.
- `POST /api/auth/forgot-password` — Password reset trigger.
- `POST /api/auth/reset-password` — Token-based password reset.

### 03 - Student
- `GET /api/students` — Paginated student directory (Admin/Supervisor).
- `GET /api/students/:id` — Student profile detail (Accessible by student or admin).
- `GET /api/students/:id/timeline` — Student history timeline.

### 04 - Parent (Strict ParentStudentLink Guard)
- `GET /api/parent/children` — Returns list of verified linked wards.
- `GET /api/parent/children/:id/dashboard` — Aggregated metrics (attendance %, live classes, assignments, fee status).
- `GET /api/parent/children/:id/attendance` — Session-by-session attendance log.
- `GET /api/parent/children/:id/academics` — Enrolled courses and syllabus breakdown.
- `GET /api/parent/children/:id/assignments` — Homework submissions, marks, teacher feedback.
- `GET /api/parent/children/:id/assessments` — Assessment scores (sanitized; questions stripped).
- `GET /api/parent/children/:id/live-classes` — Live classroom schedule for child's batch.
- `GET /api/parent/children/:id/recordings` — Classroom revision recordings.
- `GET /api/parent/children/:id/finance` — Invoices, payments, and balance due.
- `GET /api/parent/notifications` — Notification feed targeted to parent.

### 05 - Faculty
- `GET /api/teachers` — Faculty roster.
- `GET /api/teachers/:id` — Teacher profile & subjects.
- `GET /api/teachers/:id/availability` — Teaching schedule and availability hours.
- `POST /api/teachers/:id/availability` — Update teaching availability.

### 06 - Courses
- `GET /api/courses` — Course list with pagination and search.
- `GET /api/courses/:id` — Full course details and prerequisites.
- `GET /api/courses/:id/curriculum` — Structured modules, topics, and lessons.

### 07 - Enrollments & Batches
- `GET /api/enrollments` — Student enrollment records.
- `GET /api/batches` — Cohort batch roster and capacity.
- `GET /api/batches/:id` — Batch detail, instructor, and student list.

### 08 - Live Classes (HIGH PRIORITY)
- `GET /api/live-classes` — Scheduled live class sessions.
- `GET /api/live-classes/:id` — Class session detail.
- `POST /api/live-classes/:id/token` — **Jitsi Meet JWT room token generation**. Grants `isModerator: true` to assigned Faculty/Admins, and participant status to enrolled Students.
- `GET /api/live-classes/:id/announcements` — In-class announcements.
- `GET /api/live-classes/:id/resources` — PDF attachments and lesson assets.

### 09 - Recordings & Video Streaming
- `GET /api/recordings/:id/stream` — **HTTP Range 206 Partial Content video streaming** for mobile media players. Requires verified cohort membership.
- `GET /api/live-classes/:id/recordings` — Recording metadata for completed sessions.

### 10 - Attendance
- `GET /api/attendance` — Attendance records with filters (`student`, `batch`, `liveClass`).
- `GET /api/attendance/summary` — Calculated summary (total, present, absent, late, percentage).
- `POST /api/attendance` — Faculty/Admin mark individual attendance.

### 11 - Assignments
- `GET /api/assignments` — Published homework assignments.
- `GET /api/assignments/:id` — Assignment instructions, rubric, due date.
- `POST /api/assignments/:id/submit` — Student text and attachment URL submission.
- `POST /api/assignments/:id/evaluate` — Teacher grading and feedback.

### 12 - Assessments
- `GET /api/assessments` — Quizzes and exams.
- `GET /api/assessments/:id` — Assessment details (duration, passing marks).
- `POST /api/assessments/:id/start` — Start timed assessment attempt.
- `POST /api/assessments/:id/submit` — Submit answers for grading.

### 13 - Finance
- `GET /api/finance/invoices` — Tuition invoices and fee statements.
- `GET /api/finance/invoices/:id` — Invoice breakdown and balance due.
- `GET /api/finance/payments` — Payment history.
- `GET /api/finance/receipts` — Official receipt records.

### 14 - Notifications
- `GET /api/notifications/inbox` — In-app notification feed.
- `POST /api/notifications/inbox` — Mark as read (`{ "action": "read" }`) or archive (`{ "action": "archive" }`).
- `GET /api/notifications/preferences` — User alert preferences.

### 15 - Calendar
- `GET /api/calendar/ics` — Standard iCalendar (.ics) feed stream for mobile native calendar sync.

### 16 - Certificates
- `GET /api/certificates` — Course completion certificates.
- `GET /api/certificates/verify` — Public certificate credential validation.

### 17 - Admin (Mobile Optional)
- `GET /api/crm/leads` — Live admissions pipeline monitor.
- `GET /api/analytics/academic` — High-level cohort health and attendance metrics.

---

## 5. Error Model & HTTP Status Codes

| Code | Meaning | Example Scenario |
|---|---|---|
| `200` | OK | Successful GET/PUT/PATCH or operational POST |
| `201` | Created | Successful entity creation (e.g., Book Demo lead) |
| `206` | Partial Content | Video streaming byte range chunk |
| `400` | Bad Request | Validation error or invalid payload |
| `401` | Unauthorized | Missing, expired, or invalid JWT token |
| `403` | Forbidden | Insufficient role or unauthorized Parent-Child link |
| `404` | Not Found | Resource does not exist |
| `429` | Rate Limited | Rate limit exceeded |
| `500` | Server Error | Internal backend exception |
