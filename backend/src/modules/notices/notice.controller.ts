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
}
