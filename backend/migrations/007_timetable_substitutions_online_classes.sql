-- ============================================================================
-- Migration 007: Timetable, Substitutions, and Online Classes
-- Adds tables for Timetable Slots, Teacher Substitutions, and Online Classes
-- ============================================================================

-- 1. Timetable Slots Table
CREATE TABLE IF NOT EXISTS timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6), -- 1=Monday .. 6=Saturday
    period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 8),
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    room_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Teacher Substitutions Table
CREATE TABLE IF NOT EXISTS teacher_substitutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    timetable_slot_id UUID NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
    substitution_date DATE NOT NULL,
    original_teacher_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    substitute_teacher_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    remarks TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'COMPLETED', 'CANCELLED')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Online Class Sessions Table
CREATE TABLE IF NOT EXISTS online_class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 40,
    meeting_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher ON timetable_slots(school_id, teacher_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_sec ON timetable_slots(school_id, class_id, section_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_substitutions_date_sub ON teacher_substitutions(school_id, substitution_date, substitute_teacher_id);
CREATE INDEX IF NOT EXISTS idx_substitutions_date_orig ON teacher_substitutions(school_id, substitution_date, original_teacher_id);
CREATE INDEX IF NOT EXISTS idx_online_classes_teacher ON online_class_sessions(school_id, teacher_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_online_classes_class_sec ON online_class_sessions(school_id, class_id, section_id, scheduled_date);

-- Seed realistic records for Apex International School
DO $$
DECLARE
    v_school_id UUID := '65c2e388-65e7-4441-9f63-2ed046bfefd0';
    v_ay_id UUID := 'af6d0f49-741a-44c9-9986-92fb43379bf7';
    v_class_id UUID := '2dfb941e-8bc6-448f-b00e-fc48dd052e11'; -- Grade 10
    v_section_id UUID;
    v_teacher_staff_id UUID;
    v_coord_staff_id UUID;
    v_math_id UUID;
    v_sci_id UUID;
    v_eng_id UUID;
    v_slot_1 UUID;
    v_slot_2 UUID;
BEGIN
    -- Resolve Section A for Grade 10
    SELECT id INTO v_section_id FROM sections WHERE class_id = v_class_id AND name = 'Section A' LIMIT 1;

    -- Resolve Staff Profiles
    SELECT sp.id INTO v_teacher_staff_id
    FROM staff_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE u.identifier = 'teacher1' LIMIT 1;

    SELECT sp.id INTO v_coord_staff_id
    FROM staff_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE u.identifier = 'coordinator1' LIMIT 1;

    -- Resolve Subjects
    SELECT id INTO v_math_id FROM subjects WHERE school_id = v_school_id AND code = 'MATH10' LIMIT 1;
    SELECT id INTO v_sci_id FROM subjects WHERE school_id = v_school_id AND code = 'SCI10' LIMIT 1;
    SELECT id INTO v_eng_id FROM subjects WHERE school_id = v_school_id AND code = 'ENG10' LIMIT 1;

    IF v_section_id IS NOT NULL AND v_teacher_staff_id IS NOT NULL AND v_math_id IS NOT NULL THEN
        -- Seed Timetable Slots for Teacher1 (Mon=1 to Sat=6)
        -- Monday: P1 Math, P3 Science
        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 1 AND period_number = 1) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 1, 1, '08:30', '09:15', v_math_id, v_teacher_staff_id, 'Room 101')
            RETURNING id INTO v_slot_1;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 1 AND period_number = 3) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 1, 3, '10:15', '11:00', v_sci_id, v_teacher_staff_id, 'Lab-2')
            RETURNING id INTO v_slot_2;
        END IF;

        -- Tuesday: P2 Math, P4 Science
        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 2 AND period_number = 2) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 2, 2, '09:15', '10:00', v_math_id, v_teacher_staff_id, 'Room 101');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 2 AND period_number = 4) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 2, 4, '11:00', '11:45', v_sci_id, v_teacher_staff_id, 'Lab-2');
        END IF;

        -- Wednesday: P1 Math, P2 Science
        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 3 AND period_number = 1) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 3, 1, '08:30', '09:15', v_math_id, v_teacher_staff_id, 'Room 101');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 3 AND period_number = 2) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 3, 2, '09:15', '10:00', v_sci_id, v_teacher_staff_id, 'Lab-2');
        END IF;

        -- Thursday: P2 Science, P5 Math
        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 4 AND period_number = 2) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 4, 2, '09:15', '10:00', v_sci_id, v_teacher_staff_id, 'Lab-2');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 4 AND period_number = 5) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 4, 5, '12:30', '13:15', v_math_id, v_teacher_staff_id, 'Room 101');
        END IF;

        -- Friday: P1 Math, P3 Science
        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 5 AND period_number = 1) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 5, 1, '08:30', '09:15', v_math_id, v_teacher_staff_id, 'Room 101');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 5 AND period_number = 3) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 5, 3, '10:15', '11:00', v_sci_id, v_teacher_staff_id, 'Lab-2');
        END IF;

        -- Saturday: P2 Math
        IF NOT EXISTS (SELECT 1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id AND day_of_week = 6 AND period_number = 2) THEN
            INSERT INTO timetable_slots (school_id, academic_year_id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (v_school_id, v_ay_id, v_class_id, v_section_id, 6, 2, '09:15', '10:00', v_math_id, v_teacher_staff_id, 'Room 101');
        END IF;

        -- Seed Substitutions
        IF v_slot_1 IS NULL THEN
            SELECT id INTO v_slot_1 FROM timetable_slots WHERE teacher_id = v_teacher_staff_id LIMIT 1;
        END IF;

        IF v_coord_staff_id IS NOT NULL AND v_slot_1 IS NOT NULL THEN
            -- 1. Assigned to Teacher1 (Teacher1 is covering for Coordinator)
            IF NOT EXISTS (SELECT 1 FROM teacher_substitutions WHERE substitute_teacher_id = v_teacher_staff_id) THEN
                INSERT INTO teacher_substitutions (school_id, timetable_slot_id, substitution_date, original_teacher_id, substitute_teacher_id, remarks, status)
                VALUES (
                    v_school_id,
                    v_slot_1,
                    CURRENT_DATE,
                    v_coord_staff_id,
                    v_teacher_staff_id,
                    'Covering for Staff Coordinator during annual accreditation audit',
                    'ASSIGNED'
                );
            END IF;

            -- 2. Covering My Class (Coordinator is covering for Teacher1)
            IF NOT EXISTS (SELECT 1 FROM teacher_substitutions WHERE original_teacher_id = v_teacher_staff_id) THEN
                INSERT INTO teacher_substitutions (school_id, timetable_slot_id, substitution_date, original_teacher_id, substitute_teacher_id, remarks, status)
                VALUES (
                    v_school_id,
                    v_slot_1,
                    CURRENT_DATE + INTERVAL '1 day',
                    v_teacher_staff_id,
                    v_coord_staff_id,
                    'Covering Teacher Mathematics period while teacher conducts Olympiad examination',
                    'ASSIGNED'
                );
            END IF;
        END IF;

        -- Seed Online Class Sessions
        IF NOT EXISTS (SELECT 1 FROM online_class_sessions WHERE teacher_id = v_teacher_staff_id AND title = 'Trigonometry Doubt Clearance & Problem Solving') THEN
            INSERT INTO online_class_sessions (
                school_id, academic_year_id, class_id, section_id, subject_id, teacher_id,
                title, scheduled_date, start_time, duration_minutes, meeting_url, status
            ) VALUES (
                v_school_id,
                v_ay_id,
                v_class_id,
                v_section_id,
                v_math_id,
                v_teacher_staff_id,
                'Trigonometry Doubt Clearance & Problem Solving',
                CURRENT_DATE + INTERVAL '1 day',
                '16:00',
                45,
                'https://meet.google.com/abc-defg-hij',
                'SCHEDULED'
            );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM online_class_sessions WHERE teacher_id = v_teacher_staff_id AND title = 'Light: Reflection and Refraction Interactive Review') THEN
            INSERT INTO online_class_sessions (
                school_id, academic_year_id, class_id, section_id, subject_id, teacher_id,
                title, scheduled_date, start_time, duration_minutes, meeting_url, status
            ) VALUES (
                v_school_id,
                v_ay_id,
                v_class_id,
                v_section_id,
                v_sci_id,
                v_teacher_staff_id,
                'Light: Reflection and Refraction Interactive Review',
                CURRENT_DATE + INTERVAL '2 days',
                '17:30',
                40,
                'https://meet.google.com/xyz-uvwx-rst',
                'SCHEDULED'
            );
        END IF;
    END IF;
END $$;
