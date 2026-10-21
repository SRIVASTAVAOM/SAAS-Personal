-- ============================================================================
-- Migration 008: Staff Management, Individual Notifications, and Homework Indexes
-- ============================================================================

-- 1. Extend notices table with target_student_id and channel
ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS target_student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'IN_APP';

CREATE INDEX IF NOT EXISTS idx_notices_target_student ON notices(target_student_id);

-- 2. Extend staff_profiles with department and designation
ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS designation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 3. Indexes for fast homework, staff, and feedback lookups
CREATE INDEX IF NOT EXISTS idx_homework_school_due ON homework_assignments(school_id, due_date);
CREATE INDEX IF NOT EXISTS idx_homework_assigned_by ON homework_assignments(assigned_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_school_feedback_school ON school_feedback(school_id);
CREATE INDEX IF NOT EXISTS idx_student_complaints_school ON student_complaints(school_id);
