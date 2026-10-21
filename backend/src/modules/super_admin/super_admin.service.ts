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

      // 6. Assign MANAGEMENT role
      const roleRes = await client.query(`SELECT id FROM roles WHERE name = 'MANAGEMENT' LIMIT 1`);
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
          role: 'MANAGEMENT',
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
}
