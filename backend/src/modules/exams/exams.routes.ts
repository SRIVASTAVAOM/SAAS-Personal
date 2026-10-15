import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { ExamsController } from './exams.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// 1. Exam Setup & Listing
router.post(
  '/',
  requireRole(['COORDINATOR', 'MANAGEMENT']),
  ExamsController.createExam
);

router.get(
  '/',
  requireRole(['COORDINATOR', 'MANAGEMENT', 'TEACHER', 'STUDENT']),
  ExamsController.listExams
);

router.get(
  '/:id',
  requireRole(['COORDINATOR', 'MANAGEMENT', 'TEACHER', 'STUDENT']),
  ExamsController.getExamDetails
);

router.patch(
  '/:id/publish',
  requireRole(['COORDINATOR', 'MANAGEMENT']),
  ExamsController.publishExam
);

// 2. Datesheets (Scheduling)
router.post(
  '/:id/datesheets',
  requireRole(['COORDINATOR']),
  ExamsController.createDatesheet
);

router.get(
  '/:id/datesheets',
  requireRole(['COORDINATOR', 'TEACHER', 'STUDENT']),
  ExamsController.getDatesheets
);

// 3. Marks Entry & Verification
router.get(
  '/:id/datesheets/:datesheetId/marks-roster',
  requireRole(['TEACHER', 'COORDINATOR']),
  ExamsController.getMarksRoster
);

router.post(
  '/:id/datesheets/:datesheetId/marks',
  requireRole(['TEACHER', 'COORDINATOR']),
  ExamsController.saveMarks
);

router.get(
  '/:id/datesheets/:datesheetId/summary',
  requireRole(['TEACHER', 'COORDINATOR']),
  ExamsController.getDatesheetSummary
);

router.patch(
  '/:id/datesheets/:datesheetId/verify-marks',
  requireRole(['COORDINATOR']),
  ExamsController.verifyMarks
);

// 4. Report Cards Generation & Approval
router.post(
  '/:id/classes/:classId/sections/:sectionId/generate-report-cards',
  requireRole(['TEACHER', 'COORDINATOR']),
  ExamsController.generateReportCards
);

router.get(
  '/:id/classes/:classId/sections/:sectionId/report-cards',
  requireRole(['TEACHER', 'COORDINATOR']),
  ExamsController.getClassReportCards
);

router.patch(
  '/:id/classes/:classId/sections/:sectionId/approve-report-cards',
  requireRole(['COORDINATOR']),
  ExamsController.approveReportCards
);

// 5. Student Results View
router.get(
  '/:id/results/me',
  requireRole(['STUDENT']),
  ExamsController.getMyResult
);

export default router;
