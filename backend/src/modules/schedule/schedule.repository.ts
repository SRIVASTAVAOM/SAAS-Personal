import { pool } from '../../config/db.config';

export interface TimetableSlot {
  id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  room_number: string | null;
}

export interface TeacherSubstitution {
  id: string;
  timetable_slot_id: string;
  substitution_date: string;
  original_teacher_id: string;
  substitute_teacher_id: string;
  remarks: string | null;
  status: string;
  period_number: number;
  start_time: string;
  end_time: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  original_teacher_name: string;
  substitute_teacher_name: string;
  arrangement_type: 'ASSIGNED_TO_ME' | 'COVERING_FOR_ME';
}

export interface OnlineClassSession {
  id: string;
  school_id: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  meeting_url: string;
  status: string;
  created_at: string;
}

export class ScheduleRepository {
  /**
   * Fetch all timetable slots for an authenticated teacher ordered by day and period.
   */
  static async getTeacherTimetable(
    schoolId: string,
    teacherStaffId: string,
    userId: string
  ): Promise<TimetableSlot[]> {
    const query = `
      SELECT 
        ts.id,
        ts.day_of_week,
        ts.period_number,
        ts.start_time,
        ts.end_time,
        ts.class_id,
        c.name AS class_name,
        ts.section_id,
        s.name AS section_name,
        ts.subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        ts.room_number
      FROM timetable_slots ts
      JOIN classes c ON ts.class_id = c.id
      JOIN sections s ON ts.section_id = s.id
      JOIN subjects sub ON ts.subject_id = sub.id
      JOIN staff_profiles sp ON ts.teacher_id = sp.id
      WHERE ts.school_id = $1 
        AND (ts.teacher_id = $2 OR sp.user_id = $3)
      ORDER BY ts.day_of_week ASC, ts.period_number ASC;
    `;
    const { rows } = await pool.query(query, [schoolId, teacherStaffId, userId]);
    return rows;
  }

  /**
   * Fetch substitutions assigned to the teacher or covering for the teacher.
   */
  static async getTeacherSubstitutions(
    schoolId: string,
    teacherStaffId: string,
    userId: string
  ): Promise<TeacherSubstitution[]> {
    const query = `
      SELECT 
        sub.id,
        sub.timetable_slot_id,
        sub.substitution_date::text AS substitution_date,
        sub.original_teacher_id,
        sub.substitute_teacher_id,
        sub.remarks,
        sub.status,
        ts.period_number,
        ts.start_time,
        ts.end_time,
        ts.class_id,
        c.name AS class_name,
        ts.section_id,
        sec.name AS section_name,
        ts.subject_id,
        subj.name AS subject_name,
        CONCAT(orig_sp.first_name, ' ', orig_sp.last_name) AS original_teacher_name,
        CONCAT(sub_sp.first_name, ' ', sub_sp.last_name) AS substitute_teacher_name,
        CASE 
          WHEN sub.substitute_teacher_id = $2 OR sub_sp.user_id = $3 THEN 'ASSIGNED_TO_ME'
          ELSE 'COVERING_FOR_ME'
        END AS arrangement_type
      FROM teacher_substitutions sub
      JOIN timetable_slots ts ON sub.timetable_slot_id = ts.id
      JOIN classes c ON ts.class_id = c.id
      JOIN sections sec ON ts.section_id = sec.id
      JOIN subjects subj ON ts.subject_id = subj.id
      JOIN staff_profiles orig_sp ON sub.original_teacher_id = orig_sp.id
      JOIN staff_profiles sub_sp ON sub.substitute_teacher_id = sub_sp.id
      WHERE sub.school_id = $1 
        AND (sub.substitute_teacher_id = $2 OR sub_sp.user_id = $3 
             OR sub.original_teacher_id = $2 OR orig_sp.user_id = $3)
      ORDER BY sub.substitution_date DESC, ts.period_number ASC;
    `;
    const { rows } = await pool.query(query, [schoolId, teacherStaffId, userId]);
    return rows;
  }

  /**
   * Fetch online class sessions for a teacher.
   */
  static async getTeacherOnlineClasses(
    schoolId: string,
    teacherStaffId: string,
    userId: string
  ): Promise<OnlineClassSession[]> {
    const query = `
      SELECT 
        ocs.id,
        ocs.school_id,
        ocs.class_id,
        c.name AS class_name,
        ocs.section_id,
        sec.name AS section_name,
        ocs.subject_id,
        sub.name AS subject_name,
        ocs.teacher_id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
        ocs.title,
        ocs.scheduled_date::text AS scheduled_date,
        ocs.start_time,
        ocs.duration_minutes,
        ocs.meeting_url,
        ocs.status,
        ocs.created_at::text AS created_at
      FROM online_class_sessions ocs
      JOIN classes c ON ocs.class_id = c.id
      JOIN sections sec ON ocs.section_id = sec.id
      JOIN subjects sub ON ocs.subject_id = sub.id
      JOIN staff_profiles sp ON ocs.teacher_id = sp.id
      WHERE ocs.school_id = $1 
        AND (ocs.teacher_id = $2 OR sp.user_id = $3)
      ORDER BY ocs.scheduled_date ASC, ocs.start_time ASC;
    `;
    const { rows } = await pool.query(query, [schoolId, teacherStaffId, userId]);
    return rows;
  }

  /**
   * Fetch online class sessions for an enrolled student.
   */
  static async getStudentOnlineClasses(
    schoolId: string,
    classId: string,
    sectionId: string
  ): Promise<OnlineClassSession[]> {
    const query = `
      SELECT 
        ocs.id,
        ocs.school_id,
        ocs.class_id,
        c.name AS class_name,
        ocs.section_id,
        sec.name AS section_name,
        ocs.subject_id,
        sub.name AS subject_name,
        ocs.teacher_id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
        ocs.title,
        ocs.scheduled_date::text AS scheduled_date,
        ocs.start_time,
        ocs.duration_minutes,
        ocs.meeting_url,
        ocs.status,
        ocs.created_at::text AS created_at
      FROM online_class_sessions ocs
      JOIN classes c ON ocs.class_id = c.id
      JOIN sections sec ON ocs.section_id = sec.id
      JOIN subjects sub ON ocs.subject_id = sub.id
      JOIN staff_profiles sp ON ocs.teacher_id = sp.id
      WHERE ocs.school_id = $1 
        AND ocs.class_id = $2 
        AND ocs.section_id = $3
      ORDER BY ocs.scheduled_date ASC, ocs.start_time ASC;
    `;
    const { rows } = await pool.query(query, [schoolId, classId, sectionId]);
    return rows;
  }

  /**
   * Resolve active academic year for a school.
   */
  static async getActiveAcademicYear(schoolId: string): Promise<string | null> {
    const query = `
      SELECT id FROM academic_years 
      WHERE school_id = $1 AND is_current = true 
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [schoolId]);
    return rows.length > 0 ? rows[0].id : null;
  }

  /**
   * Check if a teacher is allocated to a class/subject or is a Class Teacher.
   */
  static async isTeacherAllocatedToClass(
    schoolId: string,
    teacherStaffId: string,
    classId: string,
    sectionId: string,
    subjectId: string
  ): Promise<boolean> {
    const query = `
      SELECT 1 FROM teacher_subject_allocations tsa
      JOIN staff_profiles sp ON tsa.staff_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE u.school_id = $1 
        AND sp.id = $2 
        AND tsa.class_id = $3 
        AND tsa.section_id = $4 
        AND tsa.subject_id = $5
      UNION
      SELECT 1 FROM staff_assignments sa
      JOIN staff_profiles sp ON sa.staff_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE u.school_id = $1 
        AND sp.id = $2 
        AND sa.class_id = $3 
        AND sa.section_id = $4
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [schoolId, teacherStaffId, classId, sectionId, subjectId]);
    return rows.length > 0;
  }

  /**
   * Insert a new online class session.
   */
  static async createOnlineClass(data: {
    schoolId: string;
    academicYearId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    title: string;
    scheduledDate: string;
    startTime: string;
    durationMinutes: number;
    meetingUrl: string;
  }): Promise<OnlineClassSession> {
    const insertQuery = `
      INSERT INTO online_class_sessions (
        school_id, academic_year_id, class_id, section_id, subject_id,
        teacher_id, title, scheduled_date, start_time, duration_minutes, meeting_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SCHEDULED')
      RETURNING id;
    `;
    const insertRes = await pool.query(insertQuery, [
      data.schoolId,
      data.academicYearId,
      data.classId,
      data.sectionId,
      data.subjectId,
      data.teacherId,
      data.title,
      data.scheduledDate,
      data.startTime,
      data.durationMinutes,
      data.meetingUrl,
    ]);

    const createdId = insertRes.rows[0].id;
    const fetchQuery = `
      SELECT 
        ocs.id,
        ocs.school_id,
        ocs.class_id,
        c.name AS class_name,
        ocs.section_id,
        sec.name AS section_name,
        ocs.subject_id,
        sub.name AS subject_name,
        ocs.teacher_id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
        ocs.title,
        ocs.scheduled_date::text AS scheduled_date,
        ocs.start_time,
        ocs.duration_minutes,
        ocs.meeting_url,
        ocs.status,
        ocs.created_at::text AS created_at
      FROM online_class_sessions ocs
      JOIN classes c ON ocs.class_id = c.id
      JOIN sections sec ON ocs.section_id = sec.id
      JOIN subjects sub ON ocs.subject_id = sub.id
      JOIN staff_profiles sp ON ocs.teacher_id = sp.id
      WHERE ocs.id = $1;
    `;
    const { rows } = await pool.query(fetchQuery, [createdId]);
    return rows[0];
  }

  /**
   * Get an online class by ID and schoolId.
   */
  static async getOnlineClassById(id: string, schoolId: string): Promise<any | null> {
    const query = `
      SELECT ocs.*, sp.user_id
      FROM online_class_sessions ocs
      JOIN staff_profiles sp ON ocs.teacher_id = sp.id
      WHERE ocs.id = $1 AND ocs.school_id = $2;
    `;
    const { rows } = await pool.query(query, [id, schoolId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Delete an online class session.
   */
  static async deleteOnlineClass(id: string, schoolId: string): Promise<boolean> {
    const query = `
      DELETE FROM online_class_sessions
      WHERE id = $1 AND school_id = $2;
    `;
    const result = await pool.query(query, [id, schoolId]);
    return (result.rowCount ?? 0) > 0;
  }
}
