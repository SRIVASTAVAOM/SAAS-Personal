# School ERP - Confirmed Client Requirements

**Document Version:** 1.0.0  
**Status:** Confirmed Baseline  

---

## 1. Architectural Directives

1. **Single Mobile Application:** All 5 user roles share one unified mobile application codebase built with Flutter + Dart. Dynamic interface rendering and route protection determine the accessible views based on authenticated identity.
2. **Centralized Backend:** One shared REST API service built with Node.js, Express, and TypeScript.
3. **Single Relational Database:** One relational database built with PostgreSQL ensuring strict ACID compliance for financial and academic records.
4. **Minimalist Design Language:**
   * Pure White (`#FFFFFF`) and Soft Off-White (`#F8F9FA`) surfaces.
   * Hairline borders (`1.0px solid #E2E8F0`).
   * Zero decorative gradients, zero drop shadows (`elevation: 0`), zero glassmorphism, zero glowing effects.
   * Restrained slate palette (`#1E293B`, `#64748B`) with clean Inter sans-serif typography.

---

## 2. Confirmed Feature Specifications by Role

### Role 1: Student
* **Rosters & Directories:** View student lists class-wise, class-teacher-wise, and subject-teacher-wise; view classmates list; view teacher contact and subject information.
* **Academic Views:** View daily attendance records, daily homework assignments, examination results and marks, examination datesheet, academic material uploads (PDFs/documents), notices and circulars, student birthdays.
* **Financial Views:** View fee receipts history, fee breakdown, and current dues status.
* **Self-Service Actions:** Update own student profile details (within permitted editable fields); apply for student leave; submit complaints/grievances; view school emergency and office contact details.
* **Fee Payment:** Offline counter collection active; online student-side self-checkout deferred.

### Role 2: Teacher
* **Attendance:** Mark daily student attendance for assigned class/homeroom; view own staff attendance records; view substitute arrangements when teachers are absent.
* **Academics & Classroom:** View student rosters; update student examination marks; update and assign daily homework; update student profile details; view day-wise timetable.
* **Report Cards:** Generate class-wise report cards as assigned Class Teacher.
* **Staff Self-Service:** View and update own staff profile; apply for teacher leave.
* **Online Classes:** Feature requirement noted but currently deferred (execution format pending client confirmation).

### Role 3: Accountant
* **Financial Dashboard:** Real-time summary of today's collections, total pending dues, and cash/bank balance.
* **Counter Fee Collection (Active):** Collect fees via Cash, Cheque, Card swipe (manual reference), and Counter UPI (manual reference); issue instant receipts, duplicate receipts, refunds, and adjustments.
* **Structures & Defaulters:** View-only fee structures, installments, and late fee rules; track fee defaulters and outstanding balances. *(SMS/WhatsApp dispatch deferred)*.
* **Expenditure & Petty Cash:** Record operational expenses, payment vouchers, vendor payments, and petty cash transactions.
* **Payroll Processing:** Attendance-linked monthly salary calculation, salary slips generation, deduction and advance entries; submit payroll runs for Management approval.
* **Ledgers & Reconciliation:** Maintain day book, general ledger, cheque tracker (inward/outward/cleared), and bank reconciliation.
* **Reporting:** Generate financial statements, tax and audit reports, and export to PDF and Excel (.xlsx).

### Role 4: Coordinator
* **Wing Overview:** Monitor wing-wide attendance trends, syllabus completion progress, and pending approval queues.
* **Wing Teachers:** Review wing teacher roster, staff attendance records, classroom feedback, substitute arrangements, and recommend teacher leaves to Management.
* **Academics Supervision:** Review teaching timetables, approve syllabus and lesson plans, and monitor daily homework distribution.
* **Examination Management:** Schedule examinations, generate invigilation rosters, moderate question papers, verify marks entry, analyze class results, and approve final report cards.
* **Student Welfare & Discipline:** Monitor wing student rosters, attendance patterns, student discipline records, and track weak/remedial students.
* **School Events:** Manage official circulars, parent-teacher meetings (PTM), competitions, assemblies, and school events.
* **Reports:** Generate wing-level attendance, examination result, teacher workload, and syllabus coverage reports.

### Role 5: Management / Admin
* **Teacher Leave Approvals:** Review leave requests recommended by Wing Coordinators and execute final sanction or rejection.
* **Payroll Approvals:** Review monthly payroll runs calculated by the Accounts department and execute final approval prior to bank disbursement.
* **Boundary Rule:** **Strictly limited to these two confirmed approval responsibilities.** No additional administrative menus or unconfirmed dashboards are to be invented.

---

## 3. Explicitly Deferred Capabilities (On Hold)

1. **Online Classes:** (In-app Agora/Jitsi video calling vs external Zoom/Meet link launching).
2. **Online Payment Gateway SDK:** (Razorpay / Cashfree student self-checkout).
3. **Push Notifications:** (Firebase Cloud Messaging).
4. **Automated Reminders:** (SMS & WhatsApp vendor APIs like Gupshup/Twilio).
