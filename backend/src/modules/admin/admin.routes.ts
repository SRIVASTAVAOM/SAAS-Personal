import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { AdminController } from './admin.controller';

const router = Router();

// All Admin web portal endpoints require authentication and MANAGEMENT or COORDINATOR role
router.use(authenticateToken);
router.use(requireRole(['MANAGEMENT', 'COORDINATOR']));

// Web Admin Command Center Dashboard Summary
router.get('/dashboard/summary', AdminController.getDashboardSummary);

// Master Timetable Grid Management
router.get('/timetable/grid', AdminController.getTimetableGrid);
router.post('/timetable/grid', AdminController.saveTimetableGrid);

// Master Tabulation Marksheet (Greensheet)
router.get('/reports/greensheet', AdminController.getGreensheet);

export default router;
