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

  static async getTeachers(user: TokenPayload): Promise<any[]> {
    return AdminRepository.getTeachers(user.schoolId);
  }

  static async getTeacherTimetable(user: TokenPayload, teacherId: string): Promise<any[]> {
    return AdminRepository.getTeacherTimetable(user.schoolId, teacherId);
  }

  static async getSubstitutions(user: TokenPayload, date?: string): Promise<any[]> {
    return AdminRepository.getSubstitutions(user.schoolId, date);
  }

  static async assignSubstitution(
    user: TokenPayload,
    data: {
      timetable_slot_id: string;
      substitution_date: string;
      original_teacher_id: string;
      substitute_teacher_id: string;
      remarks?: string;
    }
  ): Promise<any> {
    if (!data.timetable_slot_id || !data.substitution_date || !data.original_teacher_id || !data.substitute_teacher_id) {
      const error: any = new Error('All substitution fields are required');
      error.statusCode = 400;
      throw error;
    }
    return AdminRepository.assignSubstitution(user.schoolId, data);
  }

  static async deleteSubstitution(user: TokenPayload, id: string): Promise<boolean> {
    return AdminRepository.deleteSubstitution(user.schoolId, id);
  }

  static async getStudentsList(
    user: TokenPayload,
    filters: { classId?: string; sectionId?: string; classIds?: string[]; sectionIds?: string[]; search?: string }
  ): Promise<any[]> {
    return AdminRepository.getStudentsList(user.schoolId, filters);
  }

  static async getStudentDetails(user: TokenPayload, studentId: string): Promise<any> {
    const student = await AdminRepository.getStudentDetails(user.schoolId, studentId);
    if (!student) {
      const error: any = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }
    return student;
  }

  static async updateStudent(user: TokenPayload, studentId: string, updates: any): Promise<any> {
    const updated = await AdminRepository.updateStudent(user.schoolId, studentId, updates);
    if (!updated) {
      const error: any = new Error('Student not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  // Staff Management
  static async getAllStaff(user: TokenPayload, search?: string, isActive?: boolean): Promise<any[]> {
    return AdminRepository.getAllStaff(user.schoolId, search, isActive);
  }

  static async createStaff(user: TokenPayload, data: any): Promise<any> {
    if (!data.first_name || !data.employee_code || !data.identifier) {
      const error: any = new Error('First name, Employee Code, and Username (identifier) are required');
      error.statusCode = 400;
      throw error;
    }
    return AdminRepository.createStaff(user.schoolId, data);
  }

  static async updateStaff(user: TokenPayload, staffId: string, data: any): Promise<any> {
    return AdminRepository.updateStaff(user.schoolId, staffId, data);
  }

  static async deleteStaff(user: TokenPayload, staffId: string): Promise<any> {
    return AdminRepository.deleteStaff(user.schoolId, staffId);
  }

  // Homework Management (View, Upload/Assign, Edit, Delete)
  static async getAdminHomework(
    user: TokenPayload,
    filters: { classId?: string; sectionId?: string; subjectId?: string; search?: string }
  ): Promise<any[]> {
    return AdminRepository.getAdminHomework(user.schoolId, filters);
  }

  static async createAdminHomework(user: TokenPayload, data: any): Promise<any> {
    if (!data.class_id || !data.section_id || !data.subject_id || !data.title || !data.due_date) {
      const error: any = new Error('Class, Section, Subject, Title, and Due Date are required');
      error.statusCode = 400;
      throw error;
    }
    return AdminRepository.createAdminHomework(
      user.schoolId,
      {
        classId: data.class_id,
        sectionId: data.section_id,
        subjectId: data.subject_id,
        staffId: data.staff_id,
        title: data.title,
        description: data.description || '',
        assignedDate: data.assigned_date,
        dueDate: data.due_date,
        attachmentName: data.attachment_name,
        s3AttachmentKey: data.s3_attachment_key,
      },
      user.userId
    );
  }

  static async updateAdminHomework(user: TokenPayload, homeworkId: string, data: any): Promise<any> {
    const updated = await AdminRepository.updateAdminHomework(user.schoolId, homeworkId, {
      classId: data.class_id,
      sectionId: data.section_id,
      subjectId: data.subject_id,
      staffId: data.staff_id,
      title: data.title,
      description: data.description,
      assignedDate: data.assigned_date,
      dueDate: data.due_date,
      attachmentName: data.attachment_name,
      s3AttachmentKey: data.s3_attachment_key,
    });
    if (!updated) {
      const error: any = new Error('Homework record not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  static async deleteAdminHomework(user: TokenPayload, homeworkId: string): Promise<boolean> {
    const deleted = await AdminRepository.deleteAdminHomework(user.schoolId, homeworkId);
    if (!deleted) {
      const error: any = new Error('Homework record not found or cannot be deleted');
      error.statusCode = 404;
      throw error;
    }
    return deleted;
  }

  // Feedback & Complaints
  static async getAdminFeedback(user: TokenPayload): Promise<{ feedback: any[]; complaints: any[] }> {
    return AdminRepository.getAdminFeedback(user.schoolId);
  }

  static async updateComplaintStatus(
    user: TokenPayload,
    complaintId: string,
    data: { status: string; resolution_notes?: string }
  ): Promise<any> {
    if (!data.status) {
      const error: any = new Error('Status is required');
      error.statusCode = 400;
      throw error;
    }
    return AdminRepository.updateComplaintStatus(user.schoolId, complaintId, data);
  }
}

