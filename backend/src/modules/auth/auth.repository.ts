import { pool } from '../../config/db.config';
import { UserRole } from '../../types/auth.types';

export interface UserAuthRecord {
  id: string;
  school_id: string;
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
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN student_profiles stp ON u.id = stp.user_id
      WHERE (u.identifier = $1 OR u.email = $1 OR u.phone = $1)
      GROUP BY u.id, sp.id, stp.id, sa.wing_id, sa.class_id, sa.section_id, stp.current_class_id, stp.current_section_id
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [identifier]);
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

  static async findById(id: string): Promise<UserAuthRecord | null> {
    const query = `
      SELECT 
        u.id,
        u.school_id,
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
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN student_profiles stp ON u.id = stp.user_id
      WHERE u.id = $1
      GROUP BY u.id, sp.id, stp.id, sa.wing_id, sa.class_id, sa.section_id, stp.current_class_id, stp.current_section_id
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
}
