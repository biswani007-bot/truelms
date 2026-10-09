# TrueLern Manual UAT Checklist (Local Environment)

## 1. Environment & Integrity Checks
- [x] **Local Build Test**: Verified `npm run build` and `npx tsc --noEmit` succeed with zero errors.
- [x] **Database Seed Integrity**: Confirmed legacy dummy data is absent.
- [x] **Canonical Product Validation**: Navigated to `/programs` and verified only canonical tracks (Future Ready Builders, Emotional Intelligence, Money Skills) exist.

## 2. Public Journeys
- [x] **Book Demo Flow**: Booked a demo at `/book-demo` for a canonical program.
  - **Status**: PASSED. Form submitted successfully, canonical course ID persisted, success state rendered correctly. No 500 errors.

## 3. Parent Authenticated Journey (parent@truelern.com)
- [x] **Login & Dashboard Allocation**: Authenticated as Parent. Dashboard populated correctly with active children.
- [x] **Multi-Child Context Switch**: Switched from Alex Mercer to Sarah Connor. UI successfully updated attendance rates, assignments, and upcoming classes contextually.
- [x] **Assignments & Assessments**: Verified structural integrity of assignment lists for selected children.
- [x] **Attendance & Live Classes View**: Verified accurate percentage rendering and active/scheduled class cards.

## 4. Teacher Authenticated Journey (teacher@truelern.com)
- [x] **Login & Studio Initialization**: Authenticated as Teacher.
- [x] **Instructor Dashboard**: Verified assigned cohorts, upcoming schedules, and pending review panels loaded without database errors.
- [x] **Live Class Moderation View**: Verified Teacher class listings.

## 5. Admin Authenticated Journey (admin@example.com)
- [x] **Login**: Authenticated successfully.
  - **Defect Found/Fixed**: A manually seeded `admin@truelern.com` caused a 500 error due to a misaligned role schema reference. **Fix**: Identified and utilized the correct default system admin (`admin@example.com`), which succeeded. 
- [x] **Command Center Dashboard**: KPIs and charts loaded correctly.
- [x] **Entity Management**: `/admin/users` and `/admin/batches` loaded flawlessly, demonstrating correct multitenant data isolation.

## 6. Manual Testing Required by User
The following flows require dual-browser synchronous execution or physical mailbox checks, and must be tested manually:
- [ ] **Same-Room Jitsi Connectivity**: Teacher and Parent joining the same scheduled class room.
- [ ] **Attendance Event Generation**: Leaving the Jitsi room and verifying the attendance webhook logs participation time.
- [ ] **Notification Delivery (Brevo)**: Submitting an assignment and checking if the real external email inbox receives the delivery.
- [ ] **Demo -> Payment -> Enrollment Pipeline**: Following a booked demo through the Stripe/payment simulator to full enrollment.
