-- ============================================================================
-- Migration 005: Examinations, Marks Entry, Verification & Report Cards
-- Backward-compatible schema evolution for Milestone 6.
-- ============================================================================

-- 1. Exams Table (Term / Mid-Term / Final Examination definition)
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    wing_id UUID REFERENCES wings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_by_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_exam_dates CHECK (end_date >= start_date)
);

-- 2. Exam Datesheets Table (Subject-wise examination schedule per class)
CREATE TABLE IF NOT EXISTS exam_datesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    passing_marks NUMERIC(5, 2) DEFAULT 33.00,
    invigilator_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_exam_datesheet_time CHECK (end_time > start_time),
    CONSTRAINT chk_exam_datesheet_max_marks CHECK (max_marks > 0),
    CONSTRAINT uq_exam_datesheet_class_subject UNIQUE (exam_id, class_id, subject_id)
);

-- 3. Exam Marks Table (Student subject marks entry by allocated teachers)
CREATE TABLE IF NOT EXISTS exam_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_datesheet_id UUID NOT NULL REFERENCES exam_datesheets(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) CHECK (marks_obtained IS NULL OR marks_obtained >= 0),
    is_absent BOOLEAN NOT NULL DEFAULT FALSE,
    remarks VARCHAR(255),
    entered_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    verified_by_coordinator_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_mark_student UNIQUE (exam_datesheet_id, student_id)
);

-- 4. Exam Marks Audit Table (Historical log of marks modifications)
CREATE TABLE IF NOT EXISTS exam_marks_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_mark_id UUID NOT NULL REFERENCES exam_marks(id) ON DELETE CASCADE,
    changed_by_staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    previous_marks NUMERIC(5, 2),
    previous_is_absent BOOLEAN,
    new_marks NUMERIC(5, 2),
    new_is_absent BOOLEAN,
    change_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Report Cards Table (Aggregated class-wise student results with coordinator approval)
CREATE TABLE IF NOT EXISTS report_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    total_marks_obtained NUMERIC(7, 2) NOT NULL DEFAULT 0.00,
    total_max_marks NUMERIC(7, 2) NOT NULL DEFAULT 0.00,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    subjects_evaluated_count INT NOT NULL DEFAULT 0,
    subjects_absent_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'APPROVED', 'PUBLISHED')),
    class_teacher_remarks TEXT,
    generated_by_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_report_card_exam_student UNIQUE (exam_id, student_id)
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_exams_school_year ON exams(school_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_exams_wing ON exams(wing_id);
CREATE INDEX IF NOT EXISTS idx_exam_datesheets_exam ON exam_datesheets(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_datesheets_class_date ON exam_datesheets(class_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_marks_datesheet ON exam_marks(exam_datesheet_id);
CREATE INDEX IF NOT EXISTS idx_exam_marks_student ON exam_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_marks_status ON exam_marks(status);
CREATE INDEX IF NOT EXISTS idx_report_cards_exam_class ON report_cards(exam_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id);
