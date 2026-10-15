import { Request, Response } from 'express';
import { z } from 'zod';
import { MaterialsService } from './materials.service';

const initiateUploadSchema = z.object({
  classId: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  section_id: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fileName: z.string().min(1, 'File name is required').optional(),
  file_name: z.string().min(1, 'File name is required').optional(),
  fileSizeBytes: z.number().int().positive('File size must be positive').optional(),
  file_size_bytes: z.number().int().positive('File size must be positive').optional(),
  contentType: z.string().min(1, 'Content-type is required').optional(),
  fileType: z.string().min(1, 'Content-type is required').optional(),
  content_type: z.string().min(1, 'Content-type is required').optional(),
}).transform((data) => ({
  classId: (data.classId || data.class_id)!,
  sectionId: data.sectionId || data.section_id,
  subjectId: (data.subjectId || data.subject_id)!,
  title: data.title,
  description: data.description,
  fileName: (data.fileName || data.file_name)!,
  fileSizeBytes: (data.fileSizeBytes || data.file_size_bytes)!,
  contentType: (data.contentType || data.fileType || data.content_type)!,
})).refine((d) => !!d.classId && !!d.subjectId && !!d.fileName && !!d.fileSizeBytes && !!d.contentType, {
  message: 'classId, subjectId, fileName, fileSizeBytes, and contentType are required',
});

export class MaterialsController {
  static async initiatePresignedUpload(req: Request, res: Response): Promise<void> {
    try {
      const parsed = initiateUploadSchema.parse(req.body);
      const result = await MaterialsService.initiatePresignedUpload((req as any).user, parsed);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to initiate upload',
      });
    }
  }

  static async verifyUpload(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const material = await MaterialsService.verifyUpload((req as any).user, id);
      res.status(200).json({ success: true, data: material });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to verify upload',
      });
    }
  }

  static async getMaterials(req: Request, res: Response): Promise<void> {
    try {
      const { classId, subjectId } = req.params;
      const { sectionId } = req.query;
      const list = await MaterialsService.getMaterials(
        (req as any).user,
        classId,
        subjectId,
        sectionId as string | undefined
      );
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch materials',
      });
    }
  }

  static async getDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await MaterialsService.getDownloadUrl((req as any).user, id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to generate download URL',
      });
    }
  }

  /**
   * Safe local simulation handler for pre-signed PUT uploads when AWS credentials are not configured.
   */
  static mockUploadHandler(req: Request, res: Response): void {
    console.info(`[AWS S3 Notice]: Mock PUT upload executed successfully for key: ${req.query.key}`);
    res.status(200).json({ success: true, message: 'Mock S3 upload simulated successfully' });
  }

  /**
   * Safe local simulation handler for pre-signed GET downloads when AWS credentials are not configured.
   */
  static mockDownloadHandler(req: Request, res: Response): void {
    console.info(`[AWS S3 Notice]: Mock GET download accessed for key: ${req.query.key}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="simulated_document.pdf"');
    res.status(200).send(Buffer.from('%PDF-1.4 Simulated ERP Academic Document Content'));
  }
}
