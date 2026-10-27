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

// Teacher / Admin requests pre-signed upload URL for academic material
router.post('/presigned-upload-url', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), MaterialsController.initiatePresignedUpload);

// Teacher / Admin verifies completed upload
router.post('/:id/verify-upload', requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']), MaterialsController.verifyUpload);

// List materials for class & subject (scoped for Students, Teachers, Coordinators)
router.get('/class/:classId/:subjectId', MaterialsController.getMaterials);

// Download URL for authorized users
router.get('/:id/download-url', MaterialsController.getDownloadUrl);

// Admin Study Materials Management (Upload, view, edit, delete across school)
router.get('/admin/list', requireRole(['ADMIN', 'SUPER_ADMIN']), MaterialsController.getAdminMaterials);
router.post('/admin', requireRole(['ADMIN', 'SUPER_ADMIN']), MaterialsController.createAdminMaterial);
router.patch('/admin/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), MaterialsController.updateAdminMaterial);
router.delete('/admin/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), MaterialsController.deleteAdminMaterial);

export default router;
