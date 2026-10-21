import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth.types';
import { AcademicsService } from './academics.service';

export class AcademicsController {
  static async getClassesAndSections(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const classes = await AcademicsService.getClassesAndSections(req.user!.schoolId);
      res.status(200).json({ success: true, data: classes });
    } catch (error) {
      next(error);
    }
  }

  static async getSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjects = await AcademicsService.getSubjects(req.user!.schoolId);
      res.status(200).json({ success: true, data: subjects });
    } catch (error) {
      next(error);
    }
  }

  static async getClassRoster(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId, sectionId } = req.params;
      const roster = await AcademicsService.getClassRoster(req.user!, classId, sectionId);
      res.status(200).json({ success: true, data: roster });
    } catch (error: any) {
      if (error.message === 'FORBIDDEN_SCOPE') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You do not have permission to view rosters outside your assigned scope.',
        });
        return;
      }
      next(error);
    }
  }

  static async getMyRoster(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roster = await AcademicsService.getMyTeacherRoster(req.user!);
      res.status(200).json({ success: true, data: roster });
    } catch (error) {
      next(error);
    }
  }

  static async getMyAllocations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AcademicsService.getTeacherAllocations(req.user!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getSubjectTeachers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const teachers = await AcademicsService.getStudentSubjectTeachers(req.user!);
      res.status(200).json({ success: true, data: teachers });
    } catch (error) {
      next(error);
    }
  }

  static async getClassmatesBirthdays(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const birthdays = await AcademicsService.getClassmatesBirthdays(req.user!);
      res.status(200).json({ success: true, data: birthdays });
    } catch (error) {
      next(error);
    }
  }
}

