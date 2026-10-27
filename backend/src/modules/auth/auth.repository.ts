import { pool } from '../../config/db.config';
import { UserRole } from '../../types/auth.types';

export interface UserAuthRecord {
  id: string;
  school_id: string | null;
  school_status?: string | null;
  identifier: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  plain_login_password?: string | null;
  is_active: boolean;
  roles: UserRole[];
  profile_id: string | null;
  first_name: string | null;
  last_name: string | null;
  wing_id: string | null;
  class_id: string | null;
  section_id: string | null;
}

export class AuthRepository {
  /**
   * Finds a user by flexible identifier:
   * - Username/identifier (case-insensitive, trims '@')
   * - Staff Employee Code (case-insensitive, e.g. EMP-101)
   * - Student Admission Number (case-insensitive, e.g. ADM-2024-001)
   * - Email (case-insensitive)
   * - Phone / Emergency phone
   * along with assigned roles (with fallback for staff/students) and profile details.
   */
  static async findByIdentifier(identifier: string): Promise<UserAuthRecord | null> {
    const raw = identifier.trim();
    const cleanId = raw.replace(/^@/, '');

    const query = `
      SELECT 
        u.id,
        u.school_id,
        s.status AS school_status,
        u.identifier,
        u.email,
        u.phone,
        u.password_hash,
        COALESCE(MAX(sp.login_password), MAX(stp.login_password)) AS plain_login_password,
        u.is_active,
        COALESCE(
          array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
          CASE 
            WHEN MAX(sp.id::text) IS NOT NULL THEN ARRAY['TEACHER']::text[]
            WHEN MAX(stp.id::text) IS NOT NULL THEN ARRAY['STUDENT']::text[]
            ELSE '{}'::text[]
          END
        ) AS roles,
        COALESCE(MAX(sp.id::text), MAX(stp.id::text)) AS profile_id,
        COALESCE(MAX(sp.first_name), MAX(stp.first_name)) AS first_name,
        COALESCE(MAX(sp.last_name), MAX(stp.last_name)) AS last_name,
        MAX(sa.wing_id::text) AS wing_id,
        COALESCE(MAX(sa.class_id::text), MAX(stp.current_class_id::text)) AS class_id,
        COALESCE(MAX(sa.section_id::text), MAX(stp.current_section_id::text)) AS section_id
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN student_profiles stp ON u.id = stp.user_id
      WHERE (
        LOWER(TRIM(u.identifier)) = LOWER($1)
        OR LOWER(TRIM(u.identifier)) = LOWER($2)
        OR (u.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER($1))
        OR (u.phone IS NOT NULL AND TRIM(u.phone) = $1)
        OR (sp.employee_code IS NOT NULL AND (LOWER(TRIM(sp.employee_code)) = LOWER($1) OR LOWER(TRIM(sp.employee_code)) = LOWER($2)))
        OR (sp.phone IS NOT NULL AND TRIM(sp.phone) = $1)
        OR (stp.admission_number IS NOT NULL AND (LOWER(TRIM(stp.admission_number)) = LOWER($1) OR LOWER(TRIM(stp.admission_number)) = LOWER($2)))
        OR (stp.emergency_phone IS NOT NULL AND TRIM(stp.emergency_phone) = $1)
      )
      GROUP BY u.id, s.status
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [raw, cleanId]);
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      school_id: r.school_id,
      school_status: r.school_status,
      identifier: r.identifier,
      email: r.email,
      phone: r.phone,
      password_hash: r.password_hash,
      plain_login_password: r.plain_login_password,
      is_active: r.is_active,
      roles: r.roles as UserRole[],
      profile_id: r.profile_id,
      first_name: r.first_name,
      last_name: r.last_name,
      wing_id: r.wing_id,
      class_id: r.class_id,
      section_id: r.section_id,
    };
  }

  static async findById(id: string): Promise<UserAuthRecord | null> {
    const query = `
      SELECT 
        u.id,
        u.school_id,
        s.status AS school_status,
        u.identifier,
        u.email,
        u.phone,
        u.password_hash,
        COALESCE(MAX(sp.login_password), MAX(stp.login_password)) AS plain_login_password,
        u.is_active,
        COALESCE(
          array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
          CASE 
            WHEN MAX(sp.id::text) IS NOT NULL THEN ARRAY['TEACHER']::text[]
            WHEN MAX(stp.id::text) IS NOT NULL THEN ARRAY['STUDENT']::text[]
            ELSE '{}'::text[]
          END
        ) AS roles,
        COALESCE(MAX(sp.id::text), MAX(stp.id::text)) AS profile_id,
        COALESCE(MAX(sp.first_name), MAX(stp.first_name)) AS first_name,
        COALESCE(MAX(sp.last_name), MAX(stp.last_name)) AS last_name,
        MAX(sa.wing_id::text) AS wing_id,
        COALESCE(MAX(sa.class_id::text), MAX(stp.current_class_id::text)) AS class_id,
        COALESCE(MAX(sa.section_id::text), MAX(stp.current_section_id::text)) AS section_id
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN student_profiles stp ON u.id = stp.user_id
      WHERE u.id = $1
      GROUP BY u.id, s.status
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      school_id: r.school_id,
      school_status: r.school_status,
      identifier: r.identifier,
      email: r.email,
      phone: r.phone,
      password_hash: r.password_hash,
      plain_login_password: r.plain_login_password,
      is_active: r.is_active,
      roles: r.roles as UserRole[],
      profile_id: r.profile_id,
      first_name: r.first_name,
      last_name: r.last_name,
      wing_id: r.wing_id,
      class_id: r.class_id,
      section_id: r.section_id,
    };
  }

  /**
   * Find profile details for Forgot Password verification challenge
   */
  static async findChallengeProfileByIdentifier(identifier: string): Promise<any | null> {
    const raw = identifier.trim();
    const cleanId = raw.replace(/^@/, '');

    const query = `
      SELECT 
        u.id AS user_id,
        u.identifier,
        u.email,
        u.phone,
        u.is_active,
        COALESCE(
          array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
          CASE 
            WHEN MAX(sp.id) IS NOT NULL THEN ARRAY['TEACHER']::text[]
            WHEN MAX(stp.id) IS NOT NULL THEN ARRAY['STUDENT']::text[]
            ELSE '{}'::text[]
          END
        ) AS roles,
        MAX(stp.id::text) AS student_profile_id,
        MAX(stp.first_name) AS student_first_name,
        MAX(stp.last_name) AS student_last_name,
        MAX(stp.date_of_birth::text) AS student_dob,
        MAX(stp.emergency_phone) AS student_emergency_phone,
        MAX(sp.id::text) AS staff_profile_id,
        MAX(sp.first_name) AS staff_first_name,
        MAX(sp.last_name) AS staff_last_name,
        MAX(sp.phone) AS staff_phone,
        MAX(sp.emergency_phone) AS staff_emergency_phone,
        MAX(sp.date_of_birth::text) AS staff_dob
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN student_profiles stp ON u.id = stp.user_id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE (
        LOWER(TRIM(u.identifier)) = LOWER($1)
        OR LOWER(TRIM(u.identifier)) = LOWER($2)
        OR (u.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER($1))
        OR (u.phone IS NOT NULL AND TRIM(u.phone) = $1)
        OR (sp.employee_code IS NOT NULL AND (LOWER(TRIM(sp.employee_code)) = LOWER($1) OR LOWER(TRIM(sp.employee_code)) = LOWER($2)))
        OR (sp.phone IS NOT NULL AND TRIM(sp.phone) = $1)
        OR (stp.admission_number IS NOT NULL AND (LOWER(TRIM(stp.admission_number)) = LOWER($1) OR LOWER(TRIM(stp.admission_number)) = LOWER($2)))
        OR (stp.emergency_phone IS NOT NULL AND TRIM(stp.emergency_phone) = $1)
      )
      GROUP BY u.id
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [raw, cleanId]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * Get user's password hash by userId
   */
  static async getUserPasswordHash(userId: string): Promise<string | null> {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    return rows[0]?.password_hash || null;
  }

  /**
   * Updates user password in users table and syncs login_password in profiles
   */
  static async updateUserPassword(userId: string, passwordHash: string, plainPassword?: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, userId]
      );
      if (plainPassword) {
        await client.query(
          'UPDATE student_profiles SET login_password = $1 WHERE user_id = $2',
          [plainPassword, userId]
        );
        await client.query(
          'UPDATE staff_profiles SET login_password = $1 WHERE user_id = $2',
          [plainPassword, userId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

