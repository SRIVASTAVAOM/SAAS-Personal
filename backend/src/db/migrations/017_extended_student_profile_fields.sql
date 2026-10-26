-- Migration 017: Extended Student Profile Fields & Legacy ERP Extra Data
-- Supports all 94 bulk student import fields from school systems

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS caste VARCHAR(100),
  ADD COLUMN IF NOT EXISTS religion VARCHAR(100),
  ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS student_aadhar VARCHAR(50),
  ADD COLUMN IF NOT EXISTS aadhar_father VARCHAR(50),
  ADD COLUMN IF NOT EXISTS aadhar_mother VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pan_mother VARCHAR(50),
  ADD COLUMN IF NOT EXISTS father_pan VARCHAR(50),
  ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for high-performance JSONB queries over extra_data
CREATE INDEX IF NOT EXISTS idx_student_profiles_extra_data ON student_profiles USING GIN (extra_data);
