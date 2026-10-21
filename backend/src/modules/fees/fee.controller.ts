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

  static async getAdminOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = (req.query.class_id || req.query.classId) as string | undefined;
      const sectionId = (req.query.section_id || req.query.sectionId) as string | undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const data = await FeeService.getAdminOverview(req.user!, { classId, sectionId, status, search });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async collectFee(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipt = await FeeService.collectFee(req.user!, req.body);
      res.status(201).json({
        success: true,
        message: 'Fee payment collected successfully and receipt generated',
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminReceipts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const receipts = await FeeService.getAdminReceipts(req.user!, search);
      res.status(200).json({ success: true, data: receipts });
    } catch (error) {
      next(error);
    }
  }

  static async assignFeeHead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await FeeService.assignFeeHead(req.user!, req.body);
      res.status(201).json({
        success: true,
        message: `Fee assigned successfully to ${count} students`,
        data: { affected_students: count },
      });
    } catch (error) {
      next(error);
    }
  }
}
