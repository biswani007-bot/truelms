# TrueLern — Client Demonstration Meeting Script (15–25 Minutes)

This script is structured for an executive, client-facing walkthrough of the TrueLern LMS platform during a screen-sharing conference.

---

## Part 1: Executive Introduction (2 Minutes)
**Speaker (Presenter):**
> *"Welcome everyone. Today we are demonstrating TrueLern — an enterprise-grade, integrated Learning Management and Academic Operations platform. TrueLern unifies the entire educational journey: from prospective learner inquiry and admissions, to faculty-led live classrooms, multi-ward guardian portals, and automated academic record tracking."*

---

## Part 2: Administration & Operations Hub (4 Minutes)
**Action:**
1. Open Browser Window 1.
2. Log in with **Admin credentials**: `admin@truelern.com` / `password123`.
3. Arrive at `/admin` (Executive Dashboard).

**Speaker:**
> *"Here in the Admin Operations Hub, academic managers have 360-degree visibility over all cohorts, faculty members, active enrollments, and tuition billing. Every action is backed by real-time MongoDB Atlas persistence and strong role-based security."*

**Highlight:**
- Show **Courses & Batches**: Point to *Junior Foundation Academy* and *Full Stack Engineering*.
- Show **Students & Parents**: Point out how parent profiles link directly to one or more enrolled children.

---

## Part 3: CRM & Admissions Pipeline (3 Minutes)
**Action:**
1. Navigate to **CRM / Admissions Leads** in the Admin sidebar.
2. Show verified leads (e.g. `LED-1011`).

**Speaker:**
> *"When parents or students request a demo on the public portal, their inquiry instantly converts into an admissions lead. Counselors can schedule trial sessions, complete evaluations, and immediately enroll students into active batches without duplicate data entry."*

---

## Part 4: Faculty Live Classroom Portal (3 Minutes)
**Action:**
1. Open Browser Window 2 (or Incognito).
2. Log in with **Teacher credentials**: `teacher@truelern.com` / `password123`.
3. Arrive at `/teacher/dashboard`.

**Speaker:**
> *"Now let's switch to the Teacher view. Instructors see their assigned cohorts, attendance summaries, upcoming lectures, and grading queues. Notice the scheduled live session: 'Live Demo — Communication & Confidence'."*

---

## Part 5: Student Learning Portal (3 Minutes)
**Action:**
1. Open Browser Window 3 (or separate profile/device).
2. Log in with **Student credentials**: `student@truelern.com` / `password123`.
3. Arrive at `/student/dashboard`.

**Speaker:**
> *"Here is the Student Portal for Alex Mercer. The student has immediate visibility into upcoming live classes, active assignments, course syllabus, and lecture recordings. Students don't have to fiddle with external Zoom or Google Meet links — everything is seamlessly integrated into their schedule."*

---

## Part 6: Real-Time Two-Person Live Class Demo (5 Minutes) — *KEY MOMENT*
**Action:**
1. In the **Teacher window**, click **Join Live Class**.
2. The server issues a secure moderator JWT token and launches the integrated Jitsi Meet room (`truelern-6a8bcddbf8996599bd9cdf90`).
3. In the **Student window**, click **Join Live Class**.
4. The server validates Alex Mercer's active batch enrollment, issues a participant JWT, and joins the exact same room.
5. Demonstrate:
   - Teacher and Student see each other in the participant roster.
   - Two-way audio and video stream.
   - Teacher has moderator controls (mute, recording, screen sharing).
6. Click **Leave Room** in both windows to return cleanly to the respective LMS dashboards.

**Speaker:**
> *"As you can see, both the instructor and student joined the encrypted, self-hosted classroom instantly with zero third-party software installation. The room identity and access permissions are authoritatively governed by our backend API."*

---

## Part 7: Parent / Guardian Multi-Ward Portal (3 Minutes)
**Action:**
1. In a browser window, log in as **Parent**: `parent@truelern.com` / `password123`.
2. Arrive at `/parent/dashboard`.
3. Show the **Child Switcher** dropdown (Alex Mercer vs. Mia Mercer).

**Speaker:**
> *"Finally, parents have a dedicated portal to track their children's progress. Guardians can switch between multiple enrolled siblings, monitor attendance percentage, review completed assessments with sanitized scoring, and inspect tuition fee balances."*

---

## Part 8: Closing & Future-Ready Architecture (2 Minutes)
**Speaker:**
> *"The core LMS platform is fully operational, provider-neutral, and ready for production deployment. In subsequent phases, automated payment gateways and multi-channel notification providers can be connected seamlessly. Thank you, and we'd love to answer any questions."*
