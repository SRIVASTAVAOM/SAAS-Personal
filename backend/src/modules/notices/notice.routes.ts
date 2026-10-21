import { Router } from 'express';
import { NoticeController } from './notice.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/student', requireRole(['STUDENT']), NoticeController.getStudentNotices);

// Admin & Coordinator Notice Management
router.get('/', requireRole(['MANAGEMENT', 'COORDINATOR']), NoticeController.getAdminNotices);
router.post('/', requireRole(['MANAGEMENT', 'COORDINATOR']), NoticeController.createNotice);
router.delete('/:id', requireRole(['MANAGEMENT', 'COORDINATOR']), NoticeController.deleteNotice);

export default router;
