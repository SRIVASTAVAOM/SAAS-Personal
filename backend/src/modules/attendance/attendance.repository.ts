import { pool } from '../../config/db.config';

export interface StudentAttendanceItem {
  student_id: string;
  status: 'PRESENT' | 'ABSENT';
  remarks?: string;
}

export interface StudentAttendanceRecord {
  id: string;
  student_id: string;
  admission_number: string;
  roll_number: string | null;
  student_name: string;
  class_id: string;
  section_id: string;
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT';
  remarks: string | null;
  marked_by_name: string;
}

export interface StaffAttendanceRecord {
  id: string;
  staff_id: string;
  employee_code: string;
  staff_name: string;
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT';
  in_time: string | null;
  out_time: string | null;
  remarks: string | null;
}

export interface StaffAttendanceMarkItem {
  staff_id: string;
  status: 'PRESENT' | 'ABSENT';
  in_time?: string | null;
  out_time?: string | null;
  remarks?: string | null;
}

export class AttendanceRepository {
  /**
   * Batch mark or update student attendance for a class/section on a given date.
   * Runs in a single atomic transaction.
   */
  static async markStudentAttendance(
    schoolId: string,
    classId: string,
    sectionId: string,
    markedByStaffId: string,
    attendanceDate: string,
    records: StudentAttendanceItem[]
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO student_attendance_records (
          school_id, student_id, class_id, section_id, attendance_date, status, marked_by_staff_id, remarks, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        ON CONFLICT (student_id, attendance_date)
        DO UPDATE SET
          status = EXCLUDED.status,
          marked_by_staff_id = EXCLUDED.marked_by_staff_id,
          remarks = EXCLUDED.remarks,
          updated_at = CURRENT_TIMESTAMP;
      `;

      for (const rec of records) {
        await client.query(query, [
          schoolId,
          rec.student_id,
          classId,
          sectionId,
          attendanceDate,
          rec.status,
          markedByStaffId,
          rec.remarks ?? null,
        ]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves attendance records for a specific class & section on a given date.
   */
  static async getClassAttendance(
    classId: string,
    sectionId: string,
    attendanceDate: string
  ): Promise<StudentAttendanceRecord[]> {
    const query = `
      SELECT 
        sar.id,
        stp.id AS student_id,
        stp.admission_number,
        stp.roll_number,
        CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
        sar.class_id,
        sar.section_id,
        COALESCE(TO_CHAR(sar.attendance_date, 'YYYY-MM-DD'), $3::text) AS attendance_date,
        sar.status,
        sar.remarks,
        CONCAT(sp.first_name, ' ', sp.last_name) AS marked_by_name
      FROM student_profiles stp
      LEFT JOIN student_attendance_records sar 
        ON stp.id = sar.student_id AND sar.attendance_date = $3
      LEFT JOIN staff_profiles sp 
        ON sar.marked_by_staff_id = sp.id
      WHERE stp.current_class_id = $1 AND stp.current_section_id = $2 AND stp.is_active = TRUE
      ORDER BY stp.roll_number ASC, stp.first_name ASC;
    `;

    const { rows } = await pool.query(query, [classId, sectionId, attendanceDate]);
    return rows;
  }

  /**
   * Retrieves student's own attendance history.
   */
  static async getStudentAttendanceHistory(
    studentId: string
  ): Promise<StudentAttendanceRecord[]> {
    const query = `
      SELECT 
        sar.id,
        sar.student_id,
        stp.admission_number,
        stp.roll_number,
        CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
        sar.class_id,
        sar.section_id,
        TO_CHAR(sar.attendance_date, 'YYYY-MM-DD') AS attendance_date,
        sar.status,
        sar.remarks,
        CONCAT(sp.first_name, ' ', sp.last_name) AS marked_by_name
      FROM student_attendance_records sar
      JOIN student_profiles stp ON sar.student_id = stp.id
      LEFT JOIN staff_profiles sp ON sar.marked_by_staff_id = sp.id
      WHERE sar.student_id = $1
      ORDER BY sar.attendance_date DESC;
    `;

    const { rows } = await pool.query(query, [studentId]);
    return rows;
  }

  /**
   * Retrieves teacher's own attendance history.
   */
  static async getStaffAttendanceHistory(
    staffId: string
  ): Promise<StaffAttendanceRecord[]> {
    const query = `
      SELECT 
        sar.id,
        sar.staff_id,
        sp.employee_code,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        TO_CHAR(sar.attendance_date, 'YYYY-MM-DD') AS attendance_date,
        sar.status,
        sar.in_time,
        sar.out_time,
        sar.remarks
      FROM staff_attendance_records sar
      JOIN staff_profiles sp ON sar.staff_id = sp.id
      WHERE sar.staff_id = $1
      ORDER BY sar.attendance_date DESC;
    `;

    const { rows } = await pool.query(query, [staffId]);
    return rows;
  }

  /**
   * Retrieves attendance of all staff in a specific wing on a given date (for Coordinator).
   */
  static async getWingStaffAttendance(
    wingId: string,
    attendanceDate: string
  ): Promise<StaffAttendanceRecord[]> {
    const query = `
      SELECT 
        sar.id,
        sp.id AS staff_id,
        sp.employee_code,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        COALESCE(TO_CHAR(sar.attendance_date, 'YYYY-MM-DD'), $2::text) AS attendance_date,
        COALESCE(sar.status, 'ABSENT') AS status,
        sar.in_time,
        sar.out_time,
        sar.remarks
      FROM staff_profiles sp
      JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN staff_attendance_records sar 
        ON sp.id = sar.staff_id AND sar.attendance_date = $2::date
      WHERE sa.wing_id = $1
      ORDER BY sp.first_name ASC;
    `;

    const { rows } = await pool.query(query, [wingId, attendanceDate]);
    return rows;
  }

  /**
   * Retrieves all staff members in the school with their attendance status for a given date.
   * Can be optionally filtered by wingId (for Management).
   */
  static async getAllStaffAttendance(
    schoolId: string,
    attendanceDate: string,
    wingId?: string
  ): Promise<any[]> {
    const query = `
      SELECT * FROM (
        SELECT DISTINCT ON (sp.id)
          sp.id AS staff_id,
          sp.employee_code,
          CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
          sa.assignment_type,
          COALESCE(w.id, sa.wing_id) AS wing_id,
          w.name AS wing_name,
          COALESCE(TO_CHAR(sar.attendance_date, 'YYYY-MM-DD'), $2::text) AS attendance_date,
          sar.status,
          sar.in_time,
          sar.out_time,
          sar.remarks
        FROM staff_profiles sp
        JOIN users u ON sp.user_id = u.id AND u.school_id = $1
        LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
        LEFT JOIN wings w ON sa.wing_id = w.id
        LEFT JOIN staff_attendance_records sar 
          ON sp.id = sar.staff_id AND sar.attendance_date = $2::date
        WHERE ($3::uuid IS NULL OR sa.wing_id = $3::uuid)
        ORDER BY sp.id, sp.first_name
      ) sub
      ORDER BY sub.staff_name ASC;
    `;

    const { rows } = await pool.query(query, [schoolId, attendanceDate, wingId ?? null]);
    return rows;
  }

  /**
   * Batch mark or update staff attendance records (Management).
   * Runs in a single atomic transaction.
   */
  static async markStaffAttendance(
    schoolId: string,
    attendanceDate: string,
    records: StaffAttendanceMarkItem[]
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO staff_attendance_records (
          school_id, staff_id, attendance_date, status, in_time, out_time, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (staff_id, attendance_date)
        DO UPDATE SET
          status = EXCLUDED.status,
          in_time = COALESCE(EXCLUDED.in_time, staff_attendance_records.in_time),
          out_time = COALESCE(EXCLUDED.out_time, staff_attendance_records.out_time),
          remarks = EXCLUDED.remarks;
      `;

      for (const rec of records) {
        await client.query(query, [
          schoolId,
          rec.staff_id,
          attendanceDate,
          rec.status,
          rec.in_time ?? null,
          rec.out_time ?? null,
          rec.remarks ?? null,
        ]);
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
