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
        id, title, content, target_role, priority,
        target_class_id, target_section_id,
        published_at, created_at
      FROM notices
      WHERE school_id = $1
        AND (target_role = 'ALL' OR target_role = 'STUDENT')
        AND (target_class_id IS NULL OR target_class_id = $2)
        AND (target_section_id IS NULL OR target_section_id = $3)
      ORDER BY published_at DESC;
    `;
    const { rows } = await pool.query(query, [
      user.schoolId,
      user.classId || null,
      user.sectionId || null,
    ]);
    return rows;
  }
}
