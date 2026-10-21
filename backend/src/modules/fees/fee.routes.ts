import { Router } from 'express';
import { FeeController } from './fee.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/my-fees', requireRole(['STUDENT']), FeeController.getStudentFees);
router.get('/my-receipts', requireRole(['STUDENT']), FeeController.getStudentReceipts);

// Admin Fee Operations
router.get('/admin/overview', requireRole(['ADMIN', 'SUPER_ADMIN']), FeeController.getAdminOverview);
router.post('/admin/collect', requireRole(['ADMIN', 'SUPER_ADMIN']), FeeController.collectFee);
router.get('/admin/receipts', requireRole(['ADMIN', 'SUPER_ADMIN']), FeeController.getAdminReceipts);
router.post('/admin/assign', requireRole(['ADMIN', 'SUPER_ADMIN']), FeeController.assignFeeHead);

export default router;
