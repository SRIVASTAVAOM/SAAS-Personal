import { Router } from 'express';
import { AcademicsController } from './academics.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

// Base middleware: All academic endpoints require valid JWT authentication
router.use(authenticateToken);

router.get('/classes', AcademicsController.getClassesAndSections);
router.get('/subjects', AcademicsController.getSubjects);
router.get('/subjects/master', AcademicsController.getSubjectsWithDetails);
router.post('/subjects', requireRole(['ADMIN', 'SUPER_ADMIN']), AcademicsController.createSubject);
router.patch('/subjects/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), AcademicsController.updateSubject);
router.delete('/subjects/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), AcademicsController.deleteSubject);
router.get('/class-roster/:classId/:sectionId', AcademicsController.getClassRoster);
router.get('/my-roster', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), AcademicsController.getMyRoster);
router.get('/my-allocations', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), AcademicsController.getMyAllocations);
router.get('/subject-teachers', requireRole(['STUDENT']), AcademicsController.getSubjectTeachers);
router.get('/classmates-birthdays', requireRole(['STUDENT']), AcademicsController.getClassmatesBirthdays);

export default router;

