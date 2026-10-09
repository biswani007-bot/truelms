# TrueLern Mobile API — Role & Permission Matrix

This document provides the authoritative role-based access control (RBAC) matrix for the TrueLern Mobile API. It is derived directly from the backend implementation in [auth.middleware.ts](file:///e:/Lmsca/lmsca/middleware/auth.middleware.ts), [parent-auth.ts](file:///e:/Lmsca/lmsca/lib/auth/parent-auth.ts), and each individual route file.

---

## 1. Role Legend

| Role Identifier | Description | Mobile Primary User Type |
|---|---|---|
| **Public** | Unauthenticated public internet traffic | Lead / Prospective Learner |
| **Student** | Enrolled learner in active cohorts | Student Mobile App |
| **Parent** | Guardian with verified `ParentStudentLink` | Parent Mobile App |
| **Teacher** | Assigned faculty instructor or mentor | Faculty Mobile App |
| **Admin** | Administrator / Super Admin / Academic Manager | Staff / Supervisor App |

---

## 2. Complete Endpoint Role Matrix

| Endpoint | Method | Public | Student | Parent | Teacher | Admin | Authorization Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| **01 - Public** | | | | | | | |
| `/api/public/lead` | POST | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public / No Auth |
| `/api/public/courses` | GET | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public / No Auth |
| `/api/public/categories` | GET | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public / No Auth |
| `/api/v1/public/portal-config` | GET | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public / No Auth |
| `/api/public/search` | GET | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public / No Auth |
| **02 - Authentication** | | | | | | | |
| `/api/auth/login` | POST | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public (Issues JWT) |
| `/api/auth/refresh` | POST | ❌ (Token Req) | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Refresh Token verification |
| `/api/auth/logout` | POST | ❌ Denied | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | `withAuth` |
| `/api/auth/handoff` | GET | ✅ Allowed | ✅ Allowed | ❌ Denied | ❌ Denied | ❌ Denied | Single-use Checkout Token |
| `/api/auth/change-password` | POST | ❌ Denied | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | `withAuth` |
| `/api/auth/forgot-password` | POST | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public |
| `/api/auth/reset-password` | POST | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Reset Token verification |
| **03 - Student** | | | | | | | |
| `/api/students` | GET | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Allowed | `withRoles(["Admin", "Super Admin", "Academic Manager", "Counsellor"])` |
| `/api/students/:id` | GET | ❌ Denied | ✅ Own Profile | ❌ Denied | ❌ Denied | ✅ Allowed | `withRoles` + ownership check |
| `/api/students/:id/timeline` | GET | ❌ Denied | ✅ Own Profile | ❌ Denied | ❌ Denied | ✅ Allowed | `withRoles` + ownership check |
| **04 - Parent (ParentStudentLink Guard)** | | | | | | | |
| `/api/parent/children` | GET | ❌ Denied | ❌ Denied | ✅ Allowed | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` |
| `/api/parent/children/:id/dashboard` | GET | ❌ Denied | ❌ Denied | ✅ Linked Ward Only | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` + `ParentStudentLink` |
| `/api/parent/children/:id/attendance` | GET | ❌ Denied | ❌ Denied | ✅ Linked Ward Only | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` + `ParentStudentLink` |
| `/api/parent/children/:id/academics` | GET | ❌ Denied | ❌ Denied | ✅ Linked Ward Only | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` + `ParentStudentLink` |
| `/api/parent/children/:id/assignments` | GET | ❌ Denied | ❌ Denied | ✅ Linked Ward Only | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` + `ParentStudentLink` |
| `/api/parent/children/:id/assessments` | GET | ❌ Denied | ❌ Denied | ✅ Linked Ward Only | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` + `ParentStudentLink` |
| `/api/parent/children/:id/live-classes` | GET | ❌ Denied | ❌ Denied | ✅ Linked Ward Only | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` + `ParentStudentLink` |
| `/api/parent/children/:id/recordings` | GET | ❌ Denied | ❌ Denied | ✅ Linked Ward Only | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` + `ParentStudentLink` |
| `/api/parent/children/:id/finance` | GET | ❌ Denied | ❌ Denied | ✅ Linked Ward Only | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` + `ParentStudentLink` |
| `/api/parent/notifications` | GET | ❌ Denied | ❌ Denied | ✅ Allowed | ❌ Denied | ✅ Allowed | `getAuthenticatedParent` |
| **05 - Faculty / Teacher** | | | | | | | |
| `/api/teachers` | GET | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Allowed | `withRoles(["Admin", "Super Admin", "Academic Manager"])` |
| `/api/teachers/:id` | GET | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Own Profile | ✅ Allowed | `withRoles` |
| `/api/teachers/:id/availability` | GET / POST | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Own Profile | ✅ Allowed | `withRoles` |
| **06 - Courses** | | | | | | | |
| `/api/courses` | GET | ❌ Denied | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | `withRoles` |
| `/api/courses/:id` | GET | ❌ Denied | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | `withRoles` |
| `/api/courses/:id/curriculum` | GET | ❌ Denied | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | `withRoles` |
| **07 - Enrollments & Batches** | | | | | | | |
| `/api/enrollments` | GET | ❌ Denied | ✅ Own | ❌ Denied | ❌ Denied | ✅ Allowed | `withRoles` |
| `/api/batches` | GET | ❌ Denied | ✅ Enrolled | ❌ Denied | ✅ Assigned | ✅ Allowed | `withRoles` |
| `/api/batches/:id` | GET | ❌ Denied | ✅ Enrolled | ❌ Denied | ✅ Assigned | ✅ Allowed | `withRoles` |
| **08 - Live Classes & Jitsi Token** | | | | | | | |
| `/api/live-classes` | GET | ❌ Denied | ✅ Enrolled | ❌ Denied | ✅ Assigned | ✅ Allowed | `withRoles` |
| `/api/live-classes/:id` | GET | ❌ Denied | ✅ Enrolled | ❌ Denied | ✅ Assigned | ✅ Allowed | `withRoles` |
| `/api/live-classes/:id/token` | POST | ❌ Denied | ✅ Participant (Enrolled) | ❌ Denied | ✅ Moderator (Assigned) | ✅ Moderator (Admin) | Custom Jitsi Token Verifier |
| `/api/live-classes/:id/announcements` | GET | ❌ Denied | ✅ Enrolled | ❌ Denied | ✅ Assigned | ✅ Allowed | `withRoles` |
| `/api/live-classes/:id/resources` | GET | ❌ Denied | ✅ Enrolled | ❌ Denied | ✅ Assigned | ✅ Allowed | `withRoles` |
| **09 - Recordings & Video Streaming** | | | | | | | |
| `/api/recordings/:id/stream` | GET | ❌ Denied | ✅ Enrolled Cohort | ✅ Enrolled Ward | ✅ Assigned Teacher | ✅ Admin | Custom Stream Auth + HTTP Range 206 |
| `/api/live-classes/:id/recordings` | GET | ❌ Denied | ✅ Enrolled | ❌ Denied | ✅ Assigned | ✅ Allowed | `withRoles` |
| **10 - Attendance** | | | | | | | |
| `/api/attendance` | GET | ❌ Denied | ✅ Own Records | ❌ Denied | ✅ Batch Records | ✅ Allowed | `withRoles` |
| `/api/attendance/summary` | GET | ❌ Denied | ✅ Own Summary | ❌ Denied | ✅ Batch Summary | ✅ Allowed | `withRoles` |
| `/api/attendance` | POST | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Assigned Batch | ✅ Allowed | `withRoles(["Teacher", "Admin"])` |
| **11 - Assignments** | | | | | | | |
| `/api/assignments` | GET | ❌ Denied | ✅ Enrolled Batch | ❌ Denied | ✅ Assigned Batch | ✅ Allowed | `withRoles` |
| `/api/assignments/:id` | GET | ❌ Denied | ✅ Enrolled Batch | ❌ Denied | ✅ Assigned Batch | ✅ Allowed | `withRoles` |
| `/api/assignments/:id/submit` | POST | ❌ Denied | ✅ Enrolled Student | ❌ Denied | ❌ Denied | ❌ Denied | `withRoles(["Student"])` |
| `/api/assignments/:id/evaluate` | POST | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Assigned Teacher | ✅ Allowed | `withRoles(["Teacher", "Admin"])` |
| **12 - Assessments** | | | | | | | |
| `/api/assessments` | GET | ❌ Denied | ✅ Enrolled Batch | ❌ Denied | ✅ Assigned Batch | ✅ Allowed | `withRoles` |
| `/api/assessments/:id` | GET | ❌ Denied | ✅ Enrolled Batch | ❌ Denied | ✅ Assigned Batch | ✅ Allowed | `withRoles` |
| `/api/assessments/:id/start` | POST | ❌ Denied | ✅ Enrolled Student | ❌ Denied | ❌ Denied | ❌ Denied | `withRoles(["Student"])` |
| `/api/assessments/:id/submit` | POST | ❌ Denied | ✅ Enrolled Student | ❌ Denied | ❌ Denied | ❌ Denied | `withRoles(["Student"])` |
| **13 - Finance** | | | | | | | |
| `/api/finance/invoices` | GET | ❌ Denied | ✅ Own Invoices | ✅ Ward Invoices | ❌ Denied | ✅ Allowed | `withRoles` |
| `/api/finance/invoices/:id` | GET | ❌ Denied | ✅ Own Invoice | ✅ Ward Invoice | ❌ Denied | ✅ Allowed | `withRoles` |
| `/api/finance/payments` | GET | ❌ Denied | ✅ Own Payments | ✅ Ward Payments | ❌ Denied | ✅ Allowed | `withRoles` |
| `/api/finance/receipts` | GET | ❌ Denied | ✅ Own Receipts | ✅ Ward Receipts | ❌ Denied | ✅ Allowed | `withRoles` |
| **14 - Notifications** | | | | | | | |
| `/api/notifications/inbox` | GET / POST | ❌ Denied | ✅ Own Inbox | ✅ Own Inbox | ✅ Own Inbox | ✅ Own Inbox | `withAuth` (Recipient Scoped) |
| `/api/notifications/preferences` | GET / PUT | ❌ Denied | ✅ Own Prefs | ✅ Own Prefs | ✅ Own Prefs | ✅ Own Prefs | `withAuth` (User Scoped) |
| **15 - Calendar** | | | | | | | |
| `/api/calendar/ics` | GET | ❌ Denied | ✅ Own Schedule | ✅ Ward Schedule | ✅ Faculty Schedule | ✅ Admin | `withAuth` |
| **16 - Certificates** | | | | | | | |
| `/api/certificates` | GET | ❌ Denied | ✅ Own | ❌ Denied | ❌ Denied | ✅ Allowed | `withRoles` |
| `/api/certificates/verify` | GET | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public Verification |
| **17 - Admin (Mobile Optional)** | | | | | | | |
| `/api/crm/leads` | GET | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Allowed | `withRoles(["Admin", "Super Admin", "Counsellor"])` |
| `/api/analytics/academic` | GET | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Allowed | `withRoles(["Admin", "Super Admin", "Academic Manager"])` |

---

## 3. Key Security Invariants

1. **Parent Portal Authorization**: All `/api/parent/children/:id/*` endpoints strictly require `Parent.findOne({ user: req.user.userId })` AND `ParentStudentLink.findOne({ parent, student, canAccessPortal: true })`. Passing an arbitrary `studentId` without a verified link returns `403 FORBIDDEN`.
2. **Live Classroom Jitsi Token**: Tokens generated via `/api/live-classes/:id/token` embed the user's role and identity directly in the JWT payload (`isModerator: true` for Teachers/Admins, `isModerator: false` for Students). Enrolled student verification is strictly enforced against `BatchStudent`.
3. **Recording Streaming**: The `/api/recordings/:id/stream` endpoint requires cohort membership validation before serving media or streaming via HTTP 206 Partial Content.
