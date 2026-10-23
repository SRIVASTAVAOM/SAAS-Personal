import { AcademicsRepository, ClassmateBirthdayItem, StudentRosterItem, SubjectRecord, SubjectTeacherItem } from './academics.repository';
import { TokenPayload } from '../../types/auth.types';

export class AcademicsService {
  static async getClassesAndSections(schoolId: string): Promise<any[]> {
    return await AcademicsRepository.getClassesAndSections(schoolId);
  }

  static async getSubjects(schoolId: string): Promise<SubjectRecord[]> {
    return await AcademicsRepository.getSubjectsBySchool(schoolId);
  }

  static async getSubjectsWithDetails(schoolId: string): Promise<any[]> {
    return await AcademicsRepository.getSubjectsWithDetails(schoolId);
  }

  static async createSubject(schoolId: string, data: { name: string; code: string; type?: string; class_ids?: string[] }): Promise<any> {
    if (!data.name || !data.code) {
      const error: any = new Error('Subject name and code are required');
      error.statusCode = 400;
      throw error;
    }
    try {
      return await AcademicsRepository.createSubject(schoolId, data);
    } catch (err: any) {
      if (err.code === '23505') {
        const error: any = new Error(`A subject with code "${data.code.trim().toUpperCase()}" already exists in your school.`);
        error.statusCode = 400;
        throw error;
      }
      throw err;
    }
  }

  static async updateSubject(schoolId: string, subjectId: string, data: any): Promise<any> {
    try {
      const updated = await AcademicsRepository.updateSubject(schoolId, subjectId, data);
      if (!updated) {
        const error: any = new Error('Subject not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }
      return updated;
    } catch (err: any) {
      if (err.code === '23505') {
        const error: any = new Error(`A subject with code "${data.code?.trim().toUpperCase()}" already exists in your school.`);
        error.statusCode = 400;
        throw error;
      }
      throw err;
    }
  }

  static async deleteSubject(schoolId: string, subjectId: string): Promise<boolean> {
    const deleted = await AcademicsRepository.deleteSubject(schoolId, subjectId);
    if (!deleted) {
      const error: any = new Error('Subject not found or cannot be deleted');
      error.statusCode = 404;
      throw error;
    }
    return deleted;
  }

  static async getClassRoster(
    user: TokenPayload,
    classId: string,
    sectionId: string
  ): Promise<StudentRosterItem[]> {
    // 1. Data-Scope check for Student: A student can ONLY see students in their own class & section!
    if (user.roles.includes('STUDENT')) {
      const enrollment = await AcademicsRepository.getStudentEnrollment(user.profileId!);
      if (!enrollment || enrollment.current_class_id !== classId || enrollment.current_section_id !== sectionId) {
        throw new Error('FORBIDDEN_SCOPE');
      }
    }

    // 2. Data-Scope check for Teacher: Teacher must teach or be class teacher for this class/section
    if (user.roles.includes('TEACHER') && !user.roles.includes('ADMIN') && !user.roles.includes('SUPER_ADMIN')) {
      const allocations = await AcademicsRepository.getTeacherAllocations(user.profileId!);
      const isAllocated = allocations.some(
        (a: any) => a.class_id === classId && a.section_id === sectionId
      ) || (user.classId === classId && user.sectionId === sectionId);

      if (!isAllocated) {
        throw new Error('FORBIDDEN_SCOPE');
      }
    }

    return await AcademicsRepository.getClassRoster(classId, sectionId);
  }

  static async getMyTeacherRoster(user: TokenPayload): Promise<StudentRosterItem[]> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    return await AcademicsRepository.getTeacherClassStudents(user.profileId);
  }

  static async getTeacherAllocations(user: TokenPayload) {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    const homeroom = await AcademicsRepository.getTeacherHomeroom(user.profileId);
    const allocations = await AcademicsRepository.getTeacherAllocations(user.profileId);
    return {
      homeroom,
      allocations,
    };
  }

  static async getStudentSubjectTeachers(user: TokenPayload): Promise<SubjectTeacherItem[]> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    return await AcademicsRepository.getStudentSubjectTeachers(user.profileId);
  }

  static async getClassmatesBirthdays(user: TokenPayload): Promise<ClassmateBirthdayItem[]> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    const enrollment = await AcademicsRepository.getStudentEnrollment(user.profileId);
    if (!enrollment || !enrollment.current_class_id || !enrollment.current_section_id) {
      return [];
    }
    return await AcademicsRepository.getClassmatesBirthdays(
      enrollment.current_class_id,
      enrollment.current_section_id
    );
  }
}

