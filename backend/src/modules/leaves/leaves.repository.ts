import { pool } from '../../config/db.config';

export interface StaffLeaveRecord {
  id: string;
  school_id: string;
  staff_id: string;
  employee_code: string;
  staff_name: string;
  wing_id: string | null;
  wing_name: string | null;
  leave_type: 'SICK' | 'CASUAL' | 'EARNED';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'RECOMMENDED' | 'APPROVED' | 'REJECTED';
  coordinator_recommendation: string | null;
  recommended_by_name: string | null;
  recommended_at: string | null;
  management_comment: string | null;
  sanctioned_by_identifier: string | null;
  sanctioned_at: string | null;
  document_url?: string | null;
  attachment_name?: string | null;
  created_at: string;
}

export interface StudentLeaveRecord {
  id: string;
  school_id: string;
  student_id: string;
  admission_number: string;
  roll_number?: string;
  student_name: string;
  class_id?: string;
  class_name: string;
  section_id?: string;
  section_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  document_url?: string | null;
  attachment_name?: string | null;
  remarks?: string | null;
  reviewed_by_staff_id?: string | null;
  reviewed_by_user_id?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export class LeavesRepository {
  /**
   * Submit a new staff leave application.
   */
  static async createStaffLeave(
    schoolId: string,
    staffId: string,
    leaveType: 'SICK' | 'CASUAL' | 'EARNED',
    startDate: string,
    endDate: string,
    reason: string,
    documentUrl?: string | null,
    attachmentName?: string | null
  ): Promise<StaffLeaveRecord> {
    const query = `
      INSERT INTO staff_leaves (
        school_id, staff_id, leave_type, start_date, end_date, reason, status, document_url, attachment_name
      ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      schoolId,
      staffId,
      leaveType,
      startDate,
      endDate,
      reason,
      documentUrl || null,
      attachmentName || null,
    ]);
    return rows[0];
  }

  /**
   * Get a single staff leave record by ID with full joins.
   */
  static async getStaffLeaveById(id: string): Promise<StaffLeaveRecord | null> {
    const query = `
      SELECT 
        sl.*,
        sp.employee_code,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        COALESCE(sa.wing_id, c.wing_id) AS wing_id,
        w.name AS wing_name,
        CONCAT(rec_sp.first_name, ' ', rec_sp.last_name) AS recommended_by_name,
        u.identifier AS sanctioned_by_identifier
      FROM staff_leaves sl
      JOIN staff_profiles sp ON sl.staff_id = sp.id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN wings w ON COALESCE(sa.wing_id, c.wing_id) = w.id
      LEFT JOIN staff_profiles rec_sp ON sl.recommended_by_staff_id = rec_sp.id
      LEFT JOIN users u ON sl.sanctioned_by_user_id = u.id
      WHERE sl.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Get teacher's own leave applications.
   */
  static async getStaffLeavesByStaffId(staffId: string): Promise<StaffLeaveRecord[]> {
    const query = `
      SELECT 
        sl.*,
        sp.employee_code,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        COALESCE(sa.wing_id, c.wing_id) AS wing_id,
        w.name AS wing_name,
        CONCAT(rec_sp.first_name, ' ', rec_sp.last_name) AS recommended_by_name,
        u.identifier AS sanctioned_by_identifier
      FROM staff_leaves sl
      JOIN staff_profiles sp ON sl.staff_id = sp.id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN wings w ON COALESCE(sa.wing_id, c.wing_id) = w.id
      LEFT JOIN staff_profiles rec_sp ON sl.recommended_by_staff_id = rec_sp.id
      LEFT JOIN users u ON sl.sanctioned_by_user_id = u.id
      WHERE sl.staff_id = $1
      ORDER BY sl.created_at DESC;
    `;
    const { rows } = await pool.query(query, [staffId]);
    return rows;
  }

  /**
   * Get leave applications for teachers in a specific wing (for Coordinator).
   */
  static async getStaffLeavesByWingId(wingId: string): Promise<StaffLeaveRecord[]> {
    const query = `
      SELECT 
        sl.*,
        sp.employee_code,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        COALESCE(sa.wing_id, c.wing_id) AS wing_id,
        w.name AS wing_name,
        CONCAT(rec_sp.first_name, ' ', rec_sp.last_name) AS recommended_by_name,
        u.identifier AS sanctioned_by_identifier
      FROM staff_leaves sl
      JOIN staff_profiles sp ON sl.staff_id = sp.id
      JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN classes c ON sa.class_id = c.id
      JOIN wings w ON COALESCE(sa.wing_id, c.wing_id) = w.id
      LEFT JOIN staff_profiles rec_sp ON sl.recommended_by_staff_id = rec_sp.id
      LEFT JOIN users u ON sl.sanctioned_by_user_id = u.id
      WHERE COALESCE(sa.wing_id, c.wing_id) = $1
      ORDER BY sl.created_at DESC;
    `;
    const { rows } = await pool.query(query, [wingId]);
    return rows;
  }

  /**
   * Get all teacher leaves pending final approval (for Management).
   */
  static async getAllStaffLeavesForManagement(schoolId: string): Promise<StaffLeaveRecord[]> {
    const query = `
      SELECT 
        sl.*,
        sp.employee_code,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        COALESCE(sa.wing_id, c.wing_id) AS wing_id,
        w.name AS wing_name,
        CONCAT(rec_sp.first_name, ' ', rec_sp.last_name) AS recommended_by_name,
        u.identifier AS sanctioned_by_identifier
      FROM staff_leaves sl
      JOIN staff_profiles sp ON sl.staff_id = sp.id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN wings w ON COALESCE(sa.wing_id, c.wing_id) = w.id
      LEFT JOIN staff_profiles rec_sp ON sl.recommended_by_staff_id = rec_sp.id
      LEFT JOIN users u ON sl.sanctioned_by_user_id = u.id
      WHERE sl.school_id = $1
      ORDER BY sl.created_at DESC;
    `;
    const { rows } = await pool.query(query, [schoolId]);
    return rows;
  }

  /**
   * Coordinator adds a recommendation to a staff leave.
   */
  static async recommendStaffLeave(
    leaveId: string,
    coordinatorStaffId: string,
    recommendation: string
  ): Promise<void> {
    const query = `
      UPDATE staff_leaves
      SET 
        status = 'RECOMMENDED',
        coordinator_recommendation = $2,
        recommended_by_staff_id = $3,
        recommended_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await pool.query(query, [leaveId, recommendation, coordinatorStaffId]);
  }

  /**
   * Management sanctions (APPROVE / REJECT) a staff leave.
   */
  static async sanctionStaffLeave(
    leaveId: string,
    userId: string,
    decision: 'APPROVED' | 'REJECTED',
    comment: string | null
  ): Promise<void> {
    const query = `
      UPDATE staff_leaves
      SET 
        status = $2,
        management_comment = $3,
        sanctioned_by_user_id = $4,
        sanctioned_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await pool.query(query, [leaveId, decision, comment, userId]);
  }

  /**
   * Submit a student leave application.
   */
  static async createStudentLeave(
    schoolId: string,
    studentId: string,
    classId: string,
    sectionId: string,
    startDate: string,
    endDate: string,
    reason: string,
    documentUrl?: string | null,
    attachmentName?: string | null
  ): Promise<StudentLeaveRecord> {
    const query = `
      INSERT INTO student_leaves (
        school_id, student_id, class_id, section_id, start_date, end_date, reason, status, document_url, attachment_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      schoolId,
      studentId,
      classId,
      sectionId,
      startDate,
      endDate,
      reason,
      documentUrl || null,
      attachmentName || null,
    ]);
    return rows[0];
  }

  /**
   * Get student's own leave applications.
   */
  static async getStudentLeavesByStudentId(studentId: string): Promise<StudentLeaveRecord[]> {
    const query = `
      SELECT 
        sl.*,
        stp.admission_number,
        stp.roll_number,
        CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
        c.name AS class_name,
        s.name AS section_name,
        COALESCE(
          CONCAT(stf.first_name, ' ', stf.last_name),
          CONCAT(u.identifier, ' (Management)'),
          'Management'
        ) AS reviewed_by_name
      FROM student_leaves sl
      JOIN student_profiles stp ON sl.student_id = stp.id
      JOIN classes c ON sl.class_id = c.id
      JOIN sections s ON sl.section_id = s.id
      LEFT JOIN staff_profiles stf ON sl.reviewed_by_staff_id = stf.id
      LEFT JOIN users u ON sl.reviewed_by_user_id = u.id
      WHERE sl.student_id = $1
      ORDER BY sl.created_at DESC;
    `;
    const { rows } = await pool.query(query, [studentId]);
    return rows;
  }

  /**
   * Get student leaves for a specific class & section (for Class Teacher).
   */
  static async getClassStudentLeaves(classId: string, sectionId: string, status?: string): Promise<StudentLeaveRecord[]> {
    const params: any[] = [classId, sectionId];
    let filter = '';
    if (status) {
      params.push(status);
      filter = 'AND sl.status = $3';
    }
    const query = `
      SELECT 
        sl.*,
        stp.admission_number,
        stp.roll_number,
        CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
        c.name AS class_name,
        s.name AS section_name,
        COALESCE(
          CONCAT(stf.first_name, ' ', stf.last_name),
          CONCAT(u.identifier, ' (Management)'),
          'Management'
        ) AS reviewed_by_name
      FROM student_leaves sl
      JOIN student_profiles stp ON sl.student_id = stp.id
      JOIN classes c ON sl.class_id = c.id
      JOIN sections s ON sl.section_id = s.id
      LEFT JOIN staff_profiles stf ON sl.reviewed_by_staff_id = stf.id
      LEFT JOIN users u ON sl.reviewed_by_user_id = u.id
      WHERE sl.class_id = $1 AND sl.section_id = $2 ${filter}
      ORDER BY sl.created_at DESC;
    `;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get all student leaves across school (for Admin / Management queue).
   */
  static async getAllSchoolStudentLeaves(schoolId: string, status?: string): Promise<StudentLeaveRecord[]> {
    const params: any[] = [schoolId];
    let filter = '';
    if (status) {
      params.push(status);
      filter = 'AND sl.status = $2';
    }
    const query = `
      SELECT 
        sl.*,
        stp.admission_number,
        stp.roll_number,
        CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
        c.name AS class_name,
        s.name AS section_name,
        COALESCE(
          CONCAT(stf.first_name, ' ', stf.last_name),
          CONCAT(u.identifier, ' (Management)'),
          'Management'
        ) AS reviewed_by_name
      FROM student_leaves sl
      JOIN student_profiles stp ON sl.student_id = stp.id
      JOIN classes c ON sl.class_id = c.id
      JOIN sections s ON sl.section_id = s.id
      LEFT JOIN staff_profiles stf ON sl.reviewed_by_staff_id = stf.id
      LEFT JOIN users u ON sl.reviewed_by_user_id = u.id
      WHERE sl.school_id = $1 ${filter}
      ORDER BY sl.created_at DESC;
    `;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get a single student leave record by ID.
   */
  static async getStudentLeaveById(id: string): Promise<StudentLeaveRecord | null> {
    const query = `
      SELECT 
        sl.*,
        stp.admission_number,
        stp.roll_number,
        CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
        c.name AS class_name,
        s.name AS section_name,
        COALESCE(
          CONCAT(stf.first_name, ' ', stf.last_name),
          CONCAT(u.identifier, ' (Management)'),
          'Management'
        ) AS reviewed_by_name
      FROM student_leaves sl
      JOIN student_profiles stp ON sl.student_id = stp.id
      JOIN classes c ON sl.class_id = c.id
      JOIN sections s ON sl.section_id = s.id
      LEFT JOIN staff_profiles stf ON sl.reviewed_by_staff_id = stf.id
      LEFT JOIN users u ON sl.reviewed_by_user_id = u.id
      WHERE sl.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Update student leave status (supported for both Class Teacher and Admin / Management).
   */
  static async updateStudentLeaveStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewer: { staffId?: string | null; userId?: string | null },
    remarks?: string | null
  ): Promise<StudentLeaveRecord | null> {
    const query = `
      UPDATE student_leaves
      SET 
        status = $2,
        remarks = $3,
        reviewed_by_staff_id = $4,
        reviewed_by_user_id = $5,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    await pool.query(query, [
      id,
      status,
      remarks || null,
      reviewer.staffId || null,
      reviewer.userId || null,
    ]);
    return await this.getStudentLeaveById(id);
  }

  /**
   * Get homeroom assignment for a staff member if assigned as CLASS_TEACHER.
   */
  static async getTeacherHomeroom(
    staffId: string
  ): Promise<{ class_id: string; section_id: string; class_name: string; section_name: string } | null> {
    const query = `
      SELECT 
        sa.class_id,
        c.name AS class_name,
        sa.section_id,
        s.name AS section_name
      FROM staff_assignments sa
      JOIN classes c ON sa.class_id = c.id
      JOIN sections s ON sa.section_id = s.id
      WHERE sa.staff_id = $1 AND sa.assignment_type = 'CLASS_TEACHER' AND sa.class_id IS NOT NULL AND sa.section_id IS NOT NULL
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [staffId]);
    return rows[0] || null;
  }
}

