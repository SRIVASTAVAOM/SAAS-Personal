import { Request, Response } from 'express';
import { z } from 'zod';
import { CurriculumService } from './curriculum.service';

const createUnitSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicYearId: z.string().uuid().optional(),
  unitNumber: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

const createTopicSchema = z.object({
  unitId: z.string().uuid(),
  topicNumber: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  learningObjectives: z.string().optional(),
});

export class CurriculumController {
  static async getCurriculum(req: Request, res: Response): Promise<void> {
    try {
      const { classId, subjectId, academicYearId } = req.query;
      if (!classId || !subjectId) {
        res.status(400).json({ success: false, error: 'classId and subjectId query parameters are required.' });
        return;
      }

      const units = await CurriculumService.getCurriculum(
        (req as any).user,
        classId as string,
        subjectId as string,
        academicYearId as string | undefined
      );

      res.status(200).json({ success: true, data: units });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch curriculum',
      });
    }
  }

  static async createUnit(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createUnitSchema.parse(req.body);
      const unit = await CurriculumService.createUnit((req as any).user, parsed);
      res.status(201).json({ success: true, data: unit });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to create curriculum unit',
      });
    }
  }

  static async createTopic(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createTopicSchema.parse(req.body);
      const topic = await CurriculumService.createTopic((req as any).user, parsed);
      res.status(201).json({ success: true, data: topic });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to create curriculum topic',
      });
    }
  }
}
