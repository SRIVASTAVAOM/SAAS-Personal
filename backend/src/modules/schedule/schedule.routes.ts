import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { ScheduleController } from './schedule.controller';

const router = Router();

// All schedule endpoints require authentication
router.use(authenticateToken);

// Teacher Timetable
router.get('/timetable/my-teacher', requireRole(['TEACHER']), ScheduleController.getTeacherTimetable);

// Teacher Substitutions
router.get('/substitutions/my-teacher', requireRole(['TEACHER']), ScheduleController.getTeacherSubstitutions);

// Online Classes (Teachers & Students can view; Teachers can schedule & delete)
router.get('/online-classes', requireRole(['TEACHER', 'STUDENT']), ScheduleController.getOnlineClasses);
router.post('/online-classes', requireRole(['TEACHER']), ScheduleController.createOnlineClass);
router.delete('/online-classes/:id', requireRole(['TEACHER']), ScheduleController.deleteOnlineClass);

export default router;
