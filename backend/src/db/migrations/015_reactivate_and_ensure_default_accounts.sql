-- Migration 015: Reactivate and Guarantee Default School Login Accounts
-- Guarantees working credentials for:
-- 1. admin (ADMIN) -> Password@123
-- 2. management1 (ADMIN) -> Password@123
-- 3. teacher1 (TEACHER) -> Password@123
-- 4. student1 (STUDENT) -> Password@123
-- 5. student2 (STUDENT) -> Password@123
-- 6. superadmin (SUPER_ADMIN) -> Password@123

DO $$
DECLARE
  default_school_id UUID;
  admin_role_id UUID;
  teacher_role_id UUID;
  student_role_id UUID;
  superadmin_role_id UUID;
  default_class_id UUID;
  default_section_id UUID;
  default_password_hash VARCHAR(255) := '$2b$10$Sgh8z2Sjg36LX67D1LQMDuoC9p1plMPWhNbhr1ARyckZJ2NcoPINu'; -- Password@123
  admin_user_id UUID;
  management_user_id UUID;
  teacher_user_id UUID;
  student1_user_id UUID;
  student2_user_id UUID;
  superadmin_user_id UUID;
  teacher_staff_id UUID;
BEGIN
  -- 1. Ensure Roles Exist
  INSERT INTO roles (name) VALUES ('SUPER_ADMIN') ON CONFLICT (name) DO NOTHING;
  INSERT INTO roles (name) VALUES ('ADMIN') ON CONFLICT (name) DO NOTHING;
  INSERT INTO roles (name) VALUES ('TEACHER') ON CONFLICT (name) DO NOTHING;
  INSERT INTO roles (name) VALUES ('STUDENT') ON CONFLICT (name) DO NOTHING;

  SELECT id INTO superadmin_role_id FROM roles WHERE name = 'SUPER_ADMIN';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';
  SELECT id INTO teacher_role_id FROM roles WHERE name = 'TEACHER';
  SELECT id INTO student_role_id FROM roles WHERE name = 'STUDENT';

  -- 2. Reactivate ALL existing users and profiles
  UPDATE users SET is_active = TRUE;
  UPDATE staff_profiles SET is_active = TRUE;
  UPDATE student_profiles SET is_active = TRUE;

  -- 3. Get or Create Default School (Apex International School)
  SELECT id INTO default_school_id FROM schools ORDER BY created_at ASC LIMIT 1;
  IF default_school_id IS NULL THEN
    INSERT INTO schools (name, code, contact_email, contact_phone, address, status, plan)
    VALUES ('Apex International School', 'APEX01', 'info@apexschool.edu', '+91 9876543210', '123 Education Lane, Knowledge Park', 'ACTIVE', 'PRO')
    RETURNING id INTO default_school_id;
  END IF;

  -- Get Default Class and Section
  SELECT c.id, s.id INTO default_class_id, default_section_id
  FROM classes c
  JOIN sections s ON s.class_id = c.id
  WHERE c.school_id = default_school_id
  LIMIT 1;

  -- 4. Super Admin
  SELECT id INTO superadmin_user_id FROM users WHERE identifier = 'superadmin';
  IF superadmin_user_id IS NULL THEN
    INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
    VALUES (default_school_id, 'superadmin', 'superadmin@saas.com', '+91 9999999999', default_password_hash, TRUE)
    RETURNING id INTO superadmin_user_id;
  ELSE
    UPDATE users SET password_hash = default_password_hash, is_active = TRUE WHERE id = superadmin_user_id;
  END IF;
  INSERT INTO user_roles (user_id, role_id) VALUES (superadmin_user_id, superadmin_role_id) ON CONFLICT DO NOTHING;

  -- 5. Admin (identifier = 'admin')
  SELECT id INTO admin_user_id FROM users WHERE identifier = 'admin';
  IF admin_user_id IS NULL THEN
    INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
    VALUES (default_school_id, 'admin', 'admin@apex.edu', '+91 9876543200', default_password_hash, TRUE)
    RETURNING id INTO admin_user_id;
  ELSE
    UPDATE users SET password_hash = default_password_hash, is_active = TRUE WHERE id = admin_user_id;
  END IF;
  INSERT INTO user_roles (user_id, role_id) VALUES (admin_user_id, admin_role_id) ON CONFLICT DO NOTHING;
  INSERT INTO staff_profiles (user_id, employee_code, first_name, last_name, qualification, is_active, login_password)
  VALUES (admin_user_id, 'EMP_ADMIN_001', 'School', 'Administrator', 'M.Ed, Administration', TRUE, 'Password@123')
  ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, login_password = 'Password@123';

  -- 6. Management (identifier = 'management1')
  SELECT id INTO management_user_id FROM users WHERE identifier = 'management1';
  IF management_user_id IS NULL THEN
    INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
    VALUES (default_school_id, 'management1', 'management1@apex.edu', '+91 9876543201', default_password_hash, TRUE)
    RETURNING id INTO management_user_id;
  ELSE
    UPDATE users SET password_hash = default_password_hash, is_active = TRUE WHERE id = management_user_id;
  END IF;
  INSERT INTO user_roles (user_id, role_id) VALUES (management_user_id, admin_role_id) ON CONFLICT DO NOTHING;
  INSERT INTO staff_profiles (user_id, employee_code, first_name, last_name, qualification, is_active, login_password)
  VALUES (management_user_id, 'EMP-MANAGEMENT1', 'Management', 'Admin', 'M.B.A.', TRUE, 'Password@123')
  ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, login_password = 'Password@123';

  -- 7. Teacher (identifier = 'teacher1')
  SELECT id INTO teacher_user_id FROM users WHERE identifier = 'teacher1';
  IF teacher_user_id IS NULL THEN
    INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
    VALUES (default_school_id, 'teacher1', 'teacher1@apex.edu', '+91 9000000002', default_password_hash, TRUE)
    RETURNING id INTO teacher_user_id;
  ELSE
    UPDATE users SET password_hash = default_password_hash, is_active = TRUE WHERE id = teacher_user_id;
  END IF;
  INSERT INTO user_roles (user_id, role_id) VALUES (teacher_user_id, teacher_role_id) ON CONFLICT DO NOTHING;
  INSERT INTO staff_profiles (user_id, employee_code, first_name, last_name, gender, qualification, joining_date, emergency_phone, phone, blood_group, is_active, login_password)
  VALUES (teacher_user_id, 'EMP-TEACHER1', 'Sunita', 'Sharma', 'Female', 'M.Sc., B.Ed.', '2024-06-01', '+91 9000000002', '+91 9000000002', 'B+', TRUE, 'Password@123')
  ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, login_password = 'Password@123'
  RETURNING id INTO teacher_staff_id;

  -- 8. Student 1 (identifier = 'student1')
  SELECT id INTO student1_user_id FROM users WHERE identifier = 'student1';
  IF student1_user_id IS NULL THEN
    INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
    VALUES (default_school_id, 'student1', 'student1@apex.edu', '+91 9000000001', default_password_hash, TRUE)
    RETURNING id INTO student1_user_id;
  ELSE
    UPDATE users SET password_hash = default_password_hash, is_active = TRUE WHERE id = student1_user_id;
  END IF;
  INSERT INTO user_roles (user_id, role_id) VALUES (student1_user_id, student_role_id) ON CONFLICT DO NOTHING;
  IF default_class_id IS NOT NULL AND default_section_id IS NOT NULL THEN
    INSERT INTO student_profiles (
      user_id, admission_number, roll_number, first_name, last_name,
      gender, date_of_birth, admission_date, current_class_id, current_section_id,
      father_name, mother_name, emergency_phone, blood_group, is_active
    ) VALUES (
      student1_user_id, 'ADM2026001', '101', 'Aarav', 'Sharma',
      'Male', '2010-05-15', '2026-04-01', default_class_id, default_section_id,
      'Rajesh Sharma', 'Sunita Sharma', '+91 9000000001', 'O+', TRUE
    )
    ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE;
  END IF;

  -- 9. Student 2 (identifier = 'student2')
  SELECT id INTO student2_user_id FROM users WHERE identifier = 'student2';
  IF student2_user_id IS NULL THEN
    INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
    VALUES (default_school_id, 'student2', 'student2@apex.edu', '+91 9000000006', default_password_hash, TRUE)
    RETURNING id INTO student2_user_id;
  ELSE
    UPDATE users SET password_hash = default_password_hash, is_active = TRUE WHERE id = student2_user_id;
  END IF;
  INSERT INTO user_roles (user_id, role_id) VALUES (student2_user_id, student_role_id) ON CONFLICT DO NOTHING;
  IF default_class_id IS NOT NULL AND default_section_id IS NOT NULL THEN
    INSERT INTO student_profiles (
      user_id, admission_number, roll_number, first_name, last_name,
      gender, date_of_birth, admission_date, current_class_id, current_section_id,
      father_name, mother_name, emergency_phone, blood_group, is_active
    ) VALUES (
      student2_user_id, 'ADM2026002', '102', 'Riya', 'Patel',
      'Female', '2010-08-22', '2026-04-01', default_class_id, default_section_id,
      'Vikram Patel', 'Meena Patel', '+91 9000000006', 'A+', TRUE
    )
    ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE;
  END IF;

END $$;
