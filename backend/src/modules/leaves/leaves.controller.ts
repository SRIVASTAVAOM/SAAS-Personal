import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../types/auth.types';
import { LeavesService } from './leaves.service';

const createStaffLeaveSchema = z.object({
  leaveType: z.enum(['SICK', 'CASUAL', 'EARNED']).optional(),
  leave_type: z.enum(['SICK', 'CASUAL', 'EARNED']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  reason: z.string().min(3, 'Reason must be at least 3 characters long'),
  documentUrl: z.string().nullable().optional(),
  document_url: z.string().nullable().optional(),
  attachmentName: z.string().nullable().optional(),
  attachment_name: z.string().nullable().optional(),
}).transform((data) => ({
  leaveType: (data.leaveType || data.leave_type)!,
  startDate: (data.startDate || data.start_date)!,
  endDate: (data.endDate || data.end_date)!,
  reason: data.reason,
  documentUrl: data.documentUrl !== undefined ? data.documentUrl : (data.document_url !== undefined ? data.document_url : null),
  attachmentName: data.attachmentName !== undefined ? data.attachmentName : (data.attachment_name !== undefined ? data.attachment_name : null),
})).refine((d) => !!d.leaveType && !!d.startDate && !!d.endDate, {
  message: 'leaveType, startDate, and endDate are required',
});

const recommendStaffLeaveSchema = z.object({
  recommendation: z.string().min(3, 'Recommendation notes must be at least 3 characters long').optional(),
  note: z.string().min(3, 'Recommendation notes must be at least 3 characters long').optional(),
}).transform((data) => ({
  recommendation: (data.recommendation || data.note)!,
})).refine((d) => !!d.recommendation, {
  message: 'Recommendation notes must be at least 3 characters long',
});

const sanctionStaffLeaveSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
  note: z.string().optional(),
  rejection_reason: z.string().optional(),
}).transform((data) => ({
  decision: data.decision,
  comment: data.comment || data.note || data.rejection_reason,
}));

const createStudentLeaveSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  reason: z.string().min(3, 'Reason must be at least 3 characters long'),
  documentUrl: z.string().nullable().optional(),
  document_url: z.string().nullable().optional(),
  attachmentName: z.string().nullable().optional(),
  attachment_name: z.string().nullable().optional(),
}).transform((data) => ({
  startDate: (data.startDate || data.start_date)!,
  endDate: (data.endDate || data.end_date)!,
  reason: data.reason,
  documentUrl: data.documentUrl !== undefined ? data.documentUrl : (data.document_url !== undefined ? data.document_url : null),
  attachmentName: data.attachmentName !== undefined ? data.attachmentName : (data.attachment_name !== undefined ? data.attachment_name : null),
})).refine((d) => !!d.startDate && !!d.endDate, {
  message: 'startDate and endDate are required',
});

const updateStudentLeaveStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
  comment: z.string().optional(),
  note: z.string().optional(),
}).transform((data) => ({
  status: data.status,
  remarks: data.remarks || data.comment || data.note || null,
}));

export class LeavesController {

  static async createStaffLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = createStaffLeaveSchema.parse(req.body);
      const leave = await LeavesService.createStaffLeave(
        req.user!,
        parsed.leaveType,
        parsed.startDate,
        parsed.endDate,
        parsed.reason,
        parsed.documentUrl,
        parsed.attachmentName
      );
      res.status(201).json({ success: true, data: leave });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      if (err.message === 'INVALID_DATE_RANGE') {
        res.status(400).json({ success: false, error: 'End date cannot be earlier than start date.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getStaffMyLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const leaves = await LeavesService.getStaffMyLeaves(req.user!);
      res.status(200).json({ success: true, data: leaves });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getStaffWingLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const leaves = await LeavesService.getStaffWingLeaves(req.user!);
      res.status(200).json({ success: true, data: leaves });
    } catch (err: any) {
      if (err.message === 'WING_NOT_ASSIGNED') {
        res.status(400).json({ success: false, error: 'Coordinator has no assigned wing.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getAllStaffLeavesForManagement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const leaves = await LeavesService.getAllStaffLeavesForManagement(req.user!);
      res.status(200).json({ success: true, data: leaves });
    } catch (err: any) {
      if (err.message === 'FORBIDDEN_ROLE') {
        res.status(403).json({ success: false, error: 'Only Management can view the all leaves approval queue.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async recommendStaffLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = recommendStaffLeaveSchema.parse(req.body);

      const updated = await LeavesService.recommendStaffLeave(
        req.user!,
        id,
        parsed.recommendation
      );

      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      if (err.message === 'FORBIDDEN_SCOPE') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You can only recommend leaves for staff in your assigned wing.',
        });
        return;
      }
      if (err.message === 'INVALID_STATE_TRANSITION') {
        res.status(400).json({
          success: false,
          error: 'Cannot recommend an already sanctioned (APPROVED/REJECTED) leave.',
        });
        return;
      }
      if (err.message === 'LEAVE_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Leave application not found.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async sanctionStaffLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = sanctionStaffLeaveSchema.parse(req.body);

      const updated = await LeavesService.sanctionStaffLeave(
        req.user!,
        id,
        parsed.decision,
        parsed.comment || null
      );

      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      if (err.message === 'FORBIDDEN_ROLE') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only Management can execute final leave approval or rejection.',
        });
        return;
      }
      if (err.message === 'INVALID_STATE_TRANSITION') {
        res.status(400).json({
          success: false,
          error: 'Cannot alter decision for an already sanctioned leave.',
        });
        return;
      }
      if (err.message === 'LEAVE_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Leave application not found.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async createStudentLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = createStudentLeaveSchema.parse(req.body);
      const leave = await LeavesService.createStudentLeave(
        req.user!,
        parsed.startDate,
        parsed.endDate,
        parsed.reason,
        parsed.documentUrl,
        parsed.attachmentName
      );
      res.status(201).json({ success: true, data: leave });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      if (err.message === 'INVALID_DATE_RANGE') {
        res.status(400).json({ success: false, error: 'End date cannot be earlier than start date.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getStudentMyLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const leaves = await LeavesService.getStudentMyLeaves(req.user!);
      res.status(200).json({ success: true, data: leaves });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getPendingStudentLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { classId, sectionId } = req.query as { classId?: string; sectionId?: string };
      const leaves = await LeavesService.getPendingStudentLeaves(req.user!, classId, sectionId);
      res.status(200).json({ success: true, data: leaves });
    } catch (err: any) {
      if (err.message === 'NOT_CLASS_TEACHER') {
        res.status(403).json({ success: false, error: 'Forbidden: You are not assigned as a Class Teacher.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getClassStudentLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { classId, sectionId } = req.query as { classId?: string; sectionId?: string };
      const leaves = await LeavesService.getClassStudentLeaves(req.user!, classId, sectionId);
      res.status(200).json({ success: true, data: leaves });
    } catch (err: any) {
      if (err.message === 'NOT_CLASS_TEACHER') {
        res.status(403).json({ success: false, error: 'Forbidden: You are not assigned as a Class Teacher.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async updateStudentLeaveStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = updateStudentLeaveStatusSchema.parse(req.body);
      const updated = await LeavesService.updateStudentLeaveStatus(
        req.user!,
        id,
        parsed.status,
        parsed.remarks
      );
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      if (err.message === 'NOT_CLASS_TEACHER') {
        res.status(403).json({ success: false, error: 'Forbidden: You are not assigned as a Class Teacher.' });
        return;
      }
      if (err.message === 'FORBIDDEN_SCOPE') {
        res.status(403).json({ success: false, error: 'Forbidden: You can only approve leaves for your assigned class and section.' });
        return;
      }
      if (err.message === 'INVALID_STATE_TRANSITION') {
        res.status(400).json({ success: false, error: 'Leave application is already finalized (APPROVED/REJECTED).' });
        return;
      }
      if (err.message === 'LEAVE_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Student leave application not found.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }
}

