import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { LeavesController } from './leaves.controller';

const router = Router();

// Staff Leave Endpoints
router.post(
  '/staff',
  authenticateToken,
  requireRole(['TEACHER', 'ADMIN']),
  LeavesController.createStaffLeave
);

router.get(
  '/staff/my-leaves',
  authenticateToken,
  requireRole(['TEACHER', 'ADMIN']),
  LeavesController.getStaffMyLeaves
);

router.get(
  '/staff/wing-leaves',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  LeavesController.getStaffWingLeaves
);

router.get(
  '/staff/management-queue',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  LeavesController.getAllStaffLeavesForManagement
);

router.patch(
  '/staff/:id/recommend',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  LeavesController.recommendStaffLeave
);

router.patch(
  '/staff/:id/decide',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  LeavesController.sanctionStaffLeave
);

// Student Leave Endpoints
router.post(
  '/student',
  authenticateToken,
  requireRole(['STUDENT']),
  LeavesController.createStudentLeave
);

router.get(
  '/student/my-leaves',
  authenticateToken,
  requireRole(['STUDENT']),
  LeavesController.getStudentMyLeaves
);

router.get(
  '/student/pending-approvals',
  authenticateToken,
  requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  LeavesController.getPendingStudentLeaves
);

router.get(
  '/student/class-requests',
  authenticateToken,
  requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  LeavesController.getClassStudentLeaves
);

router.patch(
  '/student/:id/status',
  authenticateToken,
  requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  LeavesController.updateStudentLeaveStatus
);

export default router;

