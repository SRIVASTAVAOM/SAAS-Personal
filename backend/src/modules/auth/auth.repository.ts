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
   * Finds a user by flexible identifier (identifier, email, or phone)
   * along with their assigned roles and normalized profile details.
   */
  static async findByIdentifier(identifier: string): Promise<UserAuthRecord | null> {
    const query = `
      SELECT 
        u.id,
        u.school_id,
        s.status AS school_status,
        u.identifier,
        u.email,
        u.phone,
        u.password_hash,
        u.is_active,
        COALESCE(
          array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
          '{}'
        ) AS roles,
        COALESCE(sp.id, stp.id) AS profile_id,
        COALESCE(sp.first_name, stp.first_name) AS first_name,
        COALESCE(sp.last_name, stp.last_name) AS last_name,
        sa.wing_id AS wing_id,
        COALESCE(sa.class_id, stp.current_class_id) AS class_id,
        COALESCE(sa.section_id, stp.current_section_id) AS section_id
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN student_profiles stp ON u.id = stp.user_id
      WHERE (u.identifier = $1 OR u.email = $1 OR u.phone = $1)
      GROUP BY u.id, s.status, sp.id, stp.id, sa.wing_id, sa.class_id, sa.section_id, stp.current_class_id, stp.current_section_id
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [identifier]);
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
        u.is_active,
        COALESCE(
          array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
          '{}'
        ) AS roles,
        COALESCE(sp.id, stp.id) AS profile_id,
        COALESCE(sp.first_name, stp.first_name) AS first_name,
        COALESCE(sp.last_name, stp.last_name) AS last_name,
        sa.wing_id AS wing_id,
        COALESCE(sa.class_id, stp.current_class_id) AS class_id,
        COALESCE(sa.section_id, stp.current_section_id) AS section_id
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN student_profiles stp ON u.id = stp.user_id
      WHERE u.id = $1
      GROUP BY u.id, s.status, sp.id, stp.id, sa.wing_id, sa.class_id, sa.section_id, stp.current_class_id, stp.current_section_id
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      school_id: r.school_id,
      identifier: r.identifier,
      email: r.email,
      phone: r.phone,
      password_hash: r.password_hash,
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
    const query = `
      SELECT 
        u.id AS user_id,
        u.identifier,
        u.email,
        u.phone,
        u.is_active,
        COALESCE(
          array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
          '{}'
        ) AS roles,
        stp.id AS student_profile_id,
        stp.first_name AS student_first_name,
        stp.last_name AS student_last_name,
        stp.date_of_birth::text AS student_dob,
        stp.emergency_phone AS student_emergency_phone,
        sp.id AS staff_profile_id,
        sp.first_name AS staff_first_name,
        sp.last_name AS staff_last_name,
        sp.phone AS staff_phone,
        sp.emergency_phone AS staff_emergency_phone,
        sp.date_of_birth::text AS staff_dob
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN student_profiles stp ON u.id = stp.user_id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE LOWER(TRIM(u.identifier)) = LOWER(TRIM($1))
         OR (u.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM($1)))
         OR (u.phone IS NOT NULL AND u.phone = $1)
      GROUP BY u.id, stp.id, sp.id
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [identifier.trim()]);
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

