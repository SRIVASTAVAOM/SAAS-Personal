import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { AttendanceController } from './attendance.controller';

const router = Router();

// Student Attendance Endpoints
router.post(
  '/student',
  authenticateToken,
  requireRole(['TEACHER', 'COORDINATOR', 'MANAGEMENT']),
  AttendanceController.markStudentAttendance
);

router.get(
  '/student/class/:classId/:sectionId',
  authenticateToken,
  requireRole(['TEACHER', 'COORDINATOR', 'MANAGEMENT']),
  AttendanceController.getClassAttendance
);

router.get(
  '/student/my-history',
  authenticateToken,
  requireRole(['STUDENT']),
  AttendanceController.getStudentAttendanceHistory
);

// Staff Attendance Endpoints
router.get(
  '/staff/my-history',
  authenticateToken,
  requireRole(['TEACHER', 'COORDINATOR', 'ACCOUNTANT']),
  AttendanceController.getStaffAttendanceHistory
);

router.get(
  '/staff/wing/:wingId',
  authenticateToken,
  requireRole(['COORDINATOR', 'MANAGEMENT']),
  AttendanceController.getWingStaffAttendance
);

router.get(
  '/staff/management-overview',
  authenticateToken,
  requireRole(['MANAGEMENT']),
  AttendanceController.getAllStaffAttendance
);

router.post(
  '/staff',
  authenticateToken,
  requireRole(['MANAGEMENT']),
  AttendanceController.markStaffAttendance
);

export default router;
