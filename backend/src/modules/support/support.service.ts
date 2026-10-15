import { pool } from '../../config/db.config';
import { TokenPayload } from '../../types/auth.types';

export interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED';
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackItem {
  id: string;
  category: string;
  rating: number;
  feedback_text: string;
  created_at: string;
}

export class SupportService {
  static async getStudentComplaints(user: TokenPayload): Promise<ComplaintItem[]> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const query = `
      SELECT id, title, category, description, status, resolution_notes, created_at, updated_at
      FROM student_complaints
      WHERE student_id = $1 AND school_id = $2
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [user.profileId, user.schoolId]);
    return rows;
  }

  static async submitComplaint(
    user: TokenPayload,
    data: { title: string; category: string; description: string }
  ): Promise<ComplaintItem> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const validCategories = ['ACADEMIC', 'FACILITY', 'DISCIPLINE', 'TRANSPORT', 'OTHER'];
    if (!validCategories.includes(data.category)) {
      throw new Error('INVALID_CATEGORY');
    }

    if (!data.title || data.title.trim().length === 0) {
      throw new Error('TITLE_REQUIRED');
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error('DESCRIPTION_REQUIRED');
    }

    const query = `
      INSERT INTO student_complaints (school_id, student_id, title, category, description, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING id, title, category, description, status, resolution_notes, created_at, updated_at;
    `;
    const { rows } = await pool.query(query, [
      user.schoolId,
      user.profileId,
      data.title.trim(),
      data.category,
      data.description.trim(),
    ]);

    return rows[0];
  }

  static async getStudentFeedback(user: TokenPayload): Promise<FeedbackItem[]> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const query = `
      SELECT id, category, rating, feedback_text, created_at
      FROM school_feedback
      WHERE student_id = $1 AND school_id = $2
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [user.profileId, user.schoolId]);
    return rows;
  }

  static async submitFeedback(
    user: TokenPayload,
    data: { category: string; rating: number; feedback_text: string }
  ): Promise<FeedbackItem> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const validCategories = ['CURRICULUM', 'TEACHING', 'FACILITIES', 'ACTIVITIES', 'GENERAL'];
    if (!validCategories.includes(data.category)) {
      throw new Error('INVALID_CATEGORY');
    }

    if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
      throw new Error('INVALID_RATING');
    }

    if (!data.feedback_text || data.feedback_text.trim().length === 0) {
      throw new Error('FEEDBACK_TEXT_REQUIRED');
    }

    const query = `
      INSERT INTO school_feedback (school_id, student_id, category, rating, feedback_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, category, rating, feedback_text, created_at;
    `;
    const { rows } = await pool.query(query, [
      user.schoolId,
      user.profileId,
      data.category,
      data.rating,
      data.feedback_text.trim(),
    ]);

    return rows[0];
  }
}
