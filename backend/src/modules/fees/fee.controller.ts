import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth.types';
import { FeeService } from './fee.service';

export class FeeController {
  static async getStudentFees(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await FeeService.getStudentFees(req.user!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentReceipts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipts = await FeeService.getStudentReceipts(req.user!);
      res.status(200).json({ success: true, data: receipts });
    } catch (error) {
      next(error);
    }
  }
}
