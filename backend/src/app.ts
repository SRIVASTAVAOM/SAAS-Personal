import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import academicsRoutes from './modules/academics/academics.routes';
import profileRoutes from './modules/profiles/profile.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leavesRoutes from './modules/leaves/leaves.routes';
import curriculumRoutes from './modules/curriculum/curriculum.routes';
import homeworkRoutes from './modules/homework/homework.routes';
import materialsRoutes from './modules/materials/materials.routes';
import examsRoutes from './modules/exams/exams.routes';
import testRbacRoutes from './modules/test_rbac/test_rbac.routes';
import noticeRoutes from './modules/notices/notice.routes';
import feeRoutes from './modules/fees/fee.routes';
import supportRoutes from './modules/support/support.routes';
import scheduleRoutes from './modules/schedule/schedule.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/academics', academicsRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leavesRoutes);
app.use('/api/v1/curriculum', curriculumRoutes);
app.use('/api/v1/homework', homeworkRoutes);
app.use('/api/v1/materials', materialsRoutes);
app.use('/api/v1/exams', examsRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/test-rbac', testRbacRoutes);


// Centralized 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
