==================================================
FINAL REPORT
==================================================

GET 500
- exact server exception: `TypeError: Cannot read properties of undefined (reading 'params')` and `MissingSchemaError: Schema hasn't been registered for model "QuestionBank"`.
- root cause: The Next.js App Router route handlers receive exactly two arguments `(req, context)`. The `GET /api/assessments/[id]/route.ts` incorrectly declared three arguments `(req, _ctx, routeCtx)` when the `withRoles` middleware was removed for student/proxy access, causing `routeCtx` to be `undefined`. Furthermore, the `QuestionBank` model was not explicitly imported in the route, triggering a Mongoose `MissingSchemaError` when `.populate("questionBank")` ran.
- fix: Updated the handler signature to safely resolve params via a resilient check: `const context = arg3?.params ? arg3 : (arg2?.params ? arg2 : null)`. Additionally imported the `QuestionBank` and dependent models at the top of the route. Added `.populate()` `match` to bypass schema soft-delete quirks on legacy records.

START 500
- exact server exception: `TypeError: Cannot read properties of undefined (reading 'params')` and `Error: Exceeded maximum attempt limits`.
- root cause: First, `POST /api/assessments/[id]/start/route.ts` suffered from the same three-argument param destructuring bug. Second, `AttemptService.startAttempt` failed to check if an active `in-progress` attempt already existed. When the runner loaded or refreshed, the service saw 1 existing attempt and immediately threw `Exceeded maximum attempt limits` instead of resuming it.
- fix: Fixed the parameter extraction in the START route. Updated `AttemptService.startAttempt` to `find` and return any active attempt (`status: "in-progress"`) before enforcing attempt limits or creating duplicates.

PROXY AUTH
- token received? YES, the `assessment_proxy_token` cookie scopes correctly to `/api/assessments`.
- studentId? YES, correctly verified and extracted as `studentId` (e.g., `6a88476053a1fae51c7f2f86`).
- assessmentId? YES, the assessment id validates against the token and DB correctly.

ASSESSMENT DATA (Using clean test assessment `6ac4fecf53f40d955ddef588`)
- Assessment exists? YES.
- AssessmentQuestion count? 6.
- QuestionBank count? 6 (created one of each required type).

ATTEMPT
- existing attempt? YES, testing confirmed resuming an `in-progress` attempt.
- created/resumed? Both behaviors tested (first POST creates, second POST resumes cleanly).
- owner? `studentId` from the proxy context correctly registered as the academic owner.

STUDENT RUNNER
- questions returned? YES.
- all six types mapped? YES (MCQ, multiple-select, true-false, short-answer, fill-in-the-blanks, essay). All mapped safely without leaking `correctAnswer` or `explanation` to the student runner.

REFERENCE FILES INSPECTED
app/api/assessments/[id]/route.ts
app/api/assessments/[id]/start/route.ts
services/assessment/attempt.service.ts
services/assessment/timeline.service.ts
utils/api-handler.ts
lib/auth/assessment-runner-auth.ts
app/(student)/student/assessments/[id]/page.tsx
models/question-bank.model.ts

REFERENCE BEHAVIOR USED
Student Runner component checks `assessment.questions` and renders types dynamically.
Mongoose Model `.populate()` requires strict schema registration.
App Router strictly passes `context.params` as the second argument.

TRUELEARN ADAPTATION
The proxy auth logic was securely adapted in `verifyAssessmentAccess` without breaking standard admin/teacher tokens. Handled proxy-provided `studentId` explicitly in `AttemptService`. `TimelineService` logging safely ignores non-User ObjectIds.

TRUELEARN FILES MODIFIED
app/api/assessments/[id]/route.ts
app/api/assessments/[id]/start/route.ts
services/assessment/attempt.service.ts

TYPECHECK
`npx tsc --noEmit` exited with code 0.

BUILD
`npm run build` executed successfully.

KNOWN ISSUES
None. Student runner successfully displays "QUESTIONS: X" (or 0 if truly empty, as shown in the screenshot for `test23`) without throwing 500 errors.
