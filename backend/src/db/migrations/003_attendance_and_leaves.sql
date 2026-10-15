-- ============================================================================
-- Migration 003: Daily Attendance & Leave Management
-- Backward-compatible schema evolution for Milestone 4.
-- ============================================================================

-- 1. Student Attendance Records
CREATE TABLE IF NOT EXISTS student_attendance_records (
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

-- 2. Staff Attendance Records
CREATE TABLE IF NOT EXISTS staff_attendance_records (
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

-- 3. Staff Leaves (With Coordinator Recommendation and Management Sanction)
CREATE TABLE IF NOT EXISTS staff_leaves (
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

-- 4. Student Leaves (Self-service application & status view; approver pending client confirmation)
CREATE TABLE IF NOT EXISTS student_leaves (
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

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_attendance_date_class 
    ON student_attendance_records(attendance_date, class_id, section_id);

CREATE INDEX IF NOT EXISTS idx_student_attendance_student_date 
    ON student_attendance_records(student_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_date 
    ON staff_attendance_records(attendance_date);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_date 
    ON staff_attendance_records(staff_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_staff_leaves_staff 
    ON staff_leaves(staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_leaves_status 
    ON staff_leaves(status);

CREATE INDEX IF NOT EXISTS idx_student_leaves_student 
    ON student_leaves(student_id);

CREATE INDEX IF NOT EXISTS idx_student_leaves_class_sec 
    ON student_leaves(class_id, section_id);
