import { Router } from 'express';
import { NoticeController } from './notice.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/student', requireRole(['STUDENT']), NoticeController.getStudentNotices);

export default router;
