import { pool } from '../../config/db.config';

export class ProfileRepository {
  static async getStudentProfile(profileId: string) {
    const query = `
      SELECT 
        stp.id,
        stp.admission_number,
        stp.roll_number,
        stp.first_name,
        stp.last_name,
        stp.gender,
        stp.date_of_birth,
        stp.admission_date,
        stp.father_name,
        stp.mother_name,
        stp.emergency_phone,
        stp.blood_group,
        stp.medical_notes,
        stp.document_url,
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name,
        sch.name AS school_name,
        sch.contact_phone AS school_phone,
        sch.contact_email AS school_email,
        sch.address AS school_address,
        sch.menu_config,
        sch.branding_config
      FROM student_profiles stp
      LEFT JOIN classes c ON stp.current_class_id = c.id
      LEFT JOIN sections s ON stp.current_section_id = s.id
      JOIN users u ON stp.user_id = u.id
      JOIN schools sch ON u.school_id = sch.id
      WHERE stp.id = $1;
    `;
    try {
      const { rows } = await pool.query(query, [profileId]);
      return rows[0] || null;
    } catch (err: any) {
      if (err.message && err.message.includes('document_url')) {
        await pool.query('ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS document_url TEXT NULL;').catch(() => {});
        const { rows } = await pool.query(query, [profileId]);
        return rows[0] || null;
      }
      throw err;
    }
  }

  static async updateStudentProfile(
    profileId: string,
    updates: {
      emergency_phone?: string;
      blood_group?: string;
      medical_notes?: string;
      document_url?: string | null;
    }
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.emergency_phone !== undefined) {
      fields.push(`emergency_phone = $${idx++}`);
      values.push(updates.emergency_phone);
    }
    if (updates.blood_group !== undefined) {
      fields.push(`blood_group = $${idx++}`);
      values.push(updates.blood_group);
    }
    if (updates.medical_notes !== undefined) {
      fields.push(`medical_notes = $${idx++}`);
      values.push(updates.medical_notes);
    }
    if (updates.document_url !== undefined) {
      fields.push(`document_url = $${idx++}`);
      values.push(updates.document_url);
    }

    if (fields.length === 0) return null;

    values.push(profileId);
    const query = `
      UPDATE student_profiles
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${idx}
      RETURNING id, emergency_phone, blood_group, medical_notes, document_url;
    `;
    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (err: any) {
      if (err.message && err.message.includes('document_url')) {
        await pool.query('ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS document_url TEXT NULL;').catch(() => {});
        const { rows } = await pool.query(query, values);
        return rows[0] || null;
      }
      throw err;
    }
  }

  static async getStaffProfile(profileId: string) {
    const query = `
      SELECT 
        sp.id,
        sp.employee_code,
        sp.first_name,
        sp.last_name,
        sp.gender,
        sp.date_of_birth,
        sp.qualification,
        sp.joining_date,
        sp.emergency_phone,
        sp.phone,
        sp.blood_group,
        sch.name AS school_name,
        sch.menu_config,
        sch.branding_config,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'assignment_type', sa.assignment_type,
              'wing_id', sa.wing_id,
              'class_id', sa.class_id,
              'section_id', sa.section_id
            )
          ) FILTER (WHERE sa.id IS NOT NULL),
          '[]'
        ) AS assignments
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      JOIN schools sch ON u.school_id = sch.id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      WHERE sp.id = $1
      GROUP BY sp.id, sch.name, sch.menu_config, sch.branding_config;
    `;
    const { rows } = await pool.query(query, [profileId]);
    return rows[0] || null;
  }

  static async updateStaffProfile(
    profileId: string,
    updates: {
      emergency_phone?: string;
      phone?: string;
      qualification?: string;
      blood_group?: string;
    }
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.emergency_phone !== undefined) {
      fields.push(`emergency_phone = $${idx++}`);
      values.push(updates.emergency_phone);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(updates.phone);
    }
    if (updates.qualification !== undefined) {
      fields.push(`qualification = $${idx++}`);
      values.push(updates.qualification);
    }
    if (updates.blood_group !== undefined) {
      fields.push(`blood_group = $${idx++}`);
      values.push(updates.blood_group);
    }

    if (fields.length === 0) return null;

    values.push(profileId);
    const query = `
      UPDATE staff_profiles
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${idx}
      RETURNING id, emergency_phone, phone, qualification, blood_group;
    `;
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  static async getStudentWithSchool(studentId: string) {
    const query = `
      SELECT stp.id, stp.current_class_id, stp.current_section_id, u.school_id
      FROM student_profiles stp
      JOIN users u ON stp.user_id = u.id
      WHERE stp.id = $1;
    `;
    const { rows } = await pool.query(query, [studentId]);
    return rows[0] || null;
  }

  static async isClassTeacherForClass(staffId: string, classId: string, sectionId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM staff_assignments
      WHERE staff_id = $1 AND class_id = $2 AND section_id = $3 AND assignment_type = 'CLASS_TEACHER'
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [staffId, classId, sectionId]);
    return rows.length > 0;
  }

  static async updateStudentProfileByTeacher(
    studentId: string,
    updates: {
      roll_number?: string | null;
      blood_group?: string | null;
      emergency_phone?: string | null;
      medical_notes?: string | null;
      document_url?: string | null;
    }
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.roll_number !== undefined) {
      fields.push(`roll_number = $${idx++}`);
      values.push(updates.roll_number);
    }
    if (updates.blood_group !== undefined) {
      fields.push(`blood_group = $${idx++}`);
      values.push(updates.blood_group);
    }
    if (updates.emergency_phone !== undefined) {
      fields.push(`emergency_phone = $${idx++}`);
      values.push(updates.emergency_phone);
    }
    if (updates.medical_notes !== undefined) {
      fields.push(`medical_notes = $${idx++}`);
      values.push(updates.medical_notes);
    }
    if (updates.document_url !== undefined) {
      fields.push(`document_url = $${idx++}`);
      values.push(updates.document_url);
    }

    if (fields.length === 0) {
      return await this.getStudentProfile(studentId);
    }

    values.push(studentId);
    const query = `
      UPDATE student_profiles
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${idx}
      RETURNING id, admission_number, roll_number, first_name, last_name, emergency_phone, blood_group, medical_notes, document_url;
    `;
    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (err: any) {
      if (err.message && err.message.includes('document_url')) {
        await pool.query('ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS document_url TEXT NULL;').catch(() => {});
        const { rows } = await pool.query(query, values);
        return rows[0] || null;
      }
      throw err;
    }
  }
}

