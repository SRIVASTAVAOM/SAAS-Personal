-- Migration 010: Streamline System to Exactly 4 Roles
-- 1. SUPER_ADMIN (Platform Owner)
-- 2. ADMIN (School Principal / Administrator)
-- 3. TEACHER (Faculty)
-- 4. STUDENT (Student)

-- 1. Ensure ADMIN role exists
INSERT INTO roles (name) VALUES ('ADMIN')
ON CONFLICT (name) DO NOTHING;

-- 2. Migrate any existing users from MANAGEMENT, COORDINATOR, ACCOUNTANT to ADMIN
DO $$
DECLARE
  admin_role_id UUID;
  default_school_id UUID;
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';

  -- Reassign user_roles
  INSERT INTO user_roles (user_id, role_id)
  SELECT DISTINCT ur.user_id, admin_role_id
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name IN ('MANAGEMENT', 'COORDINATOR', 'ACCOUNTANT')
  ON CONFLICT DO NOTHING;

  -- Remove mappings to legacy roles
  DELETE FROM user_roles
  WHERE role_id IN (
    SELECT id FROM roles WHERE name IN ('MANAGEMENT', 'COORDINATOR', 'ACCOUNTANT')
  );

  -- Delete legacy roles from roles table
  DELETE FROM roles
  WHERE name IN ('MANAGEMENT', 'COORDINATOR', 'ACCOUNTANT');

  -- Ensure a default 'admin' user exists for the primary school
  SELECT id INTO default_school_id FROM schools ORDER BY created_at ASC LIMIT 1;
  IF default_school_id IS NOT NULL THEN
    SELECT id INTO admin_user_id FROM users WHERE identifier = 'admin';
    IF admin_user_id IS NULL THEN
      INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
      VALUES (
        default_school_id,
        'admin',
        'admin@apex.edu',
        '+91 9876543200',
        '$2b$10$Sgh8z2Sjg36LX67D1LQMDuoC9p1plMPWhNbhr1ARyckZJ2NcoPINu', -- Password@123
        TRUE
      ) RETURNING id INTO admin_user_id;

      INSERT INTO user_roles (user_id, role_id)
      VALUES (admin_user_id, admin_role_id)
      ON CONFLICT DO NOTHING;

      INSERT INTO staff_profiles (
        user_id, employee_code, first_name, last_name, qualification, is_active
      ) VALUES (
        admin_user_id, 'EMP_ADMIN_001', 'School', 'Administrator', 'M.Ed, Administration', TRUE
      ) ON CONFLICT DO NOTHING;
    ELSE
      -- Ensure admin user has ADMIN role
      INSERT INTO user_roles (user_id, role_id)
      VALUES (admin_user_id, admin_role_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
