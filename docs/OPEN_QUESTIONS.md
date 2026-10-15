# School ERP - Prioritized Unresolved Client Questions

**Document Version:** 1.0.0  
**Status:** Pending Stakeholder Clarifications  

---

## Priority 1: High (Required before Milestone 3 & 4)

### Q1: Official Account Provisioning & Login Identifier Policy
* **Current Assumption:** The system currently supports a flexible identifier column (`identifier`) accepting either an Admission Number, Employee Code, Email, or Phone Number with a standard initial password.
* **Question for Client:**
  1. What is the official format for student login credentials (e.g., Admission Number `ADM-2026-001` or Parent Phone Number)?
  2. Will students/parents receive an initial default password or an SMS OTP for their first login?
  3. What is the official format for staff credentials (e.g., Employee ID `EMP-001` or School Email)?
* **Architectural Impact:** Database `users` table already supports flexible identifiers, but UI labels, validation masks, and onboarding flows depend on this confirmation.

### Q2: School Hierarchy & Multi-Wing Teacher Allocation
* **Current Assumption:** Schools have independent Wings (e.g., Primary, Middle, Senior).
* **Question for Client:**
  1. Can a single Teacher teach across multiple Wings (e.g., teach Mathematics in both Middle and Senior Wings)?
  2. If a Teacher teaches across multiple wings, which Wing Coordinator reviews their leave requests?
* **Architectural Impact:** Determines whether `staff_assignments` requires a multi-wing foreign key mapping or a single primary wing designation.

---

## Priority 2: Medium (Required before Milestone 6 & 7)

### Q3: Online Classes Architecture Decision
* **Current Status:** Deferred.
* **Question for Client:**
  1. Does the school require native in-app video calling (using Agora, Jitsi, or 100ms SDKs)?
  2. Or will Teachers simply share third-party meeting links (Zoom or Google Meet URLs) that launch externally?
* **Architectural Impact:** In-app calling increases mobile app binary size significantly (~30MB) and introduces cloud streaming infrastructure costs. External URL launching is lightweight, stable, and cost-effective.

### Q4: Payment Gateway & Account Settlement
* **Current Status:** Deferred (Counter collection active in Milestone 7).
* **Question for Client:**
  1. Which payment gateway merchant account is registered (Razorpay, Cashfree, PayU, or Stripe)?
  2. Are student fees deposited into a single central school bank account, or are different fee heads split across separate trust accounts?
* **Architectural Impact:** Dictates backend webhook verification, automated settlement reconciliations, and payment split configurations.

### Q5: Attendance-Linked Payroll Calculation Formula
* **Current Status:** Planned for Milestone 9.
* **Question for Client:**
  1. What is the exact mathematical formula for Loss of Pay (LOP)? Is monthly salary divided by calendar days (e.g., 30) or actual working days (e.g., 24)?
  2. How are statutory deductions (Provident Fund, Professional Tax, TDS) configured? Are they percentage-based or fixed slabs?
* **Architectural Impact:** Informs the Payroll Engine calculation rules in `payroll.service.ts`.

---

## Priority 3: Low (Required before Milestone 10 & 11)

### Q6: Notification Provider Subscriptions
* **Current Status:** Deferred.
* **Question for Client:**
  1. Which SMS gateway vendor account is active (MSG91, Gupshup, Fast2SMS)?
  2. Is an official WhatsApp Business API provider configured?
  3. Are template approval DLTS registrations complete?
* **Architectural Impact:** Backend dispatcher integration and message payload formatting.

### Q7: Management/Admin Web vs. Mobile Portal
* **Current Status:** Strictly restricted to Teacher Leave Approval and Payroll Approval in Mobile App.
* **Question for Client:**
  1. Will School Management require master configuration screens (e.g., creating academic years, fee structures, admissions) inside the mobile app?
  2. Or will these configuration tasks be performed via an administrative backend or future web console?
* **Architectural Impact:** Guarantees that mobile app scope remains strictly within approved boundaries without inventing unconfirmed menus.

---

## Priority 4: Academic Materials, Homework & Curriculum (Milestone 5 Open Questions)

### Q8: Student Homework Submission & Digital Turn-in
* **Current Status:** Implemented self-completion toggle checklist (`student_homework_completions`) without digital file upload.
* **Question for Client:**
  1. Should students be allowed to submit homework solutions/files digitally (e.g. photos of handwritten notebook or scanned PDF)?
  2. Or is homework physically evaluated in the classroom, with the app serving as a digital diary and assignment tracker?
* **Architectural Impact:** If student file submission is required, a `student_homework_submissions` table with S3 pre-signed upload flow and student storage quota management will be needed in a future update.

### Q9: Homework Evaluation, Grading & Marks
* **Current Status:** Deferred. No grading or marks invented.
* **Question for Client:**
  1. Does homework carry marks/grades (e.g., marks out of 10 or grades A/B/C/D), or is it non-evaluative daily homework?
  2. Should teachers be able to write feedback or remarks on student homework?
* **Architectural Impact:** Requires an evaluation schema with teacher feedback columns and marks aggregation rules.

### Q10: Late Homework Submission Rules
* **Current Status:** Deferred. Due date is displayed and flagged as `OVERDUE` in UI if current date exceeds `due_date`.
* **Question for Client:**
  1. Can students mark homework as completed or submit after the due date has passed?
  2. Should late completion be explicitly flagged to the teacher, or blocked entirely after the due date?
* **Architectural Impact:** Determines whether backend API enforces a hard reject on overdue completion toggles or accepts with a `LATE` flag.

### Q11: Curriculum & Syllabus Approval Workflow
* **Current Status:** Direct authoring by Teachers and Coordinators for assigned subjects. No approval gate invented.
* **Question for Client:**
  1. Can Teachers create/edit syllabus units and topics directly, or must all syllabus items be drafted and approved by Wing Coordinators or Academic In-Charge before becoming visible to students?
  2. Are topics mapped to specific teaching weeks or calendar dates?
* **Architectural Impact:** If an approval gate is needed, a state machine (`DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED`) will be added to `curriculum_units` with coordinator approval APIs.

### Q12: AWS S3 Production Credentials & Bucket Provisioning
* **Current Status:** Dual-mode architecture implemented. Safe local upload/download simulation active in local development and tests; real AWS SDK presigning ready when environment variables are injected.
* **Question for Client / DevOps:**
  1. What is the target AWS Region and S3 Bucket Name for production?
  2. Will IAM user credentials (Access Key + Secret Key) or IAM Roles (e.g., for AWS ECS / EC2 / EKS) be used for authentication?
  3. Is CORS configured on the S3 bucket to allow direct browser/mobile app `PUT` requests?
* **Architectural Impact:** Seamless cutover once `.env` credentials are provided without requiring code modifications.

---

## Priority 5: Examinations, Grading Policies & Invigilation Decisions (Milestone 6 Open Questions)

### Q13: Grading System & Letter Grade Boundaries
* **Current Status:** Authoritative backend calculation stores raw marks obtained, maximum marks, and exact rounded percentage (`Math.round((total_obtained / total_max) * 10000) / 100`). Arbitrary letter grades (A+, A, B, etc.) have NOT been invented.
* **Question for Client:**
  1. Which official grading system does the school follow (CBSE 9-point grading scale `A1, A2, B1...`, ICSE, Cambridge, or State Board)?
  2. What are the exact percentage boundaries for each letter grade (e.g., `91-100: A1`, `81-90: A2`, `71-80: B1`, etc.)?
* **Architectural Impact:** A configurable `grading_scales` table can map percentages to letter grades and GPA points once confirmed.

### Q14: Passing Criteria, Compartments & Absent Mark Treatment
* **Current Status:** Configured passing marks default to 33.00. Absent students are explicitly flagged (`is_absent = true`) with null marks obtained. Absent marks are NOT automatically converted to zero.
* **Question for Client:**
  1. Is a student considered "Failed" or "Absent" if they missed an exam for medical reasons?
  2. Does the school compute overall percentage including or excluding absent subjects?
  3. Are absent students eligible for a re-test/compartment exam?
* **Architectural Impact:** Informs whether overall percentages include 0 for absent subjects or report a separate "Incomplete / Medical Absent" status.

### Q15: Weighted Term Aggregation & Annual Promotion Rules
* **Current Status:** Each examination (e.g., Mid-Term 2026) has its own independent datesheet, marks, and report cards. Multi-term aggregation formulas are NOT invented.
* **Question for Client:**
  1. How are annual final report cards calculated? Are terms weighted (e.g., Term 1: 30%, Term 2: 70%, or Unit Tests: 10% each)?
  2. Are internal assessment marks (practicals, notebooks, project work) combined with written exam marks?
* **Architectural Impact:** Multi-exam consolidation service and weighted aggregation engine in future release.

### Q16: Invigilation Planning & Room Allocation Rules
* **Current Status:** `exam_datesheets` includes an optional `invigilator_staff_id` foreign key. Automated scheduling algorithms are NOT invented.
* **Question for Client:**
  1. How are teachers assigned to exam invigilation duties (e.g., random distribution, wing-specific rotation)?
  2. Does the school require seating arrangement / room allocation management in the ERP?
* **Architectural Impact:** Dictates whether a full invigilation duty roster module and conflict checker across teachers' existing schedules is required.


