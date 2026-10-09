# TrueLern — Client Demonstration Verification Checklist

Use this checklist during pre-flight checks and live screen-sharing meetings with clients or stakeholders.

---

## 1. Pre-Flight Server & Connectivity Checks
- [x] **Production / Staging LMS URL Accessible**: `http://localhost:3000` (or `https://lms.truelern.com`) responds HTTP 200.
- [x] **MongoDB Atlas Connection Active**: Real-time read/write to `cluster0.9rxjj.mongodb.net/lmsca`.
- [x] **Docker / Jitsi Services Running**: Jitsi Web, Prosody, Jicofo, and JVB active on ports 8080/8443.
- [x] **No Broken Localhost API Dependencies**: Calendar ICS and API URLs resolve dynamically via `NEXT_PUBLIC_APP_URL`.

---

## 2. Multi-Portal Authentication & Role-Based Redirects
- [x] **Admin Login**: `admin@truelern.com` / `password123` → Redirects cleanly to `/admin`.
- [x] **Teacher Login**: `teacher@truelern.com` / `password123` → Redirects cleanly to `/teacher/dashboard`.
- [x] **Student Login**: `student@truelern.com` / `password123` → Redirects cleanly to `/student/dashboard`.
- [x] **Parent Login**: `parent@truelern.com` / `password123` → Redirects cleanly to `/parent/dashboard`.
- [x] **Parent-Child Link Verification**: Parent Marcus Mercer sees linked wards (Alex Mercer & Mia Mercer) with real aggregated attendance, batches, and live class metrics.

---

## 3. Operations & Admissions Pipeline
- [x] **Public Demo / Lead Submission**: `POST /api/public/lead` creates verified lead records (`LED-10xx`).
- [x] **Admin CRM Workflow**: Admin views incoming leads, updates status (`demo_scheduled` → `enrolled`).
- [x] **Cohort & Batch Assignment**: Student assigned to batch with assigned instructor.

---

## 4. Live Classroom Demonstration (Deterministic Dataset)
- [x] **Live Class Entity**: `LVC-DEMO-2026` (*Live Demo — Communication & Confidence*) scheduled in database.
- [x] **Teacher Visibility**: Teacher Elizabeth Vance sees the scheduled class in `/teacher/dashboard` and `/api/live-classes`.
- [x] **Student Visibility**: Enrolled Student Alex Mercer sees the class in `/student/dashboard`.
- [x] **Jitsi Token Generation (Teacher / Moderator)**: Generates JWT with `isModerator: true` for room `truelern-6a8bcddbf8996599bd9cdf90`.
- [x] **Jitsi Token Generation (Student / Attendee)**: Generates JWT with `isModerator: false` for same room `truelern-6a8bcddbf8996599bd9cdf90`.
- [x] **Two-Person Classroom Entry**: Teacher and student enter the same room with working audio, video, and screen sharing.
- [x] **Classroom Exit & Return**: Leaving room redirects cleanly back to LMS dashboard.

---

## 5. Deferred Third-Party Integrations
- [x] **Provider Neutrality**: Payment invoices, student records, and notifications function completely without live Stripe, external SMS, or external SMTP dependencies.
