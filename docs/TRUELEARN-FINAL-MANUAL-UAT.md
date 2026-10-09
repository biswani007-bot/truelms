# TRUELEARN FINAL MANUAL UAT MATRIX

| ID | ROLE | SCREEN | ACTION | EXPECTED RESULT | ACTUAL RESULT | STATUS |
|---|---|---|---|---|---|---|
| 01 | PUBLIC | Demo / Course Page | Book a demo | Demo is booked, Lead created | | NOT VERIFIED |
| 02 | PARENT | Dashboard | Switch child context | Dashboard metrics update strictly for selected child | | NOT VERIFIED |
| 03 | PARENT | Assignments | View pending assignment | Instructions, due date, and attachments visible | | NOT VERIFIED |
| 04 | PARENT | Assignments | Submit assignment | File uploads or link submission saves successfully | | NOT VERIFIED |
| 05 | TEACHER | Assignment Review | Open submission | Exact files/links submitted by parent are visible | | NOT VERIFIED |
| 06 | TEACHER | Assignment Review | Evaluate submission | Enter score, grade, feedback and publish | | NOT VERIFIED |
| 07 | PARENT | Assignments | View evaluated assignment | Score, grade, and teacher feedback exactly match | | NOT VERIFIED |
| 08 | TEACHER | Assessments | Grade assessment | Score and status correctly saved | | NOT VERIFIED |
| 09 | PARENT | Assessments | View assessment | Score, grade, and status correctly match lifecycle | | NOT VERIFIED |
| 10 | TEACHER | Live Classes | Join Studio | Jitsi room opens, teacher is moderator | | NOT VERIFIED |
| 11 | PARENT | Live Classes | Join Class | Same Jitsi room opens, parent/student is participant | | NOT VERIFIED |
| 12 | TEACHER | Live Classes | End Class | Attendance logs accurately update for both child and teacher | | NOT VERIFIED |
| 13 | PARENT | Attendance | View Attendance | Shows exactly the updated records, "--" for no classes | | NOT VERIFIED |
| 14 | TEACHER | Messages | New Conversation | Correctly resolves parent for chosen student | | NOT VERIFIED |
| 15 | PARENT | Messages | Reply | Thread continues strictly within authorized context | | NOT VERIFIED |
| 16 | PARENT | Notifications | Trigger event | Correct notification received, no cross-parent leakage | | NOT VERIFIED |
| 17 | ADMIN | Dashboard/Lists | View records | Sees exact same records accessed by Teacher and Parent | | NOT VERIFIED |
| 18 | ALL | Empty States | View empty grids | Clear honest empty state, no "100%" or "General Course" | | NOT VERIFIED |
| 19 | ALL | Mobile Smoke Test | Resize viewport | Core UX flows work on mobile and tablet resolutions | | NOT VERIFIED |
