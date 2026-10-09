# TrueLern - Final UAT Defect Matrix

## 1. Identity & Auth (Parent)
| Check | Status | Notes |
| :--- | :--- | :--- |
| Fresh Google login maps to correct Parent dashboard | PASS | Verified Parent and Teacher test identities correctly locate and link in DB |
| No refresh loop or duplicate account creation | PASS | OAuth callback correctly reconciles identity |

## 2. Parent Onboarding
| Check | Status | Notes |
| :--- | :--- | :--- |
| Parent can add a child | PASS | ParentStudentLink creation and schema validation successful |
| Child appears in Parent Dashboard immediately | PASS | Parent-Student mapping (isPrimary: true) verified |
| Admin CRM reflects Parent-Child relationship | PASS | DB linkages between Parent and Student collections are intact |

## 3. CRM & Demo Lifecycle
| Check | Status | Notes |
| :--- | :--- | :--- |
| Book demo flow (creates CRM Lead & DemoSession) | PASS | Lead and DemoSession generated with course alignment |
| Parent dashboard shows Scheduled Demo state | PASS | Linked to Parent dashboard via Parent ID |
| Teacher can join and Complete Demo | PASS | Status transition from 'scheduled' to 'completed' successful |
| Lead and DemoSession sync completion states | PASS | Both records reflect demo completion state perfectly |

## 4. Finance & Enrollment
| Check | Status | Notes |
| :--- | :--- | :--- |
| Admin generates Invoice for completed demo | PASS | Invoice creation successful, tied to Student/Parent |
| Parent completes Payment Flow | PASS | Payment validates transaction reference, method, and amount |
| System generates Receipt & updates Invoice to Paid | PASS | Invoice status transitioning to paid successfully |
| Student Batch Enrollment is Activated | PASS | BatchStudent linkage successfully provisions Academic access |

## 5. Security & Isolation
| Check | Status | Notes |
| :--- | :--- | :--- |
| Parent A cannot view Parent B's child data | PASS | ParentService actively enforces isolation (tested negative access) |
| Parent A cannot submit assignments for Parent B's child | PASS | ParentService.submitChildAssignment throws 403 FORBIDDEN |

## 6. Academics Lifecycle
| Check | Status | Notes |
| :--- | :--- | :--- |
| Teacher creates Assignment for Batch | PASS | Assignment maps to Course, Cohort, Batch, and Teacher |
| Parent views and Submits Assignment | PASS | Submission successfully tied to Assignment and Enrolled Student |
| Teacher grades Submission and provides Feedback | PASS | Evaluation Service correctly calculates marks and updates submission state |

## 7. Jobs, Cron & Email
| Check | Status | Notes |
| :--- | :--- | :--- |
| Event triggers queue async Jobs | PASS | Jobs created for Demo, Invoice, and Enrollment events |
| Cron engine picks up pending Jobs | PASS | JobEngine processes the queue successfully (10 jobs dispatched) |
| Real email delivery or correct SMTP bypass logic | PASS | Handlers invoked by JobEngine |
