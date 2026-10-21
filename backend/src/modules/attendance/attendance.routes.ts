import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { AttendanceController } from './attendance.controller';

const router = Router();

// Student Attendance Endpoints
router.post(
  '/student',
  authenticateToken,
  requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  AttendanceController.markStudentAttendance
);

router.get(
  '/student/class/:classId/:sectionId',
  authenticateToken,
  requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']),
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
  requireRole(['TEACHER', 'ADMIN']),
  AttendanceController.getStaffAttendanceHistory
);

router.get(
  '/staff/wing/:wingId',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  AttendanceController.getWingStaffAttendance
);

router.get(
  '/staff/management-overview',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  AttendanceController.getAllStaffAttendance
);

router.post(
  '/staff',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  AttendanceController.markStaffAttendance
);

export default router;
