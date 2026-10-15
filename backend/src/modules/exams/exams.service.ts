import { pool } from '../../config/db.config';
import { TokenPayload } from '../../types/auth.types';
import {
  ExamsRepository,
  ExamRecord,
  ExamDatesheetRecord,
  StudentMarkRosterItem,
  MarkInputEntry,
  DatesheetSummary,
  ReportCardRecord,
} from './exams.repository';

export class ExamsService {
  /**
   * Helper: Check if coordinator is assigned to the target wing (or class's wing)
   */
  static async verifyCoordinatorWingScope(staffId: string, wingId: string): Promise<void> {
    const { rows } = await pool.query(
      `SELECT 1 FROM staff_assignments WHERE staff_id = $1 AND wing_id = $2 AND assignment_type = 'COORDINATOR';`,
      [staffId, wingId]
    );
    if (rows.length === 0) {
      throw {
        statusCode: 403,
        message: 'Coordinator is not assigned to this wing.',
      };
    }
  }

  /**
   * Helper: Check if teacher is allocated to class, section, and subject
   */
  static async verifyTeacherAllocation(
    staffId: string,
    classId: string,
    subjectId: string,
    sectionId?: string | null
  ): Promise<void> {
    let query = `
      SELECT 1 FROM teacher_subject_allocations
      WHERE staff_id = $1 AND class_id = $2 AND subject_id = $3
    `;
    const params: any[] = [staffId, classId, subjectId];
    if (sectionId) {
      params.push(sectionId);
      query += ` AND section_id = $${params.length}`;
    }
    const { rows } = await pool.query(query, params);
    if (rows.length === 0) {
      throw {
        statusCode: 403,
        message: 'Teacher is not allocated to teach this subject in this class/section.',
      };
    }
  }

  /**
   * Helper: Verify user is class teacher of target class/section OR wing coordinator
   */
  static async verifyClassTeacherOrCoordinator(
    user: TokenPayload,
    classId: string,
    sectionId: string
  ): Promise<void> {
    if (user.roles.includes('COORDINATOR')) {
      const classRes = await pool.query(`SELECT wing_id FROM classes WHERE id = $1;`, [classId]);
      if (classRes.rows.length > 0 && classRes.rows[0].wing_id) {
        await this.verifyCoordinatorWingScope(user.profileId!, classRes.rows[0].wing_id);
        return;
      }
    }

    if (user.roles.includes('TEACHER')) {
      const { rows } = await pool.query(
        `SELECT 1 FROM staff_assignments 
         WHERE staff_id = $1 AND class_id = $2 AND section_id = $3 AND assignment_type = 'CLASS_TEACHER';`,
        [user.profileId, classId, sectionId]
      );
      if (rows.length > 0) return;
    }

    throw {
      statusCode: 403,
      message: 'Only the assigned Class Teacher or Wing Coordinator can perform this action.',
    };
  }

  // 1. Create Exam
  static async createExam(
    user: TokenPayload,
    data: {
      academicYearId: string;
      wingId?: string | null;
      name: string;
      description?: string | null;
      startDate: string;
      endDate: string;
    }
  ): Promise<ExamRecord> {
    if (!user.roles.includes('COORDINATOR') && !user.roles.includes('MANAGEMENT')) {
      throw { statusCode: 403, message: 'Only Coordinators or Management can create examinations.' };
    }

    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw { statusCode: 400, message: 'Exam end date cannot be earlier than start date.' };
    }

    if (user.roles.includes('COORDINATOR') && data.wingId) {
      await this.verifyCoordinatorWingScope(user.profileId!, data.wingId);
    }

    return await ExamsRepository.createExam({
      school_id: user.schoolId,
      academic_year_id: data.academicYearId,
      wing_id: data.wingId,
      name: data.name,
      description: data.description,
      start_date: data.startDate,
      end_date: data.endDate,
      created_by_staff_id: user.profileId,
    });
  }

  // 2. List Exams
  static async getExams(
    user: TokenPayload,
    filters?: { wingId?: string; academicYearId?: string }
  ): Promise<ExamRecord[]> {
    const isStudent = user.roles.includes('STUDENT');
    // Students only see published exams
    return await ExamsRepository.getExams(user.schoolId, {
      ...filters,
      isPublished: isStudent ? true : undefined,
    });
  }

  // 3. Get Exam Details
  static async getExamDetails(user: TokenPayload, examId: string): Promise<ExamRecord> {
    const exam = await ExamsRepository.getExamById(examId, user.schoolId);
    if (!exam) {
      throw { statusCode: 404, message: 'Examination not found.' };
    }
    if (user.roles.includes('STUDENT') && !exam.is_published) {
      throw { statusCode: 403, message: 'Examination details have not been published yet.' };
    }
    return exam;
  }

  // 4. Publish / Unpublish Exam
  static async publishExam(user: TokenPayload, examId: string, isPublished: boolean): Promise<ExamRecord> {
    if (!user.roles.includes('COORDINATOR') && !user.roles.includes('MANAGEMENT')) {
      throw { statusCode: 403, message: 'Only Coordinators or Management can publish examinations.' };
    }
    const exam = await ExamsRepository.getExamById(examId, user.schoolId);
    if (!exam) {
      throw { statusCode: 404, message: 'Examination not found.' };
    }
    if (user.roles.includes('COORDINATOR') && exam.wing_id) {
      await this.verifyCoordinatorWingScope(user.profileId!, exam.wing_id);
    }

    const updated = await ExamsRepository.setExamPublishStatus(examId, user.schoolId, isPublished);
    if (!updated) {
      throw { statusCode: 500, message: 'Failed to update exam publication status.' };
    }
    return updated;
  }

  // 5. Create Exam Datesheet
  static async createDatesheet(
    user: TokenPayload,
    examId: string,
    data: {
      classId: string;
      sectionId?: string | null;
      subjectId: string;
      examDate: string;
      startTime: string;
      endTime: string;
      maxMarks?: number;
      passingMarks?: number;
      invigilatorStaffId?: string | null;
    }
  ): Promise<ExamDatesheetRecord> {
    if (!user.roles.includes('COORDINATOR')) {
      throw { statusCode: 403, message: 'Only Coordinators can schedule exam datesheets.' };
    }

    const exam = await ExamsRepository.getExamById(examId, user.schoolId);
    if (!exam) {
      throw { statusCode: 404, message: 'Examination not found.' };
    }
    if (exam.wing_id) {
      await this.verifyCoordinatorWingScope(user.profileId!, exam.wing_id);
    }

    // Validate times
    if (data.startTime >= data.endTime) {
      throw { statusCode: 400, message: 'Exam end time must be later than start time.' };
    }

    // Validate marks
    const maxMarks = data.maxMarks ?? 100.0;
    if (maxMarks <= 0) {
      throw { statusCode: 400, message: 'Maximum marks must be greater than zero.' };
    }

    // Validate date falls within exam range
    if (data.examDate < exam.start_date || data.examDate > exam.end_date) {
      throw {
        statusCode: 400,
        message: `Exam date (${data.examDate}) must be between exam start date (${exam.start_date}) and end date (${exam.end_date}).`,
      };
    }

    // Check schedule time conflict
    const hasConflict = await ExamsRepository.checkScheduleConflict(
      examId,
      data.classId,
      data.examDate,
      data.startTime,
      data.endTime
    );
    if (hasConflict) {
      throw {
        statusCode: 409,
        message: 'A schedule conflict exists. Another exam is already scheduled for this class at this time.',
      };
    }

    return await ExamsRepository.createDatesheet({
      exam_id: examId,
      class_id: data.classId,
      section_id: data.sectionId,
      subject_id: data.subjectId,
      exam_date: data.examDate,
      start_time: data.startTime,
      end_time: data.endTime,
      max_marks: maxMarks,
      passing_marks: data.passingMarks ?? 33.0,
      invigilator_staff_id: data.invigilatorStaffId,
    });
  }

  // 6. Get Datesheets for an Exam
  static async getDatesheets(
    user: TokenPayload,
    examId: string,
    classId?: string
  ): Promise<ExamDatesheetRecord[]> {
    let targetClassId = classId;

    if (user.roles.includes('STUDENT')) {
      // Must use student's enrolled class
      const stdRes = await pool.query(`SELECT current_class_id FROM student_profiles WHERE id = $1;`, [user.profileId]);
      if (stdRes.rows.length === 0 || !stdRes.rows[0].current_class_id) {
        throw { statusCode: 403, message: 'Student is not enrolled in any class.' };
      }
      targetClassId = stdRes.rows[0].current_class_id;
    }

    return await ExamsRepository.getDatesheets(examId, targetClassId);
  }

  // 7. Get Marks Roster for Teacher/Coordinator
  static async getMarksRoster(
    user: TokenPayload,
    datesheetId: string,
    sectionId?: string | null
  ): Promise<{ datesheet: ExamDatesheetRecord; roster: StudentMarkRosterItem[] }> {
    const datesheet = await ExamsRepository.getDatesheetById(datesheetId);
    if (!datesheet) {
      throw { statusCode: 404, message: 'Exam datesheet not found.' };
    }

    if (user.roles.includes('TEACHER')) {
      // Verify teacher allocation
      await this.verifyTeacherAllocation(user.profileId!, datesheet.class_id, datesheet.subject_id, sectionId);
    } else if (user.roles.includes('COORDINATOR')) {
      if (datesheet.wing_id) {
        await this.verifyCoordinatorWingScope(user.profileId!, datesheet.wing_id);
      }
    } else {
      throw { statusCode: 403, message: 'Access denied.' };
    }

    const roster = await ExamsRepository.getMarksRoster(datesheetId, datesheet.class_id, sectionId);
    const lockStatus = await ExamsRepository.isDatesheetMarksLocked(datesheetId);
    datesheet.is_locked = lockStatus.locked;
    return { datesheet, roster };
  }

  // 8. Save / Submit Marks (Teacher / Coordinator)
  static async saveMarks(
    user: TokenPayload,
    datesheetId: string,
    data: {
      submitForVerification?: boolean;
      entries: MarkInputEntry[];
    }
  ): Promise<void> {
    const datesheet = await ExamsRepository.getDatesheetById(datesheetId);
    if (!datesheet) {
      throw { statusCode: 404, message: 'Exam datesheet not found.' };
    }

    // Check if marks entry is locked (already verified or exam/report card published/approved)
    const lockStatus = await ExamsRepository.isDatesheetMarksLocked(datesheetId);
    if (lockStatus.locked) {
      throw {
        statusCode: 403,
        message: lockStatus.reason || 'Marks are locked after verification or publication.',
      };
    }

    if (user.roles.includes('TEACHER')) {
      await this.verifyTeacherAllocation(user.profileId!, datesheet.class_id, datesheet.subject_id);
    } else if (user.roles.includes('COORDINATOR')) {
      if (datesheet.wing_id) {
        await this.verifyCoordinatorWingScope(user.profileId!, datesheet.wing_id);
      }
    } else {
      throw { statusCode: 403, message: 'Access denied.' };
    }

    // Validate entries
    const maxMarks = parseFloat(datesheet.max_marks as any);
    for (const entry of data.entries) {
      if (entry.is_absent) {
        if (entry.marks_obtained !== null && entry.marks_obtained !== undefined) {
          throw {
            statusCode: 400,
            message: `Student marked absent cannot have numeric marks entered. (Student ID: ${entry.student_id})`,
          };
        }
      } else {
        if (entry.marks_obtained !== null && entry.marks_obtained !== undefined) {
          if (entry.marks_obtained < 0 || entry.marks_obtained > maxMarks) {
            throw {
              statusCode: 400,
              message: `Marks obtained (${entry.marks_obtained}) must be between 0 and maximum marks (${maxMarks}).`,
            };
          }
        }
      }
    }

    await ExamsRepository.upsertMarksWithAudit(
      datesheetId,
      data.entries,
      user.profileId!,
      Boolean(data.submitForVerification)
    );
  }

  // Alias submitMarks to saveMarks for service consumers
  static async submitMarks(
    user: TokenPayload,
    datesheetId: string,
    data: {
      submitForVerification?: boolean;
      entries: MarkInputEntry[];
    }
  ): Promise<void> {
    return this.saveMarks(user, datesheetId, data);
  }

  // 9. Verify Datesheet Marks (Coordinator)
  static async verifyDatesheetMarks(user: TokenPayload, datesheetId: string): Promise<{ verifiedCount: number }> {
    if (!user.roles.includes('COORDINATOR')) {
      throw { statusCode: 403, message: 'Only Coordinators can verify exam marks.' };
    }

    const datesheet = await ExamsRepository.getDatesheetById(datesheetId);
    if (!datesheet) {
      throw { statusCode: 404, message: 'Exam datesheet not found.' };
    }
    if (datesheet.wing_id) {
      await this.verifyCoordinatorWingScope(user.profileId!, datesheet.wing_id);
    }

    const count = await ExamsRepository.verifyDatesheetMarks(datesheetId, user.profileId!);
    return { verifiedCount: count };
  }

  // 10. Get Datesheet Summary
  static async getDatesheetSummary(user: TokenPayload, datesheetId: string): Promise<DatesheetSummary> {
    const summary = await ExamsRepository.getDatesheetSummary(datesheetId);
    if (!summary) {
      throw { statusCode: 404, message: 'Datesheet summary not found.' };
    }
    return summary;
  }

  // 11. Generate Class Report Cards (Class Teacher or Coordinator)
  static async generateReportCards(
    user: TokenPayload,
    examId: string,
    classId: string,
    sectionId: string,
    remarks?: string
  ): Promise<ReportCardRecord[]> {
    await this.verifyClassTeacherOrCoordinator(user, classId, sectionId);

    const exam = await ExamsRepository.getExamById(examId, user.schoolId);
    if (!exam) {
      throw { statusCode: 404, message: 'Examination not found.' };
    }

    return await ExamsRepository.generateReportCards(examId, classId, sectionId, user.profileId!, remarks);
  }

  // 12. Get Class Report Cards
  static async getClassReportCards(
    user: TokenPayload,
    examId: string,
    classId: string,
    sectionId: string
  ): Promise<ReportCardRecord[]> {
    await this.verifyClassTeacherOrCoordinator(user, classId, sectionId);
    return await ExamsRepository.getClassReportCards(examId, classId, sectionId);
  }

  // 13. Approve Report Cards (Coordinator)
  static async approveReportCards(
    user: TokenPayload,
    examId: string,
    classId: string,
    sectionId: string
  ): Promise<{ approvedCount: number }> {
    if (!user.roles.includes('COORDINATOR')) {
      throw { statusCode: 403, message: 'Only Coordinators can approve report cards.' };
    }

    const classRes = await pool.query(`SELECT wing_id FROM classes WHERE id = $1;`, [classId]);
    if (classRes.rows.length > 0 && classRes.rows[0].wing_id) {
      await this.verifyCoordinatorWingScope(user.profileId!, classRes.rows[0].wing_id);
    }

    const count = await ExamsRepository.approveClassReportCards(examId, classId, sectionId, user.profileId!);
    return { approvedCount: count };
  }

  // 14. Student View Own Result
  static async getStudentResult(
    user: TokenPayload,
    examId: string
  ): Promise<{
    exam: ExamRecord;
    reportCard: ReportCardRecord;
    subjectMarks: any[];
  }> {
    if (!user.roles.includes('STUDENT')) {
      throw { statusCode: 403, message: 'Only students can access this student result endpoint.' };
    }

    const exam = await ExamsRepository.getExamById(examId, user.schoolId);
    if (!exam) {
      throw { statusCode: 404, message: 'Examination not found.' };
    }

    if (!exam.is_published) {
      throw { statusCode: 403, message: 'Examination results have not been published yet.' };
    }

    const result = await ExamsRepository.getStudentResult(examId, user.profileId!);
    if (!result.reportCard || result.reportCard.status !== 'APPROVED') {
      throw {
        statusCode: 403,
        message: 'Your report card has not been approved and published yet.',
      };
    }

    return {
      exam,
      reportCard: result.reportCard,
      subjectMarks: result.subjectMarks,
    };
  }
}
