import {
  AdminRepository,
  DashboardSummaryResponse,
  TimetableGridResponse,
  GreensheetResponse,
} from './admin.repository';
import { TokenPayload } from '../../types/auth.types';

export class AdminService {
  /**
   * Retrieves Command Center Live Summary (KPIs, Section Attendance/HW pills, Leaves, Birthdays).
   */
  static async getDashboardSummary(
    user: TokenPayload,
    date?: string
  ): Promise<DashboardSummaryResponse> {
    return AdminRepository.getDashboardSummary(user.schoolId, date);
  }

  /**
   * Retrieves full day-wise x period-wise master timetable grid for class & section.
   */
  static async getTimetableGrid(
    user: TokenPayload,
    classId: string,
    sectionId: string
  ): Promise<TimetableGridResponse> {
    if (!classId || !sectionId) {
      const error: any = new Error('class_id and section_id are required');
      error.statusCode = 400;
      throw error;
    }
    return AdminRepository.getTimetableGrid(user.schoolId, classId, sectionId);
  }

  /**
   * Saves / Updates Master Timetable Grid (supports split/combined periods).
   */
  static async saveTimetableGrid(
    user: TokenPayload,
    data: {
      class_id: string;
      section_id: string;
      academic_year_id?: string;
      slots: Array<{
        day_of_week: number;
        period_number: number;
        start_time: string;
        end_time: string;
        subject_id: string;
        teacher_id: string;
        room_number?: string | null;
      }>;
    }
  ): Promise<TimetableGridResponse> {
    if (!data.class_id || !data.section_id) {
      const error: any = new Error('class_id and section_id are required');
      error.statusCode = 400;
      throw error;
    }
    return AdminRepository.saveTimetableGrid(user.schoolId, data);
  }

  /**
   * Computes Master Tabulation Marksheet (Greensheet) for Class & Section.
   */
  static async getGreensheet(
    user: TokenPayload,
    classId: string,
    sectionId: string,
    examId?: string
  ): Promise<GreensheetResponse> {
    if (!classId || !sectionId) {
      const error: any = new Error('class_id and section_id are required');
      error.statusCode = 400;
      throw error;
    }
    return AdminRepository.getGreensheet(user.schoolId, classId, sectionId, examId);
  }
}
