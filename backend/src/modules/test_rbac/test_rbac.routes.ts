import { Router, Response } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { enforceWingScope, enforceStudentScope } from '../../middlewares/scope.middleware';
import { AuthenticatedRequest } from '../../types/auth.types';

const router = Router();

// 1. Role-specific test routes
router.get(
  '/student-zone',
  authenticateToken,
  requireRole(['STUDENT']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: 'Welcome to Student Zone', user: req.user });
  }
);

router.get(
  '/teacher-zone',
  authenticateToken,
  requireRole(['TEACHER']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: 'Welcome to Teacher Zone', user: req.user });
  }
);

router.get(
  '/admin-zone',
  authenticateToken,
  requireRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: 'Welcome to School Admin Zone', user: req.user });
  }
);

router.get(
  '/super-admin-zone',
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: 'Welcome to Super Admin Zone', user: req.user });
  }
);

router.get(
  '/student-profile/:studentId',
  authenticateToken,
  requireRole(['STUDENT']),
  enforceStudentScope('studentId'),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: `Access granted for Student: ${req.params.studentId}` });
  }
);

export default router;
