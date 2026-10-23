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
  material_type?: string;
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
        m.file_size_bytes, m.content_type, COALESCE(m.material_type, 'Study Material') AS material_type,
        m.is_verified, m.created_at
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
        m.file_size_bytes, m.content_type, COALESCE(m.material_type, 'Study Material') AS material_type,
        m.is_verified, m.created_at
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

  static async getAdminMaterials(
    schoolId: string,
    filters: { classId?: string; sectionId?: string; subjectId?: string; type?: string; search?: string }
  ): Promise<AcademicMaterial[]> {
    let query = `
      SELECT 
        m.id, m.school_id, m.class_id, c.name AS class_name,
        m.section_id, sec.name AS section_name,
        m.subject_id, sub.name AS subject_name, sub.code AS subject_code,
        m.uploaded_by_staff_id, (sp.first_name || ' ' || sp.last_name) AS teacher_name,
        m.title, m.description, m.s3_file_key, m.file_name,
        m.file_size_bytes, m.content_type, COALESCE(m.material_type, 'Study Material') AS material_type,
        m.is_verified, m.created_at
      FROM academic_materials m
      JOIN classes c ON m.class_id = c.id
      LEFT JOIN sections sec ON m.section_id = sec.id
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN staff_profiles sp ON m.uploaded_by_staff_id = sp.id
      WHERE m.school_id = $1
    `;
    const params: any[] = [schoolId];
    let idx = 2;

    if (filters.classId) {
      query += ` AND m.class_id = $${idx++}`;
      params.push(filters.classId);
    }
    if (filters.sectionId) {
      query += ` AND (m.section_id = $${idx++} OR m.section_id IS NULL)`;
      params.push(filters.sectionId);
    }
    if (filters.subjectId) {
      query += ` AND m.subject_id = $${idx++}`;
      params.push(filters.subjectId);
    }
    if (filters.type && filters.type !== 'ALL') {
      query += ` AND m.material_type = $${idx++}`;
      params.push(filters.type);
    }
    if (filters.search) {
      query += ` AND (m.title ILIKE $${idx} OR m.file_name ILIKE $${idx} OR sub.name ILIKE $${idx} OR (sp.first_name || ' ' || sp.last_name) ILIKE $${idx})`;
      params.push(`%${filters.search.trim()}%`);
      idx++;
    }

    query += ` ORDER BY m.created_at DESC;`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async createAdminMaterial(data: {
    schoolId: string;
    classId: string;
    sectionId?: string;
    subjectId: string;
    uploadedByStaffId: string;
    title: string;
    description?: string;
    materialType?: string;
    s3FileKey: string;
    fileName: string;
    fileSizeBytes: number;
    contentType: string;
  }): Promise<AcademicMaterial> {
    const { rows } = await pool.query(
      `INSERT INTO academic_materials 
        (school_id, class_id, section_id, subject_id, uploaded_by_staff_id,
         title, description, material_type, s3_file_key, file_name, file_size_bytes, content_type, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
       RETURNING *;`,
      [
        data.schoolId,
        data.classId,
        data.sectionId || null,
        data.subjectId,
        data.uploadedByStaffId,
        data.title,
        data.description || null,
        data.materialType || 'Study Material',
        data.s3FileKey,
        data.fileName,
        data.fileSizeBytes,
        data.contentType,
      ]
    );
    const created = await this.getMaterialById(rows[0].id);
    return created || rows[0];
  }

  static async updateAdminMaterial(
    id: string,
    schoolId: string,
    updates: {
      classId?: string;
      sectionId?: string | null;
      subjectId?: string;
      title?: string;
      description?: string;
      materialType?: string;
      fileName?: string;
    }
  ): Promise<AcademicMaterial | null> {
    const fields: string[] = [];
    const values: any[] = [id, schoolId];
    let idx = 3;

    if (updates.classId !== undefined) {
      fields.push(`class_id = $${idx++}`);
      values.push(updates.classId);
    }
    if (updates.sectionId !== undefined) {
      fields.push(`section_id = $${idx++}`);
      values.push(updates.sectionId || null);
    }
    if (updates.subjectId !== undefined) {
      fields.push(`subject_id = $${idx++}`);
      values.push(updates.subjectId);
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(updates.description);
    }
    if (updates.materialType !== undefined) {
      fields.push(`material_type = $${idx++}`);
      values.push(updates.materialType);
    }
    if (updates.fileName !== undefined) {
      fields.push(`file_name = $${idx++}`);
      values.push(updates.fileName);
    }

    if (fields.length > 0) {
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      const query = `
        UPDATE academic_materials
        SET ${fields.join(', ')}
        WHERE id = $1 AND school_id = $2
        RETURNING id;
      `;
      const res = await pool.query(query, values);
      if (res.rows.length === 0) return null;
    }

    return await this.getMaterialById(id);
  }

  static async deleteAdminMaterial(id: string, schoolId: string): Promise<boolean> {
    const res = await pool.query(
      `DELETE FROM academic_materials WHERE id = $1 AND school_id = $2;`,
      [id, schoolId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
