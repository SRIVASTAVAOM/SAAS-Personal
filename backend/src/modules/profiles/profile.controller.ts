import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../types/auth.types';
import { ProfileService } from './profile.service';

const studentUpdateSchema = z.object({
  emergency_phone: z.string().min(5).max(20).optional(),
  emergencyPhone: z.string().min(5).max(20).optional(),
  blood_group: z.string().max(10).optional(),
  bloodGroup: z.string().max(10).optional(),
  medical_notes: z.string().max(500).optional(),
  medicalNotes: z.string().max(500).optional(),
  document_url: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
}).transform((data) => ({
  emergency_phone: data.emergency_phone !== undefined ? data.emergency_phone : data.emergencyPhone,
  blood_group: data.blood_group !== undefined ? data.blood_group : data.bloodGroup,
  medical_notes: data.medical_notes !== undefined ? data.medical_notes : data.medicalNotes,
  document_url: data.document_url !== undefined ? data.document_url : data.documentUrl,
}));

const staffUpdateSchema = z.object({
  emergency_phone: z.string().min(5).max(20).optional(),
  phone: z.string().min(5).max(20).optional(),
  qualification: z.string().min(2).max(255).optional(),
  blood_group: z.string().max(10).optional(),
});

const teacherUpdateStudentSchema = z.object({
  roll_number: z.string().max(20).optional().nullable(),
  rollNumber: z.string().max(20).optional().nullable(),
  blood_group: z.string().max(10).optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  emergency_contact_phone: z.string().min(5).max(20).optional().nullable(),
  emergency_phone: z.string().min(5).max(20).optional().nullable(),
  emergencyPhone: z.string().min(5).max(20).optional().nullable(),
  medical_notes: z.string().max(500).optional().nullable(),
  medicalNotes: z.string().max(500).optional().nullable(),
  document_url: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
}).transform((data) => ({
  roll_number: data.roll_number !== undefined ? data.roll_number : data.rollNumber,
  blood_group: data.blood_group !== undefined ? data.blood_group : data.bloodGroup,
  emergency_phone: data.emergency_contact_phone !== undefined
    ? data.emergency_contact_phone
    : (data.emergency_phone !== undefined ? data.emergency_phone : data.emergencyPhone),
  medical_notes: data.medical_notes !== undefined ? data.medical_notes : data.medicalNotes,
  document_url: data.document_url !== undefined ? data.document_url : data.documentUrl,
}));

export class ProfileController {

  static async getStudentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await ProfileService.getStudentProfile(req.user!);
      res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
      if (error.message === 'PROFILE_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Student profile not found' });
        return;
      }
      next(error);
    }
  }

  static async updateStudentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = studentUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const updated = await ProfileService.updateStudentProfile(req.user!, validation.data);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStaffProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await ProfileService.getStaffProfile(req.user!);
      res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
      if (error.message === 'PROFILE_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Staff profile not found' });
        return;
      }
      next(error);
    }
  }

  static async updateStaffProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = staffUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const updated = await ProfileService.updateStaffProfile(req.user!, validation.data);
      res.status(200).json({
        success: true,
        message: 'Staff profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStudentProfileByTeacher(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { studentId } = req.params;
      const validation = teacherUpdateStudentSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const updated = await ProfileService.updateStudentProfileByTeacher(
        req.user!,
        studentId,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Student details updated successfully',
        data: updated,
      });
    } catch (error: any) {
      if (error.message === 'STUDENT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Student not found' });
        return;
      }
      if (
        error.message === 'FORBIDDEN_SCHOOL' ||
        error.message === 'FORBIDDEN_NOT_CLASS_TEACHER'
      ) {
        res.status(403).json({
          success: false,
          error:
            'Forbidden: Only the assigned Class Teacher can update this student details',
        });
        return;
      }
      next(error);
    }
  }
}

