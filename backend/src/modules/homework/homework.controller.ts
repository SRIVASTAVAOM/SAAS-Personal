import { Request, Response } from 'express';
import { z } from 'zod';
import { HomeworkService } from './homework.service';

const createHomeworkSchema = z.object({
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  subjectId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description/instructions are required'),
  assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid dueDate (YYYY-MM-DD) is required'),
  s3AttachmentKey: z.string().optional(),
  attachmentName: z.string().optional(),
});

const completionSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED']),
});

const updateHomeworkSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().min(1, 'Description cannot be empty').optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid dueDate (YYYY-MM-DD) is required').optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid dueDate (YYYY-MM-DD) is required').optional(),
  s3AttachmentKey: z.string().nullable().optional(),
  s3_attachment_key: z.string().nullable().optional(),
  attachmentName: z.string().nullable().optional(),
  attachment_name: z.string().nullable().optional(),
}).transform((data) => ({
  title: data.title,
  description: data.description,
  dueDate: data.dueDate || data.due_date,
  s3AttachmentKey: data.s3AttachmentKey !== undefined ? data.s3AttachmentKey : data.s3_attachment_key,
  attachmentName: data.attachmentName !== undefined ? data.attachmentName : data.attachment_name,
}));

export class HomeworkController {
  static async updateHomework(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = updateHomeworkSchema.parse(req.body);
      const homework = await HomeworkService.updateHomework((req as any).user, id, parsed);
      res.status(200).json({ success: true, data: homework });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to update homework assignment',
      });
    }
  }
  static async createHomework(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createHomeworkSchema.parse(req.body);
      const homework = await HomeworkService.createHomework((req as any).user, parsed);
      res.status(201).json({ success: true, data: homework });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to create homework assignment',
      });
    }
  }

  static async getStudentMyClassHomework(req: Request, res: Response): Promise<void> {
    try {
      const list = await HomeworkService.getStudentMyClassHomework((req as any).user);
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch student homework',
      });
    }
  }

  static async getTeacherMyAssignedHomework(req: Request, res: Response): Promise<void> {
    try {
      const list = await HomeworkService.getTeacherMyAssignedHomework((req as any).user);
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch teacher assigned homework',
      });
    }
  }

  static async getClassSectionHomework(req: Request, res: Response): Promise<void> {
    try {
      const { classId, sectionId } = req.params;
      const list = await HomeworkService.getClassSectionHomework((req as any).user, classId, sectionId);
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch class homework',
      });
    }
  }

  static async getHomeworkDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const homework = await HomeworkService.getHomeworkDetail((req as any).user, id);
      res.status(200).json({ success: true, data: homework });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch homework detail',
      });
    }
  }

  static async setCompletionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = completionSchema.parse(req.body);
      const result = await HomeworkService.setCompletionStatus((req as any).user, id, parsed.status);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to update homework completion status',
      });
    }
  }

  static async getAttachmentDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await HomeworkService.getAttachmentDownloadUrl((req as any).user, id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to generate attachment download URL',
      });
    }
  }
}
