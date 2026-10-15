# School ERP - System Architecture Blueprint

**Document Version:** 1.0.0  
**Status:** Validated Architecture  

---

## 1. High-Level Architecture Model

School ERP follows a **Single-App, Unified-Backend, Relational-Persistence** architecture model designed for enterprise scalability, strict transactional integrity, and maintainability.

```
+--------------------------------------------------------------------------+
|                     FLUTTER MOBILE CLIENT (iOS / Android)                |
|  +--------------------------------------------------------------------+  |
|  |                 Declarative GoRouter Shell (Role-Guarded)          |  |
|  |   [Student Shell] [Teacher Shell] [Accountant] [Coordinator] [Mgt] |  |
|  +--------------------------------------------------------------------+  |
|  |             BLoC / Cubit Domain State Management Layer             |  |
|  +--------------------------------------------------------------------+  |
|  |  Network Client (Dio + Auth Interceptors) | Secure Hardware Store |  |
+--+-------------------------------------------+------------------------+--+
                       |                                   |
                       | HTTPS (REST API / JWT)            | Direct S3 Upload (PUT)
                       v                                   v
+----------------------------------------------+   +-----------------------+
|        NODE.JS + EXPRESS + TYPESCRIPT        |   |     PRIVATE AWS S3    |
|  +----------------------------------------+  |   |   (Encrypted Storage) |
|  | Helmet / CORS / JSON Request Parser    |  |   |                       |
|  +----------------------------------------+  |   | - Academic Uploads    |
|  | Multi-Tier Security Middleware:        |  |   | - Student Documents   |
|  | 1. authenticateToken (JWT Validation)  |  |   | - Homework Materials  |
|  | 2. requireRole (Coarse RBAC)           |  |   | - Generated Receipts  |
|  | 3. enforceResourceScope (Data Filters) |  |   |                       |
|  +----------------------------------------+  |   | Access: Short-Lived   |
|  | Modular Domain Engines:                |  |   | Pre-Signed URLs only  |
|  | - Auth & Identity Service              |  |   +-----------------------+
|  | - Academics & Roster Service           |  |               ^
|  | - Attendance & Routine Service         |  |               |
|  | - Fee & Accounting Engine (ACID)       |  |  Generate     |
|  | - Payroll Engine (Attendance-linked)   |  |  Presigned    |
|  | - Coordinator Workflow Engine          |  |  URLs         |
|  | - S3 Presigned URL Dispatcher ---------+--+---------------+
|  +----------------------------------------+  |
|  | Repository Layer (Parameterized SQL)   |  |
+--+----------------------------------------+--+
                       |
                       | Connection Pool / Transactions (BEGIN...COMMIT)
                       v
+--------------------------------------------------------------------------+
|                        POSTGRESQL 16/17 DATABASE                         |
|  - Master Schemas: Schools, Wings, Classes, Sections, Academic Years     |
|  - Identity: Users, UserRoles, StaffProfiles, StudentProfiles            |
|  - Operations: Attendance, Timetables, Homework, Leaves, Substitutions   |
|  - Academics: Exams, Datesheets, Marks, Report Cards                     |
|  - Financial: FeeStructures, Receipts, DayBook, GeneralLedger, Payroll   |
|  - Audit Trail: Immutable system logs for sensitive actions              |
+--------------------------------------------------------------------------+
```

---

## 2. Client-Side Architecture (Flutter + Dart)

### A. Architectural Layers
1. **Presentation Layer:** Widgets, custom minimalist components, role navigation shells, and responsive form views.
2. **Business Logic Layer (BLoC / Cubit):**
   * Manages domain state transitions deterministically.
   * Isolates UI from direct API communications.
   * State examples: `AuthLoading`, `Authenticated`, `FeePaymentLoading`, `AttendanceMarked`.
3. **Repository Layer:** Abstract data source contracts combining remote API responses and local storage caching.
4. **Data & Network Layer:**
   * `DioClient`: Configured with base URL, timeout thresholds, and interceptors.
   * `AuthInterceptor`: Attaches `Authorization: Bearer <token>` on all outgoing requests; intercepts `401 Unauthorized` responses to clear sessions.
   * `SecureStorageService`: Interacts with hardware Keystores (Android Keystore / iOS Keychain).

### B. Minimalist Design System Configuration
* **Canvas:** Pure White (`#FFFFFF`) and Soft Off-White (`#F8F9FA`).
* **Borders:** Subtle hairline borders (`BorderSide(color: Color(0xFFE2E8F0), width: 1.0)`).
* **Elevation:** Zero drop shadows (`elevation: 0`) across all cards, navigation bars, and app bars.
* **Typography:** Google Fonts Inter text theme with strict hierarchy (H1: 22px, Title: 16px, Body: 14px, Caption: 12px).
* **Color Palette:** Restrained Slate (`#1E293B`, `#64748B`, `#0F172A`), functional alerts (Green `#16A34A`, Red `#DC2626`).

---

## 3. Server-Side Architecture (Node.js + Express + TypeScript)

### A. 3-Tier Layered Pattern
1. **Routes Layer (`*.routes.ts`):** Defines URL patterns and applies validation schemas and authorization middlewares.
2. **Controller Layer (`*.controller.ts`):** Parses HTTP requests, validates payloads using Zod, calls services, and formats standard HTTP responses.
3. **Service Layer (`*.service.ts`):** Contains pure business logic, calculations (e.g., fee late rules, payroll math), and coordinates database transactions.
4. **Repository Layer (`*.repository.ts`):** Executes raw, parameterized SQL queries via `pg` connection pool.

### B. Standard API Response Envelope
All API endpoints conform to a standardized JSON response format:
```json
// Success Response
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": "Error description message",
  "details": [ ... ]
}
```

---

## 4. Private Object Storage via AWS S3 Pre-Signed URLs

To ensure server performance and eliminate server memory bottlenecks when handling large PDFs, receipts, and homework documents:

1. **Client Request:** Mobile client sends metadata (`fileName`, `fileType`, `fileSize`) to backend.
2. **Validation & Ticket Generation:** Backend verifies user permissions, validates file MIME type against whitelist, and uses `@aws-sdk/s3-request-presigner` to generate a short-lived PUT URL (expiry: 300 seconds).
3. **Direct Upload:** Mobile client uploads binary payload directly to AWS S3 using HTTP PUT via `Dio`.
4. **Persistence:** Mobile client notifies backend upon completion; backend stores S3 object key in PostgreSQL.
5. **Private Access:** When downloading or previewing files, backend generates a short-lived GET URL (expiry: 900 seconds) after verifying access ownership.

---

## 5. Financial & Transaction Integrity (ACID Guarantees)

For financial operations (Accountant fee collection, voucher entries, refunds, and payroll processing):
1. **Atomic Execution:** Operations wrap in explicit `BEGIN ... COMMIT / ROLLBACK` database transactions.
2. **Concurrency Control:** Critical counters (e.g., receipt numbers, fee balance updates) use PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to prevent race conditions during simultaneous counter payments.
3. **Precision Math:** All monetary fields utilize PostgreSQL `NUMERIC(12, 2)` or integer `paise` values. JavaScript floating-point arithmetic is prohibited for currency calculations.
