-- Migration 008: SaaS Menu Config, Branding Config, and Leave Document Attachments
-- Non-destructive additive migration

-- 1. Schools table: menu_config and branding_config
ALTER TABLE schools 
  ADD COLUMN IF NOT EXISTS menu_config JSONB DEFAULT '{"student_menus": {}, "teacher_menus": {}, "company_footer": "Powered by ERP SaaS"}'::jsonb,
  ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'::jsonb;

-- 2. Leave tables: document_url and attachment_name
ALTER TABLE student_leaves 
  ADD COLUMN IF NOT EXISTS document_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT NULL;

ALTER TABLE staff_leaves 
  ADD COLUMN IF NOT EXISTS document_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT NULL;

-- 3. Base table safety if student_leave_applications or staff_leave_applications exist as physical tables
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'student_leave_applications' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE student_leave_applications ADD COLUMN IF NOT EXISTS document_url TEXT NULL;
    ALTER TABLE student_leave_applications ADD COLUMN IF NOT EXISTS attachment_name TEXT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'staff_leave_applications' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE staff_leave_applications ADD COLUMN IF NOT EXISTS document_url TEXT NULL;
    ALTER TABLE staff_leave_applications ADD COLUMN IF NOT EXISTS attachment_name TEXT NULL;
  END IF;
END $$;

-- 4. Recreate views to expose all columns
CREATE OR REPLACE VIEW student_leave_applications AS SELECT * FROM student_leaves;
CREATE OR REPLACE VIEW staff_leave_applications AS SELECT * FROM staff_leaves;
