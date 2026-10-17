-- ============================================================================
-- Migration 006: Student Dashboard Essential Features
-- Adds tables for Notices, Student Fees, Fee Receipts, Complaints, and Feedback
-- ============================================================================

-- 1. Notices Table (School-wide and class-specific announcements)
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50) DEFAULT 'ALL',
    target_class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    target_section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('INFO', 'NORMAL', 'URGENT')),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Student Fees Table (Fee heads, due dates, amount, and payment status)
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    fee_title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PARTIAL', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Fee Receipts Table (Recorded fee payments)
CREATE TABLE IF NOT EXISTS fee_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_fee_id UUID REFERENCES student_fees(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    payment_date DATE NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'DEMAND_DRAFT', 'ONLINE')),
    transaction_reference VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Student Complaints Table (Student grievances & status tracking)
CREATE TABLE IF NOT EXISTS student_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('ACADEMIC', 'FACILITY', 'DISCIPLINE', 'TRANSPORT', 'OTHER')),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'RESOLVED')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. School Feedback Table (Feedback submissions)
CREATE TABLE IF NOT EXISTS school_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (category IN ('CURRICULUM', 'TEACHING', 'FACILITIES', 'ACTIVITIES', 'GENERAL')),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_notices_school_target ON notices(school_id, target_class_id, target_section_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_student ON fee_receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_student ON student_complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student ON school_feedback(student_id);

-- Seed realistic sample records for student1
DO $$
DECLARE
    v_school_id UUID;
    v_student_id UUID;
    v_class_id UUID;
    v_ay_id UUID;
    v_fee_id_1 UUID;
    v_fee_id_2 UUID;
BEGIN
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    IF v_school_id IS NULL THEN
        -- Clean DB: DDL migration runs before seed.ts. Skip sample data insertion.
        RETURN;
    END IF;

    SELECT id INTO v_student_id FROM student_profiles LIMIT 1;
    SELECT id INTO v_class_id FROM classes WHERE school_id = v_school_id LIMIT 1;
    SELECT id INTO v_ay_id FROM academic_years WHERE school_id = v_school_id LIMIT 1;

    IF v_student_id IS NULL OR v_class_id IS NULL OR v_ay_id IS NULL THEN
        RETURN;
    END IF;
    -- Seed Notices
    IF NOT EXISTS (SELECT 1 FROM notices WHERE title = 'Annual Sports Meet 2026 Schedule') THEN
        INSERT INTO notices (school_id, title, content, target_role, priority, published_at)
        VALUES (
            v_school_id,
            'Annual Sports Meet 2026 Schedule',
            'The Annual Inter-House Athletics and Sports Meet will take place from November 15 to November 17, 2026. All participants must report to the sports ground by 8:00 AM in their respective house jerseys.',
            'ALL',
            'INFO',
            CURRENT_TIMESTAMP - INTERVAL '2 days'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM notices WHERE title = 'Grade 10 Science Exhibition & Project Submission') THEN
        INSERT INTO notices (school_id, title, content, target_role, target_class_id, priority, published_at)
        VALUES (
            v_school_id,
            'Grade 10 Science Exhibition & Project Submission',
            'All Class 10 students are required to submit their Science exhibition synopsis and working model blueprint to their subject teachers by next Monday.',
            'STUDENT',
            v_class_id,
            'URGENT',
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        );
    END IF;

    -- Seed Student Fees
    IF NOT EXISTS (SELECT 1 FROM student_fees WHERE student_id = v_student_id AND fee_title = 'Quarter 1 Tuition & Laboratory Fee') THEN
        INSERT INTO student_fees (school_id, student_id, academic_year_id, fee_title, due_date, amount, amount_paid, status)
        VALUES (
            v_school_id,
            v_student_id,
            v_ay_id,
            'Quarter 1 Tuition & Laboratory Fee',
            '2026-04-15',
            15000.00,
            15000.00,
            'PAID'
        ) RETURNING id INTO v_fee_id_1;

        -- Seed Fee Receipt for Paid Fee
        INSERT INTO fee_receipts (school_id, student_fee_id, student_id, receipt_number, payment_date, amount_paid, payment_mode, transaction_reference, remarks)
        VALUES (
            v_school_id,
            v_fee_id_1,
            v_student_id,
            'REC-2026-00412',
            '2026-04-10',
            15000.00,
            'BANK_TRANSFER',
            'HDFC-TXN-882194',
            'Paid in full for Quarter 1'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM student_fees WHERE student_id = v_student_id AND fee_title = 'Quarter 2 Tuition Fee') THEN
        INSERT INTO student_fees (school_id, student_id, academic_year_id, fee_title, due_date, amount, amount_paid, status)
        VALUES (
            v_school_id,
            v_student_id,
            v_ay_id,
            'Quarter 2 Tuition Fee',
            '2026-07-15',
            12500.00,
            0.00,
            'PENDING'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM student_fees WHERE student_id = v_student_id AND fee_title = 'Annual Examination & Library Fee') THEN
        INSERT INTO student_fees (school_id, student_id, academic_year_id, fee_title, due_date, amount, amount_paid, status)
        VALUES (
            v_school_id,
            v_student_id,
            v_ay_id,
            'Annual Examination & Library Fee',
            '2026-10-31',
            3500.00,
            0.00,
            'PENDING'
        );
    END IF;

    -- Seed Complaint
    IF NOT EXISTS (SELECT 1 FROM student_complaints WHERE student_id = v_student_id) THEN
        INSERT INTO student_complaints (school_id, student_id, title, category, description, status, resolution_notes)
        VALUES (
            v_school_id,
            v_student_id,
            'Additional Exemplar Books in Library',
            'ACADEMIC',
            'Requesting more copies of Class 10 Mathematics and Science exemplar problem books in the central library for term preparation.',
            'IN_REVIEW',
            'Librarian has placed order with publisher. Estimated arrival in 5 business days.'
        );
    END IF;

    -- Seed Feedback
    IF NOT EXISTS (SELECT 1 FROM school_feedback WHERE student_id = v_student_id) THEN
        INSERT INTO school_feedback (school_id, student_id, category, rating, feedback_text)
        VALUES (
            v_school_id,
            v_student_id,
            'TEACHING',
            5,
            'The practical demonstrations conducted during Physics class really helped clarify optics concepts.'
        );
    END IF;
END $$;
