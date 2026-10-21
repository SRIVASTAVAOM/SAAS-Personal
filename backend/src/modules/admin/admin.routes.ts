import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { AdminController } from './admin.controller';

const router = Router();

// All Admin web portal endpoints require authentication and ADMIN or SUPER_ADMIN role
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

// Web Admin Command Center Dashboard Summary
router.get('/dashboard/summary', AdminController.getDashboardSummary);

// Master Timetable Grid Management
router.get('/timetable/grid', AdminController.getTimetableGrid);
router.post('/timetable/grid', AdminController.saveTimetableGrid);

// Master Tabulation Marksheet (Greensheet)
router.get('/reports/greensheet', AdminController.getGreensheet);

// Staff Teachers Lookup for Allocations / Substitutions
router.get('/staff/teachers', AdminController.getTeachers);
router.get('/timetable/teacher/:teacherId', AdminController.getTeacherTimetable);

// Timetable Teacher Substitutions (Live sync with Teacher App)
router.get('/timetable/substitutions', AdminController.getSubstitutions);
router.post('/timetable/substitutions', AdminController.assignSubstitution);
router.delete('/timetable/substitutions/:id', AdminController.deleteSubstitution);

// Student Directory & Profile Endpoints
router.get('/students', AdminController.getStudentsList);
router.get('/students/:id', AdminController.getStudentDetails);

// Staff Directory & Management Endpoints (CRUD)
router.get('/staff', AdminController.getAllStaff);
router.post('/staff', AdminController.createStaff);
router.patch('/staff/:id', AdminController.updateStaff);
router.delete('/staff/:id', AdminController.deleteStaff);

// View Homework (All assignments across classes with teacher names)
router.get('/homework', AdminController.getAdminHomework);

// View Feedback & Student Grievances
router.get('/feedback', AdminController.getAdminFeedback);
router.patch('/complaints/:id', AdminController.updateComplaintStatus);

export default router;

