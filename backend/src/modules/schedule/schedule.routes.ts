import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { ScheduleController } from './schedule.controller';

const router = Router();

// All schedule endpoints require authentication
router.use(authenticateToken);

// Teacher Timetable
router.get('/timetable/my-teacher', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), ScheduleController.getTeacherTimetable);

// Teacher Substitutions
router.get('/substitutions/my-teacher', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), ScheduleController.getTeacherSubstitutions);

// Online Classes (Teachers & Students can view; Teachers/Admin can schedule & delete)
router.get('/online-classes', requireRole(['TEACHER', 'STUDENT', 'ADMIN', 'SUPER_ADMIN']), ScheduleController.getOnlineClasses);
router.post('/online-classes', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), ScheduleController.createOnlineClass);
router.delete('/online-classes/:id', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), ScheduleController.deleteOnlineClass);

export default router;
