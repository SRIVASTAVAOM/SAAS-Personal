# School ERP - Project Status & Existing Modules Audit Report

**Document Version:** 1.5.0  
**Last Updated:** 2026-10-13  
**Current Milestone:** Milestones M1–M6 Existing Modules Audit, Bug Fixing & Stabilization  
**Status:** Audit & Stabilization Complete — All Existing Workflows End-to-End Verified (Waiting for User Review)  

---

## 1. Executive Summary

School ERP is a unified institution management platform built with:
- **Mobile Client:** Flutter + Dart + BLoC pattern + GoRouter
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (29 relational tables, migrations 001–005)
- **Object Storage:** AWS S3 architecture with short-lived pre-signed URLs (and safe local mock fallback)

Following manual testing feedback on previously reported milestones M1–M6, an in-depth audit was conducted across all existing modules. Root causes of runtime failures were identified, systematically resolved across the backend and Flutter codebases, verified with regression tests, and confirmed end-to-end via live API and UI workflows.

**Strict Scope Boundary:** No Module 7 features or new business requirements were introduced. The database was not dropped, recreated, or reset.

---

## 2. Test & Verification Baseline

| Metric | Before Audit | After Audit & Stabilization | Current State |
| :--- | :--- | :--- | :--- |
| **Backend TypeScript Build** | Exit code 0 | Exit code 0 | **PASS** (`npm run build`) |
| **Backend Automated Tests** | 108 / 108 passed (11 suites) | **113 / 113 passed** (11 suites) | **PASS** (+5 regression tests) |
| **Mobile Static Analysis** | 0 issues | **0 issues** | **PASS** (`flutter analyze`) |
| **Mobile Automated Tests** | 81 / 81 passed | **81 / 81 passed** | **PASS** (`flutter test`) |
| **Database Migrations & Data**| Migrations 001–005 applied | Migrations 001–005 applied | **PASS** (Zero data loss, intact) |
| **Live API Audit Script** | Multiple 400/403 failures | **100% 200/201 Success** | **PASS** (`scratch/audit_api.js`) |

---

## 3. Functional Bug Inventory & Root Cause Analysis

### BUG 1 (Critical) — Section UUID Discrepancies Breaking Class/Section Workflows
- **Symptoms:** Teacher could not create or view homework; exams marks entry and class report card generation returned 403 Forbidden (`FORBIDDEN_SCOPE`).
- **Root Cause:**
  1. Grade 10 Section A has real UUID `2a6cead4-cde7-41dc-a15b-8fd2f1330895` in the PostgreSQL database.
  2. `teacher_shell.dart` and `coordinator_shell.dart` passed non-existent UUID `6b6d2fe2-16a3-4c9c-b179-88006d649ab7` to `TeacherHomeworkManageView` and `ExamsListView`.
  3. `teacher_homework_manage_view.dart` hardcoded `_defaultSectionId = '9b1c4e73-128a-40a2-b8ec-647d6df231c5'`.
- **Fix:** Replaced hardcoded invalid section UUIDs with dynamic user section IDs falling back to `2a6cead4-cde7-41dc-a15b-8fd2f1330895`.
- **Status:** **FIXED & END-TO-END VERIFIED**.

### BUG 2 (High) — Non-UUID Fallbacks Crashing PostgreSQL
- **Symptoms:** Attendance marking and coordinator wing view caused PostgreSQL error: `invalid input syntax for type uuid`.
- **Root Cause:** `teacher_shell.dart` used `'cls_g10'` and `'sec_g10_a'`; `coordinator_shell.dart` used `'wing_senior'`.
- **Fix:** Updated fallbacks to seeded Grade 10 (`2dfb941e-8bc6-448f-b00e-fc48dd052e11`), Section A (`2a6cead4-cde7-41dc-a15b-8fd2f1330895`), and Senior Wing (`85798796-83c5-461d-bec5-2cabb495c9c9`).
- **Status:** **FIXED & END-TO-END VERIFIED**.

### BUG 3 (High) — Contract Mismatch in Attendance Marking Payload
- **Symptoms:** Teacher student attendance marking failed with HTTP 400 ("Required") on submission from Flutter.
- **Root Cause:** Mobile `AttendanceRepository` sent snake_case keys (`class_id`, `section_id`, `attendance_date`, `records: [{ student_id }]`), whereas backend Zod strictly enforced camelCase (`classId`, `sectionId`, `date`, `records: [{ studentId }]`).
- **Fix:** Enhanced backend `markAttendanceSchema` to normalize both camelCase and snake_case; updated Flutter `AttendanceRepository` to normalize payload.
- **Status:** **FIXED & END-TO-END VERIFIED** (+ regression test added in `tests/attendance.test.ts`).

### BUG 4 (High) — Contract Mismatches & Invalid State in Leave Workflows
- **Symptoms:** Staff and student leave applications and approvals failed with HTTP 400. Selecting "On Duty (OD)" crashed with database check constraint violation.
- **Root Cause:**
  1. Leaves Zod schemas required camelCase (`startDate`, `leaveType`), while Flutter sent snake_case.
  2. Coordinator recommendation sent `note`, while backend expected `recommendation`.
  3. Management sanction sent `note` / `rejection_reason`, while backend expected `comment`.
  4. Teacher leave dropdown included `'DUTY'`, but DB check constraint `staff_leaves_leave_type_check` only permits `('SICK', 'CASUAL', 'EARNED')`.
- **Fix:** Enhanced backend leave schemas to accept both camelCase and snake_case, accept field aliases (`note`, `comment`, `rejection_reason`), and removed `'DUTY'` from Flutter dropdown.
- **Status:** **FIXED & END-TO-END VERIFIED** (+ regression tests added in `tests/leaves.test.ts`).

### BUG 5 (Medium) — Raw ISO Timestamps in Attendance Views
- **Symptoms:** Student and staff attendance history displayed unformatted timestamps (`2026-10-14T18:30:00.000Z`).
- **Root Cause:** Views rendered raw database ISO date strings directly.
- **Fix:** Sanitized date strings with `.split('T')[0]` across all attendance history views.
- **Status:** **FIXED & END-TO-END VERIFIED**.

### BUG 6 (Medium) — Student Profile Class/Section Key Mapping
- **Symptoms:** Student profile did not display current class and section names reliably.
- **Root Cause:** `StudentProfileModel.fromJson` checked only `current_class_id` and `current_section_id`, whereas backend endpoint returned `class_id` and `section_id`.
- **Fix:** Added fallback to `class_id` and `section_id` in `StudentProfileModel.fromJson`.
- **Status:** **FIXED & END-TO-END VERIFIED**.

### BUG 7 (Medium) — Examination Marks Payload Normalization
- **Symptoms:** Marks entry entries array failed validation if keys did not match strict snake_case conventions.
- **Root Cause:** `ExamsController.saveMarks` did not defensively normalize entries across camelCase and snake_case or string-to-number types.
- **Fix:** Added defensive normalization in `ExamsController.saveMarks` to parse `studentId` / `student_id`, `marksObtained` / `marks_obtained`, and `isAbsent` / `is_absent`.
- **Status:** **FIXED & END-TO-END VERIFIED** (+ regression test added in `tests/exams.test.ts`).

---

## 4. End-to-End Workflow Verification Matrix

| Module | Feature | User Role | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | Multi-role Authentication & Login | Student, Teacher, Coordinator, Management, Accountant | **End-to-end verified** | All 5 roles login, receive scoped JWT, `/auth/me` returns verified profile |
| **M1** | Session Expiry & Token Persistence | All roles | **End-to-end verified** | Stored in `flutter_secure_storage`, 401 triggers clean logout |
| **M1** | RBAC Route Guarding | All roles | **End-to-end verified** | Cross-role URL navigation blocked; API endpoints enforce RBAC middleware |
| **M3** | Student & Teacher Rosters | Student, Teacher | **End-to-end verified** | Class roster returns 2 students; Teacher roster scoped to allocated classes |
| **M3** | Subjects Catalog & Allocations | All roles | **End-to-end verified** | 4 subjects listed; allocations match teacher profiles |
| **M3** | Student & Teacher Profile Edit | Student, Teacher | **End-to-end verified** | Permitted fields editable; protected fields rejected |
| **M4** | Student Attendance Marking | Class Teacher | **End-to-end verified** | Batch attendance marked with upsert prevention; DB checked |
| **M4** | Student Attendance History | Student | **End-to-end verified** | Student views own attendance history (4 records, sanitized dates) |
| **M4** | Staff Attendance History | Teacher | **End-to-end verified** | Teacher views own attendance log (2 records, sanitized dates) |
| **M4** | Wing Staff Attendance Supervision| Coordinator | **End-to-end verified** | Coordinator views wing staff attendance log (14 records) |
| **M4** | Staff Leave Application & Workflow| Teacher, Coordinator, Management | **End-to-end verified** | Apply (PENDING) → Recommend (RECOMMENDED) → Sanction (APPROVED) |
| **M4** | Student Leave Application | Student | **End-to-end verified** | Apply (PENDING) → My leaves history verified |
| **M5** | Curriculum Units & Topics | Student, Teacher | **End-to-end verified** | 2 curriculum units retrieved with topics; student creation blocked |
| **M5** | Homework Creation & Listing | Teacher, Student | **End-to-end verified** | Teacher creates homework; student views own class homework (4 items) |
| **M5** | Homework Completion Toggle | Student | **End-to-end verified** | Student marks COMPLETED / PENDING; teacher completion counter increments |
| **M5** | Academic Materials Pre-signed URLs| Teacher, Student | **End-to-end verified** | Pre-signed upload & download URLs generated; safe mock active |
| **M6** | Exam Creation & Listing | Coordinator, All | **End-to-end verified** | Mid-Term Exam 2026 listed; dates validated |
| **M6** | Exam Datesheet Scheduling | Coordinator, Student | **End-to-end verified** | Math & Science datesheets listed; collision check enforced |
| **M6** | Teacher Marks Entry & Draft Save | Teacher | **End-to-end verified** | Marks roster loaded, draft saved, absent validation enforced |
| **M6** | Marks Audit Logging | System | **End-to-end verified** | `exam_marks_audit` records mark revisions with author and timestamp |
| **M6** | Coordinator Marks Verification | Coordinator | **End-to-end verified** | Summary statistics calculated; status transitioned to VERIFIED |
| **M6** | Authoritative Report Card Gen | Class Teacher | **End-to-end verified** | Class-wise report cards generated with server-side totals & percentage |
| **M6** | Report Card Approval & Publish | Coordinator | **End-to-end verified** | Coordinator approves cards; publishes exam; unapproved blocked |
| **M6** | Student Result Self-Access | Student | **End-to-end verified** | Student retrieves approved and published results |

---

## 5. Explicitly Deferred / Pending Client Decisions

The following items are intentionally preserved and NOT implemented until explicit client confirmation:
1. **Module 7 (Fee Management):** Strictly stopped as instructed; ready for subsequent milestone.
2. **Grade Boundary Mapping (A+, A, B, etc.):** Report cards display exact percentages and marks; letter grades remain unhardcoded pending institutional grading scale confirmation.
3. **Student File Upload for Homework:** Direct file submission by students deferred; homework uses completion checklist per M5 requirements.
4. **Student Leave Approval Role Assignment:** Withheld until client decides whether Class Teacher or Principal approves student leaves.
5. **Real AWS S3 Credentials:** AWS S3 operates in local simulation mode pending production AWS access keys.

---

## 6. Recommended Next Actions

1. Review this audit and stabilization report.
2. Execute the provided manual testing verification steps.
3. Upon approval, proceed with Milestone 7 (Fee Management).
