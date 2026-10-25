import bcrypt from 'bcrypt';
import { pool } from '../../config/db.config';

export interface OnboardSchoolInput {
  name: string;
  code: string;
  plan?: 'FREE' | 'PRO' | 'ENTERPRISE';
  maxStudents?: number;
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword?: string;
  address?: string;
}

export class SuperAdminService {
  /**
   * Platform-wide aggregated metrics across all schools
   */
  static async getPlatformMetrics() {
    const client = await pool.connect();
    try {
      // 1. School stats
      const schoolStatsRes = await client.query(`
        SELECT 
          COUNT(*)::int AS total_schools,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_schools,
          COUNT(*) FILTER (WHERE status = 'SUSPENDED')::int AS suspended_schools
        FROM schools;
      `);

      // 2. Student & Staff counts
      const userCountsRes = await client.query(`
        SELECT 
          (SELECT COUNT(*)::int FROM student_profiles WHERE is_active = true) AS total_students,
          (SELECT COUNT(*)::int FROM staff_profiles WHERE is_active = true) AS total_staff;
      `);

      // 3. Plan breakdown
      const planRes = await client.query(`
        SELECT COALESCE(plan, 'PRO') AS plan, COUNT(*)::int AS count
        FROM schools
        GROUP BY plan;
      `);

      // 4. Recent schools with student counts
      const recentSchoolsRes = await client.query(`
        SELECT 
          s.id,
          s.name,
          s.code,
          s.status,
          s.plan,
          s.admin_name,
          s.admin_email,
          s.created_at,
          COUNT(DISTINCT stp.id)::int AS student_count
        FROM schools s
        LEFT JOIN users u ON u.school_id = s.id
        LEFT JOIN student_profiles stp ON stp.user_id = u.id AND stp.is_active = true
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 5;
      `);

      return {
        schools: schoolStatsRes.rows[0],
        users: userCountsRes.rows[0],
        planBreakdown: planRes.rows,
        recentSchools: recentSchoolsRes.rows,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get all schools with search, filter, and tenant usage metrics
   */
  static async getSchools(filters: { search?: string; status?: string; plan?: string }) {
    const values: any[] = [];
    let whereClauses: string[] = [];

    if (filters.search) {
      values.push(`%${filters.search.trim()}%`);
      whereClauses.push(`(s.name ILIKE $${values.length} OR s.code ILIKE $${values.length} OR s.admin_email ILIKE $${values.length})`);
    }

    if (filters.status && filters.status !== 'ALL') {
      values.push(filters.status);
      whereClauses.push(`s.status = $${values.length}`);
    }

    if (filters.plan && filters.plan !== 'ALL') {
      values.push(filters.plan);
      whereClauses.push(`s.plan = $${values.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        s.id,
        s.name,
        s.code,
        s.status,
        s.plan,
        s.max_students,
        s.subscription_expires_at,
        s.admin_name,
        s.admin_email,
        s.admin_phone,
        s.address,
        s.created_at,
        COUNT(DISTINCT stp.id)::int AS student_count,
        COUNT(DISTINCT sp.id)::int AS staff_count
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN student_profiles stp ON stp.user_id = u.id AND stp.is_active = true
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id AND sp.is_active = true
      ${whereStr}
      GROUP BY s.id
      ORDER BY s.created_at DESC;
    `;

    const { rows } = await pool.query(query, values);
    return rows;
  }

  /**
   * Get single school details
   */
  static async getSchoolById(schoolId: string) {
    const schoolRes = await pool.query(`SELECT * FROM schools WHERE id = $1`, [schoolId]);
    if (schoolRes.rows.length === 0) {
      throw new Error('SCHOOL_NOT_FOUND');
    }

    const school = schoolRes.rows[0];

    // Counts
    const countsRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT stp.id)::int AS student_count,
        COUNT(DISTINCT sp.id)::int AS staff_count
      FROM users u
      LEFT JOIN student_profiles stp ON stp.user_id = u.id AND stp.is_active = true
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id AND sp.is_active = true
      WHERE u.school_id = $1;
    `, [schoolId]);

    // Wings and classes
    const classesRes = await pool.query(`
      SELECT c.id, c.name, w.name AS wing_name, COUNT(stp.id)::int AS student_count
      FROM classes c
      JOIN wings w ON c.wing_id = w.id
      LEFT JOIN student_profiles stp ON stp.current_class_id = c.id AND stp.is_active = true
      WHERE c.school_id = $1
      GROUP BY c.id, c.name, w.name
      ORDER BY c.name;
    `, [schoolId]);

    return {
      ...school,
      ...countsRes.rows[0],
      classes: classesRes.rows,
    };
  }

  /**
   * 1-Click Onboard School Transaction:
   * Creates School -> Academic Year -> Wings -> Classes -> Sections -> School Admin User
   */
  static async onboardSchool(data: OnboardSchoolInput) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const cleanCode = data.code.trim().toUpperCase();

      // Check if code exists
      const existingCode = await client.query('SELECT id FROM schools WHERE code = $1', [cleanCode]);
      if (existingCode.rows.length > 0) {
        throw new Error('SCHOOL_CODE_EXISTS');
      }

      // Check if admin email or identifier exists
      const adminIdentifier = `admin_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const existingUser = await client.query(
        'SELECT id FROM users WHERE identifier = $1 OR email = $2',
        [adminIdentifier, data.adminEmail.trim()]
      );
      if (existingUser.rows.length > 0) {
        throw new Error('ADMIN_EMAIL_OR_IDENTIFIER_EXISTS');
      }

      // 1. Insert School
      const schoolRes = await client.query(`
        INSERT INTO schools (
          name, code, status, plan, max_students, 
          subscription_expires_at, admin_name, admin_email, admin_phone, address
        ) VALUES (
          $1, $2, 'ACTIVE', $3, $4,
          CURRENT_TIMESTAMP + INTERVAL '1 year', $5, $6, $7, $8
        ) RETURNING *;
      `, [
        data.name.trim(),
        cleanCode,
        data.plan || 'PRO',
        data.maxStudents || 1000,
        data.adminName.trim(),
        data.adminEmail.trim(),
        data.adminPhone ? data.adminPhone.trim() : null,
        data.address ? data.address.trim() : null,
      ]);
      const school = schoolRes.rows[0];

      // 2. Insert Default Academic Year (2026-2027)
      await client.query(`
        INSERT INTO academic_years (school_id, label, start_date, end_date, is_current)
        VALUES ($1, '2026-2027', '2026-04-01', '2027-03-31', TRUE)
        RETURNING id;
      `, [school.id]);

      // 3. Insert Wings
      const primaryWingRes = await client.query(`
        INSERT INTO wings (school_id, name) VALUES ($1, 'Primary Wing') RETURNING id;
      `, [school.id]);
      const middleWingRes = await client.query(`
        INSERT INTO wings (school_id, name) VALUES ($1, 'Middle Wing') RETURNING id;
      `, [school.id]);
      const secondaryWingRes = await client.query(`
        INSERT INTO wings (school_id, name) VALUES ($1, 'Secondary Wing') RETURNING id;
      `, [school.id]);
      const seniorWingRes = await client.query(`
        INSERT INTO wings (school_id, name) VALUES ($1, 'Senior Secondary Wing') RETURNING id;
      `, [school.id]);

      const primaryWingId = primaryWingRes.rows[0].id;
      const middleWingId = middleWingRes.rows[0].id;
      const secondaryWingId = secondaryWingRes.rows[0].id;
      const seniorWingId = seniorWingRes.rows[0].id;

      // 4. Default Classes (1 to 12) with Section 'A'
      const classMap: { name: string; wingId: string }[] = [
        { name: 'Class 1', wingId: primaryWingId },
        { name: 'Class 2', wingId: primaryWingId },
        { name: 'Class 3', wingId: primaryWingId },
        { name: 'Class 4', wingId: primaryWingId },
        { name: 'Class 5', wingId: primaryWingId },
        { name: 'Class 6', wingId: middleWingId },
        { name: 'Class 7', wingId: middleWingId },
        { name: 'Class 8', wingId: middleWingId },
        { name: 'Class 9', wingId: secondaryWingId },
        { name: 'Class 10', wingId: secondaryWingId },
        { name: 'Class 11', wingId: seniorWingId },
        { name: 'Class 12', wingId: seniorWingId },
      ];

      for (const item of classMap) {
        const classRes = await client.query(`
          INSERT INTO classes (school_id, wing_id, name)
          VALUES ($1, $2, $3)
          RETURNING id;
        `, [school.id, item.wingId, item.name]);

        const classId = classRes.rows[0].id;
        await client.query(`
          INSERT INTO sections (class_id, name)
          VALUES ($1, 'A');
        `, [classId]);
      }

      // 5. Create Default School Admin User
      const rawPassword = data.adminPassword || 'Password@123';
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const userRes = await client.query(`
        INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING id;
      `, [
        school.id,
        adminIdentifier,
        data.adminEmail.trim(),
        data.adminPhone ? data.adminPhone.trim() : null,
        passwordHash,
      ]);
      const userId = userRes.rows[0].id;

      // 6. Assign ADMIN role
      const roleRes = await client.query(`SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1`);
      if (roleRes.rows.length > 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
        `, [userId, roleRes.rows[0].id]);
      }

      // 7. Create Staff Profile for School Admin
      const empCode = `EMP_${cleanCode}_001`;
      await client.query(`
        INSERT INTO staff_profiles (
          user_id, employee_code, first_name, last_name, qualification, is_active
        ) VALUES (
          $1, $2, $3, '(Admin)', 'Administration Head', TRUE
        );
      `, [userId, empCode, data.adminName.trim()]);

      await client.query('COMMIT');

      return {
        school,
        adminCredentials: {
          identifier: adminIdentifier,
          email: data.adminEmail.trim(),
          temporaryPassword: rawPassword,
          role: 'ADMIN',
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update school status (ACTIVE / SUSPENDED)
   */
  static async updateStatus(schoolId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const { rows } = await pool.query(`
      UPDATE schools 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, code, status, plan, updated_at;
    `, [status, schoolId]);

    if (rows.length === 0) {
      throw new Error('SCHOOL_NOT_FOUND');
    }
    return rows[0];
  }

  /**
   * Update school subscription plan and quota
   */
  static async updatePlan(schoolId: string, data: { plan: string; maxStudents?: number; subscriptionExpiresAt?: string }) {
    const { rows } = await pool.query(`
      UPDATE schools 
      SET 
        plan = COALESCE($1, plan),
        max_students = COALESCE($2, max_students),
        subscription_expires_at = COALESCE($3::timestamptz, subscription_expires_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, code, status, plan, max_students, subscription_expires_at, updated_at;
    `, [data.plan, data.maxStudents, data.subscriptionExpiresAt, schoolId]);

    if (rows.length === 0) {
      throw new Error('SCHOOL_NOT_FOUND');
    }
    return rows[0];
  }

  /**
   * Restores and guarantees default demo login accounts (admin, management1, teacher1, student1, superadmin)
   */
  static async restoreDefaultCredentials() {
    const rawPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Reactivate all users and profiles
      await client.query('UPDATE users SET is_active = TRUE;');
      await client.query('UPDATE staff_profiles SET is_active = TRUE;');
      await client.query('UPDATE student_profiles SET is_active = TRUE;');

      // 2. Reset password hashes for default users
      await client.query(
        `UPDATE users SET password_hash = $1, is_active = TRUE
         WHERE identifier IN ('admin', 'management1', 'teacher1', 'student1', 'student2', 'superadmin');`,
        [passwordHash]
      );

      // 3. Ensure default school exists
      let defaultSchoolId: string;
      const schoolRes = await client.query('SELECT id FROM schools ORDER BY created_at ASC LIMIT 1');
      if (schoolRes.rows.length === 0) {
        const newSchool = await client.query(
          `INSERT INTO schools (name, code, contact_email, contact_phone, address, status, plan)
           VALUES ('Apex International School', 'APEX01', 'info@apexschool.edu', '+91 9876543210', '123 Education Lane, Knowledge Park', 'ACTIVE', 'PRO')
           RETURNING id;`
        );
        defaultSchoolId = newSchool.rows[0].id;
      } else {
        defaultSchoolId = schoolRes.rows[0].id;
      }

      // Ensure ADMIN role
      const adminRoleRes = await client.query(`SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1`);
      const adminRoleId = adminRoleRes.rows[0]?.id;

      // Ensure TEACHER role
      const teacherRoleRes = await client.query(`SELECT id FROM roles WHERE name = 'TEACHER' LIMIT 1`);
      const teacherRoleId = teacherRoleRes.rows[0]?.id;

      // Ensure STUDENT role
      const studentRoleRes = await client.query(`SELECT id FROM roles WHERE name = 'STUDENT' LIMIT 1`);
      const studentRoleId = studentRoleRes.rows[0]?.id;

      // Ensure admin exists
      const adminCheck = await client.query(`SELECT id FROM users WHERE identifier = 'admin'`);
      let adminUserId: string;
      if (adminCheck.rows.length === 0) {
        const ins = await client.query(
          `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
           VALUES ($1, 'admin', 'admin@apex.edu', '+91 9876543200', $2, TRUE) RETURNING id`,
          [defaultSchoolId, passwordHash]
        );
        adminUserId = ins.rows[0].id;
      } else {
        adminUserId = adminCheck.rows[0].id;
      }
      if (adminRoleId) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [adminUserId, adminRoleId]
        );
      }
      await client.query(
        `INSERT INTO staff_profiles (user_id, employee_code, first_name, last_name, qualification, is_active, login_password)
         VALUES ($1, 'EMP_ADMIN_001', 'School', 'Administrator', 'M.Ed, Administration', TRUE, 'Password@123')
         ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, login_password = 'Password@123'`,
        [adminUserId]
      );

      // Ensure management1 exists
      const mgmtCheck = await client.query(`SELECT id FROM users WHERE identifier = 'management1'`);
      let mgmtUserId: string;
      if (mgmtCheck.rows.length === 0) {
        const ins = await client.query(
          `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
           VALUES ($1, 'management1', 'management1@apex.edu', '+91 9876543201', $2, TRUE) RETURNING id`,
          [defaultSchoolId, passwordHash]
        );
        mgmtUserId = ins.rows[0].id;
      } else {
        mgmtUserId = mgmtCheck.rows[0].id;
      }
      if (adminRoleId) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [mgmtUserId, adminRoleId]
        );
      }
      await client.query(
        `INSERT INTO staff_profiles (user_id, employee_code, first_name, last_name, qualification, is_active, login_password)
         VALUES ($1, 'EMP-MANAGEMENT1', 'Management', 'Admin', 'M.B.A.', TRUE, 'Password@123')
         ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, login_password = 'Password@123'`,
        [mgmtUserId]
      );

      // Ensure teacher1 exists
      const teacherCheck = await client.query(`SELECT id FROM users WHERE identifier = 'teacher1'`);
      let teacherUserId: string;
      if (teacherCheck.rows.length === 0) {
        const ins = await client.query(
          `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
           VALUES ($1, 'teacher1', 'teacher1@apex.edu', '+91 9000000002', $2, TRUE) RETURNING id`,
          [defaultSchoolId, passwordHash]
        );
        teacherUserId = ins.rows[0].id;
      } else {
        teacherUserId = teacherCheck.rows[0].id;
      }
      if (teacherRoleId) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [teacherUserId, teacherRoleId]
        );
      }
      await client.query(
        `INSERT INTO staff_profiles (user_id, employee_code, first_name, last_name, gender, qualification, joining_date, emergency_phone, phone, blood_group, is_active, login_password)
         VALUES ($1, 'EMP-TEACHER1', 'Sunita', 'Sharma', 'Female', 'M.Sc., B.Ed.', '2024-06-01', '+91 9000000002', '+91 9000000002', 'B+', TRUE, 'Password@123')
         ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, login_password = 'Password@123'`,
        [teacherUserId]
      );

      // Ensure student1 exists
      const studentCheck = await client.query(`SELECT id FROM users WHERE identifier = 'student1'`);
      let studentUserId: string;
      if (studentCheck.rows.length === 0) {
        const ins = await client.query(
          `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
           VALUES ($1, 'student1', 'student1@apex.edu', '+91 9000000001', $2, TRUE) RETURNING id`,
          [defaultSchoolId, passwordHash]
        );
        studentUserId = ins.rows[0].id;
      } else {
        studentUserId = studentCheck.rows[0].id;
      }
      if (studentRoleId) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [studentUserId, studentRoleId]
        );
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: 'All default accounts successfully restored and reactivated.',
        accounts: [
          { role: 'SUPER_ADMIN', identifier: 'superadmin', password: 'Password@123', email: 'superadmin@saas.com' },
          { role: 'ADMIN', identifier: 'admin', password: 'Password@123', email: 'admin@apex.edu' },
          { role: 'ADMIN', identifier: 'management1', password: 'Password@123', email: 'management1@apex.edu' },
          { role: 'TEACHER', identifier: 'teacher1', password: 'Password@123', email: 'teacher1@apex.edu' },
          { role: 'STUDENT', identifier: 'student1', password: 'Password@123', email: 'student1@apex.edu' },
          { role: 'STUDENT', identifier: 'student2', password: 'Password@123', email: 'student2@apex.edu' },
        ],
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
