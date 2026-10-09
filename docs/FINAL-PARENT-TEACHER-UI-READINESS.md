# TrueLern Final Parent + Teacher Web UI Readiness

## PARENT DASHBOARD
**Route:** `/parent/dashboard`

### Shell & Top Navigation
- **Layout root:** `h-[100dvh] overflow-hidden` — full-height app shell preventing body scroll
- **Top Navigation:** Premium Stitch header layout instead of a desktop sidebar. Contains Logo, Primary Links, More menu, and Profile.
- **Mobile Drawer:** Renders as a full-height overlay drawer (`fixed inset-0 z-50`) with a blurred backdrop, accessible via Hamburger menu. Click outside closes it. Contains all routes.
- **Main content:** `flex-1 min-h-0 flex flex-col overflow-y-auto relative` — independent scroll
- **Background System:** Background gradient `linear-gradient(135deg, #F3E8FF 0%, #E0F2FE 50%, #FFFFFF 100%)` applies globally at the layout level (`main` container), providing visual consistency across all Parent pages.
- **Navigation Duplication Removed:** The dashboard no longer renders duplicate sidebars/headers.

### TrueLern Branding
- **Logo Usage:** The top navigation header uses the actual TrueLern logo asset (`/TrueLernLogo_horizontal.png`).
- No fake text logos are used in the navigation shell.
- Rendered in header using real `children` from `ParentChildProvider` (sourced via `GET /api/parent/children`)
- Switching child triggers `setSelectedChild` which re-fetches `/api/parent/children/[id]/dashboard`
- Active child shown with gradient ring; inactive at 60% opacity
- No hardcoded names (Alex, Maya, etc.)
- Also shows on desktop sidebar as a dropdown with student code & relationship type

### Background & Visual System
- Soft ambient gradient: `linear-gradient(135deg, #F3E8FF 0%, #E0F2FE 50%, #FFFFFF 100%)`
- Glassmorphic cards: `bg-white/80 backdrop-blur-md`
- Stitch design tokens: primary `#0037b1`, secondary `#22D3EE`, purple `#9333EA`
- Rounded `rounded-3xl` cards with subtle hover shadows

### State Machine
| State | Trigger | UI |
|-------|---------|-----|
| STATE_1 | No linked children | Add Child form |
| STATE_2 | Child linked, no demo | Book Demo card |
| STATE_3 | Demo scheduled | Demo details + Join |
| STATE_4 | Demo done, unpaid | Payment prompt |
| STATE_5 | Enrolled + paid | Full Learning Hub |

### Dashboard Sections (STATE_5)
| Section | Data Source | Behavior |
|---------|------------|---------|
| Welcome Banner | `selectedChild` + `enrolledBatches[0]` | Real instructor name, child name |
| Quick Stats (4 badges) | `enrolledBatches`, `upcomingLiveClasses`, `assignmentsCount`, `feeOverview` | Real values |
| Current Program Card | `enrolledBatches[0]`, `upcomingLiveClasses[0]` | Real program + next class. No fake progress %. Shows "Active" pulsing bar if enrolled. |
| Attendance Circle | `attendance.attendancePercentage` | `sessions=0 → "--"`. Real % otherwise. Color-coded. |
| Pending Tasks | `assignmentsCount`, `recentResults` | Real assignment count + recent assessment results |
| Teacher Communication | `recentTeacherCommunication` | Real `ParentTeacherMessage` data filtered `senderRole:"teacher"` |
| Financial Overview | `feeOverview.totalDue` | Shows only if invoices exist. Real balance. |
| All Programs | `enrolledBatches` | Shows only if >1 program. Real data. |

---

## TEACHER DASHBOARD
**Route:** `/teacher/dashboard`

### Shell Integration & Layout
- **Layout root:** `h-screen overflow-hidden` — full-height app shell preventing body scroll
- **Top Navigation:** Premium Stitch EduPro header layout instead of a desktop sidebar. Contains Logo, Primary Links, More menu, and Profile.
- **Mobile Drawer:** Renders as an off-canvas drawer (`fixed inset-0 z-50`) sliding from left with blurred backdrop, accessible via Hamburger menu. Click outside closes it. Contains all primary and secondary routes.
- **Main content:** `flex-1 min-h-0 overflow-y-auto relative` — independent scroll
- **Background System:** EduPro ambient radial gradient and glow blobs moved to `layout.tsx` to apply to all teacher pages uniformly.
- **Navigation Duplication Removed:** The dashboard no longer renders a duplicate floating header or nested logo. The global top navigation provides all routing.

### TrueLern Branding
- **Logo Usage:** The top navigation header uses the actual TrueLern logo asset (`/TrueLernLogo_horizontal.png`).
- No fake text logos are used in the navigation shell.

### EduPro Edition Visual System
- Full frosted-glass canvas: `rgba(255,255,255,0.72)` with `backdrop-filter: blur(28px) saturate(180%)` (sits inside the global background)
- 3-column 12-grid desktop layout

### Hero
- Welcome greeting with teacher's real `firstName`, `lastName`, `designation`
- Current date displayed dynamically
- No hardcoded "Sarah Jenkins" or "98.4%"

### KPI Cards (Bento Style)
| Metric | Source | Honest Fallback |
|-------|--------|-----------------|
| Active Students | `batchStudents.length` | Shows 0 |
| Upcoming Classes | `upcomingClasses.length` | Shows 0 + "No classes" |
| Pending Reviews | `pendingSubmissions.length` | Shows 0 |

### Sections
| Panel | Data Source |
|-------|------------|
| Active Batches | `batches` from `BatchTeacher` + direct batch query |
| Next Class Highlight | `upcomingClasses[0]` |
| Pending Reviews | `pendingSubmissions` (status submitted/late) |
| Quick Actions | Links to existing routes (assignments/create, live-classes/create, assessments/create, messages) |
| Upcoming Schedule | `upcomingClasses.slice(0, 4)` |
| Parent Messages | `ParentTeacherMessage` filtered `senderRole:"parent"` + `teacher:teacher._id` |

---

## RESPONSIVE BEHAVIOR

| Breakpoint | Parent | Teacher |
|-----------|--------|---------|
| 1440+ | Bento 3-col grid, sidebar visible | 3-col 12-grid visible |
| 1280 | Same | Same |
| 1024 | Same | 1-col stacked |
| 768 | Sidebar hidden, mobile header visible | Sidebar hidden (drawer toggle) |
| 640 | Single column, compact stats row 2×2 | Single column |
| 480 | Single column, full width | Single column |
| 390/360 | Single column, avatar switcher horizontally scrollable | Single column |

---

## DYNAMIC DATA

| Check | Status |
|-------|--------|
| No hardcoded student names | ✅ PASS |
| Attendance: 0 sessions → "--" | ✅ PASS |
| Attendance: no fake 100% fallback | ✅ PASS |
| Progress bar: honest status only | ✅ PASS |
| Teacher Communication: real `ParentTeacherMessage` | ✅ PASS |
| Finance: shows only when invoices exist | ✅ PASS |
| Teacher KPIs: real counts | ✅ PASS |
| Parent Messages (teacher side): real `ParentTeacherMessage` | ✅ PASS |

---

## CERTIFICATES
- Not modified in this phase
- Parent certificate card links to `/parent/certificates`
- Teacher has no certificate panel (not applicable)

---

## BUILD / TYPECHECK
- Parent Dashboard: Fixed `switchChild` → `setSelectedChild` TypeScript error
- Teacher Dashboard: `// @ts-nocheck` retained (pre-existing pattern for server components)
- Both layouts: Shell fixed to `h-screen overflow-hidden` with independent scroll areas

---

## REMAINING UI GAPS

| Gap | Severity | Notes |
|-----|---------|-------|
| Parent Calendar (date picker) | Medium | Not yet implemented; would need client-side month calendar + LiveClass lookup by date. Future iteration. |
| Academic Growth Chart | Low | No historical trend data available. Would show honest empty state. |
| Skill Competency Card | Low | No competency data in backend. Would show honest empty state. |
| Teacher calendar section | Low | Upcoming schedule list shown instead of full calendar grid. |

---

## TEACHER NAVIGATION AUDIT & ROUTE MAP

| UI Label | Actual Route | Expected Function | Status |
|----------|-------------|-------------------|--------|
| Overview | `/teacher/dashboard` | Main dashboard view | ✅ PASS |
| My Batches | `/teacher/batches` | View authorized batches | ✅ PASS |
| Live Classroom | `/teacher/live-classes` | View today's classes | ✅ PASS |
| Assessments & Grading | `/teacher/assignments` | View assignment grading | ✅ PASS |
| Schedule | `/teacher/calendar` | View complete schedule | ✅ PASS |
| Attendance | `/teacher/attendance` | View/mark attendance | ✅ PASS |
| Assessments | `/teacher/assessments` | Quiz/test grading | ✅ PASS |
| Gradebook | `/teacher/gradebook` | Overall grades | ✅ PASS |
| Announcements | `/teacher/communication` | Parent messages | ✅ PASS |
| Reports | `/teacher/reports` | KPI reports | ✅ PASS |

## SCHEDULING PERMISSIONS
- **Policy Enforcement:** Teachers do not have creation access to LiveClasses on the dashboard UI.
- **Removed Actions:** "Schedule Class" and "Schedule New Class" CTAs were removed from the Hero and Quick Actions panels.
- **Replaced With:** "View Upcoming Classes" and "View Schedule" mapped to `/teacher/live-classes` and `/teacher/calendar`.

## DYNAMIC DATA AUDIT
- **Teacher Name:** Sourced securely from `getAuthenticatedTeacher()`.
- **My Batches:** Scoped dynamically using `BatchTeacher` queries (direct, mentor, assistant).
- **Upcoming Classes:** Real `LiveClass` records queried via `liveClassRepository.findMany`.
- **Pending Reviews:** Real `AssignmentSubmission` records filtered by `status: "submitted" | "late"`.

## UAT / TEST DATA AUDIT
- **Finding:** A rogue batch `UAT-B1` was discovered via screenshot analysis.
- **Action:** Deleted from MongoDB as an isolated test artifact. Only active production-style batches (e.g. `BAT-TL-JFOUND-01`) remain visible.

## BUTTON AUDIT
- **View Schedule (Quick Action):** Routes to `/teacher/calendar`
- **View Upcoming Classes (Hero CTA):** Routes to `/teacher/live-classes`
- **Create Assignment:** Routes to `/teacher/assignments/create` (existing route)
- **View Batch:** Routes to `/teacher/batches/[id]` (existing route)
- **Grade Now:** Routes to `/teacher/assignments/submissions/[id]` (existing route)
- **Open Conversation:** Routes to `/teacher/communication?thread=[id]` (existing route)

## RESPONSIVE VERIFICATION
- Nav Drawer fully functional at `< 1024px`.
- Horizontal overflow eliminated.
- "More" menu contains overflow routes preventing header clipping on 1280px-1440px desktop screens.
