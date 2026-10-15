import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { CurriculumController } from './curriculum.controller';

const router = Router();

router.use(authenticateToken);

// All authenticated roles (Student, Teacher, Coordinator, Management) can view authorized curriculum
router.get('/units', CurriculumController.getCurriculum);

// Teachers, Coordinators, Management can create units & topics
router.post('/units', requireRole(['TEACHER', 'COORDINATOR', 'MANAGEMENT']), CurriculumController.createUnit);
router.post('/topics', requireRole(['TEACHER', 'COORDINATOR', 'MANAGEMENT']), CurriculumController.createTopic);

export default router;
