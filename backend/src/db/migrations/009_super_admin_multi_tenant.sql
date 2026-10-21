-- Migration 009: Super Admin and Multi-Tenant SaaS Architecture
-- Enables global platform owner (Super Admin) capabilities and tenant controls

-- 1. Ensure SUPER_ADMIN role exists
INSERT INTO roles (name) VALUES ('SUPER_ADMIN')
ON CONFLICT (name) DO NOTHING;

-- 2. Allow school_id to be NULL for platform-level Super Admins
ALTER TABLE users ALTER COLUMN school_id DROP NOT NULL;

-- 3. Enhance schools table with SaaS tenant management fields
ALTER TABLE schools 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'PRO',
  ADD COLUMN IF NOT EXISTS max_students INT DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year'),
  ADD COLUMN IF NOT EXISTS admin_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(50);

-- Update existing schools to ACTIVE if status is NULL
UPDATE schools SET status = 'ACTIVE' WHERE status IS NULL;
UPDATE schools SET plan = 'PRO' WHERE plan IS NULL;

-- 4. Seed default Super Admin user (Password: Password@123)
DO $$
DECLARE
  super_admin_role_id UUID;
  super_admin_user_id UUID;
BEGIN
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN';

  -- Check if superadmin user exists
  SELECT id INTO super_admin_user_id FROM users WHERE identifier = 'superadmin';

  IF super_admin_user_id IS NULL THEN
    INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
    VALUES (
      NULL,
      'superadmin',
      'superadmin@saas.com',
      '+91 9999999999',
      '$2b$10$Sgh8z2Sjg36LX67D1LQMDuoC9p1plMPWhNbhr1ARyckZJ2NcoPINu',
      TRUE
    ) RETURNING id INTO super_admin_user_id;
  END IF;

  -- Assign SUPER_ADMIN role
  INSERT INTO user_roles (user_id, role_id)
  VALUES (super_admin_user_id, super_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

END $$;
