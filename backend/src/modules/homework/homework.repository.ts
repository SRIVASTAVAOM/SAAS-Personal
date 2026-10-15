import { pool } from '../../config/db.config';

export interface HomeworkAssignment {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  section_id: string;
  section_name?: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  assigned_by_staff_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  s3_attachment_key: string | null;
  attachment_name: string | null;
  created_at: string;
  student_status?: 'PENDING' | 'COMPLETED';
  completed_at?: string | null;
  completed_count?: number;
  total_students?: number;
}

export class HomeworkRepository {
  static async createHomework(data: {
    schoolId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    assignedByStaffId: string;
    title: string;
    description: string;
    assignedDate?: string;
    dueDate: string;
    s3AttachmentKey?: string;
    attachmentName?: string;
  }): Promise<HomeworkAssignment> {
    const { rows } = await pool.query(
      `INSERT INTO homework_assignments 
        (school_id, class_id, section_id, subject_id, assigned_by_staff_id, 
         title, description, assigned_date, due_date, s3_attachment_key, attachment_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::date, CURRENT_DATE), $9::date, $10, $11)
       RETURNING *;`,
      [
        data.schoolId,
        data.classId,
        data.sectionId,
        data.subjectId,
        data.assignedByStaffId,
        data.title,
        data.description,
        data.assignedDate || null,
        data.dueDate,
        data.s3AttachmentKey || null,
        data.attachmentName || null,
      ]
    );
    return rows[0];
  }

  static async getClassSectionHomework(
    classId: string,
    sectionId: string,
    studentId?: string
  ): Promise<HomeworkAssignment[]> {
    const query = `
      SELECT 
        h.id, h.school_id, h.class_id, c.name AS class_name,
        h.section_id, sec.name AS section_name,
        h.subject_id, sub.name AS subject_name, sub.code AS subject_code,
        h.assigned_by_staff_id, (sp.first_name || ' ' || sp.last_name) AS teacher_name,
        h.title, h.description, 
        TO_CHAR(h.assigned_date, 'YYYY-MM-DD') AS assigned_date,
        TO_CHAR(h.due_date, 'YYYY-MM-DD') AS due_date,
        h.s3_attachment_key, h.attachment_name, h.created_at,
        ${studentId ? `COALESCE(shc.status, 'PENDING')` : `'PENDING'`} AS student_status,
        ${studentId ? `shc.completed_at` : `NULL`} AS completed_at,
        (SELECT COUNT(*)::int FROM student_homework_completions WHERE homework_id = h.id AND status = 'COMPLETED') AS completed_count,
        (SELECT COUNT(*)::int FROM student_profiles WHERE current_class_id = h.class_id AND current_section_id = h.section_id) AS total_students
      FROM homework_assignments h
      JOIN classes c ON h.class_id = c.id
      JOIN sections sec ON h.section_id = sec.id
      JOIN subjects sub ON h.subject_id = sub.id
      JOIN staff_profiles sp ON h.assigned_by_staff_id = sp.id
      ${studentId ? `LEFT JOIN student_homework_completions shc ON shc.homework_id = h.id AND shc.student_id = $3` : ''}
      WHERE h.class_id = $1 AND h.section_id = $2
      ORDER BY h.due_date DESC, h.assigned_date DESC;
    `;

    const params = studentId ? [classId, sectionId, studentId] : [classId, sectionId];
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getTeacherAssignedHomework(staffId: string): Promise<HomeworkAssignment[]> {
    const query = `
      SELECT 
        h.id, h.school_id, h.class_id, c.name AS class_name,
        h.section_id, sec.name AS section_name,
        h.subject_id, sub.name AS subject_name, sub.code AS subject_code,
        h.assigned_by_staff_id, (sp.first_name || ' ' || sp.last_name) AS teacher_name,
        h.title, h.description, 
        TO_CHAR(h.assigned_date, 'YYYY-MM-DD') AS assigned_date,
        TO_CHAR(h.due_date, 'YYYY-MM-DD') AS due_date,
        h.s3_attachment_key, h.attachment_name, h.created_at,
        (SELECT COUNT(*)::int FROM student_homework_completions WHERE homework_id = h.id AND status = 'COMPLETED') AS completed_count,
        (SELECT COUNT(*)::int FROM student_profiles WHERE current_class_id = h.class_id AND current_section_id = h.section_id) AS total_students
      FROM homework_assignments h
      JOIN classes c ON h.class_id = c.id
      JOIN sections sec ON h.section_id = sec.id
      JOIN subjects sub ON h.subject_id = sub.id
      JOIN staff_profiles sp ON h.assigned_by_staff_id = sp.id
      WHERE h.assigned_by_staff_id = $1
      ORDER BY h.due_date DESC, h.assigned_date DESC;
    `;
    const { rows } = await pool.query(query, [staffId]);
    return rows;
  }

  static async getHomeworkById(id: string, studentId?: string): Promise<HomeworkAssignment | null> {
    const query = `
      SELECT 
        h.id, h.school_id, h.class_id, c.name AS class_name,
        h.section_id, sec.name AS section_name,
        h.subject_id, sub.name AS subject_name, sub.code AS subject_code,
        h.assigned_by_staff_id, (sp.first_name || ' ' || sp.last_name) AS teacher_name,
        h.title, h.description, 
        TO_CHAR(h.assigned_date, 'YYYY-MM-DD') AS assigned_date,
        TO_CHAR(h.due_date, 'YYYY-MM-DD') AS due_date,
        h.s3_attachment_key, h.attachment_name, h.created_at,
        ${studentId ? `COALESCE(shc.status, 'PENDING')` : `'PENDING'`} AS student_status,
        ${studentId ? `shc.completed_at` : `NULL`} AS completed_at,
        (SELECT COUNT(*)::int FROM student_homework_completions WHERE homework_id = h.id AND status = 'COMPLETED') AS completed_count,
        (SELECT COUNT(*)::int FROM student_profiles WHERE current_class_id = h.class_id AND current_section_id = h.section_id) AS total_students
      FROM homework_assignments h
      JOIN classes c ON h.class_id = c.id
      JOIN sections sec ON h.section_id = sec.id
      JOIN subjects sub ON h.subject_id = sub.id
      JOIN staff_profiles sp ON h.assigned_by_staff_id = sp.id
      ${studentId ? `LEFT JOIN student_homework_completions shc ON shc.homework_id = h.id AND shc.student_id = $2` : ''}
      WHERE h.id = $1;
    `;
    const params = studentId ? [id, studentId] : [id];
    const { rows } = await pool.query(query, params);
    return rows[0] || null;
  }

  static async setCompletionStatus(
    homeworkId: string,
    studentId: string,
    status: 'COMPLETED' | 'PENDING'
  ): Promise<{ status: string; completed_at: string }> {
    const { rows } = await pool.query(
      `INSERT INTO student_homework_completions (homework_id, student_id, status, completed_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (homework_id, student_id)
       DO UPDATE SET status = EXCLUDED.status, completed_at = CURRENT_TIMESTAMP
       RETURNING status, completed_at;`,
      [homeworkId, studentId, status]
    );
    return rows[0];
  }

  static async updateHomework(
    id: string,
    schoolId: string,
    assignedByStaffId: string,
    updates: {
      title?: string;
      description?: string;
      dueDate?: string;
      s3AttachmentKey?: string | null;
      attachmentName?: string | null;
    }
  ): Promise<HomeworkAssignment | null> {
    const fields: string[] = [];
    const values: any[] = [id, schoolId, assignedByStaffId];

    if (updates.title !== undefined) {
      values.push(updates.title);
      fields.push(`title = $${values.length}`);
    }
    if (updates.description !== undefined) {
      values.push(updates.description);
      fields.push(`description = $${values.length}`);
    }
    if (updates.dueDate !== undefined) {
      values.push(updates.dueDate);
      fields.push(`due_date = $${values.length}::date`);
    }
    if (updates.s3AttachmentKey !== undefined) {
      values.push(updates.s3AttachmentKey);
      fields.push(`s3_attachment_key = $${values.length}`);
    }
    if (updates.attachmentName !== undefined) {
      values.push(updates.attachmentName);
      fields.push(`attachment_name = $${values.length}`);
    }

    if (fields.length === 0) {
      return await this.getHomeworkById(id);
    }

    const query = `
      UPDATE homework_assignments
      SET ${fields.join(', ')}
      WHERE id = $1 AND school_id = $2 AND assigned_by_staff_id = $3
      RETURNING id;
    `;
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) return null;
    return await this.getHomeworkById(id);
  }
}
