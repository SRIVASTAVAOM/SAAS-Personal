import { pool } from '../../config/db.config';

export interface CurriculumTopic {
  id: string;
  unit_id: string;
  topic_number: number;
  title: string;
  description: string | null;
  learning_objectives: string | null;
  created_at: string;
}

export interface CurriculumUnit {
  id: string;
  school_id: string;
  academic_year_id: string;
  class_id: string;
  subject_id: string;
  unit_number: number;
  title: string;
  description: string | null;
  created_at: string;
  topics?: CurriculumTopic[];
}

export class CurriculumRepository {
  static async getUnitsWithTopics(
    classId: string,
    subjectId: string,
    academicYearId?: string
  ): Promise<CurriculumUnit[]> {
    let query = `
      SELECT 
        cu.id, cu.school_id, cu.academic_year_id, cu.class_id, cu.subject_id,
        cu.unit_number, cu.title, cu.description, cu.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ct.id,
              'unit_id', ct.unit_id,
              'topic_number', ct.topic_number,
              'title', ct.title,
              'description', ct.description,
              'learning_objectives', ct.learning_objectives,
              'created_at', ct.created_at
            ) ORDER BY ct.topic_number ASC
          ) FILTER (WHERE ct.id IS NOT NULL),
          '[]'
        ) AS topics
      FROM curriculum_units cu
      LEFT JOIN curriculum_topics ct ON cu.id = ct.unit_id
      WHERE cu.class_id = $1 AND cu.subject_id = $2
    `;
    const params: any[] = [classId, subjectId];

    if (academicYearId) {
      query += ` AND cu.academic_year_id = $3`;
      params.push(academicYearId);
    }

    query += ` GROUP BY cu.id ORDER BY cu.unit_number ASC;`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async createUnit(data: {
    schoolId: string;
    academicYearId: string;
    classId: string;
    subjectId: string;
    unitNumber: number;
    title: string;
    description?: string;
  }): Promise<CurriculumUnit> {
    const { rows } = await pool.query(
      `INSERT INTO curriculum_units 
        (school_id, academic_year_id, class_id, subject_id, unit_number, title, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [
        data.schoolId,
        data.academicYearId,
        data.classId,
        data.subjectId,
        data.unitNumber,
        data.title,
        data.description || null,
      ]
    );
    return rows[0];
  }

  static async getUnitById(unitId: string): Promise<CurriculumUnit | null> {
    const { rows } = await pool.query(
      `SELECT * FROM curriculum_units WHERE id = $1;`,
      [unitId]
    );
    return rows[0] || null;
  }

  static async createTopic(data: {
    unitId: string;
    topicNumber: number;
    title: string;
    description?: string;
    learningObjectives?: string;
  }): Promise<CurriculumTopic> {
    const { rows } = await pool.query(
      `INSERT INTO curriculum_topics 
        (unit_id, topic_number, title, description, learning_objectives)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [
        data.unitId,
        data.topicNumber,
        data.title,
        data.description || null,
        data.learningObjectives || null,
      ]
    );
    return rows[0];
  }
}
