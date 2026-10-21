import { pool } from '../../config/db.config';
import { TokenPayload } from '../../types/auth.types';
import { CurriculumRepository, CurriculumUnit, CurriculumTopic } from './curriculum.repository';

export class CurriculumService {
  /**
   * Verifies access to curriculum for a given class and subject.
   */
  static async verifyClassAccess(user: TokenPayload, classId: string, subjectId: string): Promise<void> {
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) return;

    if (user.roles.includes('STUDENT')) {
      const { rows } = await pool.query(
        `SELECT current_class_id FROM student_profiles WHERE id = $1;`,
        [user.profileId]
      );
      if (rows.length === 0 || rows[0].current_class_id !== classId) {
        throw { statusCode: 403, message: 'Students can only view curriculum for their own enrolled class.' };
      }
      return;
    }

    if (user.roles.includes('TEACHER')) {
      const { rows } = await pool.query(
        `SELECT 1 FROM teacher_subject_allocations 
         WHERE staff_id = $1 AND class_id = $2 AND subject_id = $3
         UNION
         SELECT 1 FROM staff_assignments
         WHERE staff_id = $1 AND class_id = $2;`,
        [user.profileId, classId, subjectId]
      );
      if (rows.length === 0) {
        throw { statusCode: 403, message: 'Teachers can only view/manage curriculum for their allocated classes and subjects.' };
      }
      return;
    }

    throw { statusCode: 403, message: 'Unauthorized to access curriculum.' };
  }

  static async getCurriculum(
    user: TokenPayload,
    classId: string,
    subjectId: string,
    academicYearId?: string
  ): Promise<CurriculumUnit[]> {
    await this.verifyClassAccess(user, classId, subjectId);
    return await CurriculumRepository.getUnitsWithTopics(classId, subjectId, academicYearId);
  }

  static async createUnit(
    user: TokenPayload,
    data: {
      classId: string;
      subjectId: string;
      academicYearId?: string;
      unitNumber: number;
      title: string;
      description?: string;
    }
  ): Promise<CurriculumUnit> {
    // Only Teachers, Admin, and Super Admin can add curriculum units
    if (!user.roles.some((r) => ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(r))) {
      throw { statusCode: 403, message: 'Only authorized academic staff can create curriculum units.' };
    }

    await this.verifyClassAccess(user, data.classId, data.subjectId);

    // Resolve academic year if not provided
    let yearId = data.academicYearId;
    if (!yearId) {
      const { rows } = await pool.query(
        `SELECT id FROM academic_years WHERE school_id = $1 AND is_current = true LIMIT 1;`,
        [user.schoolId]
      );
      if (rows.length > 0) yearId = rows[0].id;
      else throw { statusCode: 400, message: 'Active academic year not found.' };
    }

    return await CurriculumRepository.createUnit({
      schoolId: user.schoolId,
      academicYearId: yearId!,
      classId: data.classId,
      subjectId: data.subjectId,
      unitNumber: data.unitNumber,
      title: data.title,
      description: data.description,
    });
  }

  static async createTopic(
    user: TokenPayload,
    data: {
      unitId: string;
      topicNumber: number;
      title: string;
      description?: string;
      learningObjectives?: string;
    }
  ): Promise<CurriculumTopic> {
    if (!user.roles.some((r) => ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(r))) {
      throw { statusCode: 403, message: 'Only authorized academic staff can add curriculum topics.' };
    }

    const unit = await CurriculumRepository.getUnitById(data.unitId);
    if (!unit) {
      throw { statusCode: 404, message: 'Curriculum unit not found.' };
    }

    await this.verifyClassAccess(user, unit.class_id, unit.subject_id);

    return await CurriculumRepository.createTopic({
      unitId: data.unitId,
      topicNumber: data.topicNumber,
      title: data.title,
      description: data.description,
      learningObjectives: data.learningObjectives,
    });
  }
}
