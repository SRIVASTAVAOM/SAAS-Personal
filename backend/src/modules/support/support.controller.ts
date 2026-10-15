import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth.types';
import { SupportService } from './support.service';

export class SupportController {
  static async getStudentComplaints(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaints = await SupportService.getStudentComplaints(req.user!);
      res.status(200).json({ success: true, data: complaints });
    } catch (error) {
      next(error);
    }
  }

  static async submitComplaint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, category, description } = req.body;
      const complaint = await SupportService.submitComplaint(req.user!, { title, category, description });
      res.status(201).json({ success: true, message: 'Complaint submitted successfully.', data: complaint });
    } catch (error: any) {
      if (['INVALID_CATEGORY', 'TITLE_REQUIRED', 'DESCRIPTION_REQUIRED'].includes(error.message)) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  static async getStudentFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const feedback = await SupportService.getStudentFeedback(req.user!);
      res.status(200).json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  }

  static async submitFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, rating, feedback_text } = req.body;
      const feedback = await SupportService.submitFeedback(req.user!, { category, rating, feedback_text });
      res.status(201).json({ success: true, message: 'Feedback submitted successfully.', data: feedback });
    } catch (error: any) {
      if (['INVALID_CATEGORY', 'INVALID_RATING', 'FEEDBACK_TEXT_REQUIRED'].includes(error.message)) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}
