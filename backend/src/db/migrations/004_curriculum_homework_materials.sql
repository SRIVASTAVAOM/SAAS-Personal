-- ============================================================================
-- Migration 004: Curriculum, Homework & Academic Materials
-- Backward-compatible schema evolution for Milestone 5.
-- ============================================================================

-- 1. Curriculum Units (Syllabus Units per class, subject, and academic year)
CREATE TABLE IF NOT EXISTS curriculum_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_curriculum_unit UNIQUE(class_id, subject_id, academic_year_id, unit_number)
);

-- 2. Curriculum Topics (Topics belonging to a Curriculum Unit)
CREATE TABLE IF NOT EXISTS curriculum_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
    topic_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    learning_objectives TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_curriculum_topic UNIQUE(unit_id, topic_number)
);

-- 3. Homework Assignments
CREATE TABLE IF NOT EXISTS homework_assignments (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_homework_due_date CHECK (due_date >= assigned_date)
);

-- 4. Student Homework Completion Tracking (Self-completion toggle by student)
CREATE TABLE IF NOT EXISTS student_homework_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homework_id UUID NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_homework_completion UNIQUE(homework_id, student_id)
);

-- 5. Academic Study Materials (Document and study guides uploaded by teachers)
CREATE TABLE IF NOT EXISTS academic_materials (
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
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_curriculum_units_query 
    ON curriculum_units(class_id, subject_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_topics_unit 
    ON curriculum_topics(unit_id);

CREATE INDEX IF NOT EXISTS idx_homework_class_sec_date 
    ON homework_assignments(class_id, section_id, assigned_date);

CREATE INDEX IF NOT EXISTS idx_homework_staff 
    ON homework_assignments(assigned_by_staff_id);

CREATE INDEX IF NOT EXISTS idx_homework_subject 
    ON homework_assignments(subject_id);

CREATE INDEX IF NOT EXISTS idx_homework_completion_student 
    ON student_homework_completions(student_id);

CREATE INDEX IF NOT EXISTS idx_materials_class_subject 
    ON academic_materials(class_id, subject_id);

CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by 
    ON academic_materials(uploaded_by_staff_id);
