import { pool } from '../../config/db.config';

export interface SubjectRecord {
  id: string;
  name: string;
  code: string;
}

export interface StudentRosterItem {
  id: string;
  admission_number: string;
  roll_number: string | null;
  first_name: string;
  last_name: string;
  gender: string | null;
  emergency_phone: string | null;
  blood_group: string | null;
  medical_notes?: string | null;
  class_id?: string;
  section_id?: string;
}

export interface SubjectTeacherItem {
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  employee_code: string;
  qualification: string | null;
  emergency_phone: string | null;
  is_class_teacher?: boolean;
}

export interface ClassmateBirthdayItem {
  id: string;
  admission_number: string;
  roll_number: string | null;
  first_name: string;
  last_name: string;
  birth_month: number;
  birth_day: number;
  birthday_formatted: string;
}

export class AcademicsRepository {
  static async getClassesAndSections(schoolId: string): Promise<any[]> {
    const query = `
      SELECT 
        c.id,
        c.id AS class_id,
        c.name,
        c.name AS class_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name
            ) ORDER BY s.name ASC
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS sections
      FROM classes c
      LEFT JOIN sections s ON s.class_id = c.id
      WHERE c.school_id = $1
      GROUP BY c.id, c.name
      ORDER BY c.name ASC;
    `;
    const { rows } = await pool.query(query, [schoolId]);
    return rows;
  }

  static async getSubjectsBySchool(schoolId: string): Promise<SubjectRecord[]> {
    const query = `
      SELECT id, name, code
      FROM subjects
      WHERE school_id = $1
      ORDER BY name ASC;
    `;
    const { rows } = await pool.query(query, [schoolId]);
    return rows;
  }

  static async getClassRoster(classId: string, sectionId: string): Promise<StudentRosterItem[]> {
    const query = `
      SELECT 
        id, admission_number, roll_number, first_name, last_name,
        gender, emergency_phone, blood_group, medical_notes,
        current_class_id AS class_id, current_section_id AS section_id
      FROM student_profiles
      WHERE current_class_id = $1 AND current_section_id = $2 AND is_active = TRUE
      ORDER BY roll_number ASC, first_name ASC;
    `;
    const { rows } = await pool.query(query, [classId, sectionId]);
    return rows;
  }


  static async getStudentSubjectTeachers(studentProfileId: string): Promise<SubjectTeacherItem[]> {
    const query = `
      (
        SELECT 
          'Class Teacher (Homeroom)' AS subject_name,
          'HOMEROOM' AS subject_code,
          CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
          sp.employee_code,
          sp.qualification,
          sp.emergency_phone,
          TRUE AS is_class_teacher
        FROM student_profiles stp
        JOIN staff_assignments sa 
          ON stp.current_class_id = sa.class_id 
         AND stp.current_section_id = sa.section_id
         AND sa.assignment_type = 'CLASS_TEACHER'
        JOIN staff_profiles sp ON sa.staff_id = sp.id
        WHERE stp.id = $1
        LIMIT 1
      )
      UNION ALL
      (
        SELECT 
          sub.name AS subject_name,
          sub.code AS subject_code,
          CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
          sp.employee_code,
          sp.qualification,
          sp.emergency_phone,
          FALSE AS is_class_teacher
        FROM student_profiles stp
        JOIN teacher_subject_allocations tsa 
          ON stp.current_class_id = tsa.class_id 
         AND stp.current_section_id = tsa.section_id
        JOIN subjects sub ON tsa.subject_id = sub.id
        JOIN staff_profiles sp ON tsa.staff_id = sp.id
        WHERE stp.id = $1
        ORDER BY sub.name ASC
      );
    `;
    const { rows } = await pool.query(query, [studentProfileId]);
    return rows;
  }

  static async getClassmatesBirthdays(classId: string, sectionId: string): Promise<ClassmateBirthdayItem[]> {
    const query = `
      SELECT 
        id, admission_number, roll_number, first_name, last_name,
        EXTRACT(MONTH FROM date_of_birth)::int AS birth_month,
        EXTRACT(DAY FROM date_of_birth)::int AS birth_day,
        TO_CHAR(date_of_birth, 'Mon DD') AS birthday_formatted
      FROM student_profiles
      WHERE current_class_id = $1 AND current_section_id = $2 AND is_active = TRUE
      ORDER BY EXTRACT(MONTH FROM date_of_birth), EXTRACT(DAY FROM date_of_birth), first_name ASC;
    `;
    const { rows } = await pool.query(query, [classId, sectionId]);
    return rows;
  }

  static async getTeacherAllocations(staffProfileId: string) {
    const query = `
      SELECT 
        tsa.id,
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name,
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code
      FROM teacher_subject_allocations tsa
      JOIN classes c ON tsa.class_id = c.id
      JOIN sections s ON tsa.section_id = s.id
      JOIN subjects sub ON tsa.subject_id = sub.id
      WHERE tsa.staff_id = $1;
    `;
    const { rows } = await pool.query(query, [staffProfileId]);
    return rows;
  }

  static async getTeacherHomeroom(staffProfileId: string) {
    const query = `
      SELECT 
        sa.id,
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name
      FROM staff_assignments sa
      JOIN classes c ON sa.class_id = c.id
      JOIN sections s ON sa.section_id = s.id
      WHERE sa.staff_id = $1 AND sa.assignment_type = 'CLASS_TEACHER'
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [staffProfileId]);
    return rows[0] || null;
  }

  static async getTeacherClassStudents(staffProfileId: string): Promise<StudentRosterItem[]> {
    const query = `
      SELECT DISTINCT 
        stp.id, stp.admission_number, stp.roll_number, stp.first_name, stp.last_name,
        stp.gender, stp.emergency_phone, stp.blood_group, stp.medical_notes,
        stp.current_class_id AS class_id, stp.current_section_id AS section_id
      FROM student_profiles stp

      WHERE (stp.current_class_id, stp.current_section_id) IN (
        SELECT class_id, section_id FROM teacher_subject_allocations WHERE staff_id = $1
        UNION
        SELECT class_id, section_id FROM staff_assignments WHERE staff_id = $1 AND class_id IS NOT NULL
      )
      AND stp.is_active = TRUE
      ORDER BY stp.first_name ASC;
    `;
    const { rows } = await pool.query(query, [staffProfileId]);
    return rows;
  }

  static async getStudentEnrollment(studentProfileId: string) {
    const query = `
      SELECT current_class_id, current_section_id
      FROM student_profiles
      WHERE id = $1;
    `;
    const { rows } = await pool.query(query, [studentProfileId]);
    return rows[0] || null;
  }
}
