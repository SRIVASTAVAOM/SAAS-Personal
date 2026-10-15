# School ERP - Master Implementation Roadmap to Production

**Document Version:** 1.0.0  
**Status:** Approved Master Roadmap  

---

## Roadmap Overview

```
[Milestone 1: Foundation & Dynamic Shells] (COMPLETED & VERIFIED)
       |
[Milestone 2: Audit & Master Implementation Blueprint] (COMPLETED & VERIFIED)
       |
[Milestone 3: Academic Master, Subjects & Staff/Student Rosters] (COMPLETED & VERIFIED)
       |
[Milestone 4: Attendance, Daily Operations & Leave Management] (COMPLETED & VERIFIED)
       |
[Milestone 5: Curriculum, Homework & S3 Academic Uploads] (COMPLETED & VERIFIED)
       |
[Milestone 6: Examinations, Marks & Report Cards] (COMPLETED & VERIFIED)
       |
[Milestone 7: Fee Management & Counter Collections] (NEXT RECOMMENDED)
       |
[Milestone 8: School Expenses, Day Book & General Ledger]
       |
[Milestone 9: Staff Payroll Processing & Management Approvals]
       |
[Milestone 10: Coordinator Supervision, Remedial & Activities]
       |
[Milestone 11: System Integration, Security & Performance Tuning]
       |
[Milestone 12: Production Deployment, Staging & Runbooks]
```

---

## Milestone Specifications

### Milestone 3: Academic Master, Subjects & Staff/Student Rosters
* **Status:** `COMPLETED & VERIFIED`
* **Exact Scope:** Subject management, class-subject allocations, teacher subject assignments, student roster directory views, teacher directory views, profile viewing and editing. Fix identified security defects (GoRouter cross-role guards, Base URL configuration).
* **Excluded Scope:** Attendance marking, marks entry, fee structures, payroll.
* **Screens to Build:** `StudentDirectoryScreen`, `TeacherDirectoryScreen`, `ProfileDetailScreen`, `ProfileEditScreen`.
* **Database Migrations:** `002_academic_master.sql` (`subjects`, `class_subjects`, `teacher_subject_allocations`).
* **API Contracts:** `GET /api/v1/academics/subjects`, `GET /api/v1/academics/rosters`, `PATCH /api/v1/students/profile`.
* **Authorization Rules:** Students view only their own section roster; Teachers view students in their assigned classes; Profile edit restricted to non-identity fields.
* **Acceptance Criteria:** Student can see classmates and assigned teachers; Teacher can see class rosters.
* **Definition of Done:** Automated tests pass, Flutter screens render cleanly, zero regressions.

---

### Milestone 4: Attendance, Daily Operations & Leave Management
* **Status:** `COMPLETED & VERIFIED`
* **Exact Scope:** Daily student attendance marking (authorized class teacher), duplicate prevention (`UNIQUE(student_id, attendance_date)`), student self-history view, staff own attendance view, coordinator wing staff attendance view, teacher leave application & coordinator recommendation & management approval, student leave self-application & status view.
* **Excluded Scope:** Homework uploads, exam scheduling, fee collection, payroll. Student leave approval route withheld pending client workflow confirmation; staff attendance marking role deferred pending client confirmation.
* **Screens Built:** `TeacherAttendanceMarkingView`, `StudentAttendanceHistoryView`, `TeacherOwnAttendanceView`, `CoordinatorStaffAttendanceView`, `TeacherLeaveView`, `CoordinatorLeaveReviewView`, `ManagementLeaveApprovalView`, `StudentLeaveView`.
* **Database Migrations:** `003_attendance_and_leaves.sql` (`student_attendance_records`, `staff_attendance_records`, `staff_leaves`, `student_leaves`).
* **API Contracts:** `POST /api/v1/attendance/students`, `GET /api/v1/attendance/students/history`, `GET /api/v1/attendance/staff/me`, `GET /api/v1/attendance/staff/wing`, `POST /api/v1/leaves/staff`, `PATCH /api/v1/leaves/staff/:id/recommend`, `PATCH /api/v1/leaves/staff/:id/decide`, `POST /api/v1/leaves/student`, `GET /api/v1/leaves/student/me`.
* **Authorization Rules:** Only assigned Class Teacher can mark student attendance; status strictly `PRESENT` or `ABSENT`; Coordinators recommend within wing scope; Management approves/rejects staff leaves; Students view only own attendance and leaves.
* **Acceptance Criteria:** Class teacher marks attendance; duplicate attendance on the same day is upserted safely without duplicates; invalid dates/statuses rejected; 61 backend Jest tests pass; 43 Flutter tests pass.
* **Definition of Done:** Jest and Flutter tests pass, offline/loading/error states handled, database constraints verified.

---

### Milestone 5: Curriculum, Homework & S3 Academic Uploads
* **Status:** `COMPLETED & VERIFIED`
* **Exact Scope:** Teacher homework assignment creation & management (authorized class/section/subject scope, `due_date >= assigned_date`), optional document attachments, student homework list filtered to enrolled class/section, homework detail view with completion tracking checklist (`student_homework_completions`), normalized curriculum structure (`curriculum_units`, `curriculum_topics`), academic materials upload/download via AWS S3 pre-signed URLs, server-side object key generation, MIME/size validation, two-phase upload verification (`is_verified = TRUE`), cross-class document isolation, and safe simulation fallback when AWS keys are unconfigured.
* **Excluded Scope:** Student digital homework submission uploads, homework grading/marks, late penalty rules, syllabus coordinator approval gates, online classes.
* **Screens Built:** `TeacherHomeworkManageView`, `StudentHomeworkView`, `AcademicMaterialsView`, `CurriculumView` with connected subtabs in `StudentShell`, `TeacherShell`, and `CoordinatorShell`.
* **Database Migrations:** `004_curriculum_homework_materials.sql` (`curriculum_units`, `curriculum_topics`, `homework_assignments`, `student_homework_completions`, `academic_materials`, plus 8 indexes).
* **API Contracts:** `POST /api/v1/homework`, `GET /api/v1/homework`, `GET /api/v1/homework/:id`, `PATCH /api/v1/homework/:id/toggle-completion`, `GET /api/v1/curriculum`, `POST /api/v1/curriculum/units`, `POST /api/v1/curriculum/topics`, `POST /api/v1/materials/presigned-upload`, `POST /api/v1/materials/confirm-upload`, `GET /api/v1/materials`, `GET /api/v1/materials/:id/download`.
* **Authorization Rules:** Teachers assign homework & upload materials only for their authorized class/section/subject allocations; Students view homework & materials only for their enrolled class/section; pre-signed download URLs generated only for authorized users with short 15-minute expiry.
* **Acceptance Criteria:** Teacher assigns homework; student toggles completion; unauthorized cross-class access rejected with 403; file uploads validated (<10MB, PDF/PNG/JPEG); dual-mode S3 service handles presigned URLs and safe mock simulation; 85 backend Jest tests pass; 62 Flutter tests pass; clean static analysis (0 issues).
* **Definition of Done:** 10 backend Jest test suites green; 15 Flutter test suites green; `flutter analyze` 0 issues; zero raw S3 keys exposed to clients.

---

### Milestone 6: Examinations, Marks Entry, Verification & Report Cards
* **Status:** `COMPLETED & VERIFIED`
* **Exact Scope:** Examination setup and wing-scoped datesheet generation, teacher marks entry with allocation check and max mark validation, explicit absent handling (`is_absent = true` with null marks) and missing mark tracking, tamper-evident audit history (`exam_marks_audit`), coordinator statistical analysis and marks verification (`status = 'VERIFIED'`), class teacher report card generation with authoritative server-side totals and exact percentage calculation, coordinator report card approval (`status = 'APPROVED'`), publication control gate (`is_published = true`), and student self-result viewing restricted to published and approved exams.
* **Excluded Scope:** Unconfirmed letter grade boundaries (A/B/C/D), passing thresholds, weighted annual term aggregation, automated invigilation scheduling, online fee payment, payroll.
* **Screens Built:** `ExamDatesheetView`, `TeacherMarksEntryView`, `CoordinatorMarksReviewView`, `ClassReportCardsView`, `StudentResultView`, and `ExamsListView` with connected subtabs in `StudentShell`, `TeacherShell`, and `CoordinatorShell`.
* **Database Migrations:** `005_examinations_and_report_cards.sql` (`exams`, `exam_datesheets`, `exam_marks`, `exam_marks_audit`, `report_cards`, plus 9 indexes).
* **API Contracts:** `POST /api/v1/exams`, `GET /api/v1/exams`, `POST /api/v1/exams/:id/datesheets`, `GET /api/v1/exams/:id/datesheets`, `GET /api/v1/exams/:id/datesheets/student/my-class`, `GET /api/v1/exams/:id/datesheets/:datesheetId/marks-roster`, `POST /api/v1/exams/:id/datesheets/:datesheetId/marks`, `GET /api/v1/exams/:id/datesheets/:datesheetId/summary`, `PATCH /api/v1/exams/:id/datesheets/:datesheetId/verify`, `POST /api/v1/exams/:id/report-cards/class/:classId/:sectionId`, `GET /api/v1/exams/:id/report-cards/class/:classId/:sectionId`, `PATCH /api/v1/exams/:id/report-cards/class/:classId/:sectionId/approve`, `PATCH /api/v1/exams/:id/publish`, `GET /api/v1/exams/:id/results/student/my-result`.
* **Authorization Rules:** Teachers enter marks only for their assigned subjects and classes; Coordinators verify marks and approve report cards within their assigned wing scope; Class teachers generate report cards for their assigned class/section; Students view results only for their own records and only when the exam is approved and published.
* **Acceptance Criteria:** Full lifecycle verified end-to-end: exam setup, collision checks, teacher allocation guards, max marks validation, absent handling, audit logging, coordinator verification, authoritative report card calculations, approval, publication control, student self-access.
* **Definition of Done:** 11 backend Jest test suites green (108/108 passed); 16 Flutter test suites green (81/81 passed); `flutter analyze` 0 issues; TypeScript build clean (`npm run build` exits 0).

---

### Milestone 7: Fee Management & Counter Cash/Bank Collections
* **Exact Scope:** Fee structure setup, installment dues calculation, Accountant counter collection (Cash, Cheque, Card swipe reference, Counter UPI reference), instant receipt generation, duplicate receipts, refunds, fee defaulters tracking, student fee receipt view.
* **Excluded Scope:** In-app payment gateway SDK (Deferred), automated SMS reminders (Deferred).
* **Screens to Build:** `FeeCounterScreen`, `ReceiptPreviewScreen`, `DefaultersListScreen`, `StudentFeesScreen`.
* **Database Migrations:** `006_fees_and_collections.sql` (`fee_heads`, `fee_structures`, `student_fee_dues`, `fee_receipts`, `fee_receipt_items`, `fee_refunds`).
* **API Contracts:** `POST /api/v1/finance/collect-fee`, `GET /api/v1/finance/defaulters`, `GET /api/v1/finance/receipts/:id`.
* **Authorization Rules:** Only `ACCOUNTANT` role can collect fees and issue receipts; Student views only their own fee receipts.
* **Acceptance Criteria:** Row-level locking on receipt number generation; ACID transaction ensures dues are decremented atomically with receipt creation.
* **Definition of Done:** Concurrency test with simultaneous payments passes; PDF receipt generation verified.

---

### Milestone 8: School Expenses, Day Book, General Ledger & Reconciliation
* **Exact Scope:** Expense voucher recording, vendor payments, petty cash management, daily cash/bank Day Book, general ledger, cheque tracker, bank statement reconciliation, financial exports (Excel & PDF).
* **Excluded Scope:** Automated bank feed scraping.
* **Screens to Build:** `ExpenseEntryScreen`, `DayBookScreen`, `LedgerViewScreen`, `BankReconciliationScreen`, `ExportReportScreen`.
* **Database Migrations:** `007_expenses_and_ledgers.sql` (`expenses`, `expense_vouchers`, `day_book_entries`, `bank_reconciliations`, `cheque_tracker`).
* **API Contracts:** `POST /api/v1/finance/expenses`, `GET /api/v1/finance/day-book`, `GET /api/v1/finance/export/excel`.
* **Authorization Rules:** `ACCOUNTANT` access only; double-entry validation enforced on all voucher entries.
* **Acceptance Criteria:** Total cash in hand matches day book calculation; bank reconciliation marks cheques cleared.
* **Definition of Done:** Financial reports export cleanly to `.xlsx` and `.pdf` with exact numerical reconciliation.

---

### Milestone 9: Staff Payroll Processing & Management Approvals
* **Exact Scope:** Staff salary structures, attendance-linked monthly salary calculation (working days, loss of pay, deductions, advances), salary slips generation, Accountant payroll submission, **Management Payroll Approval Gate**, staff salary slip viewing.
* **Excluded Scope:** Direct bank API disbursement (manual NEFT/cheque batch list generated).
* **Screens to Build:** `PayrollProcessingScreen`, `SalarySlipDetailScreen`, `ManagementPayrollApprovalScreen`.
* **Database Migrations:** `008_payroll_system.sql` (`salary_structures`, `payroll_runs`, `salary_slips`).
* **API Contracts:** `POST /api/v1/payroll/calculate`, `POST /api/v1/management/payroll/:id/approve`, `GET /api/v1/payroll/slip/:id`.
* **Authorization Rules:** Accountant calculates and submits; only `MANAGEMENT` can approve; Staff can only view their own salary slips.
* **Acceptance Criteria:** Attendance deductions link directly to Milestone 4 staff attendance records; Management approval changes status to `APPROVED_BY_MANAGEMENT`.
* **Definition of Done:** Payroll calculations verified against mathematical edge cases; unapproved payroll cannot be disbursed.

---

### Milestone 10: Coordinator Supervision, Remedial & Activities
* **Exact Scope:** Wing attendance and syllabus tracking, teacher leave recommendations, weak-student identification, remedial class tracking, student discipline incident records, official circulars, PTM scheduling.
* **Excluded Scope:** Public social media postings.
* **Screens to Build:** `WingOverviewDashboard`, `RemedialTrackerScreen`, `DisciplineLogScreen`, `CircularsManageScreen`.
* **Database Migrations:** `009_coordinator_and_welfare.sql` (`discipline_records`, `weak_student_trackings`, `circulars`, `ptm_schedules`).
* **API Contracts:** `GET /api/v1/coordinator/wing-overview`, `POST /api/v1/coordinator/remedial`, `POST /api/v1/coordinator/circulars`.
* **Authorization Rules:** `COORDINATOR` operates strictly on their assigned `wing_id`; teachers and students receive circulars based on target audience.
* **Acceptance Criteria:** Coordinator recommends teacher leave to Management; Management sees recommended queue; remedial student progress tracked.
* **Definition of Done:** All coordinator supervisory workflows verified with cross-role handoffs.

---

### Milestone 11: System Integration, Security & Performance Tuning
* **Exact Scope:** Cross-role end-to-end integration testing, comprehensive immutable audit logging (`audit_logs`), rate-limiting, SQL query optimization and database indexing, mobile offline resilience and token refresh handling, responsive tablet/mobile screen auditing.
* **Excluded Scope:** New feature additions.
* **Database Migrations:** `010_audit_logging.sql` (`audit_logs`).
* **Tasks:** Automated penetration tests for RBAC bypass, load testing API endpoints, database index analysis (`EXPLAIN ANALYZE`).
* **Acceptance Criteria:** 100% test pass rate across end-to-end user journeys; zero unauthorized data access; API p95 response time < 150ms.
* **Definition of Done:** Performance benchmarks met; security audit checklist signed off.

---

### Milestone 12: Production Readiness, Staging Deployment & Runbooks
* **Exact Scope:** Staging environment deployment, production database migration verification, automated backup and point-in-time restore drills, SSL/TLS certificate enforcement, production environment variables configuration, release build generation (Android App Bundle & iOS archive), operational runbooks.
* **Deliverables:** Production deployment runbook, database recovery guide, user training manuals.
* **Acceptance Criteria:** Staging tests 100% green; database backup and restore verified; production builds signed and verified.
* **Definition of Done:** Production launch approval.
