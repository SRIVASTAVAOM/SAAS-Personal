import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Web Admin Panel Module Integration Tests (/api/v1/admin)', () => {
  let managementToken: string;
  let coordinatorToken: string;
  let teacherToken: string;
  let studentToken: string;

  let schoolId: string;
  let academicYearId: string;
  let classId: string;
  let sectionId: string;
  let mathSubjectId: string;
  let teacherProfileId: string;

  beforeAll(async () => {
    // 1. Authenticate Management
    const mgmtLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'management1', password: 'Password@123' });
    expect(mgmtLogin.status).toBe(200);
    managementToken = mgmtLogin.body.data.token;
    schoolId = mgmtLogin.body.data.user.schoolId;

    // 2. Authenticate Coordinator
    const coordLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'coordinator1', password: 'Password@123' });
    expect(coordLogin.status).toBe(200);
    coordinatorToken = coordLogin.body.data.token;

    // 3. Authenticate Teacher
    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    expect(teacherLogin.status).toBe(200);
    teacherToken = teacherLogin.body.data.token;
    teacherProfileId = teacherLogin.body.data.user.profileId;

    // 4. Authenticate Student
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    expect(studentLogin.status).toBe(200);
    studentToken = studentLogin.body.data.token;

    // Look up class, section, subject, academic year
    const clsRes = await pool.query(`SELECT id FROM classes WHERE name = 'Grade 10' LIMIT 1;`);
    classId = clsRes.rows[0].id;

    const secRes = await pool.query(`SELECT id FROM sections WHERE class_id = $1 LIMIT 1;`, [classId]);
    sectionId = secRes.rows[0].id;

    const ayRes = await pool.query(`SELECT id FROM academic_years WHERE school_id = $1 LIMIT 1;`, [schoolId]);
    academicYearId = ayRes.rows[0].id;

    const subRes = await pool.query(`SELECT id FROM subjects WHERE school_id = $1 AND code = 'MATH10' LIMIT 1;`, [schoolId]);
    mathSubjectId = subRes.rows[0].id;
  });

  afterAll(async () => {
    // End pool if running standalone
  });

  describe('RBAC & Role Enforcement', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student requests with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects teacher requests with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows coordinator role to access admin dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${coordinatorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/admin/dashboard/summary', () => {
    it('returns section-wise attendance and homework status pills, KPIs, pending leaves, and birthdays', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data).toHaveProperty('date');
      expect(data).toHaveProperty('sections');
      expect(Array.isArray(data.sections)).toBe(true);
      expect(data.sections.length).toBeGreaterThan(0);

      // Verify section status pills
      const firstSection = data.sections[0];
      expect(firstSection).toHaveProperty('class_name');
      expect(firstSection).toHaveProperty('section_name');
      expect(firstSection).toHaveProperty('total_students');
      expect(['GREEN', 'RED']).toContain(firstSection.attendance_status);
      expect(['GREEN', 'RED']).toContain(firstSection.homework_status);

      // Verify KPIs
      expect(data).toHaveProperty('kpis');
      expect(data.kpis).toHaveProperty('total_sections');
      expect(data.kpis).toHaveProperty('attendance_marked_sections');
      expect(data.kpis).toHaveProperty('attendance_pending_sections');
      expect(data.kpis).toHaveProperty('homework_assigned_sections');
      expect(data.kpis).toHaveProperty('homework_pending_sections');
      expect(data.kpis).toHaveProperty('total_absent_students');
      expect(data.kpis).toHaveProperty('total_absent_staff');
      expect(data.kpis).toHaveProperty('pending_leaves_count');
      expect(data.kpis).toHaveProperty('today_birthdays_count');

      // Verify pending leaves list
      expect(data).toHaveProperty('pending_leaves');
      expect(Array.isArray(data.pending_leaves)).toBe(true);

      // Verify today birthdays list
      expect(data).toHaveProperty('today_birthdays');
      expect(Array.isArray(data.today_birthdays)).toBe(true);

      // Verify day-wise and monthly collection
      expect(data).toHaveProperty('daily_collection');
      expect(data.daily_collection).toHaveProperty('total_received');
      expect(data.daily_collection).toHaveProperty('total_created');
      expect(data.daily_collection).toHaveProperty('by_mode');
      expect(data.daily_collection.by_mode).toHaveProperty('cash');
      expect(data.daily_collection.by_mode).toHaveProperty('online');
      expect(data.daily_collection.by_mode).toHaveProperty('cheque');
      expect(data.daily_collection.by_mode).toHaveProperty('upi');

      expect(data).toHaveProperty('monthly_collection');
      expect(data.monthly_collection).toHaveProperty('total_received');
      expect(data.monthly_collection).toHaveProperty('total_created');
      expect(data.monthly_collection).toHaveProperty('by_mode');
    });
  });

  describe('GET /api/v1/admin/timetable/grid', () => {
    it('returns 400 if class_id or section_id is missing', async () => {
      const res = await request(app)
        .get('/api/v1/admin/timetable/grid')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns full day-wise (1-6) x period-wise (1-8) matrix for selected class and section', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/timetable/grid?class_id=${classId}&section_id=${sectionId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const grid = res.body.data;
      expect(grid.class_id).toBe(classId);
      expect(grid.section_id).toBe(sectionId);
      expect(grid).toHaveProperty('academic_year_id');
      expect(grid).toHaveProperty('slots');
      expect(grid).toHaveProperty('matrix');

      // Verify matrix structure covers days 1 to 6 and periods 1 to 8
      for (let day = 1; day <= 6; day++) {
        expect(grid.matrix).toHaveProperty(day.toString());
        for (let p = 1; p <= 8; p++) {
          expect(grid.matrix[day.toString()]).toHaveProperty(p.toString());
          expect(Array.isArray(grid.matrix[day.toString()][p.toString()])).toBe(true);
        }
      }
    });
  });

  describe('POST /api/v1/admin/timetable/grid', () => {
    it('validates required fields in timetable grid update', async () => {
      const res = await request(app)
        .post('/api/v1/admin/timetable/grid')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          class_id: classId,
          section_id: sectionId,
          slots: [
            {
              day_of_week: 1,
              // missing period_number, times, teacher, subject
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('saves master timetable grid slots and returns updated grid', async () => {
      const newSlots = [
        {
          day_of_week: 1,
          period_number: 1,
          start_time: '08:00:00',
          end_time: '08:45:00',
          subject_id: mathSubjectId,
          teacher_id: teacherProfileId,
          room_number: '101',
        },
        {
          day_of_week: 1,
          period_number: 2,
          start_time: '08:45:00',
          end_time: '09:30:00',
          subject_id: mathSubjectId,
          teacher_id: teacherProfileId,
          room_number: '101',
        },
      ];

      const res = await request(app)
        .post('/api/v1/admin/timetable/grid')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          class_id: classId,
          section_id: sectionId,
          academic_year_id: academicYearId,
          slots: newSlots,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('updated successfully');
      expect(res.body.data.slots.length).toBeGreaterThanOrEqual(2);

      // Verify persistent in GET /api/v1/admin/timetable/grid
      const getRes = await request(app)
        .get(`/api/v1/admin/timetable/grid?class_id=${classId}&section_id=${sectionId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(getRes.status).toBe(200);
      const day1p1 = getRes.body.data.matrix['1']['1'];
      expect(day1p1.length).toBeGreaterThanOrEqual(1);
      expect(day1p1[0].subject_id).toBe(mathSubjectId);
    });
  });

  describe('GET /api/v1/admin/reports/greensheet', () => {
    it('returns 400 if class_id or section_id is missing', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/greensheet')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns master tabulation report card (greensheet) with student-wise subject marks, totals, and ranks', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/reports/greensheet?class_id=${classId}&section_id=${sectionId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const greensheet = res.body.data;
      expect(greensheet).toHaveProperty('class_name');
      expect(greensheet).toHaveProperty('section_name');
      expect(greensheet).toHaveProperty('subjects');
      expect(Array.isArray(greensheet.subjects)).toBe(true);

      expect(greensheet).toHaveProperty('students');
      expect(Array.isArray(greensheet.students)).toBe(true);
      expect(greensheet.students.length).toBeGreaterThan(0);

      // Inspect student row
      const firstStudent = greensheet.students[0];
      expect(firstStudent).toHaveProperty('student_id');
      expect(firstStudent).toHaveProperty('student_name');
      expect(firstStudent).toHaveProperty('roll_number');
      expect(firstStudent).toHaveProperty('subject_marks');
      expect(firstStudent).toHaveProperty('total_marks_obtained');
      expect(firstStudent).toHaveProperty('total_max_marks');
      expect(firstStudent).toHaveProperty('percentage');
      expect(firstStudent).toHaveProperty('grade');
      expect(firstStudent).toHaveProperty('rank');

      // Verify summary statistics
      expect(greensheet).toHaveProperty('statistics');
      expect(greensheet.statistics).toHaveProperty('total_enrolled');
      expect(greensheet.statistics).toHaveProperty('total_appeared');
      expect(greensheet.statistics).toHaveProperty('total_passed');
      expect(greensheet.statistics).toHaveProperty('total_failed');
      expect(greensheet.statistics).toHaveProperty('class_average_percentage');
      expect(greensheet.statistics).toHaveProperty('highest_percentage');
      expect(greensheet.statistics).toHaveProperty('lowest_percentage');
      expect(greensheet.statistics).toHaveProperty('pass_percentage');
    });
  });

  describe('Admin Homework Assignment & Edit Endpoints', () => {
    let createdHwId: string;

    it('POST /api/v1/admin/homework - allows admin to upload/assign homework to any class and section', async () => {
      const res = await request(app)
        .post('/api/v1/admin/homework')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          class_id: classId,
          section_id: sectionId,
          subject_id: mathSubjectId,
          title: 'Integration Test Homework',
          description: 'Solve exercises 5.1 to 5.4 in notebook.',
          assigned_date: '2026-10-23',
          due_date: '2026-10-26',
          attachment_name: 'test_worksheet.pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Integration Test Homework');
      expect(res.body.data.class_id).toBe(classId);
      expect(res.body.data.section_id).toBe(sectionId);
      createdHwId = res.body.data.id;
    });

    it('PATCH /api/v1/admin/homework/:id - allows admin to edit homework title, description, and deadlines', async () => {
      expect(createdHwId).toBeDefined();
      const res = await request(app)
        .patch(`/api/v1/admin/homework/${createdHwId}`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          title: 'Updated Integration Test Homework',
          description: 'Solve exercises 5.1 to 5.5 and submit online.',
          due_date: '2026-10-27',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Integration Test Homework');
      expect(res.body.data.due_date).toBe('2026-10-27');
    });

    it('DELETE /api/v1/admin/homework/:id - allows admin to delete homework', async () => {
      expect(createdHwId).toBeDefined();
      const res = await request(app)
        .delete(`/api/v1/admin/homework/${createdHwId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
    });
  });

  describe('Staff Credentials and Inactive Lifecycle', () => {
    let testStaffId: string;

    it('GET /api/v1/admin/staff - returns staff with username and password properties', async () => {
      const res = await request(app)
        .get('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const staff = res.body.data[0];
      expect(staff).toHaveProperty('username');
      expect(staff).toHaveProperty('password');
      expect(staff).toHaveProperty('is_active');
    });

    it('POST /api/v1/admin/staff - creates staff with assigned password and username', async () => {
      const uniqueCode = `EMP-TEST-${Date.now().toString().slice(-4)}`;
      const uniqueUser = `test_staff_${Date.now().toString().slice(-4)}`;

      const res = await request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          first_name: 'Anita',
          last_name: 'Deshmukh',
          employee_code: uniqueCode,
          identifier: uniqueUser,
          email: `${uniqueUser}@school.internal`,
          password: 'SecretStaff@2026',
          role: 'TEACHER',
          department: 'Mathematics',
          designation: 'Senior Faculty',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      testStaffId = res.body.data.id;
    });

    it('DELETE /api/v1/admin/staff/:id - deactivates staff so they appear in inactive list', async () => {
      expect(testStaffId).toBeDefined();
      const delRes = await request(app)
        .delete(`/api/v1/admin/staff/${testStaffId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify that fetching with is_active=false includes the deactivated staff
      const inactiveRes = await request(app)
        .get('/api/v1/admin/staff?is_active=false')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(inactiveRes.status).toBe(200);
      const foundInInactive = inactiveRes.body.data.find((s: any) => s.id === testStaffId);
      expect(foundInInactive).toBeDefined();
      expect(foundInInactive.is_active).toBe(false);
      expect(foundInInactive.password).toBe('SecretStaff@2026');

      // Verify NOT present in active list
      const activeRes = await request(app)
        .get('/api/v1/admin/staff?is_active=true')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(activeRes.status).toBe(200);
      const foundInActive = activeRes.body.data.find((s: any) => s.id === testStaffId);
      expect(foundInActive).toBeUndefined();
    });

    it('PATCH /api/v1/admin/staff/:id - reactivates staff and restores them to active list', async () => {
      expect(testStaffId).toBeDefined();
      const patchRes = await request(app)
        .patch(`/api/v1/admin/staff/${testStaffId}`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({ is_active: true });

      expect(patchRes.status).toBe(200);

      // Verify staff is now active again
      const activeRes = await request(app)
        .get('/api/v1/admin/staff?is_active=true')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(activeRes.status).toBe(200);
      const foundInActive = activeRes.body.data.find((s: any) => s.id === testStaffId);
      expect(foundInActive).toBeDefined();
      expect(foundInActive.is_active).toBe(true);
    });
  });

  describe('Bulk Ingestion, Academic Allocations & 360-Degree Inspector', () => {
    let uploadedStudentId: string;
    let uploadedTeacherId: string;

    it('POST /api/v1/admin/students/bulk-upload - uploads students and auto-maps to classes/sections', async () => {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const res = await request(app)
        .post('/api/v1/admin/students/bulk-upload')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          students: [
            {
              admission_no: `BULK_STU_${uniqueSuffix}_1`,
              roll_no: '101',
              first_name: 'Aarav',
              last_name: 'Sharma',
              class_name: 'Grade 10',
              section_name: 'Section A',
              gender: 'MALE',
              phone: '9876543210',
            },
            {
              admission_no: `BULK_STU_${uniqueSuffix}_2`,
              roll_no: '102',
              first_name: 'Diya',
              last_name: 'Patel',
              class_name: 'Grade 9',
              section_name: 'Section B',
              gender: 'FEMALE',
              phone: '9876543211',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.created).toBeGreaterThanOrEqual(1);

      // Verify students appear in list
      const listRes = await request(app)
        .get(`/api/v1/admin/students?search=Aarav`)
        .set('Authorization', `Bearer ${managementToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
      uploadedStudentId = listRes.body.data[0].id;
    });

    it('POST /api/v1/admin/staff/bulk-upload - uploads staff roster and creates credentials', async () => {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const res = await request(app)
        .post('/api/v1/admin/staff/bulk-upload')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          staff: [
            {
              employee_code: `BULK_EMP_${uniqueSuffix}_1`,
              first_name: 'Sunil',
              last_name: 'Mishra',
              email: `sunil_${uniqueSuffix}@school.edu`,
              phone: '9876500001',
              qualification: 'M.Sc Physics',
              department: 'Science',
              designation: 'Senior Faculty',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.created).toBe(1);

      const staffRes = await request(app)
        .get(`/api/v1/admin/staff?search=Sunil`)
        .set('Authorization', `Bearer ${managementToken}`);
      expect(staffRes.status).toBe(200);
      expect(staffRes.body.data.length).toBeGreaterThanOrEqual(1);
      uploadedTeacherId = staffRes.body.data[0].id;
    });

    it('GET & POST /api/v1/admin/academics/allocations - manages class teacher and subject teacher allocations', async () => {
      // 1. Get allocations
      const getRes = await request(app)
        .get('/api/v1/admin/academics/allocations')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(Array.isArray(getRes.body.data.allocations)).toBe(true);
      expect(Array.isArray(getRes.body.data.teachers)).toBe(true);

      const firstSec = getRes.body.data.allocations[0];
      expect(firstSec).toBeDefined();

      // 2. Save allocations
      const saveRes = await request(app)
        .post('/api/v1/admin/academics/allocations')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          class_id: firstSec.class_id,
          section_id: firstSec.section_id,
          class_teacher_id: uploadedTeacherId || teacherProfileId,
          subject_allocations: firstSec.subjects.map((sub: any) => ({
            subject_id: sub.subject_id,
            teacher_id: uploadedTeacherId || teacherProfileId,
          })),
        });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);

      // Verify updated allocations
      const verifyRes = await request(app)
        .get('/api/v1/admin/academics/allocations')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(verifyRes.status).toBe(200);
      const updatedSec = verifyRes.body.data.allocations.find(
        (a: any) => a.class_id === firstSec.class_id && a.section_id === firstSec.section_id
      );
      expect(updatedSec).toBeDefined();
      expect(updatedSec.class_teacher).not.toBeNull();
    });

    it('GET /api/v1/admin/dashboard/student-inspect/:id - returns student 360 overview', async () => {
      expect(uploadedStudentId).toBeDefined();
      const res = await request(app)
        .get(`/api/v1/admin/dashboard/student-inspect/${uploadedStudentId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.attendance).toBeDefined();
      expect(res.body.data.fees).toBeDefined();
    });

    it('GET /api/v1/admin/dashboard/teacher-inspect/:id - returns teacher 360 overview', async () => {
      expect(uploadedTeacherId).toBeDefined();
      const res = await request(app)
        .get(`/api/v1/admin/dashboard/teacher-inspect/${uploadedTeacherId}`)
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teacher).toBeDefined();
      expect(res.body.data.class_teacher_of).toBeDefined();
      expect(res.body.data.subjects_taught).toBeDefined();
    });
  });
});

