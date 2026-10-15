import { Request, Response } from 'express';
import { z } from 'zod';
import { ScheduleService } from './schedule.service';

const createOnlineClassSchema = z
  .object({
    class_id: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    section_id: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    subject_id: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    title: z.string().min(1, 'Title is required'),
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduled_date must be in YYYY-MM-DD format').optional(),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduledDate must be in YYYY-MM-DD format').optional(),
    start_time: z.string().min(1, 'start_time is required').optional(),
    startTime: z.string().min(1, 'startTime is required').optional(),
    duration_minutes: z.coerce.number().int().positive().optional(),
    durationMinutes: z.coerce.number().int().positive().optional(),
    meeting_url: z.string().url('Meeting URL must be a valid URL').optional(),
    meetingUrl: z.string().url('Meeting URL must be a valid URL').optional(),
  })
  .transform((data) => ({
    class_id: (data.class_id || data.classId)!,
    section_id: (data.section_id || data.sectionId)!,
    subject_id: (data.subject_id || data.subjectId)!,
    title: data.title.trim(),
    scheduled_date: (data.scheduled_date || data.scheduledDate)!,
    start_time: (data.start_time || data.startTime)!.trim(),
    duration_minutes: data.duration_minutes || data.durationMinutes || 40,
    meeting_url: (data.meeting_url || data.meetingUrl)!.trim(),
  }))
  .refine(
    (d) =>
      !!d.class_id &&
      !!d.section_id &&
      !!d.subject_id &&
      !!d.title &&
      !!d.scheduled_date &&
      !!d.start_time &&
      !!d.meeting_url,
    {
      message: 'class_id, section_id, subject_id, title, scheduled_date, start_time, and meeting_url are required',
    }
  )
  .refine((d) => d.meeting_url.startsWith('https://'), {
    message: 'Meeting link must use secure https:// protocol',
  });

export class ScheduleController {
  /**
   * GET /api/v1/schedule/timetable/my-teacher
   */
  static async getTeacherTimetable(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const timetable = await ScheduleService.getTeacherTimetable(user);
      res.status(200).json({
        success: true,
        data: timetable,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch teacher timetable',
      });
    }
  }

  /**
   * GET /api/v1/schedule/substitutions/my-teacher
   */
  static async getTeacherSubstitutions(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const substitutions = await ScheduleService.getTeacherSubstitutions(user);
      res.status(200).json({
        success: true,
        data: substitutions,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch teacher substitutions',
      });
    }
  }

  /**
   * GET /api/v1/schedule/online-classes
   */
  static async getOnlineClasses(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const sessions = await ScheduleService.getOnlineClasses(user);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch online classes',
      });
    }
  }

  /**
   * POST /api/v1/schedule/online-classes
   */
  static async createOnlineClass(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const validated = createOnlineClassSchema.parse(req.body);
      const created = await ScheduleService.createOnlineClass(user, validated);
      res.status(201).json({
        success: true,
        data: created,
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
        error: error.message || 'Failed to create online class session',
      });
    }
  }

  /**
   * DELETE /api/v1/schedule/online-classes/:id
   */
  static async deleteOnlineClass(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      await ScheduleService.deleteOnlineClass(user, id);
      res.status(200).json({
        success: true,
        message: 'Online class session cancelled and removed successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to delete online class session',
      });
    }
  }
}
