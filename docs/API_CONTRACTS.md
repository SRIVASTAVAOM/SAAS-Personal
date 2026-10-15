# School ERP - API Contracts Specification

**Document Version:** 1.2.0  
**Base URL:** `/api/v1`  
**Standard Headers:**
* `Content-Type: application/json`
* `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Contracts

### `POST /auth/login`
* **Access:** Public
* **Request:**
```json
{
  "identifier": "teacher1",
  "password": "Password@123"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "e81d4a8e-...",
      "schoolId": "a12c4b5e-...",
      "identifier": "teacher1",
      "email": "teacher1@apex.edu",
      "firstName": "Vikram",
      "lastName": "Joshi",
      "roles": ["TEACHER"],
      "profileId": "f78a2c1b-...",
      "wingId": "wing_senior",
      "classId": "cls_g10",
      "sectionId": "sec_g10_a"
    }
  }
}
```

---

## 2. Daily Attendance Contracts

### `POST /attendance/student`
* **Access:** `TEACHER`, `COORDINATOR`
* **Scope:** Caller must be assigned Class Teacher or Wing Coordinator for target class/section.
* **Request:**
```json
{
  "class_id": "cls_g10",
  "section_id": "sec_g10_a",
  "attendance_date": "2026-10-12",
  "records": [
    { "student_id": "std_uuid_1", "status": "PRESENT", "remarks": null },
    { "student_id": "std_uuid_2", "status": "ABSENT", "remarks": "Fever reported" }
  ]
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Attendance marked successfully (2 records processed)",
  "data": { "marked_count": 2, "date": "2026-10-12" }
}
```
* **Rules & Error Handling:**
  * Status strictly restricted to `PRESENT` or `ABSENT`. Any other status returns `400 Bad Request`.
  * Duplicate records for `(student_id, attendance_date)` are prevented and updated atomically.

### `GET /attendance/student/class/:classId/:sectionId?date=YYYY-MM-DD`
* **Access:** `TEACHER`, `COORDINATOR`
* **Scope:** Scoped to authorized class teacher or wing coordinator.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "att_rec_1",
      "student_id": "std_uuid_1",
      "student_name": "Aarav Sharma",
      "admission_number": "ADM-2024-001",
      "roll_number": 1,
      "attendance_date": "2026-10-12",
      "status": "PRESENT",
      "remarks": null,
      "marked_by_name": "Vikram Joshi"
    }
  ]
}
```

### `GET /attendance/student/my-history`
* **Access:** `STUDENT`
* **Scope:** Strictly scoped to authenticated student.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "att_rec_1",
      "student_id": "std_uuid_1",
      "attendance_date": "2026-10-12",
      "status": "PRESENT",
      "remarks": null,
      "marked_by_name": "Vikram Joshi"
    }
  ]
}
```

### `GET /attendance/staff/my-history`
* **Access:** `TEACHER`, `COORDINATOR`, `ACCOUNTANT`
* **Scope:** Returns authenticated staff member's own attendance logs.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "staff_att_1",
      "staff_id": "stf_uuid_1",
      "attendance_date": "2026-10-12",
      "status": "PRESENT",
      "remarks": null
    }
  ]
}
```

### `GET /attendance/staff/wing/:wingId?date=YYYY-MM-DD`
* **Access:** `COORDINATOR`
* **Scope:** Strictly scoped to coordinator's assigned wing. Cross-wing access returns `403 Forbidden`.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "staff_att_1",
      "staff_id": "stf_uuid_1",
      "staff_name": "Vikram Joshi",
      "employee_code": "EMP-2024-010",
      "designation": "Senior Teacher",
      "wing_id": "wing_senior",
      "attendance_date": "2026-10-12",
      "status": "PRESENT",
      "remarks": null
    }
  ]
}
```

---

## 3. Leave Management Contracts

### `POST /leaves/staff`
* **Access:** `TEACHER`, `COORDINATOR`
* **Request:**
```json
{
  "start_date": "2026-10-15",
  "end_date": "2026-10-16",
  "leave_type": "CASUAL",
  "reason": "Family wedding"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Leave application submitted successfully",
  "data": {
    "id": "lve_uuid_1",
    "staff_id": "stf_uuid_1",
    "start_date": "2026-10-15",
    "end_date": "2026-10-16",
    "leave_type": "CASUAL",
    "reason": "Family wedding",
    "status": "PENDING"
  }
}
```

### `GET /leaves/staff/my-leaves`
* **Access:** `TEACHER`, `COORDINATOR`
* **Success Response (200 OK):** Returns staff's own submitted leaves with recommendation & decision details.

### `GET /leaves/staff/wing-leaves`
* **Access:** `COORDINATOR`
* **Scope:** Returns leaves of staff belonging to coordinator's assigned wing.

### `PATCH /leaves/staff/:id/recommend`
* **Access:** `COORDINATOR`
* **Scope:** Coordinator attached to applicant's wing. Teachers calling this endpoint get `403 Forbidden`.
* **Request:**
```json
{
  "note": "Substitute teacher arranged: Mr. Gupta"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Leave recommended successfully",
  "data": {
    "id": "lve_uuid_1",
    "status": "RECOMMENDED",
    "recommendation_note": "Substitute teacher arranged: Mr. Gupta"
  }
}
```

### `GET /leaves/staff/management-queue`
* **Access:** `MANAGEMENT`
* **Scope:** School-wide queue of pending and recommended staff leaves.

### `PATCH /leaves/staff/:id/decide`
* **Access:** `MANAGEMENT`
* **Request:**
```json
{
  "decision": "APPROVED", // "APPROVED" or "REJECTED"
  "note": "Approved per school policy",
  "rejection_reason": null
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Leave decision recorded successfully",
  "data": {
    "id": "lve_uuid_1",
    "status": "APPROVED",
    "decision_note": "Approved per school policy"
  }
}
```
* **State Machine Rule:** Already sanctioned leaves (`APPROVED` or `REJECTED`) cannot be modified; returns `400 Bad Request`.

### `POST /leaves/student`
* **Access:** `STUDENT`
* **Request:**
```json
{
  "start_date": "2026-10-20",
  "end_date": "2026-10-21",
  "reason": "High fever"
}
```
* **Success Response (201 Created):** Creates student leave record with initial status `PENDING`.

### `GET /leaves/student/my-leaves`
* **Access:** `STUDENT`
* **Scope:** Scoped strictly to authenticated student.
* **Success Response (200 OK):** Returns student's submitted leave records.

---

## 4. Academic Master & Profile Contracts

* `GET /academics/subjects` - List all school subjects.
* `GET /academics/class-roster/:classId/:sectionId` - Class students roster (scoped to enrolled students & allocated teachers).
* `GET /academics/my-roster` - Taught students roster for teachers.
* `GET /academics/subject-teachers` - Allocated subject teachers for students.
* `GET /profiles/student` & `PATCH /profiles/student` - Student profile view & permitted editing.
* `GET /profiles/staff` & `PATCH /profiles/staff` - Staff profile view & permitted editing.

---

## 5. Milestone 5: Curriculum, Homework & Academic Materials Contracts

### `POST /homework`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT` (Teachers must be allocated to class, section, and subject).
* **Request:**
```json
{
  "classId": "2dfb941e-8bc6-448f-b00e-fc48dd052e11",
  "sectionId": "6b6d2fe2-16a3-4c9c-b179-88006d649ab7",
  "subjectId": "8cb6d05e-e45e-44dc-a0a5-4ba5fd8f303f",
  "title": "Trigonometry Heights & Distances",
  "description": "Complete exercise 9.1 questions 1 to 8",
  "assignedDate": "2026-10-11",
  "dueDate": "2026-10-15",
  "s3AttachmentKey": "schools/.../worksheet.pdf",
  "attachmentName": "Worksheet_9_1.pdf"
}
```
* **Validation:** `dueDate >= assignedDate`, non-empty title and description.
* **Success Response (201 Created):** Returns created homework assignment.

### `GET /homework/student/my-class`
* **Access:** `STUDENT`
* **Scope:** Filtered strictly to student's enrolled `class_id` and `section_id`.
* **Success Response (200 OK):** Returns homework list with completion status badge (`PENDING` or `COMPLETED`).

### `POST /homework/:id/completion`
* **Access:** `STUDENT`
* **Request:**
```json
{
  "status": "COMPLETED"
}
```
* **Validation:** Status must be `COMPLETED` or `PENDING`.
* **Success Response (200 OK):** Updates completion toggle with timestamp.

### `GET /homework/:id/attachment-download`
* **Access:** `STUDENT`, `TEACHER`, `COORDINATOR`, `MANAGEMENT` (Class-scoped).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://school-erp-bucket.s3.amazonaws.com/...",
    "fileName": "Worksheet_9_1.pdf",
    "expiresInSeconds": 900
  }
}
```

### `GET /curriculum/units`
* **Access:** Authenticated users in the school (`STUDENT`, `TEACHER`, `COORDINATOR`, `MANAGEMENT`).
* **Query Params:** `classId` (required), `subjectId` (required), `academicYearId` (optional).
* **Success Response (200 OK):** Returns sorted units and nested topics.

### `POST /curriculum/units`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT` (Teachers must be allocated to class and subject).
* **Request:**
```json
{
  "classId": "2dfb941e-8bc6-448f-b00e-fc48dd052e11",
  "subjectId": "8cb6d05e-e45e-44dc-a0a5-4ba5fd8f303f",
  "unitNumber": 1,
  "title": "Unit 1: Real Numbers",
  "description": "Fundamental arithmetic theorem and proofs"
}
```
* **Success Response (201 Created):** Returns created unit.

### `POST /curriculum/topics`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT` (Allocation check enforced).
* **Request:**
```json
{
  "unitId": "unit_uuid",
  "topicNumber": 1,
  "title": "Euclid Division Lemma",
  "description": "Lemma statements and applications",
  "learningObjectives": "Understand algorithm"
}
```
* **Success Response (201 Created):** Returns created topic.

### `POST /materials/presigned-upload-url`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT` (Teachers must be allocated).
* **Request:**
```json
{
  "classId": "2dfb941e-8bc6-448f-b00e-fc48dd052e11",
  "subjectId": "8cb6d05e-e45e-44dc-a0a5-4ba5fd8f303f",
  "title": "Trigonometry Formula Sheet",
  "fileName": "formulas.pdf",
  "fileSizeBytes": 204800,
  "contentType": "application/pdf"
}
```
* **Validation:** File size <= 10MB (10485760 bytes), MIME type in `['application/pdf', 'image/jpeg', 'image/png']`.
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "materialId": "mat_uuid",
    "uploadUrl": "https://school-erp-bucket.s3.amazonaws.com/uploads/...",
    "fileKey": "schools/.../formulas.pdf",
    "expiresInSeconds": 300
  }
}
```

### `POST /materials/:id/verify-upload`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT` (Original uploader or coordinator/management).
* **Success Response (200 OK):** Sets `is_verified = true` in PostgreSQL and returns activated material.

### `GET /materials/class/:classId/:subjectId`
* **Access:** Authenticated users in the class.
* **Success Response (200 OK):** Returns verified academic materials.

### `GET /materials/:id/download-url`
* **Access:** Scoped to class/section students and authorized teachers.
* **Success Response (200 OK):** Returns short-lived signed GET URL (valid 15 minutes).

---

## 6. Examinations, Marks Entry, Verification & Report Cards (Milestone 6)

### `POST /api/v1/exams`
* **Access:** `COORDINATOR`, `MANAGEMENT`
* **Request:**
```json
{
  "academicYearId": "uuid",
  "wingId": "uuid",
  "name": "Mid-Term Examinations 2026",
  "examType": "MID_TERM",
  "startDate": "2026-10-15",
  "endDate": "2026-10-25",
  "description": "Optional notes"
}
```
* **Validation:** `startDate <= endDate`, `wingId` within coordinator scope.
* **Success Response (201 Created):** Returns created exam object.

### `GET /api/v1/exams`
* **Access:** Authenticated users (`STUDENT`, `TEACHER`, `COORDINATOR`, `MANAGEMENT`).
* **Query Parameters:** `wingId` (optional), `academicYearId` (optional).
* **Success Response (200 OK):** Returns list of examinations.

### `POST /api/v1/exams/:id/datesheets`
* **Access:** `COORDINATOR`, `MANAGEMENT`
* **Request:**
```json
{
  "classId": "uuid",
  "subjectId": "uuid",
  "examDate": "2026-10-16",
  "startTime": "09:00:00",
  "endTime": "12:00:00",
  "maxMarks": 100,
  "passingMarks": 33
}
```
* **Validation:** `maxMarks > 0`, `startTime < endTime`, schedule collision check prevents overlapping exam time for the same class and date.
* **Success Response (201 Created):** Returns created datesheet entry.

### `GET /api/v1/exams/:id/datesheets`
* **Access:** Authenticated users.
* **Query Parameters:** `classId` (optional).
* **Success Response (200 OK):** Returns scheduled subjects with timing and max marks.

### `GET /api/v1/exams/:id/datesheets/student/my-class`
* **Access:** `STUDENT`
* **Validation:** Strictly retrieves scheduled subjects for authenticated student's enrolled `class_id`.
* **Success Response (200 OK):** Returns datesheet schedule for student's class.

### `GET /api/v1/exams/:id/datesheets/:datesheetId/marks-roster`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT`
* **Validation:** Teacher must be allocated to the subject and class via `teacher_subject_allocations`.
* **Query Parameters:** `sectionId` (optional).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "datesheet": { "id": "uuid", "maxMarks": 100, "subjectName": "Mathematics" },
    "roster": [
      {
        "studentId": "uuid",
        "rollNumber": "1",
        "admissionNumber": "ADM101",
        "firstName": "Aarav",
        "lastName": "Sharma",
        "marksObtained": 88.0,
        "isAbsent": false,
        "remarks": "Well done",
        "status": "DRAFT"
      }
    ]
  }
}
```

### `POST /api/v1/exams/:id/datesheets/:datesheetId/marks`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT` (Allocation checked for teacher).
* **Request:**
```json
{
  "submitForVerification": false,
  "marks": [
    {
      "studentId": "uuid",
      "marksObtained": 88.0,
      "isAbsent": false,
      "remarks": "Well done"
    },
    {
      "studentId": "uuid-2",
      "marksObtained": null,
      "isAbsent": true,
      "remarks": "Medical leave"
    }
  ]
}
```
* **Validation:** `0 <= marksObtained <= maxMarks`. When `isAbsent = true`, `marksObtained` must be null. Missing marks are tracked without auto-zeroing.
* **Audit History:** Every modification automatically logs previous mark, new mark, modified by user ID, and timestamp to `exam_marks_audit`.
* **Success Response (200 OK):** Returns updated count and status.

### `GET /api/v1/exams/:id/datesheets/:datesheetId/summary`
* **Access:** `COORDINATOR`, `TEACHER`, `MANAGEMENT`
* **Success Response (200 OK):** Returns total students, entered count, absent count, missing count, average marks, highest, lowest, and verification status.

### `PATCH /api/v1/exams/:id/datesheets/:datesheetId/verify`
* **Access:** `COORDINATOR`, `MANAGEMENT` (Wing scope checked).
* **Validation:** Sets mark records to `VERIFIED` status. Distinct from report card approval.
* **Success Response (200 OK):** Returns verified count.

### `POST /api/v1/exams/:id/report-cards/class/:classId/:sectionId`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT`
* **Validation:** Teachers must be assigned as the class teacher for the specified class and section.
* **Calculation:** Backend authoritatively aggregates total marks obtained, total max marks, and exact percentage (`Math.round((total_obtained / total_max) * 10000) / 100`).
* **Success Response (200 OK):** Returns generated report cards for class.

### `GET /api/v1/exams/:id/report-cards/class/:classId/:sectionId`
* **Access:** `TEACHER`, `COORDINATOR`, `MANAGEMENT`
* **Success Response (200 OK):** Returns compiled class report cards.

### `PATCH /api/v1/exams/:id/report-cards/class/:classId/:sectionId/approve`
* **Access:** `COORDINATOR`, `MANAGEMENT` (Wing scope checked).
* **Validation:** Transitions class report cards from `DRAFT` to `APPROVED`.
* **Success Response (200 OK):** Returns approved count.

### `PATCH /api/v1/exams/:id/publish`
* **Access:** `COORDINATOR`, `MANAGEMENT` (Wing scope checked).
* **Request:** `{ "isPublished": true }`
* **Success Response (200 OK):** Updates publication status of the exam.

### `GET /api/v1/exams/:id/results/student/my-result`
* **Access:** `STUDENT`
* **Validation:** Scoped strictly to authenticated student. Exam must be published (`is_published = true`) and student's report card must be `APPROVED`. Otherwise returns 403 Forbidden.
* **Success Response (200 OK):** Returns exam details, overall report card with percentage and totals, and subject-wise mark breakdown.


