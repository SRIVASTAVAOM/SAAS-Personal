# School ERP - Test Strategy & Verification Framework

**Document Version:** 1.5.0  
**Status:** Audit & Stabilization Verified  

---

## 1. Testing Pyramid & Verification Principles

The testing framework guarantees that **no feature is marked complete or delivered without automated verification**:

```
        / \
       /   \     E2E Cross-Role Integration Scenarios (Role Hand-offs)
      /-----\
     /       \   API Integration & RBAC Security Tests (Supertest + Jest)
    /---------\
   /           \ State & Unit Tests (BLoC Tests, Repository Mocks, SQL Tests)
  /-------------\
```

### Core Verification Rules
1. **Never Assume:** Previous completion reports do not substitute for actual test execution.
2. **Zero-Trust Testing:** Every protected API endpoint must include automated test cases asserting both positive (`200 OK`) and negative (`403 Forbidden` / `401 Unauthorized`) outcomes.
3. **Payload Tolerance & Contract Rigor:** APIs must be tested against both canonical camelCase and client-originated snake_case payloads to ensure mobile clients and web portals operate seamlessly without brittle failures.
4. **Data Integrity & Non-Destructive Testing:** Automated tests must never drop, reset, or alter production seed fixtures without restoring state.

---

## 2. Actual Verified Test Results (Post-Audit Baseline)

### A. Backend Integration Suite (Jest + Supertest)
* **Execution Command:** `npm test` inside `backend/`
* **Test Suites:** 11 passed, 11 total
* **Total Tests:** 113 passed, 113 total (includes 5 new regression tests)
* **Execution Time:** ~11.6 seconds

```
PASS tests/rbac.test.ts (11 tests)
PASS tests/auth.test.ts (8 tests)
PASS tests/attendance.test.ts (11 tests - includes snake_case mobile payload regression test)
PASS tests/leaves.test.ts (15 tests - includes mobile snake_case and note alias regression tests)
PASS tests/exams.test.ts (27 tests - includes camelCase marks entry regression test)
PASS tests/homework.test.ts (9 tests)
PASS tests/curriculum.test.ts (5 tests)
PASS tests/materials.test.ts (10 tests)
PASS tests/academics.test.ts (8 tests)
PASS tests/profile.test.ts (5 tests)
PASS tests/env.test.ts (4 tests)

Test Suites: 11 passed, 11 total
Tests:       113 passed, 113 total
Snapshots:   0 total
Time:        11.642 s
```

### B. Mobile Unit & Widget Suite (Flutter Test)
* **Execution Command:** `flutter test` inside `mobile/`
* **Test Files:** 16 passed, 16 total
* **Total Tests:** 81 passed, 81 total
* **Execution Time:** ~7.2 seconds
* **Static Analysis:** `flutter analyze` — 0 issues found!

```
PASS test/auth_bloc_test.dart
PASS test/login_screen_test.dart
PASS test/app_router_test.dart
PASS test/academics_bloc_test.dart
PASS test/academics_views_test.dart
PASS test/profile_bloc_test.dart
PASS test/profile_views_test.dart
PASS test/attendance_bloc_test.dart
PASS test/attendance_leave_views_test.dart
PASS test/leaves_bloc_test.dart
PASS test/homework_bloc_test.dart
PASS test/curriculum_bloc_test.dart
PASS test/materials_bloc_test.dart
PASS test/homework_materials_views_test.dart
PASS test/exams_bloc_test.dart
PASS test/exams_views_test.dart

All 81 tests passed!
```

---

## 3. End-to-End Live API Verification Runbook

An automated end-to-end integration audit script is maintained at:
`/Users/omsrivastava/.gemini/antigravity-ide/brain/a07210e6-3bde-456d-b4f3-d617dae60561/scratch/audit_api.js`

To execute end-to-end audit:
```bash
node /Users/omsrivastava/.gemini/antigravity-ide/brain/a07210e6-3bde-456d-b4f3-d617dae60561/scratch/audit_api.js
```
Expected result: 100% PASS across:
- M1: Authentication & Token verification (5 roles)
- M3: Academic rosters, subjects catalog, profiles
- M4: Attendance marking, history retrieval, leave workflows (apply -> recommend -> sanction)
- M5: Curriculum units, homework listing, pre-signed upload URLs
- M6: Exams listing, datesheets, marks rosters, report cards, student results

---

## 4. Manual Verification Runbook for Role Verification

| Test Case | Role | Steps | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-AUD-01: Teacher Attendance Marking** | `teacher1` / `Password@123` | Open Teacher Shell -> Attendance Tab -> Select Date -> Toggle status -> Tap "Submit Attendance" | SnackBar confirmation; DB records upserted without duplicate error. |
| **TC-AUD-02: Teacher Leave Application** | `teacher1` / `Password@123` | Open Teacher Shell -> Attendance Tab -> My Leaves -> Tap Apply -> Select Casual/Sick -> Submit | Leave appears with status `PENDING` (no 400 error). |
| **TC-AUD-03: Coordinator Leave Recommendation** | `coordinator1` / `Password@123`| Open Coordinator Shell -> Wing Teachers -> Leave Recommendations -> Enter note -> Tap Recommend | Status updates to `RECOMMENDED`. |
| **TC-AUD-04: Management Leave Sanction** | `management1` / `Password@123` | Open Management Shell -> Leave Approvals -> Review Leave -> Tap "Approve" | Status updates to `APPROVED` (no 400 error). |
| **TC-AUD-05: Teacher Homework Creation** | `teacher1` / `Password@123` | Open Teacher Shell -> Classes Tab -> Homework -> Tap "+" -> Enter Title/Desc -> Submit | Homework created with valid Grade 10 Section A UUID; visible in list. |
| **TC-AUD-06: Student Homework Completion** | `student1` / `Password@123` | Open Student Shell -> Academics Tab -> Homework -> Check/uncheck completion box | Status toggles between `COMPLETED` and `PENDING`. |
| **TC-AUD-07: Teacher Marks Entry** | `teacher1` / `Password@123` | Open Teacher Shell -> Classes Tab -> Examinations -> Mid-Term 2026 -> Marks Entry -> Enter 45.0 -> Save Draft | Draft saved successfully; absent validation enforced. |
| **TC-AUD-08: Class Report Cards** | `teacher1` / `Password@123` | Open Teacher Shell -> Classes Tab -> Examinations -> Tap "Report Cards" | Roster with Grade 10 Section A cards displays server-calculated totals. |
| **TC-AUD-09: Coordinator Report Cards Approval** | `coordinator1` / `Password@123`| Open Coordinator Shell -> Academics -> Examinations -> Tap "Approve Cards" -> "Approve All" | Report cards marked `APPROVED`. |
| **TC-AUD-10: Student Result Access** | `student1` / `Password@123` | Open Student Shell -> Academics Tab -> Examinations -> View Result | Student views verified marks and overall percentage. |
