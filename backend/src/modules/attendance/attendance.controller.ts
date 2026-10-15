import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../types/auth.types';
import { AttendanceService } from './attendance.service';

const markAttendanceRecordSchema = z.object({
  studentId: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  status: z.enum(['PRESENT', 'ABSENT']),
  remarks: z.string().max(255).nullable().optional(),
}).transform((data) => ({
  studentId: (data.studentId || data.student_id)!,
  status: data.status,
  remarks: data.remarks || undefined,
})).refine((d) => !!d.studentId, { message: 'studentId or student_id is required' });

const markAttendanceSchema = z.object({
  classId: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  section_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  records: z.array(markAttendanceRecordSchema).min(1, 'At least one student attendance record is required'),
}).transform((data) => ({
  classId: (data.classId || data.class_id)!,
  sectionId: (data.sectionId || data.section_id)!,
  date: (data.date || data.attendance_date)!,
  records: data.records,
})).refine((d) => !!d.classId && !!d.sectionId && !!d.date, {
  message: 'classId, sectionId, and date are required',
});

const markStaffAttendanceRecordSchema = z
  .object({
    staffId: z.string().uuid().optional(),
    staff_id: z.string().uuid().optional(),
    status: z.enum(['PRESENT', 'ABSENT']),
    inTime: z.string().max(30).nullable().optional(),
    in_time: z.string().max(30).nullable().optional(),
    outTime: z.string().max(30).nullable().optional(),
    out_time: z.string().max(30).nullable().optional(),
    remarks: z.string().max(255).nullable().optional(),
  })
  .transform((data) => ({
    staffId: (data.staffId || data.staff_id)!,
    status: data.status,
    inTime: data.inTime || data.in_time || null,
    outTime: data.outTime || data.out_time || null,
    remarks: data.remarks || null,
  }))
  .refine((d) => !!d.staffId, { message: 'staffId or staff_id is required' });

const markStaffAttendanceSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    records: z.array(markStaffAttendanceRecordSchema).min(1, 'At least one staff attendance record is required'),
  })
  .transform((data) => ({
    date: (data.date || data.attendance_date)!,
    records: data.records,
  }))
  .refine((d) => !!d.date, { message: 'date is required' });

export class AttendanceController {
  static async markStudentAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = markAttendanceSchema.parse(req.body);
      const mappedRecords = parsed.records.map((r) => ({
        student_id: r.studentId,
        status: r.status,
        remarks: r.remarks,
      }));

      await AttendanceService.markStudentAttendance(
        req.user!,
        parsed.classId,
        parsed.sectionId,
        parsed.date,
        mappedRecords
      );

      res.status(200).json({
        success: true,
        message: 'Attendance marked successfully',
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      if (err.message === 'FORBIDDEN_SCOPE') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You are not authorized to mark attendance for this class.',
        });
        return;
      }
      if (err.message === 'INVALID_ATTENDANCE_STATUS') {
        res.status(400).json({
          success: false,
          error: 'Invalid attendance status. Only PRESENT and ABSENT are supported.',
        });
        return;
      }
      if (err.message === 'INVALID_DATE') {
        res.status(400).json({ success: false, error: 'Invalid attendance date format.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getClassAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { classId, sectionId } = req.params;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

      const records = await AttendanceService.getClassAttendance(
        req.user!,
        classId,
        sectionId,
        date
      );

      res.status(200).json({ success: true, data: records });
    } catch (err: any) {
      if (err.message === 'FORBIDDEN_SCOPE') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You are not authorized to view attendance for this class.',
        });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getStudentAttendanceHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const records = await AttendanceService.getStudentAttendanceHistory(req.user!);
      res.status(200).json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getStaffAttendanceHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const records = await AttendanceService.getStaffAttendanceHistory(req.user!);
      res.status(200).json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getWingStaffAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { wingId } = req.params;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

      const records = await AttendanceService.getWingStaffAttendance(
        req.user!,
        wingId,
        date
      );

      res.status(200).json({ success: true, data: records });
    } catch (err: any) {
      if (err.message === 'FORBIDDEN_SCOPE') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You are not authorized to view staff attendance for this wing.',
        });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async getAllStaffAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const wingId = req.query.wingId as string | undefined;

      const records = await AttendanceService.getAllStaffAttendance(req.user!, date, wingId);
      res.status(200).json({ success: true, data: records });
    } catch (err: any) {
      if (err.message === 'INVALID_DATE') {
        res.status(400).json({ success: false, error: 'Invalid attendance date format.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  static async markStaffAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parsed = markStaffAttendanceSchema.parse(req.body);

      await AttendanceService.markStaffAttendance(req.user!, parsed.date, parsed.records);

      res.status(200).json({
        success: true,
        message: 'Staff attendance marked successfully',
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      if (err.message === 'INVALID_ATTENDANCE_STATUS') {
        res.status(400).json({
          success: false,
          error: 'Invalid attendance status. Only PRESENT and ABSENT are supported.',
        });
        return;
      }
      if (err.message === 'INVALID_DATE') {
        res.status(400).json({ success: false, error: 'Invalid attendance date format.' });
        return;
      }
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }
}
