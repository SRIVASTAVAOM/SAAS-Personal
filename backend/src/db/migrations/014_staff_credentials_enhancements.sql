-- Migration: 014_staff_credentials_enhancements.sql
-- Add login_password column to staff_profiles to allow admin visibility of initial/assigned credentials
-- and add performance index on is_active

ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS login_password VARCHAR(255) DEFAULT 'Staff@123';

-- Populate existing staff with default password if null
UPDATE staff_profiles 
SET login_password = 'Staff@123' 
WHERE login_password IS NULL;

-- Index for fast status filtering (active vs inactive)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_is_active ON staff_profiles(is_active);
