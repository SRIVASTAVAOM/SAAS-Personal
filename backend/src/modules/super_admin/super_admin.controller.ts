import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../types/auth.types';
import { SuperAdminService } from './super_admin.service';

const onboardSchoolSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  code: z.string().min(2, 'School code must be at least 2 characters').max(15, 'Code too long'),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
  maxStudents: z.number().int().positive().optional(),
  adminName: z.string().min(2, 'Admin full name is required'),
  adminEmail: z.string().email('Valid admin email is required'),
  adminPhone: z.string().optional(),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
  address: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

const updatePlanSchema = z.object({
  plan: z.string(),
  maxStudents: z.number().int().positive().optional(),
  subscriptionExpiresAt: z.string().optional(),
});

export class SuperAdminController {
  static async getMetrics(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await SuperAdminService.getPlatformMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSchools(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, plan } = req.query;
      const schools = await SuperAdminService.getSchools({
        search: search as string | undefined,
        status: status as string | undefined,
        plan: plan as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: schools,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSchoolById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const school = await SuperAdminService.getSchoolById(id);
      res.status(200).json({
        success: true,
        data: school,
      });
    } catch (error: any) {
      if (error.message === 'SCHOOL_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'School not found' });
        return;
      }
      next(error);
    }
  }

  static async onboardSchool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = onboardSchoolSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const result = await SuperAdminService.onboardSchool(validation.data);
      res.status(201).json({
        success: true,
        message: 'School onboarded successfully with default academic structure and admin account',
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'SCHOOL_CODE_EXISTS') {
        res.status(409).json({
          success: false,
          error: 'A school with this unique code already exists. Please choose a different code.',
        });
        return;
      }

      if (error.message === 'ADMIN_EMAIL_OR_IDENTIFIER_EXISTS') {
        res.status(409).json({
          success: false,
          error: 'An administrator with this email or username already exists.',
        });
        return;
      }

      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validation = updateStatusSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const updated = await SuperAdminService.updateStatus(id, validation.data.status);
      res.status(200).json({
        success: true,
        message: `School status updated to ${validation.data.status}`,
        data: updated,
      });
    } catch (error: any) {
      if (error.message === 'SCHOOL_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'School not found' });
        return;
      }
      next(error);
    }
  }

  static async updatePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validation = updatePlanSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const updated = await SuperAdminService.updatePlan(id, validation.data);
      res.status(200).json({
        success: true,
        message: 'School subscription updated successfully',
        data: updated,
      });
    } catch (error: any) {
      if (error.message === 'SCHOOL_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'School not found' });
        return;
      }
      next(error);
    }
  }
}
