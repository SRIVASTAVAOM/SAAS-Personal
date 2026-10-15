import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { HomeworkController } from './homework.controller';

const router = Router();

router.use(authenticateToken);

// Teacher creates homework
router.post('/', requireRole(['TEACHER']), HomeworkController.createHomework);

// Teacher updates their assigned homework
router.patch('/:id', requireRole(['TEACHER']), HomeworkController.updateHomework);

// Teacher views their assigned homework
router.get('/teacher/my-assigned', requireRole(['TEACHER']), HomeworkController.getTeacherMyAssignedHomework);

// Student views homework for their class/section
router.get('/student/my-class', requireRole(['STUDENT']), HomeworkController.getStudentMyClassHomework);

// Student toggles completion status for an assignment
router.post('/:id/completion', requireRole(['STUDENT']), HomeworkController.setCompletionStatus);

// Class & section homework list (scoped for teachers, coordinators, students)
router.get('/class/:classId/:sectionId', HomeworkController.getClassSectionHomework);

// Attachment download URL (scoped)
router.get('/:id/attachment-download', HomeworkController.getAttachmentDownloadUrl);

// Single homework assignment detail
router.get('/:id', HomeworkController.getHomeworkDetail);

export default router;
