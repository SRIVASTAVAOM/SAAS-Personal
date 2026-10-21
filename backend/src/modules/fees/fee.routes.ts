import { Router } from 'express';
import { FeeController } from './fee.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/my-fees', requireRole(['STUDENT']), FeeController.getStudentFees);
router.get('/my-receipts', requireRole(['STUDENT']), FeeController.getStudentReceipts);

// Admin & Accountant Fee Operations
router.get('/admin/overview', requireRole(['MANAGEMENT', 'ACCOUNTANT', 'COORDINATOR']), FeeController.getAdminOverview);
router.post('/admin/collect', requireRole(['MANAGEMENT', 'ACCOUNTANT']), FeeController.collectFee);
router.get('/admin/receipts', requireRole(['MANAGEMENT', 'ACCOUNTANT', 'COORDINATOR']), FeeController.getAdminReceipts);
router.post('/admin/assign', requireRole(['MANAGEMENT', 'ACCOUNTANT']), FeeController.assignFeeHead);

export default router;
