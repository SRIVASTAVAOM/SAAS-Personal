# School ERP - Database Design & Evolution Roadmap

**Document Version:** 1.0.0  
**Database Engine:** PostgreSQL 16/17  
**Status:** Validated Architecture  

---

## 1. Audit of Existing Baseline Schema (Milestone 1)

The database `school_erp_db` currently contains 12 verified tables:

| Table Name | Purpose | Primary Key | Key Foreign Keys | Status |
| :--- | :--- | :--- | :--- | :--- |
| `schools` | Multi-tenant tenant boundary | `id` (UUID) | None | Verified in DB |
| `wings` | School sections (Primary, Senior) | `id` (UUID) | `school_id -> schools` | Verified in DB |
| `academic_years` | School sessions (e.g., 2026-2027) | `id` (UUID) | `school_id -> schools` | Verified in DB |
| `classes` | Standard classes (e.g., Grade 10) | `id` (UUID) | `school_id, wing_id` | Verified in DB |
| `sections` | Class divisions (Section A) | `id` (UUID) | `class_id -> classes` | Verified in DB |
| `roles` | System roles (5 confirmed roles) | `id` (UUID) | None | Verified in DB |
| `users` | Auth credentials (bcrypt salt 12) | `id` (UUID) | `school_id -> schools` | Verified in DB |
| `user_roles` | User-role mapping | `id` (UUID) | `user_id, role_id` | Verified in DB |
| `staff_profiles` | Normalized employee profile | `id` (UUID) | `user_id -> users` | Verified in DB |
| `student_profiles` | Normalized student profile | `id` (UUID) | `user_id, current_class_id, current_section_id` | Verified in DB |
| `staff_assignments`| Scoped Wing/Class allocations | `id` (UUID) | `staff_id, wing_id, class_id, section_id` | Verified in DB |
| `schema_migrations`| Migration version history | `id` (SERIAL)| None | Verified in DB |
| `subjects` | Master subject catalog | `id` (UUID) | `school_id -> schools` | Verified in DB (M3) |
| `class_subjects` | Class-subject mappings | `id` (UUID) | `class_id, subject_id` | Verified in DB (M3) |
| `teacher_subject_allocations` | Teacher-subject-class allocations | `id` (UUID) | `staff_id, class_id, section_id, subject_id` | Verified in DB (M3) |
| `student_attendance_records` | Daily student attendance | `id` (UUID) | `student_id, class_id, section_id, marked_by` | Verified in DB (M4) |
| `staff_attendance_records` | Daily staff attendance | `id` (UUID) | `staff_id, school_id` | Verified in DB (M4) |
| `staff_leaves` | Staff leave applications & tracking | `id` (UUID) | `staff_id, recommended_by, sanctioned_by` | Verified in DB (M4) |
| `student_leaves` | Student leave applications | `id` (UUID) | `student_id, class_id, section_id` | Verified in DB (M4) |

---

## 2. Complete Domain Schema Evolution Roadmap

To support the confirmed client requirements across all 5 roles without rewriting the foundation, the schema will evolve across subsequent milestones in the following structured dependency order:

```
[M1: Core Master & Identity] (DONE)
            |
            v
[M3: Subjects & Staff Allocations]
            |
            +---------------------------------------+
            |                                       |
            v                                       v
[M4: Attendance, Leaves & Routine]       [M7: Fee Structures & Dues]
            |                                       |
            v                                       v
[M5: Homework & S3 Materials]            [M7: Counter Fee Receipts]
            |                                       |
            v                                       v
[M6: Exams, Marks & Report Cards]        [M8: Expenses & Day Book]
            |                                       |
            +-------------------+-------------------+
                                |
                                v
                 [M9: Attendance-Linked Payroll]
                                |
                                v
                 [M10: Coordinator & Activities]
                                |
                                v
                 [M11: Comprehensive Audit Logs]
```

---

### Domain 1: Subjects & Academic Allocation (Milestone 3)
```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, code)
);

CREATE TABLE class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_elective BOOLEAN DEFAULT FALSE,
  UNIQUE(class_id, subject_id)
);

CREATE TABLE teacher_subject_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  UNIQUE(staff_id, class_id, section_id, subject_id, academic_year_id)
);
```

---

### Domain 2: Daily Operations, Attendance & Leaves (Milestone 4 - Implemented)
```sql
-- Status constrained to confirmed values ('PRESENT', 'ABSENT')
CREATE TABLE student_attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
    marked_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_attendance_date UNIQUE(student_id, attendance_date)
);

CREATE TABLE staff_attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
    in_time TIME,
    out_time TIME,
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_staff_attendance_date UNIQUE(staff_id, attendance_date)
);

CREATE TABLE staff_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('SICK', 'CASUAL', 'EARNED')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECOMMENDED', 'APPROVED', 'REJECTED')),
    coordinator_recommendation TEXT,
    recommended_by_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    recommended_at TIMESTAMP WITH TIME ZONE,
    management_comment TEXT,
    sanctioned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sanctioned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_staff_leave_dates CHECK (end_date >= start_date)
);

CREATE TABLE student_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_student_leave_dates CHECK (end_date >= start_date)
);

-- Performance Indexes
CREATE INDEX idx_student_attendance_date_class ON student_attendance_records(attendance_date, class_id, section_id);
CREATE INDEX idx_student_attendance_student_date ON student_attendance_records(student_id, attendance_date);
CREATE INDEX idx_staff_attendance_date ON staff_attendance_records(attendance_date);
CREATE INDEX idx_staff_attendance_staff_date ON staff_attendance_records(staff_id, attendance_date);
CREATE INDEX idx_staff_leaves_staff ON staff_leaves(staff_id);
CREATE INDEX idx_staff_leaves_status ON staff_leaves(status);
CREATE INDEX idx_student_leaves_student ON student_leaves(student_id);
CREATE INDEX idx_student_leaves_class_sec ON student_leaves(class_id, section_id);
```

---

### Domain 3: Timetable, Homework & S3 Materials (Milestone 5)
```sql
CREATE TABLE timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  period_number INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  room_number VARCHAR(50),
  UNIQUE(class_id, section_id, academic_year_id, day_of_week, period_number)
);

-- =====================================================================
-- MILESTONE 5: CURRICULUM, HOMEWORK & ACADEMIC MATERIALS
-- =====================================================================

-- Table 20: Curriculum Units
CREATE TABLE curriculum_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  unit_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, subject_id, academic_year_id, unit_number)
);

-- Table 21: Curriculum Topics
CREATE TABLE curriculum_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
  topic_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  learning_objectives TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(unit_id, topic_number)
);

-- Table 22: Homework Assignments
CREATE TABLE homework_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  assigned_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  s3_attachment_key VARCHAR(500),
  attachment_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_homework_due_date CHECK (due_date >= assigned_date)
);

-- Table 23: Student Homework Completions
CREATE TABLE student_homework_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homework_id UUID NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(homework_id, student_id)
);

-- Table 24: Academic Materials
CREATE TABLE academic_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  uploaded_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  s3_file_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### Domain 4: Examinations & Report Cards (Milestone 6)
```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  wing_id UUID NOT NULL REFERENCES wings(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  exam_type VARCHAR(50) NOT NULL DEFAULT 'MID_TERM', -- 'MID_TERM', 'FINAL', 'UNIT_TEST', 'PRACTICAL'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_by_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_exam_dates CHECK (end_date >= start_date)
);

CREATE TABLE exam_datesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE, -- NULL indicates whole class
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_marks NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (max_marks > 0),
  passing_marks NUMERIC(5, 2) NOT NULL DEFAULT 33.00 CHECK (passing_marks >= 0),
  invigilator_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_exam_time CHECK (end_time > start_time),
  UNIQUE(exam_id, class_id, subject_id)
);

CREATE TABLE exam_marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_datesheet_id UUID NOT NULL REFERENCES exam_datesheets(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5, 2) CHECK (marks_obtained >= 0),
  is_absent BOOLEAN NOT NULL DEFAULT FALSE,
  remarks VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED')),
  entered_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  verified_by_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status_updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(exam_datesheet_id, student_id),
  CONSTRAINT chk_absent_marks CHECK (
    (is_absent = TRUE AND marks_obtained IS NULL) OR
    (is_absent = FALSE)
  )
);

CREATE TABLE exam_marks_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_marks_id UUID NOT NULL REFERENCES exam_marks(id) ON DELETE CASCADE,
  previous_marks NUMERIC(5, 2),
  new_marks NUMERIC(5, 2),
  previous_absent BOOLEAN,
  new_absent BOOLEAN,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  modified_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL DEFAULT 'UPDATE', -- 'CREATE', 'UPDATE', 'VERIFY'
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  total_marks_obtained NUMERIC(7, 2) NOT NULL DEFAULT 0.00,
  total_max_marks NUMERIC(7, 2) NOT NULL DEFAULT 0.00,
  percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  subjects_evaluated_count INTEGER NOT NULL DEFAULT 0,
  subjects_absent_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED')),
  class_teacher_remarks TEXT,
  generated_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  approved_by_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, student_id)
);

-- Performance and Scope Indexes
CREATE INDEX idx_exams_school_wing ON exams(school_id, wing_id, academic_year_id);
CREATE INDEX idx_exam_datesheets_exam_class ON exam_datesheets(exam_id, class_id);
CREATE INDEX idx_exam_datesheets_date_time ON exam_datesheets(exam_date, start_time, end_time);
CREATE INDEX idx_exam_marks_datesheet ON exam_marks(exam_datesheet_id);
CREATE INDEX idx_exam_marks_student ON exam_marks(student_id);
CREATE INDEX idx_exam_marks_audit_marks_id ON exam_marks_audit(exam_marks_id);
CREATE INDEX idx_report_cards_exam_class_sec ON report_cards(exam_id, class_id, section_id);
CREATE INDEX idx_report_cards_student ON report_cards(student_id);
CREATE INDEX idx_report_cards_status ON report_cards(status);
```

---

### Domain 5: Fees, Receipts & Accounting Ledgers (Milestone 7 & 8)
```sql
CREATE TABLE fee_heads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Tuition Fee, Computer Lab, Annual Activity
  is_recurring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  fee_head_id UUID NOT NULL REFERENCES fee_heads(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_day_of_month INT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(academic_year_id, class_id, fee_head_id)
);

CREATE TABLE student_fee_dues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  installment_label VARCHAR(50) NOT NULL, -- e.g., Q1 - April 2026
  original_amount NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  paid_amount NUMERIC(12, 2) DEFAULT 0.00,
  balance_amount NUMERIC(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  is_cleared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fee_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  payment_mode VARCHAR(50) NOT NULL, -- CASH, CHEQUE, POS_CARD, COUNTER_UPI
  transaction_reference VARCHAR(150),
  cheque_number VARCHAR(100),
  cheque_bank VARCHAR(150),
  collected_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE day_book_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type VARCHAR(20) NOT NULL, -- RECEIPT, PAYMENT, CONTRA
  account_head VARCHAR(150) NOT NULL,
  voucher_number VARCHAR(100),
  cash_debit NUMERIC(12, 2) DEFAULT 0.00,
  cash_credit NUMERIC(12, 2) DEFAULT 0.00,
  bank_debit NUMERIC(12, 2) DEFAULT 0.00,
  bank_credit NUMERIC(12, 2) DEFAULT 0.00,
  narration TEXT NOT NULL,
  created_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  voucher_number VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL, -- UTILITIES, MAINTENANCE, SUPPLIES
  vendor_name VARCHAR(150),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode VARCHAR(50) NOT NULL,
  invoice_reference VARCHAR(100),
  recorded_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  expense_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### Domain 6: Payroll Processing & Management Approvals (Milestone 9)
```sql
CREATE TYPE payroll_status_enum AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED_BY_MANAGEMENT', 'DISBURSED');

CREATE TABLE salary_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID UNIQUE NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  basic_salary NUMERIC(12, 2) NOT NULL,
  house_rent_allowance NUMERIC(12, 2) DEFAULT 0.00,
  special_allowance NUMERIC(12, 2) DEFAULT 0.00,
  provident_fund_deduction NUMERIC(12, 2) DEFAULT 0.00,
  tax_deduction NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  cycle_month INT NOT NULL CHECK (cycle_month BETWEEN 1 AND 12),
  cycle_year INT NOT NULL,
  total_gross NUMERIC(14, 2) NOT NULL,
  total_deductions NUMERIC(14, 2) NOT NULL,
  total_net_payable NUMERIC(14, 2) NOT NULL,
  status payroll_status_enum DEFAULT 'CALCULATED',
  processed_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  management_approved_by_user_id UUID REFERENCES users(id),
  management_approved_at TIMESTAMP WITH TIME ZONE,
  management_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, cycle_month, cycle_year)
);

CREATE TABLE salary_slips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  present_days NUMERIC(4, 1) NOT NULL,
  lop_days NUMERIC(4, 1) DEFAULT 0.0,
  gross_earnings NUMERIC(12, 2) NOT NULL,
  total_deductions NUMERIC(12, 2) NOT NULL,
  net_salary NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(payroll_run_id, staff_id)
);
```

---

### Domain 7: Coordinator Welfare, Circulars & Student Records (Milestone 10)
```sql
CREATE TABLE discipline_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL, -- MISBEHAVIOR, ATTENDANCE, INFRASTRUCTURE
  description TEXT NOT NULL,
  action_taken TEXT,
  recorded_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  wing_id UUID NOT NULL REFERENCES wings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weak_student_trackings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  identified_date DATE NOT NULL,
  reason TEXT NOT NULL,
  remedial_plan TEXT,
  progress_notes TEXT,
  tracked_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE circulars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  wing_id UUID REFERENCES wings(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL, -- ALL, TEACHERS, STUDENTS, WING
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### Domain 8: Immutable Audit Trail (Milestone 11)
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- MARKS_UPDATE, FEE_COLLECTION, REFUND, PAYROLL_APPROVE
  entity_name VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_state JSONB,
  new_state JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```
