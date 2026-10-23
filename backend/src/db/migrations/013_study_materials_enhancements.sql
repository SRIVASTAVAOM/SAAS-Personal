-- Migration 013: Study Materials Enhancements
-- Adds material_type and indexes to support admin and teacher material categories (Syllabus, Practice Sheet, Notes, etc.)

ALTER TABLE academic_materials 
ADD COLUMN IF NOT EXISTS material_type VARCHAR(50) DEFAULT 'Study Material';

CREATE INDEX IF NOT EXISTS idx_materials_school_created 
ON academic_materials(school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_materials_type 
ON academic_materials(school_id, material_type);
