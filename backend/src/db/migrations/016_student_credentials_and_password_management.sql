-- Migration: 016_student_credentials_and_password_management.sql
-- Add login_password column to student_profiles for initial/assigned credentials tracking
-- and index for fast lookups.

ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS login_password VARCHAR(255) DEFAULT 'Student@123';

-- Update existing students with default password if null
UPDATE student_profiles 
SET login_password = 'Student@123' 
WHERE login_password IS NULL;
