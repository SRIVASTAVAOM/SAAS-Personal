-- Migration 012: Subject Master Enhancements
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'THEORY',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_subjects_type ON subjects(type);
