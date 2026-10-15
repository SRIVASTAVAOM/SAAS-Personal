import { pool } from '../../config/db.config';

export interface AcademicMaterial {
  id: string;
  school_id: string;
  class_id: string;
  class_name?: string;
  section_id: string | null;
  section_name?: string | null;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  uploaded_by_staff_id: string;
  teacher_name?: string;
  title: string;
  description: string | null;
  s3_file_key: string;
  file_name: string;
  file_size_bytes: string | number;
  content_type: string;
  is_verified: boolean;
  created_at: string;
}

export class MaterialsRepository {
  static async createPendingMaterial(data: {
    schoolId: string;
    classId: string;
    sectionId?: string;
    subjectId: string;
    uploadedByStaffId: string;
    title: string;
    description?: string;
    s3FileKey: string;
    fileName: string;
    fileSizeBytes: number;
    contentType: string;
  }): Promise<AcademicMaterial> {
    const { rows } = await pool.query(
      `INSERT INTO academic_materials 
        (school_id, class_id, section_id, subject_id, uploaded_by_staff_id,
         title, description, s3_file_key, file_name, file_size_bytes, content_type, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false)
       RETURNING *;`,
      [
        data.schoolId,
        data.classId,
        data.sectionId || null,
        data.subjectId,
        data.uploadedByStaffId,
        data.title,
        data.description || null,
        data.s3FileKey,
        data.fileName,
        data.fileSizeBytes,
        data.contentType,
      ]
    );
    return rows[0];
  }

  static async markMaterialVerified(id: string, staffId: string): Promise<AcademicMaterial | null> {
    const { rows } = await pool.query(
      `UPDATE academic_materials 
       SET is_verified = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND uploaded_by_staff_id = $2
       RETURNING *;`,
      [id, staffId]
    );
    return rows[0] || null;
  }

  static async getMaterialsByClassAndSubject(
    classId: string,
    subjectId: string,
    sectionId?: string
  ): Promise<AcademicMaterial[]> {
    let query = `
      SELECT 
        m.id, m.school_id, m.class_id, c.name AS class_name,
        m.section_id, sec.name AS section_name,
        m.subject_id, sub.name AS subject_name, sub.code AS subject_code,
        m.uploaded_by_staff_id, (sp.first_name || ' ' || sp.last_name) AS teacher_name,
        m.title, m.description, m.s3_file_key, m.file_name,
        m.file_size_bytes, m.content_type, m.is_verified, m.created_at
      FROM academic_materials m
      JOIN classes c ON m.class_id = c.id
      LEFT JOIN sections sec ON m.section_id = sec.id
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN staff_profiles sp ON m.uploaded_by_staff_id = sp.id
      WHERE m.class_id = $1 AND m.subject_id = $2 AND m.is_verified = true
    `;
    const params: any[] = [classId, subjectId];

    if (sectionId) {
      query += ` AND (m.section_id IS NULL OR m.section_id = $3)`;
      params.push(sectionId);
    }

    query += ` ORDER BY m.created_at DESC;`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getMaterialById(id: string): Promise<AcademicMaterial | null> {
    const query = `
      SELECT 
        m.id, m.school_id, m.class_id, c.name AS class_name,
        m.section_id, sec.name AS section_name,
        m.subject_id, sub.name AS subject_name, sub.code AS subject_code,
        m.uploaded_by_staff_id, (sp.first_name || ' ' || sp.last_name) AS teacher_name,
        m.title, m.description, m.s3_file_key, m.file_name,
        m.file_size_bytes, m.content_type, m.is_verified, m.created_at
      FROM academic_materials m
      JOIN classes c ON m.class_id = c.id
      LEFT JOIN sections sec ON m.section_id = sec.id
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN staff_profiles sp ON m.uploaded_by_staff_id = sp.id
      WHERE m.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}
