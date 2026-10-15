import { Router } from 'express';
import { SupportController } from './support.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateToken);

// Complaints endpoints
router.get('/complaints', requireRole(['STUDENT']), SupportController.getStudentComplaints);
router.post('/complaints', requireRole(['STUDENT']), SupportController.submitComplaint);

// Feedback endpoints
router.get('/feedback', requireRole(['STUDENT']), SupportController.getStudentFeedback);
router.post('/feedback', requireRole(['STUDENT']), SupportController.submitFeedback);

export default router;
