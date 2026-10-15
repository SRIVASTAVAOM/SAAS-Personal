import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/auth.types';
import { ExamsService } from './exams.service';

export class ExamsController {
  // 1. Create Exam
  static async createExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { academicYearId, wingId, name, description, startDate, endDate } = req.body;
      if (!academicYearId || !name || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Academic year ID, name, start date, and end date are required.' },
        });
        return;
      }

      const exam = await ExamsService.createExam(req.user!, {
        academicYearId,
        wingId,
        name,
        description,
        startDate,
        endDate,
      });

      res.status(201).json({
        success: true,
        message: 'Examination created successfully.',
        data: exam,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'EXAM_CREATION_FAILED', message: error.message || 'Failed to create examination.' },
      });
    }
  }

  // 2. List Exams
  static async listExams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { wingId, academicYearId } = req.query;
      const exams = await ExamsService.getExams(req.user!, {
        wingId: wingId as string,
        academicYearId: academicYearId as string,
      });

      res.status(200).json({
        success: true,
        data: exams,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'FETCH_EXAMS_FAILED', message: error.message || 'Failed to fetch examinations.' },
      });
    }
  }

  // 3. Get Exam Details
  static async getExamDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exam = await ExamsService.getExamDetails(req.user!, id);

      res.status(200).json({
        success: true,
        data: exam,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'FETCH_EXAM_DETAILS_FAILED', message: error.message || 'Failed to fetch exam details.' },
      });
    }
  }

  // 4. Publish / Unpublish Exam
  static async publishExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;
      if (typeof isPublished !== 'boolean') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'isPublished boolean is required.' },
        });
        return;
      }

      const exam = await ExamsService.publishExam(req.user!, id, isPublished);
      res.status(200).json({
        success: true,
        message: isPublished ? 'Examination published successfully.' : 'Examination unpublished successfully.',
        data: exam,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'EXAM_PUBLISH_FAILED', message: error.message || 'Failed to update publication status.' },
      });
    }
  }

  // 5. Create Exam Datesheet
  static async createDatesheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: examId } = req.params;
      const { classId, sectionId, subjectId, examDate, startTime, endTime, maxMarks, passingMarks, invigilatorStaffId } =
        req.body;

      if (!classId || !subjectId || !examDate || !startTime || !endTime) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Class ID, subject ID, exam date, start time, and end time are required.',
          },
        });
        return;
      }

      const datesheet = await ExamsService.createDatesheet(req.user!, examId, {
        classId,
        sectionId,
        subjectId,
        examDate,
        startTime,
        endTime,
        maxMarks: maxMarks !== undefined ? parseFloat(maxMarks) : undefined,
        passingMarks: passingMarks !== undefined ? parseFloat(passingMarks) : undefined,
        invigilatorStaffId,
      });

      res.status(201).json({
        success: true,
        message: 'Exam datesheet scheduled successfully.',
        data: datesheet,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'DATESHEET_CREATION_FAILED', message: error.message || 'Failed to create exam datesheet.' },
      });
    }
  }

  // 6. Get Exam Datesheets
  static async getDatesheets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: examId } = req.params;
      const { classId } = req.query;

      const datesheets = await ExamsService.getDatesheets(req.user!, examId, classId as string);
      res.status(200).json({
        success: true,
        data: datesheets,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'FETCH_DATESHEETS_FAILED', message: error.message || 'Failed to fetch datesheets.' },
      });
    }
  }

  // 7. Get Marks Roster for Datesheet
  static async getMarksRoster(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { datesheetId } = req.params;
      const { sectionId } = req.query;

      const result = await ExamsService.getMarksRoster(req.user!, datesheetId, sectionId as string);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'FETCH_MARKS_ROSTER_FAILED', message: error.message || 'Failed to fetch marks roster.' },
      });
    }
  }

  // 8. Save Marks (Teacher / Coordinator)
  static async saveMarks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { datesheetId } = req.params;
      const { submitForVerification, entries } = req.body;

      if (!Array.isArray(entries) || entries.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'A non-empty entries array is required.' },
        });
        return;
      }

      const normalizedEntries = entries.map((e: any) => ({
        student_id: e.student_id || e.studentId,
        marks_obtained:
          e.marks_obtained !== undefined
            ? (e.marks_obtained !== null ? parseFloat(e.marks_obtained) : null)
            : (e.marksObtained !== undefined
                ? (e.marksObtained !== null ? parseFloat(e.marksObtained) : null)
                : null),
        is_absent: Boolean(e.is_absent ?? e.isAbsent ?? false),
        remarks: e.remarks || null,
        change_reason: e.change_reason || e.changeReason || null,
      }));

      await ExamsService.saveMarks(req.user!, datesheetId, {
        submitForVerification: Boolean(submitForVerification),
        entries: normalizedEntries,
      });

      res.status(200).json({
        success: true,
        message: submitForVerification
          ? 'Marks submitted for coordinator verification.'
          : 'Marks saved as draft successfully.',
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'SAVE_MARKS_FAILED', message: error.message || 'Failed to save marks.' },
      });
    }
  }

  // 9. Get Datesheet Summary
  static async getDatesheetSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { datesheetId } = req.params;
      const summary = await ExamsService.getDatesheetSummary(req.user!, datesheetId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'FETCH_SUMMARY_FAILED', message: error.message || 'Failed to fetch summary.' },
      });
    }
  }

  // 10. Verify Marks (Coordinator)
  static async verifyMarks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { datesheetId } = req.params;
      const result = await ExamsService.verifyDatesheetMarks(req.user!, datesheetId);

      res.status(200).json({
        success: true,
        message: 'Marks verified successfully.',
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'VERIFY_MARKS_FAILED', message: error.message || 'Failed to verify marks.' },
      });
    }
  }

  // 11. Generate Class Report Cards
  static async generateReportCards(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: examId, classId, sectionId } = req.params;
      const { remarks } = req.body;

      const reportCards = await ExamsService.generateReportCards(req.user!, examId, classId, sectionId, remarks);
      res.status(200).json({
        success: true,
        message: `Report cards generated for ${reportCards.length} students.`,
        data: reportCards,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'GENERATE_REPORT_CARDS_FAILED', message: error.message || 'Failed to generate report cards.' },
      });
    }
  }

  // 12. Get Class Report Cards
  static async getClassReportCards(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: examId, classId, sectionId } = req.params;
      const reportCards = await ExamsService.getClassReportCards(req.user!, examId, classId, sectionId);

      res.status(200).json({
        success: true,
        data: reportCards,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'FETCH_REPORT_CARDS_FAILED', message: error.message || 'Failed to fetch report cards.' },
      });
    }
  }

  // 13. Approve Class Report Cards (Coordinator)
  static async approveReportCards(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: examId, classId, sectionId } = req.params;
      const result = await ExamsService.approveReportCards(req.user!, examId, classId, sectionId);

      res.status(200).json({
        success: true,
        message: `Report cards approved for ${result.approvedCount} students.`,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'APPROVE_REPORT_CARDS_FAILED', message: error.message || 'Failed to approve report cards.' },
      });
    }
  }

  // 14. Student View Own Result
  static async getMyResult(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: examId } = req.params;
      const result = await ExamsService.getStudentResult(req.user!, examId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'FETCH_RESULT_FAILED', message: error.message || 'Failed to fetch exam result.' },
      });
    }
  }
}
