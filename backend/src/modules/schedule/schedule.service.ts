import { ScheduleRepository, TimetableSlot, TeacherSubstitution, OnlineClassSession } from './schedule.repository';
import { TokenPayload } from '../../types/auth.types';

export class ScheduleService {
  /**
   * Get authenticated teacher's day-wise timetable.
   */
  static async getTeacherTimetable(user: TokenPayload): Promise<TimetableSlot[]> {
    const teacherStaffId = user.profileId ?? '';
    return ScheduleRepository.getTeacherTimetable(user.schoolId, teacherStaffId, user.userId);
  }

  /**
   * Get teacher's substitution arrangements (both assigned and covering).
   */
  static async getTeacherSubstitutions(user: TokenPayload): Promise<{
    assigned_to_me: TeacherSubstitution[];
    covering_for_me: TeacherSubstitution[];
  }> {
    const teacherStaffId = user.profileId ?? '';
    const all = await ScheduleRepository.getTeacherSubstitutions(user.schoolId, teacherStaffId, user.userId);

    const assigned_to_me = all.filter((s) => s.arrangement_type === 'ASSIGNED_TO_ME');
    const covering_for_me = all.filter((s) => s.arrangement_type === 'COVERING_FOR_ME');

    return { assigned_to_me, covering_for_me };
  }

  /**
   * Get online class sessions for teacher or student.
   */
  static async getOnlineClasses(user: TokenPayload): Promise<OnlineClassSession[]> {
    if (user.roles.includes('TEACHER')) {
      const teacherStaffId = user.profileId ?? '';
      return ScheduleRepository.getTeacherOnlineClasses(user.schoolId, teacherStaffId, user.userId);
    }

    if (user.roles.includes('STUDENT')) {
      if (!user.classId || !user.sectionId) {
        return [];
      }
      return ScheduleRepository.getStudentOnlineClasses(user.schoolId, user.classId, user.sectionId);
    }

    return [];
  }

  /**
   * Create an online class session.
   */
  static async createOnlineClass(
    user: TokenPayload,
    data: {
      class_id: string;
      section_id: string;
      subject_id: string;
      title: string;
      scheduled_date: string;
      start_time: string;
      duration_minutes?: number;
      meeting_url: string;
    }
  ): Promise<OnlineClassSession> {
    const teacherStaffId = user.profileId;
    if (!teacherStaffId) {
      const error: any = new Error('Teacher staff profile required to schedule an online class');
      error.statusCode = 403;
      throw error;
    }

    // Resolve current academic year
    const academicYearId = await ScheduleRepository.getActiveAcademicYear(user.schoolId);
    if (!academicYearId) {
      const error: any = new Error('No active academic year found for this school');
      error.statusCode = 400;
      throw error;
    }

    // Check teacher allocation
    const isAllocated = await ScheduleRepository.isTeacherAllocatedToClass(
      user.schoolId,
      teacherStaffId,
      data.class_id,
      data.section_id,
      data.subject_id
    );

    if (!isAllocated) {
      const error: any = new Error('You are not allocated to teach this class or subject');
      error.statusCode = 403;
      throw error;
    }

    return ScheduleRepository.createOnlineClass({
      schoolId: user.schoolId,
      academicYearId,
      classId: data.class_id,
      sectionId: data.section_id,
      subjectId: data.subject_id,
      teacherId: teacherStaffId,
      title: data.title,
      scheduledDate: data.scheduled_date,
      startTime: data.start_time,
      durationMinutes: data.duration_minutes ?? 40,
      meetingUrl: data.meeting_url,
    });
  }

  /**
   * Delete / Cancel an online class session.
   */
  static async deleteOnlineClass(user: TokenPayload, id: string): Promise<void> {
    const session = await ScheduleRepository.getOnlineClassById(id, user.schoolId);
    if (!session) {
      const error: any = new Error('Online class session not found');
      error.statusCode = 404;
      throw error;
    }

    const teacherStaffId = user.profileId ?? '';
    const isOwner = session.teacher_id === teacherStaffId || session.user_id === user.userId;
    if (!isOwner) {
      const error: any = new Error('You are not authorized to cancel or delete this online class session');
      error.statusCode = 403;
      throw error;
    }

    await ScheduleRepository.deleteOnlineClass(id, user.schoolId);
  }
}
