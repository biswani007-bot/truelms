# Mobile API Contract & Audit

## Status Legend
- **IMPLEMENTED**: New API added
- **FIXED**: Existing API modified
- **EXTENDED**: Existing API supplemented
- **REUSED**: Existing API retained as-is
- **NOT REQUIRED**: Omitted intentionally based on review
- **HOLD**: Deferred intentionally (e.g. separate student auth)

## Parent Profile
- **Endpoint**: \`GET /api/parent/profile\`
- **Status**: IMPLEMENTED
- **Purpose**: Returns authenticated Parent context.

## Child Schedule
- **Endpoint**: \`GET /api/parent/children/[id]/schedule\`
- **Status**: IMPLEMENTED
- **Purpose**: Retrieves dynamic program and live-class schedules bounded by enrollment batches.

## Class Summary
- **Endpoint**: \`GET /api/parent/children/[id]/classes/[classId]/summary\`
- **Status**: IMPLEMENTED
- **Purpose**: Retrieves post-class information and attendance status.

## Current Program
- **Endpoint**: \`GET /api/parent/children/[id]/program\`
- **Status**: IMPLEMENTED
- **Purpose**: Extracts real enrolled course topics and quantitative progress (assignments completed vs total).

## Topic Detail
- **Endpoint**: \`GET /api/parent/children/[id]/topics/[topicId]\`
- **Status**: IMPLEMENTED
- **Purpose**: Context endpoint confirming enrollment in course module.

## Progress
- **Endpoint**: \`GET /api/parent/children/[id]/progress\`
- **Status**: IMPLEMENTED
- **Purpose**: Exposes overall completion (assignments + classes attended).

## Skills
- **Endpoint**: \`GET /api/parent/children/[id]/skills\`
- **Status**: IMPLEMENTED
- **Purpose**: Aggregates skills listed in the actual enrolled course's outcomes.

## Certificates
- **Endpoint**: \`GET /api/parent/children/[id]/certificates\`
- **Status**: IMPLEMENTED
- **Purpose**: Read-only wrapper over Certificate models matching child.

## Invoices
- **Endpoint**: \`GET /api/parent/children/[id]/invoices\`
- **Status**: IMPLEMENTED
- **Purpose**: Read-only wrapper over Finance models matching child.

## Assignments
- **Endpoint**: \`GET /api/parent/children/[id]/assignments\`
- **Status**: REUSED
- **Purpose**: ParentService already returns all assignments.

- **Endpoint**: \`GET /api/parent/children/[id]/assignments/[assignmentId]\`
- **Status**: IMPLEMENTED
- **Purpose**: Specific assignment extraction.

- **Endpoint**: \`PUT /api/parent/children/[id]/assignments/[assignmentId]/draft\`
- **Status**: IMPLEMENTED
- **Purpose**: Safely persists AssignmentSubmission as status "draft" before final evaluation.

- **Endpoint**: \`PUT /api/parent/children/[id]/assignments/[assignmentId]/submission\`
- **Status**: REUSED
- **Purpose**: Final submission continues to be governed by \`SubmissionService\`.

## Authentication (Student)
- **Status**: HOLD
- **Purpose**: Student login functionality explicitly excluded.

## Progress Gamification
- **Status**: HOLD
- **Purpose**: Fake percentages, badges, leaderboards explicitly omitted.
