import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { AdminController } from './admin.controller';
import { MaterialsController } from '../materials/materials.controller';

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
router.post('/students/bulk-upload', AdminController.bulkUploadStudents);
router.get('/students/:id', AdminController.getStudentDetails);
router.patch('/students/:id', AdminController.updateStudent);

// Staff Directory & Management Endpoints (CRUD)
router.get('/staff', AdminController.getAllStaff);
router.post('/staff', AdminController.createStaff);
router.post('/staff/bulk-upload', AdminController.bulkUploadStaff);
router.patch('/staff/:id', AdminController.updateStaff);
router.delete('/staff/:id', AdminController.deleteStaff);

// Academic Class Teacher & Subject Teacher Allocation Hub
router.get('/academics/allocations', AdminController.getAcademicAllocations);
router.post('/academics/allocations', AdminController.saveAcademicAllocations);

// Real-Time Dashboard 360-Degree Inspector
router.get('/dashboard/student-inspect/:id', AdminController.getStudentInspection);
router.get('/dashboard/teacher-inspect/:id', AdminController.getTeacherInspection);

// View & Assign Homework (Upload, assign, edit, delete across classes)
router.get('/homework', AdminController.getAdminHomework);
router.post('/homework', AdminController.createAdminHomework);
router.patch('/homework/:id', AdminController.updateAdminHomework);
router.delete('/homework/:id', AdminController.deleteAdminHomework);

// View Feedback & Student Grievances
router.get('/feedback', AdminController.getAdminFeedback);
router.patch('/complaints/:id', AdminController.updateComplaintStatus);

// Study Material & Academic Repository (Upload, view, edit, delete across school)
router.get('/materials', MaterialsController.getAdminMaterials);
router.post('/materials', MaterialsController.createAdminMaterial);
router.patch('/materials/:id', MaterialsController.updateAdminMaterial);
router.delete('/materials/:id', MaterialsController.deleteAdminMaterial);

export default router;


