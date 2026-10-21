import { pool } from '../../config/db.config';
import { TokenPayload } from '../../types/auth.types';
import { AcademicsRepository } from '../academics/academics.repository';
import { AttendanceRepository, StudentAttendanceItem } from './attendance.repository';

export class AttendanceService {
  private static isValidDateString(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  }

  static async markStudentAttendance(
    user: TokenPayload,
    classId: string,
    sectionId: string,
    attendanceDate: string,
    records: StudentAttendanceItem[]
  ) {
    if (!this.isValidDateString(attendanceDate)) {
      throw new Error('INVALID_DATE');
    }

    let markerStaffId: string = user.profileId || '';
    if (!markerStaffId) {
      const staffRes = await pool.query(
        `SELECT sp.id FROM staff_profiles sp JOIN users u ON sp.user_id = u.id WHERE u.school_id = $1 AND sp.is_active = TRUE ORDER BY sp.created_at ASC LIMIT 1;`,
        [user.schoolId]
      );
      if (staffRes.rows.length > 0) {
        markerStaffId = staffRes.rows[0].id;
      } else {
        throw new Error('PROFILE_NOT_FOUND');
      }
    }

    // Role & Resource Scope Check for Teacher
    if (user.roles.includes('TEACHER') && !user.roles.includes('ADMIN') && !user.roles.includes('SUPER_ADMIN')) {
      let isHomeroom = user.classId === classId && user.sectionId === sectionId;
      if (!isHomeroom && user.profileId) {
        const homeroom = await AcademicsRepository.getTeacherHomeroom(user.profileId);
        if (homeroom && homeroom.class_id === classId && homeroom.section_id === sectionId) {
          isHomeroom = true;
        }
      }
      const allocations = user.profileId ? await AcademicsRepository.getTeacherAllocations(user.profileId) : [];
      const isAllocated = allocations.some(
        (a: any) => a.class_id === classId && a.section_id === sectionId
      );

      if (!isHomeroom && !isAllocated) {
        throw new Error('FORBIDDEN_SCOPE');
      }
    }

    // Validate records status (Only PRESENT or ABSENT approved)
    for (const rec of records) {
      if (rec.status !== 'PRESENT' && rec.status !== 'ABSENT') {
        throw new Error('INVALID_ATTENDANCE_STATUS');
      }
    }

    await AttendanceRepository.markStudentAttendance(
      user.schoolId,
      classId,
      sectionId,
      markerStaffId,
      attendanceDate,
      records
    );
  }

  static async getClassAttendance(
    user: TokenPayload,
    classId: string,
    sectionId: string,
    attendanceDate: string
  ) {
    if (!this.isValidDateString(attendanceDate)) {
      throw new Error('INVALID_DATE');
    }

    // Scope check for Teacher
    if (user.roles.includes('TEACHER') && !user.roles.includes('ADMIN') && !user.roles.includes('SUPER_ADMIN')) {
      let isHomeroom = user.classId === classId && user.sectionId === sectionId;
      if (!isHomeroom) {
        const homeroom = await AcademicsRepository.getTeacherHomeroom(user.profileId!);
        if (homeroom && homeroom.class_id === classId && homeroom.section_id === sectionId) {
          isHomeroom = true;
        }
      }
      const allocations = await AcademicsRepository.getTeacherAllocations(user.profileId!);
      const isAllocated = allocations.some(
        (a: any) => a.class_id === classId && a.section_id === sectionId
      );

      if (!isHomeroom && !isAllocated) {
        throw new Error('FORBIDDEN_SCOPE');
      }
    }

    return await AttendanceRepository.getClassAttendance(classId, sectionId, attendanceDate);
  }

  static async getStudentAttendanceHistory(user: TokenPayload) {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    return await AttendanceRepository.getStudentAttendanceHistory(user.profileId);
  }

  static async getStaffAttendanceHistory(user: TokenPayload) {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    return await AttendanceRepository.getStaffAttendanceHistory(user.profileId);
  }

  static async getWingStaffAttendance(user: TokenPayload, wingId: string, attendanceDate: string) {
    if (!this.isValidDateString(attendanceDate)) {
      throw new Error('INVALID_DATE');
    }

    // School ADMIN and SUPER_ADMIN have full access
    if (!user.roles.includes('ADMIN') && !user.roles.includes('SUPER_ADMIN')) {
      if (user.wingId !== wingId) {
        throw new Error('FORBIDDEN_SCOPE');
      }
    }

    return await AttendanceRepository.getWingStaffAttendance(wingId, attendanceDate);
  }

  static async getAllStaffAttendance(user: TokenPayload, attendanceDate: string, wingId?: string) {
    if (!this.isValidDateString(attendanceDate)) {
      throw new Error('INVALID_DATE');
    }
    return await AttendanceRepository.getAllStaffAttendance(user.schoolId, attendanceDate, wingId);
  }

  static async markStaffAttendance(
    user: TokenPayload,
    attendanceDate: string,
    records: {
      staffId: string;
      status: 'PRESENT' | 'ABSENT';
      inTime?: string | null;
      outTime?: string | null;
      remarks?: string | null;
    }[]
  ) {
    if (!this.isValidDateString(attendanceDate)) {
      throw new Error('INVALID_DATE');
    }

    for (const rec of records) {
      if (rec.status !== 'PRESENT' && rec.status !== 'ABSENT') {
        throw new Error('INVALID_ATTENDANCE_STATUS');
      }
    }

    const mapped = records.map((r) => ({
      staff_id: r.staffId,
      status: r.status,
      in_time: r.inTime,
      out_time: r.outTime,
      remarks: r.remarks,
    }));

    await AttendanceRepository.markStaffAttendance(user.schoolId, attendanceDate, mapped);
  }
}
