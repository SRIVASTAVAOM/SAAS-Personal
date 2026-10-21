import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateToken);

// Student profile endpoints
router.get('/student', requireRole(['STUDENT']), ProfileController.getStudentProfile);
router.patch('/student', requireRole(['STUDENT']), ProfileController.updateStudentProfile);
router.patch(
  '/student/:studentId/by-teacher',
  requireRole(['TEACHER']),
  ProfileController.updateStudentProfileByTeacher
);


// Staff profile endpoints (Teacher, Admin, Super Admin)
router.get(
  '/staff',
  requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  ProfileController.getStaffProfile
);
router.patch(
  '/staff',
  requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  ProfileController.updateStaffProfile
);

export default router;
