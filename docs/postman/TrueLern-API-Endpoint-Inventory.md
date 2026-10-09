# TrueLern API Endpoint Inventory

| Method | Endpoint | Auth | Role | Path Params | Query Params | Body | Description |
|---|---|---|---|---|---|---|---|
| GET | `/api/admin/cms/analytics` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/analytics/route.ts` |
| GET | `/api/admin/cms/blogs` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/blogs/route.ts` |
| POST | `/api/admin/cms/blogs` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/blogs/route.ts` |
| GET | `/api/admin/cms/blogs/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/blogs/[id]/route.ts` |
| PUT | `/api/admin/cms/blogs/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/blogs/[id]/route.ts` |
| DELETE | `/api/admin/cms/blogs/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/blogs/[id]/route.ts` |
| POST | `/api/admin/cms/blogs/bulk` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/blogs/bulk/route.ts` |
| GET | `/api/admin/cms/media` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/media/route.ts` |
| POST | `/api/admin/cms/media` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/media/route.ts` |
| GET | `/api/admin/cms/media/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/media/[id]/route.ts` |
| PUT | `/api/admin/cms/media/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/media/[id]/route.ts` |
| DELETE | `/api/admin/cms/media/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/media/[id]/route.ts` |
| GET | `/api/admin/cms/navigation` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/navigation/route.ts` |
| PUT | `/api/admin/cms/navigation` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/navigation/route.ts` |
| GET | `/api/admin/cms/pages` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/pages/route.ts` |
| POST | `/api/admin/cms/pages` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/pages/route.ts` |
| GET | `/api/admin/cms/pages/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/pages/[id]/route.ts` |
| PUT | `/api/admin/cms/pages/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/pages/[id]/route.ts` |
| DELETE | `/api/admin/cms/pages/[id]` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/admin/cms/pages/[id]/route.ts` |
| POST | `/api/admin/cms/pages/bulk` | Yes | ["Admin", "Super Admin", "academic-manager", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/cms/pages/bulk/route.ts` |
| GET | `/api/admin/reports/system` | Yes | ["Admin", "Super Admin", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/reports/system/route.ts` |
| GET | `/api/admin/search` | Yes | ["Admin", "Super Admin"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/search/route.ts` |
| GET | `/api/admin/security` | Yes | ["Admin", "Super Admin", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/security/route.ts` |
| POST | `/api/admin/security/revoke-session` | Yes | ["Admin", "Super Admin"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/security/revoke-session/route.ts` |
| GET | `/api/admin/settings` | Yes | ["Admin", "Super Admin"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/settings/route.ts` |
| PUT | `/api/admin/settings` | Yes | ["Admin", "Super Admin"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/settings/route.ts` |
| POST | `/api/admin/settings/reset` | Yes | ["Admin", "Super Admin"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/settings/reset/route.ts` |
| POST | `/api/admin/settings/validate` | Yes | ["Admin", "Super Admin"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/settings/validate/route.ts` |
| GET | `/api/admin/storage/stats` | Yes | ["Admin", "Super Admin", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/storage/stats/route.ts` |
| GET | `/api/admin/system/jobs/trigger` | Yes | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/admin/system/jobs/trigger/route.ts` |
| POST | `/api/admin/system/jobs/trigger` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/system/jobs/trigger/route.ts` |
| GET | `/api/admin/users/[id]` | Yes | ["Admin", "Super Admin"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/admin/users/[id]/route.ts` |
| PUT | `/api/admin/users/[id]` | Yes | ["Admin", "Super Admin"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/admin/users/[id]/route.ts` |
| GET | `/api/analytics/academic` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/academic/route.ts` |
| GET | `/api/analytics/admissions` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/admissions/route.ts` |
| GET | `/api/analytics/dashboards` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/dashboards/route.ts` |
| POST | `/api/analytics/dashboards` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/analytics/dashboards/route.ts` |
| GET | `/api/analytics/dashboards/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/dashboards/[id]/route.ts` |
| PUT | `/api/analytics/dashboards/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/analytics/dashboards/[id]/route.ts` |
| DELETE | `/api/analytics/dashboards/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/dashboards/[id]/route.ts` |
| GET | `/api/analytics/executive` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/executive/route.ts` |
| GET | `/api/analytics/finance` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/finance/route.ts` |
| GET | `/api/analytics/widgets` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/widgets/route.ts` |
| POST | `/api/analytics/widgets` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/analytics/widgets/route.ts` |
| GET | `/api/analytics/widgets/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/widgets/[id]/route.ts` |
| PUT | `/api/analytics/widgets/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/analytics/widgets/[id]/route.ts` |
| DELETE | `/api/analytics/widgets/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/analytics/widgets/[id]/route.ts` |
| GET | `/api/assessments` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/assessments/route.ts` |
| POST | `/api/assessments` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/assessments/route.ts` |
| GET | `/api/assessments/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/route.ts` |
| PUT | `/api/assessments/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/route.ts` |
| DELETE | `/api/assessments/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/route.ts` |
| GET | `/api/assessments/[id]/attempts` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/attempts/route.ts` |
| POST | `/api/assessments/[id]/evaluate` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/evaluate/route.ts` |
| POST | `/api/assessments/[id]/publish` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/publish/route.ts` |
| POST | `/api/assessments/[id]/publish-results` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/publish-results/route.ts` |
| GET | `/api/assessments/[id]/questions` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student", "Parent"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/questions/route.ts` |
| POST | `/api/assessments/[id]/questions` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student", "Parent"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/questions/route.ts` |
| POST | `/api/assessments/[id]/start` | Yes | ["Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/start/route.ts` |
| POST | `/api/assessments/[id]/submit` | Yes | ["Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/submit/route.ts` |
| GET | `/api/assessments/[id]/timeline` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/assessments/[id]/timeline/route.ts` |
| GET | `/api/assignments` | Yes | Teacher | - | - | - | Source: `:/Lmsca/lmsca/app/api/assignments/route.ts` |
| POST | `/api/assignments` | Yes | Teacher | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/assignments/route.ts` |
| GET | `/api/assignments/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/route.ts` |
| PUT | `/api/assignments/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/route.ts` |
| DELETE | `/api/assignments/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/route.ts` |
| POST | `/api/assignments/[id]/archive` | Yes | ["Admin", "Super Admin"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/archive/route.ts` |
| POST | `/api/assignments/[id]/close` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/close/route.ts` |
| POST | `/api/assignments/[id]/evaluate` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/evaluate/route.ts` |
| POST | `/api/assignments/[id]/publish` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/publish/route.ts` |
| POST | `/api/assignments/[id]/publish-grades` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/publish-grades/route.ts` |
| GET | `/api/assignments/[id]/submissions` | Yes | Student | id | - | - | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/submissions/route.ts` |
| POST | `/api/assignments/[id]/submit` | Yes | ["Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/submit/route.ts` |
| GET | `/api/assignments/[id]/timeline` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/assignments/[id]/timeline/route.ts` |
| GET | `/api/attendance` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/attendance/route.ts` |
| POST | `/api/attendance` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/attendance/route.ts` |
| GET | `/api/attendance/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/attendance/[id]/route.ts` |
| PUT | `/api/attendance/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/attendance/[id]/route.ts` |
| DELETE | `/api/attendance/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/attendance/[id]/route.ts` |
| POST | `/api/attendance/bulk-mark` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/attendance/bulk-mark/route.ts` |
| POST | `/api/attendance/bulk-update` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/attendance/bulk-update/route.ts` |
| POST | `/api/attendance/session/close` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/attendance/session/close/route.ts` |
| POST | `/api/attendance/session/freeze` | Yes | ["Admin", "Super Admin", "Academic Manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/attendance/session/freeze/route.ts` |
| POST | `/api/attendance/session/open` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/attendance/session/open/route.ts` |
| POST | `/api/attendance/session/reopen` | Yes | ["Admin", "Super Admin", "Academic Manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/attendance/session/reopen/route.ts` |
| GET | `/api/attendance/summary` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/attendance/summary/route.ts` |
| POST | `/api/auth/activate` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/activate/route.ts` |
| POST | `/api/auth/change-password` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/change-password/route.ts` |
| GET | `/api/auth/devices` | Yes | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/auth/devices/route.ts` |
| DELETE | `/api/auth/devices` | Yes | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/auth/devices/route.ts` |
| POST | `/api/auth/forgot-password` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/forgot-password/route.ts` |
| GET | `/api/auth/handoff` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/auth/handoff/route.ts` |
| POST | `/api/auth/login` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/login/route.ts` |
| POST | `/api/auth/logout` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/logout/route.ts` |
| POST | `/api/auth/oauth/mobile` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/oauth/mobile/route.ts` |
| POST | `/api/auth/otp/send` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/otp/send/route.ts` |
| POST | `/api/auth/otp/verify` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/otp/verify/route.ts` |
| POST | `/api/auth/refresh` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/refresh/route.ts` |
| POST | `/api/auth/reset-password` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/auth/reset-password/route.ts` |
| GET | `/api/batches` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/batches/route.ts` |
| POST | `/api/batches` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/route.ts` |
| GET | `/api/batches/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/route.ts` |
| PUT | `/api/batches/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/[id]/route.ts` |
| DELETE | `/api/batches/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/route.ts` |
| GET | `/api/batches/[id]/capacity` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/capacity/route.ts` |
| GET | `/api/batches/[id]/recommendations` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/recommendations/route.ts` |
| POST | `/api/batches/[id]/recommendations` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/[id]/recommendations/route.ts` |
| GET | `/api/batches/[id]/students` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/students/route.ts` |
| POST | `/api/batches/[id]/students` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/[id]/students/route.ts` |
| DELETE | `/api/batches/[id]/students/[studentId]` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id, studentId | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/students/[studentId]/route.ts` |
| POST | `/api/batches/[id]/students/swap` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/[id]/students/swap/route.ts` |
| POST | `/api/batches/[id]/students/transfer` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/[id]/students/transfer/route.ts` |
| GET | `/api/batches/[id]/teachers` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/teachers/route.ts` |
| POST | `/api/batches/[id]/teachers` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/[id]/teachers/route.ts` |
| GET | `/api/batches/[id]/timeline` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/timeline/route.ts` |
| GET | `/api/batches/[id]/waiting-list` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/waiting-list/route.ts` |
| POST | `/api/batches/[id]/waiting-list` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/[id]/waiting-list/route.ts` |
| POST | `/api/batches/[id]/waiting-list/[entryId]` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id, entryId | - | Yes | Source: `:/Lmsca/lmsca/app/api/batches/[id]/waiting-list/[entryId]/route.ts` |
| DELETE | `/api/batches/[id]/waiting-list/[entryId]` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id, entryId | - | - | Source: `:/Lmsca/lmsca/app/api/batches/[id]/waiting-list/[entryId]/route.ts` |
| GET | `/api/certificates` | Yes | ["Admin", "Super Admin", "Academic Manager", "Certificate Officer", "Teacher", "Student"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/certificates/route.ts` |
| POST | `/api/certificates` | Yes | ["Admin", "Super Admin", "Academic Manager", "Certificate Officer", "Teacher", "Student"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/certificates/route.ts` |
| GET | `/api/certificates/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Certificate Officer", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/route.ts` |
| PUT | `/api/certificates/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Certificate Officer", "Teacher", "Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/route.ts` |
| DELETE | `/api/certificates/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Certificate Officer", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/route.ts` |
| POST | `/api/certificates/[id]/approve` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/approve/route.ts` |
| POST | `/api/certificates/[id]/generate` | Yes | ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/generate/route.ts` |
| POST | `/api/certificates/[id]/issue` | Yes | ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/issue/route.ts` |
| POST | `/api/certificates/[id]/reject` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/reject/route.ts` |
| POST | `/api/certificates/[id]/revoke` | Yes | ["Admin", "Super Admin"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/revoke/route.ts` |
| GET | `/api/certificates/[id]/timeline` | Yes | ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/certificates/[id]/timeline/route.ts` |
| GET | `/api/certificates/verify` | Yes | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/certificates/verify/route.ts` |
| GET | `/api/cms/[model]` | No | - | model | - | - | Source: `:/Lmsca/lmsca/app/api/cms/[model]/route.ts` |
| POST | `/api/cms/[model]` | No | - | model | - | Yes | Source: `:/Lmsca/lmsca/app/api/cms/[model]/route.ts` |
| GET | `/api/cms/[model]/[id]` | No | - | model, id | - | - | Source: `:/Lmsca/lmsca/app/api/cms/[model]/[id]/route.ts` |
| PUT | `/api/cms/[model]/[id]` | No | - | model, id | - | Yes | Source: `:/Lmsca/lmsca/app/api/cms/[model]/[id]/route.ts` |
| DELETE | `/api/cms/[model]/[id]` | No | - | model, id | - | - | Source: `:/Lmsca/lmsca/app/api/cms/[model]/[id]/route.ts` |
| GET | `/api/cohorts` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/cohorts/route.ts` |
| POST | `/api/cohorts` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/cohorts/route.ts` |
| GET | `/api/cohorts/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/cohorts/[id]/route.ts` |
| PUT | `/api/cohorts/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Read Only"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/cohorts/[id]/route.ts` |
| DELETE | `/api/cohorts/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/cohorts/[id]/route.ts` |
| GET | `/api/cohorts/[id]/timeline` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/cohorts/[id]/timeline/route.ts` |
| GET | `/api/courses` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/courses/route.ts` |
| POST | `/api/courses` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/courses/route.ts` |
| GET | `/api/courses/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/courses/[id]/route.ts` |
| PUT | `/api/courses/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/courses/[id]/route.ts` |
| DELETE | `/api/courses/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/courses/[id]/route.ts` |
| GET | `/api/courses/[id]/curriculum` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Student", "Parent"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/courses/[id]/curriculum/route.ts` |
| POST | `/api/courses/[id]/curriculum` | Yes | ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Student", "Parent"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/courses/[id]/curriculum/route.ts` |
| GET | `/api/crm/demos` | Yes | ["Admin", "Super Admin", "Academic Manager", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/crm/demos/route.ts` |
| POST | `/api/crm/demos` | Yes | ["Admin", "Super Admin", "Academic Manager", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/crm/demos/route.ts` |
| GET | `/api/crm/demos/smart-schedule` | Yes | ["Admin", "Super Admin", "Academic Manager", "operations-manager"] | - | courseId, teacherId, duration, daysAhead | - | Source: `:/Lmsca/lmsca/app/api/crm/demos/smart-schedule/route.ts` |
| POST | `/api/crm/demos/schedule-for-child` | Yes | ["Admin", "Super Admin", "Academic Manager", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/crm/demos/schedule-for-child/route.ts` |
| GET | `/api/crm/leads` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/crm/leads/route.ts` |
| POST | `/api/crm/leads` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/crm/leads/route.ts` |
| GET | `/api/crm/leads/[id]` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/route.ts` |
| PUT | `/api/crm/leads/[id]` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/route.ts` |
| DELETE | `/api/crm/leads/[id]` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/route.ts` |
| POST | `/api/crm/leads/[id]/enroll` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/enroll/route.ts` |
| GET | `/api/crm/leads/[id]/followups` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/followups/route.ts` |
| POST | `/api/crm/leads/[id]/followups` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/followups/route.ts` |
| GET | `/api/crm/leads/[id]/tasks` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/tasks/route.ts` |
| POST | `/api/crm/leads/[id]/tasks` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/tasks/route.ts` |
| GET | `/api/crm/leads/[id]/timeline` | Yes | ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/crm/leads/[id]/timeline/route.ts` |
| GET | `/api/enrollments` | Yes | ["Admin", "Super Admin", "Admissions Manager", "Counsellor"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/enrollments/route.ts` |
| POST | `/api/enrollments` | Yes | ["Admin", "Super Admin", "Admissions Manager", "Counsellor"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/enrollments/route.ts` |
| GET | `/api/enrollments/[id]` | Yes | ["Admin", "Super Admin", "Admissions Manager", "Counsellor", "Student", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/enrollments/[id]/route.ts` |
| PUT | `/api/enrollments/[id]` | Yes | ["Admin", "Super Admin", "Admissions Manager", "Counsellor", "Student", "Read Only"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/enrollments/[id]/route.ts` |
| DELETE | `/api/enrollments/[id]` | Yes | ["Admin", "Super Admin", "Admissions Manager", "Counsellor", "Student", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/enrollments/[id]/route.ts` |
| GET | `/api/enrollments/[id]/timeline` | Yes | ["Admin", "Super Admin", "Admissions Manager", "Counsellor", "Student", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/enrollments/[id]/timeline/route.ts` |
| GET | `/api/finance/dashboard` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/finance/dashboard/route.ts` |
| GET | `/api/finance/fee-plans` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/finance/fee-plans/route.ts` |
| POST | `/api/finance/fee-plans` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/fee-plans/route.ts` |
| GET | `/api/finance/fee-plans/[id]` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/finance/fee-plans/[id]/route.ts` |
| PUT | `/api/finance/fee-plans/[id]` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/fee-plans/[id]/route.ts` |
| DELETE | `/api/finance/fee-plans/[id]` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/finance/fee-plans/[id]/route.ts` |
| GET | `/api/finance/installments` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/finance/installments/route.ts` |
| POST | `/api/finance/installments` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/installments/route.ts` |
| GET | `/api/finance/invoice-items` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/finance/invoice-items/route.ts` |
| POST | `/api/finance/invoice-items` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/invoice-items/route.ts` |
| GET | `/api/finance/invoices` | Yes | Student | - | - | - | Source: `:/Lmsca/lmsca/app/api/finance/invoices/route.ts` |
| POST | `/api/finance/invoices` | Yes | Student | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/invoices/route.ts` |
| GET | `/api/finance/invoices/[id]` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/finance/invoices/[id]/route.ts` |
| DELETE | `/api/finance/invoices/[id]` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/finance/invoices/[id]/route.ts` |
| GET | `/api/finance/payments` | Yes | Student | - | - | - | Source: `:/Lmsca/lmsca/app/api/finance/payments/route.ts` |
| POST | `/api/finance/payments` | Yes | Student | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/payments/route.ts` |
| GET | `/api/finance/payments/[id]` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/finance/payments/[id]/route.ts` |
| GET | `/api/finance/receipts` | Yes | Student | - | - | - | Source: `:/Lmsca/lmsca/app/api/finance/receipts/route.ts` |
| GET | `/api/finance/receipts/[id]` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/finance/receipts/[id]/route.ts` |
| GET | `/api/finance/refunds` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/finance/refunds/route.ts` |
| POST | `/api/finance/refunds` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/refunds/route.ts` |
| GET | `/api/finance/refunds/[id]` | Yes | ["Admin", "Super Admin", "Finance Manager", "Accountant"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/finance/refunds/[id]/route.ts` |
| POST | `/api/finance/refunds/[id]/approve` | Yes | ["Admin", "Super Admin", "Finance Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/refunds/[id]/approve/route.ts` |
| POST | `/api/finance/refunds/[id]/reject` | Yes | ["Admin", "Super Admin", "Finance Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/finance/refunds/[id]/reject/route.ts` |
| GET | `/api/gateway/audit-logs` | Yes | ["super-admin", "admin", "api-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/gateway/audit-logs/route.ts` |
| GET | `/api/gateway/clients` | Yes | ["super-admin", "admin", "api-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/gateway/clients/route.ts` |
| POST | `/api/gateway/clients` | Yes | ["super-admin", "admin", "api-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/gateway/clients/route.ts` |
| GET | `/api/gateway/keys` | Yes | ["super-admin", "admin", "api-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/gateway/keys/route.ts` |
| POST | `/api/gateway/keys` | Yes | ["super-admin", "admin", "api-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/gateway/keys/route.ts` |
| POST | `/api/gateway/keys/[id]/revoke` | Yes | ["super-admin", "admin", "api-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/gateway/keys/[id]/revoke/route.ts` |
| POST | `/api/gateway/keys/[id]/rotate` | Yes | ["super-admin", "admin", "api-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/gateway/keys/[id]/rotate/route.ts` |
| GET | `/api/gateway/usage` | Yes | ["super-admin", "admin", "api-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/gateway/usage/route.ts` |
| GET | `/api/gateway/webhooks` | Yes | ["super-admin", "admin", "api-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/gateway/webhooks/route.ts` |
| POST | `/api/gateway/webhooks` | Yes | ["super-admin", "admin", "api-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/gateway/webhooks/route.ts` |
| GET | `/api/gateway/webhooks/[id]/deliveries` | Yes | ["super-admin", "admin", "api-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/gateway/webhooks/[id]/deliveries/route.ts` |
| POST | `/api/gateway/webhooks/deliveries/[id]/retry` | Yes | ["super-admin", "admin", "api-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/gateway/webhooks/deliveries/[id]/retry/route.ts` |
| GET | `/api/live-classes` | Yes | Teacher | - | - | - | Source: `:/Lmsca/lmsca/app/api/live-classes/route.ts` |
| POST | `/api/live-classes` | Yes | Teacher | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/route.ts` |
| GET | `/api/live-classes/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/route.ts` |
| PUT | `/api/live-classes/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/route.ts` |
| DELETE | `/api/live-classes/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/route.ts` |
| GET | `/api/live-classes/[id]/announcements` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/announcements/route.ts` |
| POST | `/api/live-classes/[id]/announcements` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/announcements/route.ts` |
| POST | `/api/live-classes/[id]/cancel` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/cancel/route.ts` |
| POST | `/api/live-classes/[id]/clone-schedule` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/clone-schedule/route.ts` |
| POST | `/api/live-classes/[id]/complete` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/complete/route.ts` |
| POST | `/api/live-classes/[id]/duplicate` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/duplicate/route.ts` |
| GET | `/api/live-classes/[id]/recordings` | Yes | ["Admin", "Super Admin", "SuperAdmin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/recordings/route.ts` |
| POST | `/api/live-classes/[id]/recordings` | Yes | ["Admin", "Super Admin", "SuperAdmin", "Academic Manager", "Teacher", "Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/recordings/route.ts` |
| POST | `/api/live-classes/[id]/reschedule` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/reschedule/route.ts` |
| GET | `/api/live-classes/[id]/resources` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/resources/route.ts` |
| POST | `/api/live-classes/[id]/resources` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/resources/route.ts` |
| GET | `/api/live-classes/[id]/timeline` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/live-classes/[id]/timeline/route.ts` |
| GET | `/api/media/[filename]` | Yes | Admin | filename | - | - | Source: `:/Lmsca/lmsca/app/api/media/[filename]/route.ts` |
| POST | `/api/media/upload` | Yes | ["Admin", "Super Admin"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/media/upload/route.ts` |
| GET | `/api/messages` | Yes | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/messages/route.ts` |
| POST | `/api/messages` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/messages/route.ts` |
| GET | `/api/notifications/history` | Yes | ["super-admin", "admin", "marketing", "support"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/history/route.ts` |
| GET | `/api/notifications/inbox` | Yes | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/inbox/route.ts` |
| POST | `/api/notifications/inbox` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/notifications/inbox/route.ts` |
| GET | `/api/notifications/preferences` | Yes | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/preferences/route.ts` |
| POST | `/api/notifications/preferences` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/notifications/preferences/route.ts` |
| GET | `/api/notifications/preferences/[id]` | Yes | ["super-admin", "admin"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/preferences/[id]/route.ts` |
| PUT | `/api/notifications/preferences/[id]` | Yes | ["super-admin", "admin"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/notifications/preferences/[id]/route.ts` |
| GET | `/api/notifications/queue` | Yes | ["super-admin", "admin", "marketing", "support"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/queue/route.ts` |
| POST | `/api/notifications/queue/[id]/cancel` | Yes | ["super-admin", "admin", "support"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/notifications/queue/[id]/cancel/route.ts` |
| POST | `/api/notifications/queue/[id]/retry` | Yes | ["super-admin", "admin", "support"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/notifications/queue/[id]/retry/route.ts` |
| GET | `/api/notifications/templates` | Yes | ["super-admin", "admin", "marketing", "support"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/templates/route.ts` |
| POST | `/api/notifications/templates` | Yes | ["super-admin", "admin", "marketing", "support"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/notifications/templates/route.ts` |
| GET | `/api/notifications/templates/[id]` | Yes | ["super-admin", "admin", "marketing", "support"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/templates/[id]/route.ts` |
| PUT | `/api/notifications/templates/[id]` | Yes | ["super-admin", "admin", "marketing", "support"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/notifications/templates/[id]/route.ts` |
| DELETE | `/api/notifications/templates/[id]` | Yes | ["super-admin", "admin", "marketing", "support"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/templates/[id]/route.ts` |
| GET | `/api/notifications/timeline` | Yes | ["super-admin", "admin", "marketing", "support"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/notifications/timeline/route.ts` |
| GET | `/api/parent/children` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/route.ts` |
| POST | `/api/parent/children` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/children/route.ts` |
| DELETE | `/api/parent/children/[id]` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/route.ts` |
| GET | `/api/parent/children/[id]/academics` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/academics/route.ts` |
| GET | `/api/parent/children/[id]/assessments` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/assessments/route.ts` |
| GET | `/api/parent/children/[id]/assignments` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/assignments/route.ts` |
| GET | `/api/parent/children/[id]/assignments/[assignmentId]` | No | - | id, assignmentId | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/assignments/[assignmentId]/route.ts` |
| PUT | `/api/parent/children/[id]/assignments/[assignmentId]/draft` | No | - | id, assignmentId | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/assignments/[assignmentId]/draft/route.ts` |
| POST | `/api/parent/children/[id]/assignments/[assignmentId]/submit` | No | - | id, assignmentId | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/assignments/[assignmentId]/submit/route.ts` |
| GET | `/api/parent/children/[id]/attendance` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/attendance/route.ts` |
| GET | `/api/parent/children/[id]/certificates` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/certificates/route.ts` |
| GET | `/api/parent/children/[id]/classes/[classId]/summary` | No | - | id, classId | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/classes/[classId]/summary/route.ts` |
| GET | `/api/parent/children/[id]/dashboard` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/dashboard/route.ts` |
| GET | `/api/parent/children/[id]/finance` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/finance/route.ts` |
| GET | `/api/parent/children/[id]/finance/invoices/[invoiceId]` | No | - | id, invoiceId | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/finance/invoices/[invoiceId]/route.ts` |
| GET | `/api/parent/children/[id]/finance/invoices/[invoiceId]/download` | No | - | id, invoiceId | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/finance/invoices/[invoiceId]/download/route.ts` |
| POST | `/api/parent/children/[id]/finance/pay` | No | - | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/finance/pay/route.ts` |
| GET | `/api/parent/children/[id]/finance/receipts/[receiptId]` | No | - | id, receiptId | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/finance/receipts/[receiptId]/route.ts` |
| GET | `/api/parent/children/[id]/finance/receipts/[receiptId]/download` | No | - | id, receiptId | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/finance/receipts/[receiptId]/download/route.ts` |
| GET | `/api/parent/children/[id]/invoices` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/invoices/route.ts` |
| GET | `/api/parent/children/[id]/live-classes` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/live-classes/route.ts` |
| GET | `/api/parent/children/[id]/messages` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/messages/route.ts` |
| POST | `/api/parent/children/[id]/messages` | No | - | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/messages/route.ts` |
| PATCH | `/api/parent/children/[id]/messages/[messageId]/read` | No | - | id, messageId | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/messages/[messageId]/read/route.ts` |
| GET | `/api/parent/children/[id]/program` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/program/route.ts` |
| GET | `/api/parent/children/[id]/progress` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/progress/route.ts` |
| GET | `/api/parent/children/[id]/recordings` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/recordings/route.ts` |
| GET | `/api/parent/children/[id]/schedule` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/schedule/route.ts` |
| GET | `/api/parent/children/[id]/skills` | No | - | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/skills/route.ts` |
| GET | `/api/parent/children/[id]/topics/[topicId]` | No | - | id, topicId | - | - | Source: `:/Lmsca/lmsca/app/api/parent/children/[id]/topics/[topicId]/route.ts` |
| GET | `/api/parent/demo` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/parent/demo/route.ts` |
| POST | `/api/parent/demo` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/demo/route.ts` |
| GET | `/api/parent/demo/availability` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/parent/demo/availability/route.ts` |
| GET | `/api/parent/demo/courses` | Yes | Parent | - | - | - | Source: `:/Lmsca/lmsca/app/api/parent/demo/courses/route.ts` |
| POST | `/api/parent/demo/[id]/child-token` | Yes | Parent | id | - | - | Source: `:/Lmsca/lmsca/app/api/parent/demo/[id]/child-token/route.ts` |
| GET | `/api/parent/notifications` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/parent/notifications/route.ts` |
| GET | `/api/parent/preferences` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/parent/preferences/route.ts` |
| PATCH | `/api/parent/preferences` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/preferences/route.ts` |
| GET | `/api/parent/profile` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/parent/profile/route.ts` |
| PUT | `/api/parent/profile` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/profile/route.ts` |
| PATCH | `/api/parent/profile` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/profile/route.ts` |
| GET | `/api/parent/status` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/parent/status/route.ts` |
| PUT | `/api/parent/timezone` | Yes | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/parent/timezone/route.ts` |
| GET | `/api/public/categories` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/categories/route.ts` |
| GET | `/api/public/courses` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/courses/route.ts` |
| POST | `/api/public/enroll` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/public/enroll/route.ts` |
| POST | `/api/public/enroll/checkout` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/public/enroll/checkout/route.ts` |
| GET | `/api/public/enroll/invoice` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/enroll/invoice/route.ts` |
| GET | `/api/public/enroll/status` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/enroll/status/route.ts` |
| GET | `/api/public/events` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/events/route.ts` |
| GET | `/api/public/events/[slug]` | No | - | slug | - | - | Source: `:/Lmsca/lmsca/app/api/public/events/[slug]/route.ts` |
| POST | `/api/public/events/[slug]/register` | No | - | slug | - | Yes | Source: `:/Lmsca/lmsca/app/api/public/events/[slug]/register/route.ts` |
| POST | `/api/public/lead` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/public/lead/route.ts` |
| GET | `/api/public/newsletter` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/newsletter/route.ts` |
| POST | `/api/public/newsletter` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/public/newsletter/route.ts` |
| GET | `/api/public/newsletter/unsubscribe` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/newsletter/unsubscribe/route.ts` |
| POST | `/api/public/newsletter/unsubscribe` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/public/newsletter/unsubscribe/route.ts` |
| GET | `/api/public/partners` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/partners/route.ts` |
| GET | `/api/public/search` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/public/search/route.ts` |
| GET | `/api/reports` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/reports/route.ts` |
| POST | `/api/reports` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/reports/route.ts` |
| GET | `/api/reports/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/reports/[id]/route.ts` |
| PUT | `/api/reports/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/reports/[id]/route.ts` |
| DELETE | `/api/reports/[id]` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/reports/[id]/route.ts` |
| POST | `/api/reports/export` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/reports/export/route.ts` |
| POST | `/api/reports/run` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/reports/run/route.ts` |
| GET | `/api/reports/schedule` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/reports/schedule/route.ts` |
| POST | `/api/reports/schedule` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/reports/schedule/route.ts` |
| PUT | `/api/reports/schedule/[id]` | Yes | ["super-admin", "admin"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/reports/schedule/[id]/route.ts` |
| DELETE | `/api/reports/schedule/[id]` | Yes | ["super-admin", "admin"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/reports/schedule/[id]/route.ts` |
| GET | `/api/reports/snapshot` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/reports/snapshot/route.ts` |
| POST | `/api/reports/snapshot` | Yes | ["super-admin", "admin", "academic-manager", "finance-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/reports/snapshot/route.ts` |
| GET | `/api/students` | Yes | ["Admin", "Super Admin", "Academic Manager", "Counsellor"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/students/route.ts` |
| POST | `/api/students` | Yes | ["Admin", "Super Admin", "Academic Manager", "Counsellor"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/students/route.ts` |
| GET | `/api/students/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/students/[id]/route.ts` |
| PUT | `/api/students/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Read Only"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/students/[id]/route.ts` |
| DELETE | `/api/students/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/students/[id]/route.ts` |
| GET | `/api/students/[id]/documents` | Yes | ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Parent"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/students/[id]/documents/route.ts` |
| POST | `/api/students/[id]/documents` | Yes | ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Parent"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/students/[id]/documents/route.ts` |
| PATCH | `/api/students/[id]/documents/[docId]` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id, docId | - | Yes | Source: `:/Lmsca/lmsca/app/api/students/[id]/documents/[docId]/route.ts` |
| DELETE | `/api/students/[id]/documents/[docId]` | Yes | ["Admin", "Super Admin", "Academic Manager"] | id, docId | - | - | Source: `:/Lmsca/lmsca/app/api/students/[id]/documents/[docId]/route.ts` |
| GET | `/api/students/[id]/timeline` | Yes | ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/students/[id]/timeline/route.ts` |
| GET | `/api/teacher/batches` | Yes | ["Teacher"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/teacher/batches/route.ts` |
| POST | `/api/teacher/demo/[id]/token` | Yes | ["Teacher", "Admin"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/teacher/demo/[id]/token/route.ts` |
| GET | `/api/teacher/messages` | No | - | - | - | - | Source: `:/Lmsca/lmsca/app/api/teacher/messages/route.ts` |
| POST | `/api/teacher/messages` | No | - | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/teacher/messages/route.ts` |
| GET | `/api/teachers` | Yes | ["Admin", "Super Admin", "Academic Manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/teachers/route.ts` |
| POST | `/api/teachers` | Yes | ["Admin", "Super Admin", "Academic Manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/teachers/route.ts` |
| GET | `/api/teachers/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/teachers/[id]/route.ts` |
| PUT | `/api/teachers/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/teachers/[id]/route.ts` |
| DELETE | `/api/teachers/[id]` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/teachers/[id]/route.ts` |
| GET | `/api/teachers/[id]/availability` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/teachers/[id]/availability/route.ts` |
| POST | `/api/teachers/[id]/availability` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/teachers/[id]/availability/route.ts` |
| GET | `/api/teachers/[id]/leaves` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/teachers/[id]/leaves/route.ts` |
| POST | `/api/teachers/[id]/leaves` | Yes | ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/teachers/[id]/leaves/route.ts` |
| GET | `/api/test/protected` | Yes | ["Admin", "Super Admin"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/test/protected/route.ts` |
| POST | `/api/test/protected` | Yes | ["Admin", "Super Admin"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/test/protected/route.ts` |
| GET | `/api/v1/public/[...resource]` | No | - | resource | - | - | Source: `:/Lmsca/lmsca/app/api/v1/public/[.resource]/route.ts` |
| GET | `/api/workflows` | Yes | ["super-admin", "admin", "operations-manager", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/workflows/route.ts` |
| POST | `/api/workflows` | Yes | ["super-admin", "admin", "operations-manager", "academic-manager", "finance-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/workflows/route.ts` |
| GET | `/api/workflows/[id]` | Yes | ["super-admin", "admin", "operations-manager", "academic-manager", "finance-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/workflows/[id]/route.ts` |
| PUT | `/api/workflows/[id]` | Yes | ["super-admin", "admin", "operations-manager", "academic-manager", "finance-manager"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/workflows/[id]/route.ts` |
| DELETE | `/api/workflows/[id]` | Yes | ["super-admin", "admin", "operations-manager", "academic-manager", "finance-manager"] | id | - | - | Source: `:/Lmsca/lmsca/app/api/workflows/[id]/route.ts` |
| POST | `/api/workflows/[id]/activate` | Yes | ["super-admin", "admin"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/workflows/[id]/activate/route.ts` |
| POST | `/api/workflows/[id]/execute` | Yes | ["super-admin", "admin"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/workflows/[id]/execute/route.ts` |
| POST | `/api/workflows/[id]/pause` | Yes | ["super-admin", "admin"] | id | - | Yes | Source: `:/Lmsca/lmsca/app/api/workflows/[id]/pause/route.ts` |
| GET | `/api/workflows/executions` | Yes | ["super-admin", "admin", "operations-manager", "academic-manager", "finance-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/workflows/executions/route.ts` |
| GET | `/api/workflows/executions/logs` | Yes | ["super-admin", "admin", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/workflows/executions/logs/route.ts` |
| GET | `/api/workflows/templates` | Yes | ["super-admin", "admin", "operations-manager"] | - | - | - | Source: `:/Lmsca/lmsca/app/api/workflows/templates/route.ts` |
| POST | `/api/workflows/templates` | Yes | ["super-admin", "admin", "operations-manager"] | - | - | Yes | Source: `:/Lmsca/lmsca/app/api/workflows/templates/route.ts` |
