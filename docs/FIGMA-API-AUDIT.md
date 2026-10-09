# Figma API Audit

## Overview
This document audits the Figma UI screens against the actual backend logic.

## Parent Dashboard / Mobile
- **Child Schedule**: Verified `LiveClass` relationships through `BatchStudent`. API `GET /api/parent/children/[id]/schedule` uses real date filters and joins.
- **Progress Ring**: Derived strictly from `completedAssignments` + `attendedClasses` vs `totalAssignments` + `totalClasses`. No hardcoded percentages.
- **Skills Area**: Extracted directly from `course.outcomes.skills` of active enrollments.
- **Certificates**: Authenticated `CertificateService` correctly bounds responses.

## Teacher Dashboard
- **Schedules**: Bound strictly by `batchTeacher`. 
- **Assignments**: Evaluation workflow uses proper ownership checks. No arbitrary cross-teacher evaluation.

## Admin Dashboard
- **Consistency**: Admin APIs for scheduling properly feed the `LiveClass` documents which are correctly rendered in Parent and Teacher flows.
- **No Duplicate Logic**: Relying entirely on existing Admin endpoints without parallel data sets.

## Security Constraints Enforced
- Parent boundaries enforced by `authorizeChildAccess`.
- Cross-child assignment and invoice lookups reject with `403/404`.
- Student explicit authentication is omitted (HOLD).
