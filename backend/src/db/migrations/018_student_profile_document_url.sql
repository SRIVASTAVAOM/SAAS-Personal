-- Migration 018: Add document_url to student_profiles
-- Enables document attachments and health records for student profiles

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS document_url TEXT NULL;

