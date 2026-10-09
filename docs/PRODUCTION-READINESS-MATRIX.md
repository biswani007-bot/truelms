# Production Readiness Matrix

| Area | Workflow | Root Cause | Files Changed | API | Service | DB Effect | Browser Test | Automation | Email | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Authentication | Fresh Google login works first time | Serialized role missing | `api/auth/callback/google/route.ts` | `/api/auth/callback/google` | `AuthService` | Parent created | PASS | N/A | N/A | PASS |
| Authentication | Correct Parent role/session immediately | See above | See above | `/api/auth/me` | `ParentAuth` | Role assigned | PASS | N/A | N/A | PASS |
| Parent AIO | Parent dashboard correct without second login | See above | See above | `/api/parent/status` | `ParentService` | Parent status read | PASS | N/A | N/A | PASS |
| Parent AIO | Parent can add child | Fixed by auth | `api/parent/children/route.ts` | `/api/parent/children` | `ParentService` | Student & Link created | PASS | N/A | N/A | PASS |
| Parent AIO | Parent-child link persists | Fixed by auth | `api/parent/children/route.ts` | `/api/parent/children` | `ParentService` | ParentStudentLink | PASS | N/A | N/A | PASS |
| Admin CRM | Admin sees parent/child | N/A | N/A | `/api/admin/parents` | `ParentService` | N/A | NOT VERIFIED | N/A | N/A | NOT VERIFIED |
| Demo Booking | Parent can schedule demo | `leadSource` enum | `models/lead.model.ts` | `/api/parent/demo` | `ParentService` | Lead & DemoSession | PASS | N/A | N/A | PASS |
| Admin CRM | Admin sees same lead/demo | N/A | N/A | `/api/admin/crm` | `CRMService` | N/A | PASS | N/A | N/A | PASS |
| Demo Booking | Parent sees demo updates | N/A | N/A | `/api/parent/demo` | `ParentService` | N/A | PASS | N/A | N/A | PASS |
| Demo Booking | Demo completion works | N/A | N/A | `/api/admin/crm` | `CRMService` | Lead & DemoSession | PASS | N/A | N/A | PASS |
| Finance | Invoice created correctly | N/A | N/A | `/api/admin/enrollments` | `EnrollmentService` | Invoice & Enrollment | PASS | N/A | N/A | PASS |
| Finance | Payment updates invoice | N/A | N/A | `/api/parent/finance/invoices/[id]/pay` | `FinanceService` | Payment record | PASS | N/A | N/A | PASS |
| Finance | Receipt generated | N/A | N/A | `/api/parent/finance/receipts` | `FinanceService` | Receipt record | PASS | N/A | N/A | PASS |
| Enrollment | Enrollment confirmed | N/A | N/A | `/api/parent/finance/invoices/[id]/pay` | `EnrollmentService` | Enrollment state | PASS | N/A | N/A | PASS |
| Parent AIO | Parent sees active learning state | N/A | N/A | `/api/parent/dashboard` | `ParentService` | N/A | PASS | N/A | N/A | PASS |
| Admin | Admin-created course detail works | API wrapper signature | `api/courses/[id]/route.ts` | `/api/courses/[id]` | `CourseService` | N/A | NOT VERIFIED | N/A | N/A | NOT VERIFIED |
| Admin | Admin batch/cohort relationships work | N/A | N/A | N/A | N/A | N/A | NOT VERIFIED | N/A | N/A | NOT VERIFIED |
| Teacher | Teacher sees assigned batch | N/A | N/A | `/api/teacher/batches` | `TeacherService` | Batch & Cohort | PASS | N/A | N/A | PASS |
| Teacher | Teacher launches live class (Jitsi) | N/A | N/A | `/api/teacher/live-classes` | `TeacherService` | LiveClass & Jitsi | PASS | N/A | N/A | PASS |
| Student | Student (Parent) joins live class (Jitsi) | N/A | N/A | `/api/parent/live-classes` | `ParentService` | Jitsi integration | PASS | N/A | N/A | PASS |
| Security | Cross-parent access blocked | N/A | N/A | N/A | N/A | N/A | NOT VERIFIED | N/A | N/A | NOT VERIFIED |
| Security | Cross-child access blocked | N/A | N/A | N/A | N/A | N/A | NOT VERIFIED | N/A | N/A | NOT VERIFIED |
| Security | Audit logs work where designed | N/A | N/A | N/A | N/A | N/A | NOT VERIFIED | N/A | N/A | NOT VERIFIED |
