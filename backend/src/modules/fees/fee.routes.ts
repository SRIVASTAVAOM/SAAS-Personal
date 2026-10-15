import { Router } from 'express';
import { FeeController } from './fee.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/my-fees', requireRole(['STUDENT']), FeeController.getStudentFees);
router.get('/my-receipts', requireRole(['STUDENT']), FeeController.getStudentReceipts);

export default router;
