import { pool } from '../../config/db.config';
import { TokenPayload } from '../../types/auth.types';

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  target_role: string;
  priority: 'INFO' | 'NORMAL' | 'URGENT';
  target_class_id: string | null;
  target_section_id: string | null;
  published_at: string;
  created_at: string;
}

export class NoticeService {
  static async getStudentNotices(user: TokenPayload): Promise<NoticeItem[]> {
    const query = `
      SELECT 
        id, title, content, target_role, priority, channel,
        target_class_id, target_section_id, target_student_id,
        published_at, created_at
      FROM notices
      WHERE school_id = $1
        AND (target_role = 'ALL' OR target_role = 'STUDENT')
        AND (target_class_id IS NULL OR target_class_id = $2)
        AND (target_section_id IS NULL OR target_section_id = $3)
        AND (target_student_id IS NULL OR target_student_id = $4)
      ORDER BY published_at DESC;
    `;
    const { rows } = await pool.query(query, [
      user.schoolId,
      user.classId || null,
      user.sectionId || null,
      user.profileId || null,
    ]);
    return rows;
  }

  static async getAdminNotices(user: TokenPayload): Promise<any[]> {
    const query = `
      SELECT 
        n.id, n.title, n.content, n.target_role, n.priority, n.channel,
        n.target_class_id, n.target_section_id, n.target_student_id,
        c.name AS class_name, s.name AS section_name,
        CONCAT(stp.first_name, ' ', stp.last_name) AS target_student_name,
        stp.admission_number AS target_student_admission,
        n.published_at, n.created_at
      FROM notices n
      LEFT JOIN classes c ON c.id = n.target_class_id
      LEFT JOIN sections s ON s.id = n.target_section_id
      LEFT JOIN student_profiles stp ON stp.id = n.target_student_id
      WHERE n.school_id = $1
      ORDER BY n.published_at DESC;
    `;
    const { rows } = await pool.query(query, [user.schoolId]);
    return rows;
  }

  static async createNotice(
    user: TokenPayload,
    data: {
      title: string;
      content: string;
      target_role?: string;
      target_class_id?: string | null;
      target_section_id?: string | null;
      target_student_id?: string | null;
      priority?: 'INFO' | 'NORMAL' | 'URGENT';
      channel?: string;
    }
  ): Promise<any> {
    if (!data.title?.trim() || !data.content?.trim()) {
      const error: any = new Error('Title and content are required');
      error.statusCode = 400;
      throw error;
    }

    const query = `
      INSERT INTO notices (
        school_id, title, content, target_role,
        target_class_id, target_section_id, target_student_id, priority, channel, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      user.schoolId,
      data.title.trim(),
      data.content.trim(),
      data.target_role || 'ALL',
      data.target_class_id || null,
      data.target_section_id || null,
      data.target_student_id || null,
      data.priority || 'NORMAL',
      data.channel || 'IN_APP',
    ]);

    return rows[0];
  }

  static async deleteNotice(user: TokenPayload, id: string): Promise<boolean> {
    const query = `
      DELETE FROM notices
      WHERE id = $1 AND school_id = $2
      RETURNING id;
    `;
    const { rows } = await pool.query(query, [id, user.schoolId]);
    return rows.length > 0;
  }
}
