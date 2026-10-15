import { ProfileRepository } from './profile.repository';
import { TokenPayload } from '../../types/auth.types';

export class ProfileService {
  static async getStudentProfile(user: TokenPayload) {
    if (!user.profileId) throw new Error('PROFILE_NOT_FOUND');
    const profile = await ProfileRepository.getStudentProfile(user.profileId);
    if (!profile) throw new Error('PROFILE_NOT_FOUND');
    return profile;
  }

  static async updateStudentProfile(
    user: TokenPayload,
    updates: {
      emergency_phone?: string;
      blood_group?: string;
      medical_notes?: string;
    }
  ) {
    if (!user.profileId) throw new Error('PROFILE_NOT_FOUND');
    const updated = await ProfileRepository.updateStudentProfile(user.profileId, updates);
    return updated;
  }

  static async getStaffProfile(user: TokenPayload) {
    if (!user.profileId) throw new Error('PROFILE_NOT_FOUND');
    const profile = await ProfileRepository.getStaffProfile(user.profileId);
    if (!profile) throw new Error('PROFILE_NOT_FOUND');
    return profile;
  }

  static async updateStaffProfile(
    user: TokenPayload,
    updates: {
      emergency_phone?: string;
      phone?: string;
      qualification?: string;
      blood_group?: string;
    }
  ) {
    if (!user.profileId) throw new Error('PROFILE_NOT_FOUND');
    const updated = await ProfileRepository.updateStaffProfile(user.profileId, updates);
    return updated;
  }

  static async updateStudentProfileByTeacher(
    user: TokenPayload,
    studentId: string,
    updates: {
      roll_number?: string | null;
      blood_group?: string | null;
      emergency_phone?: string | null;
      medical_notes?: string | null;
    }
  ) {
    if (!user.profileId) throw new Error('PROFILE_NOT_FOUND');

    const student = await ProfileRepository.getStudentWithSchool(studentId);
    if (!student) throw new Error('STUDENT_NOT_FOUND');

    if (student.school_id !== user.schoolId) {
      throw new Error('FORBIDDEN_SCHOOL');
    }

    if (!student.current_class_id || !student.current_section_id) {
      throw new Error('STUDENT_NOT_ENROLLED');
    }

    const isClassTeacher = await ProfileRepository.isClassTeacherForClass(
      user.profileId,
      student.current_class_id,
      student.current_section_id
    );

    if (!isClassTeacher) {
      throw new Error('FORBIDDEN_NOT_CLASS_TEACHER');
    }

    return await ProfileRepository.updateStudentProfileByTeacher(studentId, updates);
  }
}

