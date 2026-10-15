# School ERP - Security, Authorization & RBAC Architecture

**Document Version:** 1.0.0  
**Status:** Audit & Security Hardening Specifications  

---

## 1. Zero-Trust Authorization Model

The application adheres to a strict Zero-Trust backend policy: **Client-side routing is solely an interface convenience; real authorization and access boundaries are cryptographically enforced at the Node.js API layer.**

### A. Authorization Middleware Pipeline
```
Incoming Request
       |
       v
[ 1. authenticateToken ]
  - Validates Authorization: Bearer <token>
  - Cryptographically verifies signature using JWT_SECRET
  - Checks expiration timestamp
  - Attaches TokenPayload to req.user
       |
       v
[ 2. requireRole(allowedRoles) ]
  - Validates user.roles includes at least one required role
  - Returns 403 Forbidden on failure
       |
       v
[ 3. enforceResourceScope ]
  - School Isolation: Enforces req.user.schoolId on all DB queries
  - Wing Scope: Verifies Coordinator operates strictly within assigned wingId
  - Class/Section Scope: Verifies Teacher is assigned class/subject teacher
  - Student Ownership: Verifies Student can only access records where student_id = req.user.profileId
  - Management Boundary: Restricts Management to Teacher Leave & Payroll approvals
       |
       v
Controller / Business Logic Execution
```

---

## 2. Security Audit Findings & Discovered Defects

During the Milestone 2 codebase audit, 4 specific architectural and security defects were identified:

### Defect 1: Mobile Client Cross-Role Route Guard Missing
* **Location:** [`mobile/lib/core/router/app_router.dart`](file:///Users/omsrivastava/Desktop/Project_SAAS/mobile/lib/core/router/app_router.dart)
* **Vulnerability:** The `redirect` callback only triggers when `state.matchedLocation == '/login'`. If an authenticated user with `role: 'STUDENT'` manually deep-links or navigates to `/accountant` or `/management`, the router returns `null` and mounts the `AccountantShell` widget. While backend APIs return 403 Forbidden, rendering privileged screens to unauthorized users is an interface security flaw.
* **Smallest Safe Fix:** Add route-matching checks inside `redirect`:
  ```dart
  if (state.matchedLocation.startsWith('/accountant') && authState.activeRole != 'ACCOUNTANT') {
    return '/student'; // Redirect to own home
  }
  ```

### Defect 2: Dio 401 Expiry Interceptor Desynchronization
* **Location:** [`mobile/lib/core/network/dio_client.dart`](file:///Users/omsrivastava/Desktop/Project_SAAS/mobile/lib/core/network/dio_client.dart)
* **Vulnerability:** When an API request returns `401 Unauthorized` (token expired), `storageService.clearAll()` is executed. However, `AuthBloc` is not notified. The in-memory state remains `Authenticated`, leaving the user on the dashboard with failing API calls until they manually restart the app.
* **Smallest Safe Fix:** Provide an `onUnauthorized` callback from `DioClient` to dispatch `LogoutRequestedEvent()` to `AuthBloc`.

### Defect 3: Hardcoded API Base URL
* **Location:** [`mobile/lib/core/network/api_endpoints.dart`](file:///Users/omsrivastava/Desktop/Project_SAAS/mobile/lib/core/network/api_endpoints.dart)
* **Vulnerability:** `baseUrl = 'http://localhost:5001/api/v1'` is hardcoded. It works on macOS Desktop and Chrome, but fails on Android Emulators (which require `10.0.2.2:5001`) and physical test devices.
* **Smallest Safe Fix:** Use `String.fromEnvironment('API_BASE_URL', defaultValue: ...)` with platform detection fallback (`Platform.isAndroid ? 'http://10.0.2.2:5001/api/v1' : 'http://localhost:5001/api/v1'`).

### Defect 4: Production Fallback for `JWT_SECRET`
* **Location:** [`backend/src/config/env.config.ts`](file:///Users/omsrivastava/Desktop/Project_SAAS/backend/src/config/env.config.ts)
* **Vulnerability:** `JWT_SECRET` has a default string value. In production environments, forgetting to supply `JWT_SECRET` in `.env` would silently allow deployment with a known key.
* **Smallest Safe Fix:** Use Zod refinement: if `NODE_ENV === 'production'`, require `JWT_SECRET` to be provided and minimum 32 characters.

---

## 3. Data Protection & Cryptographic Practices

1. **Passwords:** Stored strictly using `bcrypt` with salt rounds = 12. Plain text passwords never enter application logs or database tables.
2. **SQL Injection:** Prohibited. All SQL queries execute via parameterized placeholders (`$1, $2, ...`) through PostgreSQL's native binary protocol.
3. **AWS S3 Buckets:** Private by default. Public bucket access is blocked at the AWS IAM level. Object URLs are generated on-demand with 5-minute (PUT) and 15-minute (GET) expiries.

---

## 4. Milestone 4 RBAC & Scoping Rules: Attendance & Leaves

### A. Student Attendance Rules
| Action | Allowed Roles | Scope Enforced by Backend |
| :--- | :--- | :--- |
| Mark Student Attendance | `TEACHER` | Must be assigned Class Teacher / subject teacher for the target `class_id` and `section_id` in `staff_assignments`. Attempts to mark other classes return `403 Forbidden`. |
| View Class Attendance | `TEACHER`, `COORDINATOR` | Teachers restricted to their assigned classes. Coordinators restricted to classes within their assigned wing (`wing_id`). |
| View Student Own History | `STUDENT` | Verified against `req.user.profileId`. Querying any other student's attendance returns `403 Forbidden`. |
| Permitted Statuses | - | Strictly `'PRESENT'` and `'ABSENT'`. Any other status string returns `400 Bad Request`. |
| Duplicate Prevention | - | Enforced via database constraint `uq_student_attendance_date UNIQUE(student_id, attendance_date)`. Batch submission runs in an ACID transaction with upsert (`DO UPDATE`). |

### B. Staff Attendance Rules
| Action | Allowed Roles | Scope Enforced by Backend |
| :--- | :--- | :--- |
| View Own Staff Attendance | `TEACHER`, `COORDINATOR` | Verified against `staff_id = req.user.profileId`. |
| View Wing Staff Attendance | `COORDINATOR` | Must be for staff members assigned to the coordinator's authorized `wing_id`. |
| Staff Attendance Marking | *Deferred* | Responsibility not yet defined in client requirements; no unconfirmed marking role invented. |

### C. Leave Management State Machine & Scoping
#### Staff / Teacher Leaves
```
[Staff Submits: PENDING]
          |
          +---> [Coordinator Recommends: RECOMMENDED]
          |               |
          v               v
  [Management: APPROVED / REJECTED]
```
- **Creation:** `TEACHER` applies for leave. Date validation enforces `end_date >= start_date`. Status starts as `PENDING`.
- **Recommendation:** `COORDINATOR` adds recommendation remarks (`status: 'RECOMMENDED'`). Backend verifies staff belongs to coordinator's assigned wing. Coordinator CANNOT execute final approval or rejection.
- **Approval / Rejection:** Strictly restricted to `MANAGEMENT` / `ADMIN` roles. Allowed transitions: `PENDING -> APPROVED/REJECTED` or `RECOMMENDED -> APPROVED/REJECTED`. Cannot transition already approved/rejected leaves.

#### Student Leaves
- **Application:** `STUDENT` submits leave with reason and dates. Validated against active student profile and class/section.
- **Self-View:** Students can view their own leave history.
- **Approval Route:** Approver role (Class Teacher vs Coordinator vs Principal) is NOT confirmed in client requirements. Approval endpoints are withheld (`PATCH /leaves/student/:id/approve` returns 404) until client confirms the workflow.

## 5. Milestone 5 RBAC & Scoping Rules: Homework, Curriculum & S3 Materials

### A. Homework Scoping & Integrity
| Action | Allowed Roles | Scope Enforced by Backend |
| :--- | :--- | :--- |
| Create Homework | `TEACHER`, `COORDINATOR`, `MANAGEMENT` | Teachers must hold active allocation in `staff_assignments` for target `(class_id, section_id, subject_id)`. Attempts to assign to other classes return `403 Forbidden`. |
| View Class Homework | `TEACHER`, `COORDINATOR`, `MANAGEMENT` | Teachers restricted to taught classes/sections; Coordinators to wing classes; Management school-wide. |
| View Student Homework Feed | `STUDENT` | Filtered strictly to student's enrolled `class_id` and `section_id`. Cross-class queries return empty or `403`. |
| Toggle Completion Status | `STUDENT` | Restricts update to `student_id = req.user.profileId`. Status strictly in `('PENDING', 'COMPLETED')`. Duplicate record prevented by `uq_student_hw_completion`. |
| Date Rules | - | Backend enforces `due_date >= assigned_date` via both application validation and PostgreSQL check constraint `chk_homework_due_date`. |

### B. Curriculum & Syllabus Rules
| Action | Allowed Roles | Scope Enforced by Backend |
| :--- | :--- | :--- |
| View Units & Topics | `STUDENT`, `TEACHER`, `COORDINATOR`, `MANAGEMENT` | Authenticated users within the school. Scoped to requested `classId` and `subjectId`. |
| Create Unit / Topic | `TEACHER`, `COORDINATOR`, `MANAGEMENT` | Teachers must have active teaching assignment for target class and subject. Students attempting to create units receive `403 Forbidden`. |

### C. AWS S3 Academic Materials Security Architecture
| Security Control | Implementation | Threat Prevented |
| :--- | :--- | :--- |
| **Private S3 Bucket** | S3 bucket configured with Block Public Access enabled; zero public ACLs. | Unauthorized web scraping / public document leakage. |
| **Short-Lived Pre-Signed URLs** | Pre-signed PUT valid for 300s (5 min); Pre-signed GET valid for 900s (15 min). | Link hoarding and permanent link exposure. |
| **Server-Generated Object Keys** | Server formats keys: `schools/{schoolId}/classes/{classId}/subjects/{subjectId}/{uuid}_{sanitizedName}`. Client-provided S3 paths are rejected. | S3 path traversal, object overwriting, cross-tenant file injection. |
| **Strict File Size & MIME Validation** | Configurable default: 10 MB limit (`MAX_UPLOAD_SIZE_BYTES: 10485760`); allowed MIME types: `application/pdf,image/jpeg,image/png`. | Denial of service, bucket bill spikes, executable payload uploads. |
| **Two-Step Upload Verification** | Material record created as `is_verified = false`. Marked active only after explicit backend verification. Unverified materials hidden from students. | Phantom files and dangling database records. |
| **Cross-Class Download Protection** | Download URL generated only after validating student enrollment or teacher allocation. | Students accessing exam materials or resources of other classes. |
| **Safe Local Simulation** | When `AWS_ACCESS_KEY_ID` is unconfigured, backend simulates pre-signed upload/download endpoints in development/testing. | Hard crashes in offline or non-cloud environments. |

---

## 5. Milestone 6 Examination, Marks Entry & Report Card Security Architecture

### A. Examination Setup & Datesheet Scoping
| Action | Allowed Roles | Scope Enforced by Backend |
| :--- | :--- | :--- |
| Create Exam | `COORDINATOR`, `MANAGEMENT` | Coordinators strictly restricted to their assigned `wing_id`. Validates `start_date <= end_date`. |
| Create Datesheet Item | `COORDINATOR`, `MANAGEMENT` | Class must belong to the exam's wing. Validates `start_time < end_time` and `max_marks > 0`. Collision checks prevent scheduling two exams for the same class at overlapping time intervals. |
| Student Datesheet Access | `STUDENT` | Filtered strictly to student's enrolled `class_id`. |

### B. Teacher Marks Entry & Audit Logging
| Security Control | Implementation | Threat Prevented |
| :--- | :--- | :--- |
| **Teacher Subject Allocation Check** | Backend validates caller in `teacher_subject_allocations` for target `(class_id, subject_id)`. Unauthorized teachers receive `403 Forbidden`. | Cross-teacher marks tampering or unauthorized subject grading. |
| **Marks Boundary Validation** | Enforces `0 <= marks_obtained <= max_marks` at both service layer and PostgreSQL schema constraint. | Negative marks or inflated marks exceeding exam maximum. |
| **Explicit Absent Handling** | Enforces `(is_absent = TRUE AND marks_obtained IS NULL)` via check constraint `chk_absent_marks`. | Corrupted records where a student is absent but still assigned numeric marks. |
| **Missing Mark Protection** | Missing marks are preserved as missing in roster without auto-zeroing. Auto-zeroing is strictly prohibited without explicit confirmation. | Prematurely penalizing students whose papers are under review or pending. |
| **Tamper-Evident Audit History** | Every creation, edit, or status change automatically logs previous mark, new mark, previous absent flag, new absent flag, modifier user ID, and timestamp into `exam_marks_audit`. | Untraceable grade tampering or unauthorized modifications. |

### C. Verification, Report Cards & Publication Gates
| Action | Allowed Roles | Enforcement & Verification Rule |
| :--- | :--- | :--- |
| Coordinator Marks Verification | `COORDINATOR`, `MANAGEMENT` | Distinct workflow setting mark entries to `VERIFIED`. Scoped to wing classes. |
| Report Card Generation | `TEACHER`, `COORDINATOR`, `MANAGEMENT` | Teachers must hold active `CLASS_TEACHER` allocation for target `(class_id, section_id)`. Calculations (totals and percentage) are executed authoritatively on the server. |
| Report Card Approval | `COORDINATOR`, `MANAGEMENT` | Transitions status from `DRAFT` to `APPROVED`. Distinct from marks verification. |
| Exam Publication Control | `COORDINATOR`, `MANAGEMENT` | Sets `is_published = true`. Unpublished exams remain completely hidden from students. |
| Student Result Access | `STUDENT` | Student can only fetch their own result (`student_id = req.user.profileId`). Requires both `is_published = true` and report card `status = 'APPROVED'`. Returns `403 Forbidden` otherwise. |



