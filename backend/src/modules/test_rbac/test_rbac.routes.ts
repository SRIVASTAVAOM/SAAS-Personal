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
  '/accountant-zone',
  authenticateToken,
  requireRole(['ACCOUNTANT']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: 'Welcome to Accountant Zone', user: req.user });
  }
);

router.get(
  '/coordinator-zone',
  authenticateToken,
  requireRole(['COORDINATOR']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: 'Welcome to Coordinator Zone', user: req.user });
  }
);

router.get(
  '/management-zone',
  authenticateToken,
  requireRole(['MANAGEMENT']),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: 'Welcome to Management Zone', user: req.user });
  }
);

// 2. Resource-level scope test routes
router.get(
  '/coordinator-wing/:wingId',
  authenticateToken,
  requireRole(['COORDINATOR']),
  enforceWingScope('wingId'),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, message: `Access granted for Wing: ${req.params.wingId}` });
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
