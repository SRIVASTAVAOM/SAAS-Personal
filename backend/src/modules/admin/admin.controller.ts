import { Request, Response } from 'express';
import { z } from 'zod';
import { AdminService } from './admin.service';

const saveGridSlotItemSchema = z.object({
  day_of_week: z.coerce.number().int().min(1).max(6).optional(),
  dayOfWeek: z.coerce.number().int().min(1).max(6).optional(),
  period_number: z.coerce.number().int().min(1).max(8).optional(),
  periodNumber: z.coerce.number().int().min(1).max(8).optional(),
  start_time: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  end_time: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  subject_id: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  room_number: z.string().nullable().optional(),
  roomNumber: z.string().nullable().optional(),
}).transform((data) => ({
  day_of_week: (data.day_of_week || data.dayOfWeek)!,
  period_number: (data.period_number || data.periodNumber)!,
  start_time: (data.start_time || data.startTime)!,
  end_time: (data.end_time || data.endTime)!,
  subject_id: (data.subject_id || data.subjectId)!,
  teacher_id: (data.teacher_id || data.teacherId)!,
  room_number: data.room_number ?? data.roomNumber ?? null,
})).refine(
  (d) =>
    d.day_of_week !== undefined &&
    d.period_number !== undefined &&
    !!d.start_time &&
    !!d.end_time &&
    !!d.subject_id &&
    !!d.teacher_id,
  {
    message: 'day_of_week, period_number, start_time, end_time, subject_id, and teacher_id are required for each slot',
  }
);

const saveTimetableGridSchema = z.object({
  class_id: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  section_id: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  slots: z.array(saveGridSlotItemSchema),
}).transform((data) => ({
  class_id: (data.class_id || data.classId)!,
  section_id: (data.section_id || data.sectionId)!,
  academic_year_id: data.academic_year_id || data.academicYearId,
  slots: data.slots,
})).refine((d) => !!d.class_id && !!d.section_id, {
  message: 'class_id and section_id are required',
});

export class AdminController {
  /**
   * GET /api/v1/admin/dashboard/summary
   */
  static async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { date } = req.query;
      const summary = await AdminService.getDashboardSummary(
        user,
        typeof date === 'string' ? date : undefined
      );
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch admin dashboard summary',
      });
    }
  }

  /**
   * GET /api/v1/admin/timetable/grid
   */
  static async getTimetableGrid(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = (req.query.class_id || req.query.classId) as string;
      const sectionId = (req.query.section_id || req.query.sectionId) as string;

      if (!classId || !sectionId) {
        res.status(400).json({
          success: false,
          error: 'class_id and section_id query parameters are required',
        });
        return;
      }

      const grid = await AdminService.getTimetableGrid(user, classId, sectionId);
      res.status(200).json({
        success: true,
        data: grid,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch timetable grid',
      });
    }
  }

  /**
   * POST /api/v1/admin/timetable/grid
   */
  static async saveTimetableGrid(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const validated = saveTimetableGridSchema.parse(req.body);
      const updatedGrid = await AdminService.saveTimetableGrid(user, validated);
      res.status(200).json({
        success: true,
        data: updatedGrid,
        message: 'Master timetable grid updated successfully',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => e.message),
        });
        return;
      }
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to update timetable grid',
      });
    }
  }

  /**
   * GET /api/v1/admin/reports/greensheet
   */
  static async getGreensheet(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const classId = (req.query.class_id || req.query.classId) as string;
      const sectionId = (req.query.section_id || req.query.sectionId) as string;
      const examId = (req.query.exam_id || req.query.examId) as string | undefined;

      if (!classId || !sectionId) {
        res.status(400).json({
          success: false,
          error: 'class_id and section_id query parameters are required',
        });
        return;
      }

      const greensheet = await AdminService.getGreensheet(user, classId, sectionId, examId);
      res.status(200).json({
        success: true,
        data: greensheet,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to generate greensheet tabulation',
      });
    }
  }
}
