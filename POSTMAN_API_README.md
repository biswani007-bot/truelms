# TrueLern / LMSCA — Postman Collection & API Documentation

This directory contains the synchronized Postman collection and environments reflecting the actual Next.js backend API routes (`app/api/**`).

---

## 1. Collection Files

- **`TrueLern_Postman_Collection.json`**: Complete Postman Collection (v2.1.0 format) covering 422 API requests organized into 21 functional modules, plus dedicated Child-Isolation and Security suites.
- **`TrueLern_Local.postman_environment.json`**: Local development environment configured for `http://localhost:3030`.
- **`TrueLern_Production.postman_environment.json`**: Production environment configured for `https://truelern.visital.in`.

### v2.1.0 Course-Aware Demo Scheduling Updates (2026-10-07)
- **NEW:** `GET /api/parent/demo/courses` — Loads published Course records for parent demo course selection.
- **NEW:** `GET /api/crm/demos/smart-schedule` — Admin smart scheduling resolving eligible teachers and conflict-free slots.
- **NEW:** `POST /api/crm/demos/schedule-for-child` — Admin schedules demo session with course, teacher, email dispatch, and lead sync.
- **NEW:** `POST /api/parent/demo/[id]/child-token` — Child-scoped Jitsi demo participant token for authorized parent.
- **NEW:** `POST /api/teacher/demo/[id]/token` — Teacher-scoped Jitsi token with T-15 window guard.
- **UPDATED:** `GET /api/parent/demo/availability` — Added `courseId={{courseId}}` query support with legacy program fallback.
- **NEW VARIABLES:** `demoScheduledStart`, `demoScheduledEnd`, `demoDurationMinutes`.

---

## 2. Authentication Flow

TrueLern supports dual-mode authentication via edge middleware (`proxy.ts`) and API auth helper (`getAuthenticatedUser` / `getAuthenticatedParent` / `getAuthenticatedStudent` / `getAuthenticatedTeacher`):
1. **Bearer Authorization Header:** `Authorization: Bearer <accessToken>`
2. **HttpOnly Cookie:** `accessToken=<accessToken>; refreshToken=<refreshToken>`

### Login Steps
1. Execute `[POST] /api/auth/login` under **01 Authentication**.
2. The automated Postman test script captures `accessToken`, `refreshToken`, and `userId` directly into the active environment.
3. Subsequent requests automatically pass `{accessToken}` in the headers and cookies.

---

## 3. Module Hierarchy

```text
01 Authentication                 — User login, refresh token, password reset, OAuth, sessions
02 Parent                         — Multi-child profile, child-scoped academics, attendance, finance, demo
03 Student                        — Student directory, timeline, student profiles, documents
04 Teacher                        — Faculty batches, messages, teacher directory, availability
05 Admin                          — User roles, system configurations, admin dashboard, analytics
06 Courses                        — Course catalog, public courses, categories, modules
07 Batches / Cohorts              — Cohort schedules, students, teachers, timelines
08 Enrollments                    — Student admissions, checklist, public checkout
09 Demo / CRM                     — Demo availability, atomic booking, lead pipeline, follow-ups
10 Live Classes                   — Sessions, Jitsi tokens, participant heartbeats, recordings
11 Attendance                     — Attendance logs, daily tracking, regularization
12 Assignments                    — Creation, evaluation, student submissions, soft-delete
13 Assessments                    — Quizzes, evaluations, questions, rubrics, results
14 Academic Progress              — Schedule-based Course Progress (Student & Parent child-scoped)
15 Messaging / Communication      — Parent-teacher conversation threads, read indicators
16 Notifications                  — Notification queue, inbox, preference settings, templates
17 Finance / Invoices / Receipts  — Invoices, fee plans, installments, payment receipts, refunds
18 Certificates                   — Certificate verification, issuance, eligibility, templates
19 Media / Uploads                — Secure file uploads, attachment retrieval
20 Profile / Settings             — User profile management, global app settings
21 Health / Utility / Other       — System health, docs-json, workflows, gateway logs
Parent → Child Isolation Tests    — Multi-child data leakage and child-context switching verification
Critical Security & Negative Tests— 401 unauthenticated, 403 role-guard, 404/400 validation, IDOR tests
_DEPRECATED                       — Retired/superseded endpoints marked with migration rationale
```

---

## 4. Parent → Child Isolation Tests

Multi-child isolation is strictly enforced across all parent endpoints:
- Child selection uses the route format `/api/parent/children/:studentId/...` or `?studentId={studentId}`.
- The **Parent → Child Isolation Tests** folder executes:
  1. Fetch Child A dashboard (`{studentAId}`)
  2. Verify response contains Student A data only (no bleed of Student B)
  3. Fetch Child A progress (`/api/parent/children/{studentAId}/progress`)
  4. Fetch Child A assignments (`/api/parent/children/{studentAId}/assignments`)
  5. Fetch Child A attendance (`/api/parent/children/{studentAId}/attendance`)
  6. Switch active child to Student B (`{studentBId}`)
  7. Verify response switches completely without caching Student A data
  8. Verify demo booking scoping (`/api/parent/demo?studentId={studentAId}`)

---

## 5. Academic Progress Architecture

The progress computation is powered by `ProgressService.getStudentCourseProgressDetail`:
- Computes schedule-based completion by evaluating completed live-class sessions against total scheduled classes.
- Used in both Student Portal (`GET /api/student/courses/:id/progress`) and Parent Portal (`GET /api/parent/children/:id/progress`).

---

## 6. Deprecated / Superseded Endpoints

Located in `_DEPRECATED`:
- `GET /api/parent/progress`: Replaced by child-scoped `/api/parent/children/:id/progress`.
- `GET /api/parent/assignments`: Replaced by child-scoped `/api/parent/children/:id/assignments`.
- `GET /api/parent/attendance`: Replaced by child-scoped `/api/parent/children/:id/attendance`.
