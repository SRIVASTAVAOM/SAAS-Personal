import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { CurriculumController } from './curriculum.controller';

const router = Router();

router.use(authenticateToken);

// All authenticated roles (Student, Teacher, Coordinator, Management) can view authorized curriculum
router.get('/units', CurriculumController.getCurriculum);

// Teachers, Admin, Super Admin can create units & topics
router.post('/units', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), CurriculumController.createUnit);
router.post('/topics', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), CurriculumController.createTopic);

export default router;
