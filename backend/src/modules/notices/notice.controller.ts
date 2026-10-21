import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth.types';
import { NoticeService } from './notice.service';

export class NoticeController {
  static async getStudentNotices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notices = await NoticeService.getStudentNotices(req.user!);
      res.status(200).json({ success: true, data: notices });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminNotices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notices = await NoticeService.getAdminNotices(req.user!);
      res.status(200).json({ success: true, data: notices });
    } catch (error) {
      next(error);
    }
  }

  static async createNotice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notice = await NoticeService.createNotice(req.user!, req.body);
      res.status(201).json({ success: true, message: 'Notice published successfully', data: notice });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await NoticeService.deleteNotice(req.user!, id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Notice not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Notice deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
