import { Router } from 'express';
import { SuperAdminController } from './super_admin.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

// Platform Super Admin RBAC Gate: All routes require valid auth token + SUPER_ADMIN role
router.use(authenticateToken as any);
router.use(requireRole(['SUPER_ADMIN']) as any);

// 1. Platform-wide aggregated metrics
router.get('/metrics', SuperAdminController.getMetrics as any);

// 2. School directory & listing
router.get('/schools', SuperAdminController.getSchools as any);

// 3. Single school dossier
router.get('/schools/:id', SuperAdminController.getSchoolById as any);

// 4. 1-Click Onboard School Engine
router.post('/schools', SuperAdminController.onboardSchool as any);

// 5. School lifecycle toggle (ACTIVE / SUSPENDED)
router.patch('/schools/:id/status', SuperAdminController.updateStatus as any);

// 6. School subscription & plan management
router.patch('/schools/:id/plan', SuperAdminController.updatePlan as any);

// 7. Instant Reset & Recovery of Default Accounts (admin, teacher, student)
router.post('/restore-credentials', SuperAdminController.restoreCredentials as any);

export default router;

