# School ERP - Requirements Traceability Matrix (RTM)

**Document Version:** 1.0.0  
**Status:** Milestone 2 Baseline  

---

## Legend & Status Definitions

* **VERIFIED:** Implemented, covered by automated test suites, and verified in active runtime.
* **INCOMPLETE:** Core scaffolding or partial implementation exists; awaiting full module delivery.
* **NOT IMPLEMENTED:** Planned and mapped to architecture; UI currently displays placeholder shell; backend and database tables pending future milestones.
* **DEFERRED:** Explicitly put on hold awaiting client decision or vendor selection.

---

## 1. Authentication & Common Platform Features

| ID | Feature Name | Role | Expected Outcome | Frontend Screen | Backend Endpoint | Database Entities | Data Scope & Auth | Validation Rules | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Multi-Role Login | All Roles | User authenticates via identifier and password; receives signed JWT with roles and scope. | `LoginScreen` | `POST /api/v1/auth/login` | `users`, `user_roles`, `roles` | Public endpoint; returns token with claims | Non-empty identifier & password; bcrypt compare | **VERIFIED** |
| **AUTH-02** | Profile Verification | All Roles | App verifies active session and retrieves user profile. | Root Router | `GET /api/v1/auth/me` | `users`, `staff_profiles`, `student_profiles` | Bearer JWT required | Token signature and expiry valid | **VERIFIED** |
| **AUTH-03** | Secure Token Storage | All Roles | JWT persists securely across app launches. | Core Storage | Client-side only | Secure Keychain / EncryptedSharedPreferences | Hardware encrypted | Token non-empty | **VERIFIED** |
| **AUTH-04** | Role Navigation Shells | All Roles | Dynamic dashboard displays based on authenticated role. | `*Shell` | Client-side GoRouter | N/A | Dynamic auth guard | Valid role in token | **VERIFIED** |
| **AUTH-05** | Secure Session Logout | All Roles | User clears session token and returns to login screen. | All Shells AppBar | Client-side only | Local storage cleared | Token deleted from device | Local cleanup | **VERIFIED** |

---

## 2. Student Role Features

| ID | Feature Name | Expected Outcome | Frontend Screen | Backend Endpoint | Database Entities | Data Scope & Auth | Validation & Error States | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **STU-01** | Student Attendance View | View monthly/daily attendance status and percentage. | `StudentAttendanceHistoryView` | `GET /api/v1/attendance/student/my-history` | `student_attendance_records` | `STUDENT`; scoped to `student_id = req.user.profileId` | 403 on cross-student access | M4 (Attendance) | **VERIFIED** |
| **STU-02** | Homework Assignments View | View homework for enrolled class/section, due dates, completion toggle. | `StudentHomeworkView` | `GET /api/v1/homework/student/my-class` & `POST /api/v1/homework/:id/completion` | `homework_assignments`, `student_homework_completions` | `STUDENT`; scoped to enrolled `class_id`, `section_id` | Completion toggle PENDING/COMPLETED | M5 (Homework) | **VERIFIED** |
| **STU-03** | Examination Results & Marks | View authoritative subject marks, totals, and percentages once published. | `StudentResultView` | `GET /api/v1/exams/:id/results/student/my-result` | `exam_marks`, `report_cards`, `exams` | `STUDENT`; scoped to `student_id = req.user.profileId` | Exam published; 403 on unpublished or others | M6 (Exams) | **VERIFIED** |
| **STU-04** | Examination Datesheet | View schedule, timings, and max marks for upcoming exams. | `ExamDatesheetView` | `GET /api/v1/exams/:id/datesheets/student/my-class` | `exam_datesheets`, `exams` | `STUDENT`; scoped to student's enrolled `class_id` | Datesheet published | M6 (Exams) | **VERIFIED** |
| **STU-05** | Notices & Circulars | Read school-wide and wing circulars. | `StudentNoticesScreen` | `GET /api/v1/students/notices` | `circulars`, `circular_recipients` | `STUDENT`; scoped to school and wing | Active circulars only | M10 (Circulars) | **NOT IMPLEMENTED** |
| **STU-06** | Fee Receipts & Ledger | View payment history and download receipt PDFs. | `StudentFeesScreen` | `GET /api/v1/students/fee-receipts` | `fee_receipts`, `fee_receipt_items` | `STUDENT`; scoped to `student_id = req.user.profileId` | Receipt belongs to authenticated student | M7 (Fees) | **NOT IMPLEMENTED** |
| **STU-07** | Academic Material Downloads | Access syllabus and study resources securely from S3. | `AcademicMaterialsView`| `GET /api/v1/materials/class/:classId/:subjectId` & `GET /api/v1/materials/:id/download-url` | `academic_materials` | `STUDENT`; presigned GET URL generated | S3 short-lived signed URL; class-scoped | M5 (Uploads) | **VERIFIED** |
| **STU-08** | Class Roster & Classmates | View list of classmates in current section. | `StudentRosterView` | `GET /api/v1/academics/class-roster/:classId/:sectionId` | `student_profiles`, `sections` | `STUDENT`; scoped to current `class_id`, `section_id` | Class section mapped | M3 (Roster) | **VERIFIED** |
| **STU-09** | Teacher Directory | View subject teachers and class teacher contacts. | `SubjectTeachersView` | `GET /api/v1/academics/subject-teachers` | `staff_profiles`, `staff_assignments` | `STUDENT`; scoped to assigned teachers | Staff active | M3 (Roster) | **VERIFIED** |
| **STU-10** | Student Profile Update | Update permitted profile fields (e.g., emergency phone). | `StudentProfileView` | `PATCH /api/v1/profiles/student` | `student_profiles` | `STUDENT`; scoped to `student_id = req.user.profileId` | Valid phone format; restricted fields immutable | M3 (Profiles) | **VERIFIED** |
| **STU-11** | Leave Application | Submit leave request with dates and reasons. | `StudentLeaveView` | `POST /api/v1/leaves/student` & `GET /api/v1/leaves/student/my-leaves` | `student_leaves` | `STUDENT`; scoped to `student_id = req.user.profileId` | `start_date <= end_date`; reason non-empty | M4 (Leaves) | **VERIFIED** |
| **STU-12** | Grievance / Complaint | Submit grievance or feedback to school authority. | `StudentComplaintScreen` | `POST /api/v1/students/complaints`| `complaints` | `STUDENT`; scoped to authenticated student | Category required; message non-empty | M10 (Complaints) | **NOT IMPLEMENTED** |
| **STU-13** | Birthdays Calendar | View birthdays of classmates in current month. | `BirthdaysScreen` | `GET /api/v1/students/birthdays` | `student_profiles` | `STUDENT`; scoped to current section | Day/Month extracted from DOB | M3 (Roster) | **NOT IMPLEMENTED** |
| **STU-14** | School Contact Details | View official school phone, email, and address. | `SchoolContactsScreen` | `GET /api/v1/school/info` | `schools` | `STUDENT`; scoped to `school_id` | Active school record | M3 (Master) | **NOT IMPLEMENTED** |
| **STU-15** | Online Fee Payment | Pay school dues directly within mobile app. | `OnlineFeePaymentScreen` | `POST /api/v1/finance/initiate-payment` | `payment_transactions` | `STUDENT` | Payment gateway pending | Deferred | **DEFERRED** |

---

## 3. Teacher Role Features

| ID | Feature Name | Expected Outcome | Frontend Screen | Backend Endpoint | Database Entities | Data Scope & Auth | Validation & Error States | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEA-01** | Student Attendance Marking | Mark Present/Absent for class students with duplicate prevention. | `TeacherAttendanceMarkingView` | `POST /api/v1/attendance/student` | `student_attendance_records` | `TEACHER`; assigned class teacher allocation | Status in (`PRESENT`,`ABSENT`); duplicate upsert | M4 (Attendance) | **VERIFIED** |
| **TEA-02** | Student Roster View | View students belonging to assigned classes. | `StudentRosterView` | `GET /api/v1/academics/my-roster` | `student_profiles`, `classes` | `TEACHER`; scoped to taught classes | Active students | M3 (Roster) | **VERIFIED** |
| **TEA-03** | Update Examination Marks | Enter, validate, and audit marks for assigned subjects & classes. | `TeacherMarksEntryView` | `POST /api/v1/exams/:id/datesheets/:datesheetId/marks` | `exam_marks`, `exam_marks_audit` | `TEACHER`; scoped to assigned subject/section | Marks 0 to Max Marks; explicit absent handling; audit log | M6 (Marks) | **VERIFIED** |
| **TEA-04** | Homework Assignment | Create and manage daily homework with title, instructions, dates. | `TeacherHomeworkManageView` | `POST /api/v1/homework` & `GET /api/v1/homework/teacher/my-assigned` | `homework_assignments` | `TEACHER`; scoped to assigned subject/class | Due date >= assigned date; non-empty title | M5 (Homework) | **VERIFIED** |
| **TEA-05** | Update Staff Profile | Update permitted staff profile fields (qualification, etc.). | `TeacherProfileView` | `PATCH /api/v1/profiles/staff` | `staff_profiles` | `TEACHER`; scoped to `staff_id = req.user.profileId` | Immutable core identity fields | M3 (Profiles) | **VERIFIED** |
| **TEA-06** | View Own Attendance | Review own staff attendance log and biometric status. | `TeacherOwnAttendanceView` | `GET /api/v1/attendance/staff/my-history` | `staff_attendance_records` | `TEACHER`; scoped to `staff_id = req.user.profileId` | Valid date range | M4 (Attendance) | **VERIFIED** |
| **TEA-07** | Day-Wise Timetable | View daily period allocations, classes, and rooms. | `TeacherTimetableScreen` | `GET /api/v1/teachers/timetable` | `timetables`, `period_allocations` | `TEACHER`; scoped to authenticated teacher | Active academic year | M4 (Timetable) | **NOT IMPLEMENTED** |
| **TEA-08** | Substitute Arrangements | View temporary class substitutions assigned for the day. | `SubstituteViewScreen` | `GET /api/v1/teachers/substitutes` | `substitutions` | `TEACHER`; scoped to teacher or school | Date active | M4 (Substitutions)| **NOT IMPLEMENTED** |
| **TEA-09** | Report Card Generation | Generate class report cards with server-side authoritative calculations. | `ClassReportCardsView` | `POST /api/v1/exams/:id/report-cards/class/:classId/:sectionId` | `report_cards`, `exam_marks` | `TEACHER`; must be assigned `CLASS_TEACHER` | All subject marks aggregated authoritatively | M6 (Report Cards)| **VERIFIED** |
| **TEA-10** | Apply Teacher Leave | Apply for personal/medical staff leave and track status. | `TeacherLeaveView` | `POST /api/v1/leaves/staff` & `GET /api/v1/leaves/staff/my-leaves` | `staff_leaves` | `TEACHER`; scoped to authenticated staff | `start_date <= end_date`; reason non-empty | M4 (Leaves) | **VERIFIED** |
| **TEA-11** | Conduct Online Classes | Host live online video sessions with class. | `OnlineClassScreen` | `POST /api/v1/teachers/online-classes` | `online_classes` | `TEACHER` | Provider pending confirmation | Deferred | **DEFERRED** |
| **TEA-12** | Academic Materials Upload | Upload study guides, worksheets to private S3 with signed URLs. | `AcademicMaterialsView` | `POST /api/v1/materials/presigned-upload-url` & `POST /api/v1/materials/:id/verify-upload` | `academic_materials` | `TEACHER`; allocated to class/subject | Size <= 10MB; PDF/JPEG/PNG allowlist | M5 (Materials) | **VERIFIED** |

---

## 4. Accountant Role Features

| ID | Feature Name | Expected Outcome | Frontend Screen | Backend Endpoint | Database Entities | Data Scope & Auth | Validation & Error States | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ACC-01** | Financial Dashboard | View today's collections, dues, and cash/bank balance. | `AccountantDashboardScreen`| `GET /api/v1/finance/dashboard` | `fee_receipts`, `expenses`, `day_book_entries` | `ACCOUNTANT`; scoped to `school_id` | Accurate live aggregations | M7 (Finance) | **NOT IMPLEMENTED** |
| **ACC-02** | Counter Fee Collection | Collect fees via Cash, Cheque, POS Card, or Counter UPI. | `FeeCollectionScreen` | `POST /api/v1/finance/collect-fee` | `fee_receipts`, `fee_receipt_items`, `day_book_entries` | `ACCOUNTANT`; ACID transaction with row-locking | Amount > 0; mode required; receipt uniqueness | M7 (Fees) | **NOT IMPLEMENTED** |
| **ACC-03** | Duplicate Receipts & Refunds | Issue duplicate receipt copies and process refunds. | `ReceiptManagerScreen` | `POST /api/v1/finance/receipts/:id/refund` | `fee_refunds`, `fee_receipts` | `ACCOUNTANT`; requires reason and manager pin | Refund amount <= receipt balance | M7 (Fees) | **NOT IMPLEMENTED** |
| **ACC-04** | Dues & Defaulters List | View class-wise outstanding fees and overdue terms. | `DefaultersScreen` | `GET /api/v1/finance/defaulters` | `student_fee_dues`, `classes` | `ACCOUNTANT`; scoped to `school_id` | Filter by class/wing | M7 (Fees) | **NOT IMPLEMENTED** |
| **ACC-05** | View-Only Fee Structures | Inspect approved fee slabs, installments, late rules. | `FeeStructureViewScreen` | `GET /api/v1/finance/structures` | `fee_structures`, `fee_installments` | `ACCOUNTANT`; view-only permission | Read-only enforcement | M7 (Fees) | **NOT IMPLEMENTED** |
| **ACC-06** | Expenses & Vouchers | Record school expenses, vendor payments, petty cash. | `ExpenseVoucherScreen` | `POST /api/v1/finance/expenses` | `expenses`, `expense_vouchers`, `vendors` | `ACCOUNTANT`; double-entry ledger impact | Category valid; payment mode valid | M8 (Expenses) | **NOT IMPLEMENTED** |
| **ACC-07** | Payroll Processing | Calculate attendance-linked salaries and slips. | `PayrollRunScreen` | `POST /api/v1/finance/payroll/calculate` | `payroll_runs`, `salary_slips` | `ACCOUNTANT`; linked to staff attendance | Deductions & advances validated | M9 (Payroll) | **NOT IMPLEMENTED** |
| **ACC-08** | Day Book & Ledgers | Review daily transactional cash/bank movements. | `DayBookScreen` | `GET /api/v1/finance/day-book` | `day_book_entries`, `general_ledger` | `ACCOUNTANT`; scoped to `school_id` | Balance brought forward verified | M8 (Accounting) | **NOT IMPLEMENTED** |
| **ACC-09** | Bank Reconciliation | Match bank statements against recorded receipts. | `BankReconciliationScreen` | `POST /api/v1/finance/reconciliation` | `bank_reconciliations`, `cheque_tracker` | `ACCOUNTANT`; scoped to school bank accounts | Cheque status updated | M8 (Reconciliation)| **NOT IMPLEMENTED** |
| **ACC-10** | Financial Exports | Generate Excel and PDF audit/tax statements. | `ReportsExportScreen` | `GET /api/v1/finance/export/:format` | Aggregated ledgers | `ACCOUNTANT`; generated server-side | Date range valid | M7/M8 (Reports) | **NOT IMPLEMENTED** |
| **ACC-11** | Automated Reminders | Send automated SMS/WhatsApp fee dues notices. | `RemindersScreen` | `POST /api/v1/finance/send-reminders` | `notification_logs` | `ACCOUNTANT` | Vendor APIs pending | Deferred | **DEFERRED** |

---

## 5. Coordinator Role Features

| ID | Feature Name | Expected Outcome | Frontend Screen | Backend Endpoint | Database Entities | Data Scope & Auth | Validation & Error States | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CRD-01** | Wing Overview & Trends | Monitor wing attendance, syllabus and approval queues. | `WingOverviewScreen` | `GET /api/v1/coordinator/wing-overview` | `wings`, `student_attendance_records` | `COORDINATOR`; strictly scoped to assigned `wing_id` | 403 on cross-wing queries | M10 (Monitoring) | **NOT IMPLEMENTED** |
| **CRD-02** | Wing Staff Attendance | Review attendance of teachers in assigned wing scope. | `CoordinatorStaffAttendanceView` | `GET /api/v1/attendance/staff/wing/:wingId` | `staff_attendance_records`, `staff_assignments` | `COORDINATOR`; scoped to assigned `wing_id` | 403 on cross-wing queries | M4 (Attendance) | **VERIFIED** |
| **CRD-03** | Teacher Leave Recommendations| Review wing teacher leaves and attach non-binding recommendation note. | `CoordinatorLeaveReviewView`| `GET /api/v1/leaves/staff/wing-leaves` & `PATCH /api/v1/leaves/staff/:id/recommend` | `staff_leaves` | `COORDINATOR`; scoped to wing teachers | Non-binding; forwards to management | M4 (Leaves) | **VERIFIED** |
| **CRD-04** | Syllabus & Lesson Plan Approval| Review and approve weekly syllabus progress. | `SyllabusApprovalScreen` | `POST /api/v1/coordinator/syllabus-approve` | `syllabus_progress`, `lesson_plans` | `COORDINATOR`; scoped to wing subjects | Topic valid; status transition valid | M10 (Syllabus) | **NOT IMPLEMENTED** |
| **CRD-05** | Exam Scheduling & Datesheet | Create exams and datesheets with conflict and max mark validation. | `ExamDatesheetView` | `POST /api/v1/exams` & `POST /api/v1/exams/:id/datesheets` | `exams`, `exam_datesheets` | `COORDINATOR`; scoped to wing classes | Date & time order validated; collision checks | M6 (Exams) | **VERIFIED** |
| **CRD-06** | Marks Verification & Approval | Verify class marks and approve report cards for release. | `CoordinatorMarksReviewView` & `ClassReportCardsView` | `PATCH /api/v1/exams/:id/datesheets/:datesheetId/verify` & `PATCH /api/v1/exams/:id/report-cards/class/:classId/:sectionId/approve` & `PATCH /api/v1/exams/:id/publish` | `exam_marks`, `report_cards`, `exams` | `COORDINATOR`; scoped to wing classes | Verification distinct from approval; publication control | M6 (Report Cards)| **VERIFIED** |
| **CRD-07** | Remedial & Weak Student Tracker| Flag and monitor remedial student performance. | `RemedialTrackingScreen` | `POST /api/v1/coordinator/remedial` | `weak_student_trackings` | `COORDINATOR`; scoped to wing students | Threshold score defined | M10 (Remedial) | **NOT IMPLEMENTED** |
| **CRD-08** | Circulars & School Activities | Publish wing circulars, PTM schedules, assemblies. | `ActivitiesManageScreen` | `POST /api/v1/coordinator/activities` | `circulars`, `ptm_schedules` | `COORDINATOR`; scoped to wing | Title and audience non-empty | M10 (Activities) | **NOT IMPLEMENTED** |

---

## 6. Management / Admin Role Features (Strictly Confirmed Scope)

| ID | Feature Name | Expected Outcome | Frontend Screen | Backend Endpoint | Database Entities | Data Scope & Auth | Validation & Error States | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MGT-01** | Teacher Leave Approval | Executive approval or rejection of teacher leaves. | `ManagementLeaveApprovalView`| `GET /api/v1/leaves/staff/management-queue` & `PATCH /api/v1/leaves/staff/:id/decide`| `staff_leaves` | `MANAGEMENT`; school-wide scope | Status must be PENDING/RECOMMENDED; invalid state returns 400 | M4 (Leaves) | **VERIFIED** |
| **MGT-02** | Payroll Approval Gate | Final review and sanction of monthly payroll runs. | `ManagementPayrollApprovalScreen`| `POST /api/v1/management/payroll/:id/approve`| `payroll_runs` | `MANAGEMENT`; school-wide scope | Status must be CALCULATED | M9 (Payroll) | **NOT IMPLEMENTED** |
