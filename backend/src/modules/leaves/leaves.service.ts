import { TokenPayload } from '../../types/auth.types';
import { LeavesRepository } from './leaves.repository';

export class LeavesService {
  private static isValidDateString(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  }

  static async createStaffLeave(
    user: TokenPayload,
    leaveType: 'SICK' | 'CASUAL' | 'EARNED',
    startDate: string,
    endDate: string,
    reason: string
  ) {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    if (!this.isValidDateString(startDate) || !this.isValidDateString(endDate)) {
      throw new Error('INVALID_DATE');
    }

    if (new Date(endDate) < new Date(startDate)) {
      throw new Error('INVALID_DATE_RANGE');
    }

    return await LeavesRepository.createStaffLeave(
      user.schoolId,
      user.profileId,
      leaveType,
      startDate,
      endDate,
      reason.trim()
    );
  }

  static async getStaffMyLeaves(user: TokenPayload) {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    return await LeavesRepository.getStaffLeavesByStaffId(user.profileId);
  }

  static async getStaffWingLeaves(user: TokenPayload) {
    if (!user.wingId) {
      throw new Error('WING_NOT_ASSIGNED');
    }
    return await LeavesRepository.getStaffLeavesByWingId(user.wingId);
  }

  static async getAllStaffLeavesForManagement(user: TokenPayload) {
    if (!user.roles.includes('MANAGEMENT')) {
      throw new Error('FORBIDDEN_ROLE');
    }
    return await LeavesRepository.getAllStaffLeavesForManagement(user.schoolId);
  }

  static async recommendStaffLeave(
    user: TokenPayload,
    leaveId: string,
    recommendation: string
  ) {
    if (!user.profileId || !user.wingId) {
      throw new Error('COORDINATOR_CONTEXT_MISSING');
    }

    const leave = await LeavesRepository.getStaffLeaveById(leaveId);
    if (!leave) {
      throw new Error('LEAVE_NOT_FOUND');
    }

    // Wing Scope Check: Teacher must be in Coordinator's assigned wing
    if (leave.wing_id !== user.wingId) {
      throw new Error('FORBIDDEN_SCOPE');
    }

    if (leave.status === 'APPROVED' || leave.status === 'REJECTED') {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    await LeavesRepository.recommendStaffLeave(
      leaveId,
      user.profileId,
      recommendation.trim()
    );

    return await LeavesRepository.getStaffLeaveById(leaveId);
  }

  static async sanctionStaffLeave(
    user: TokenPayload,
    leaveId: string,
    decision: 'APPROVED' | 'REJECTED',
    comment: string | null
  ) {
    if (!user.roles.includes('MANAGEMENT')) {
      throw new Error('FORBIDDEN_ROLE');
    }

    const leave = await LeavesRepository.getStaffLeaveById(leaveId);
    if (!leave) {
      throw new Error('LEAVE_NOT_FOUND');
    }

    if (leave.status === 'APPROVED' || leave.status === 'REJECTED') {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    await LeavesRepository.sanctionStaffLeave(
      leaveId,
      user.userId,
      decision,
      comment ? comment.trim() : null
    );

    return await LeavesRepository.getStaffLeaveById(leaveId);
  }

  static async createStudentLeave(
    user: TokenPayload,
    startDate: string,
    endDate: string,
    reason: string
  ) {
    if (!user.profileId || !user.classId || !user.sectionId) {
      throw new Error('STUDENT_ENROLLMENT_NOT_FOUND');
    }

    if (!this.isValidDateString(startDate) || !this.isValidDateString(endDate)) {
      throw new Error('INVALID_DATE');
    }

    if (new Date(endDate) < new Date(startDate)) {
      throw new Error('INVALID_DATE_RANGE');
    }

    return await LeavesRepository.createStudentLeave(
      user.schoolId,
      user.profileId,
      user.classId,
      user.sectionId,
      startDate,
      endDate,
      reason.trim()
    );
  }

  static async getStudentMyLeaves(user: TokenPayload) {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    return await LeavesRepository.getStudentLeavesByStudentId(user.profileId);
  }

  static async getClassStudentLeaves(user: TokenPayload) {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    const homeroom = await LeavesRepository.getTeacherHomeroom(user.profileId);
    if (!homeroom) {
      throw new Error('NOT_CLASS_TEACHER');
    }
    return await LeavesRepository.getClassStudentLeaves(homeroom.class_id, homeroom.section_id);
  }

  static async updateStudentLeaveStatus(
    user: TokenPayload,
    leaveId: string,
    status: 'APPROVED' | 'REJECTED',
    remarks?: string | null
  ) {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const homeroom = await LeavesRepository.getTeacherHomeroom(user.profileId);
    if (!homeroom) {
      throw new Error('NOT_CLASS_TEACHER');
    }

    const leave = await LeavesRepository.getStudentLeaveById(leaveId);
    if (!leave) {
      throw new Error('LEAVE_NOT_FOUND');
    }

    // Class Teacher must be in the same school and assigned to the same class & section
    if (leave.school_id !== user.schoolId || leave.class_id !== homeroom.class_id || leave.section_id !== homeroom.section_id) {
      throw new Error('FORBIDDEN_SCOPE');
    }

    // Lock final states (APPROVED/REJECTED) from further edits
    if (leave.status === 'APPROVED' || leave.status === 'REJECTED') {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    return await LeavesRepository.updateStudentLeaveStatus(
      leaveId,
      status,
      user.profileId,
      remarks
    );
  }
}

