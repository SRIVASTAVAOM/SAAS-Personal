import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { MaterialsController } from './materials.controller';

const router = Router();

// Development / Local S3 simulation endpoints (no token required, matching real S3 pre-signed URL behavior)
router.put('/mock-s3-upload', MaterialsController.mockUploadHandler);
router.get('/mock-s3-download', MaterialsController.mockDownloadHandler);

// Authenticated API Endpoints
router.use(authenticateToken);

// Teacher requests pre-signed upload URL for academic material
router.post('/presigned-upload-url', requireRole(['TEACHER']), MaterialsController.initiatePresignedUpload);

// Teacher verifies completed upload
router.post('/:id/verify-upload', requireRole(['TEACHER']), MaterialsController.verifyUpload);

// List materials for class & subject (scoped for Students, Teachers, Coordinators)
router.get('/class/:classId/:subjectId', MaterialsController.getMaterials);

// Download URL for authorized users
router.get('/:id/download-url', MaterialsController.getDownloadUrl);

export default router;
