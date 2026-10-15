import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Multi-Tenant SaaS Synchronization & Cross-Tenant Security Tests', () => {
  // School 1 (Apex International)
  let school1Id: string;
  let school1ClassId: string;
  let school1SectionId: string;
  let school1SubjectId: string;
  let teacher1Token: string;
  let student1Token: string;
  let student1ProfileId: string;

  // School 2 (Horizon Academy)
  let school2Id: string;
  let school2ClassId: string;
  let school2SectionId: string;
  let school2SubjectId: string;
  let teacherHorizonToken: string;
  let studentHorizonToken: string;
  let studentHorizonProfileId: string;

  const testAttendanceDate = '2026-09-18';

  beforeAll(async () => {
    // 1. Fetch School 1 details and log in School 1 users
    const s1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    student1Token = s1Res.body.data.token;
    student1ProfileId = s1Res.body.data.user.profileId;
    school1Id = s1Res.body.data.user.schoolId;
    school1ClassId = s1Res.body.data.user.classId;
    school1SectionId = s1Res.body.data.user.sectionId;

    const t1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    teacher1Token = t1Res.body.data.token;

    const sub1Res = await pool.query(
      `SELECT id FROM subjects WHERE school_id = $1 AND code = 'MATH10' LIMIT 1;`,
      [school1Id]
    );
    school1SubjectId = sub1Res.rows[0].id;

    // 2. Provision School 2 ("Horizon Academy") if not exists
    const school2Query = await pool.query(
      `INSERT INTO schools (name, code, contact_email, contact_phone, address)
       VALUES ('Horizon Academy', 'HORIZON_SAAS_TEST', 'info@horizon.edu', '+91 9112233445', '45 Knowledge Hub, Sector 9')
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`
    );
    school2Id = school2Query.rows[0].id;

    // School 2 Academic Year
    const ay2Res = await pool.query(
      `INSERT INTO academic_years (school_id, label, start_date, end_date, is_current)
       VALUES ($1, '2026-2027', '2026-04-01', '2027-03-31', TRUE)
       ON CONFLICT (school_id, label) DO UPDATE SET is_current = EXCLUDED.is_current
       RETURNING id;`,
      [school2Id]
    );
    const ay2Id = ay2Res.rows[0].id;

    // School 2 Wing
    const wing2Res = await pool.query(
      `INSERT INTO wings (school_id, name)
       VALUES ($1, 'Middle Wing')
       ON CONFLICT (school_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [school2Id]
    );
    const wing2Id = wing2Res.rows[0].id;

    // School 2 Class ("Grade 8")
    const class2Res = await pool.query(
      `INSERT INTO classes (school_id, wing_id, name)
       VALUES ($1, $2, 'Grade 8')
       ON CONFLICT (school_id, name) DO UPDATE SET wing_id = EXCLUDED.wing_id
       RETURNING id;`,
      [school2Id, wing2Id]
    );
    school2ClassId = class2Res.rows[0].id;

    // School 2 Section ("Section B")
    const sec2Res = await pool.query(
      `INSERT INTO sections (class_id, name)
       VALUES ($1, 'Section B')
       ON CONFLICT (class_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [school2ClassId]
    );
    school2SectionId = sec2Res.rows[0].id;

    // School 2 Subject ("Physics 08")
    const sub2Res = await pool.query(
      `INSERT INTO subjects (school_id, name, code)
       VALUES ($1, 'Physics', 'PHY08')
       ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [school2Id]
    );
    school2SubjectId = sub2Res.rows[0].id;

    await pool.query(
      `INSERT INTO class_subjects (class_id, subject_id, is_elective)
       VALUES ($1, $2, FALSE)
       ON CONFLICT (class_id, subject_id) DO NOTHING;`,
      [school2ClassId, school2SubjectId]
    );

    // Get role IDs
    const teacherRoleRes = await pool.query(`SELECT id FROM roles WHERE name = 'TEACHER';`);
    const studentRoleRes = await pool.query(`SELECT id FROM roles WHERE name = 'STUDENT';`);
    const teacherRoleId = teacherRoleRes.rows[0].id;
    const studentRoleId = studentRoleRes.rows[0].id;

    const pwHash = await bcrypt.hash('Password@123', 10);

    // School 2 Teacher
    const tHorizUser = await pool.query(
      `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
       VALUES ($1, 'teacher_horizon', 'teacher@horizon.edu', '9111111111', $2, TRUE)
       ON CONFLICT (identifier) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id;`,
      [school2Id, pwHash]
    );
    const tHorizUserId = tHorizUser.rows[0].id;

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
      [tHorizUserId, teacherRoleId]
    );

    const tHorizStaff = await pool.query(
      `INSERT INTO staff_profiles (
        user_id, employee_code, first_name, last_name, gender, date_of_birth, qualification,
        joining_date, emergency_phone, phone, blood_group
       ) VALUES ($1, 'EMP-HORIZON-01', 'Vikram', 'Mehta', 'Male', '1985-04-12', 'M.Sc. Physics', '2024-01-10', '9111111111', '9111111111', 'O+')
       ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id;`,
      [tHorizUserId]
    );
    const tHorizStaffId = tHorizStaff.rows[0].id;

    // Allocate School 2 Teacher to Grade 8, Section B, Physics
    await pool.query(
      `INSERT INTO teacher_subject_allocations (staff_id, class_id, section_id, subject_id, academic_year_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING;`,
      [tHorizStaffId, school2ClassId, school2SectionId, school2SubjectId, ay2Id]
    );

    // Also assign as Class Teacher for Grade 8 Section B
    await pool.query(
      `INSERT INTO staff_assignments (staff_id, wing_id, class_id, section_id, assignment_type)
       VALUES ($1, $2, $3, $4, 'CLASS_TEACHER')
       ON CONFLICT DO NOTHING;`,
      [tHorizStaffId, wing2Id, school2ClassId, school2SectionId]
    );

    // School 2 Student
    const sHorizUser = await pool.query(
      `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
       VALUES ($1, 'student_horizon', 'student@horizon.edu', '9222222222', $2, TRUE)
       ON CONFLICT (identifier) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id;`,
      [school2Id, pwHash]
    );
    const sHorizUserId = sHorizUser.rows[0].id;

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
      [sHorizUserId, studentRoleId]
    );

    const sHorizProfile = await pool.query(
      `INSERT INTO student_profiles (
        user_id, admission_number, roll_number, first_name, last_name, gender,
        date_of_birth, admission_date, current_class_id, current_section_id, emergency_phone, blood_group
       ) VALUES ($1, 'ADM-HORIZON-01', '801', 'Priya', 'Verma', 'Female', '2012-09-14', '2026-04-01', $2, $3, '9222222222', 'B+')
       ON CONFLICT (user_id) DO UPDATE SET current_class_id = EXCLUDED.current_class_id
       RETURNING id;`,
      [sHorizUserId, school2ClassId, school2SectionId]
    );
    studentHorizonProfileId = sHorizProfile.rows[0].id;

    // Login Horizon Teacher and Student
    const thRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher_horizon', password: 'Password@123' });
    teacherHorizonToken = thRes.body.data.token;

    const shRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student_horizon', password: 'Password@123' });
    studentHorizonToken = shRes.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('1. Dynamic Teacher Allocation & Isolation', () => {
    it('should return School 1 teacher allocations and homeroom for Apex teacher', async () => {
      const res = await request(app)
        .get('/api/v1/academics/my-allocations')
        .set('Authorization', `Bearer ${teacher1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.homeroom).toBeDefined();
      expect(res.body.data.homeroom.class_id).toBe(school1ClassId);
      expect(Array.isArray(res.body.data.allocations)).toBe(true);
      expect(res.body.data.allocations.some((a: any) => a.class_id === school1ClassId)).toBe(true);
      // Must NOT include School 2
      expect(res.body.data.allocations.some((a: any) => a.class_id === school2ClassId)).toBe(false);
    });

    it('should return School 2 teacher allocations for Horizon teacher', async () => {
      const res = await request(app)
        .get('/api/v1/academics/my-allocations')
        .set('Authorization', `Bearer ${teacherHorizonToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.allocations.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.allocations.some((a: any) => a.class_id === school2ClassId)).toBe(true);
      expect(res.body.data.allocations.some((a: any) => a.subject_code === 'PHY08')).toBe(true);
      // Must NOT include School 1
      expect(res.body.data.allocations.some((a: any) => a.class_id === school1ClassId)).toBe(false);
    });
  });

  describe('2. Cross-School Class Roster Security', () => {
    it('should allow School 1 teacher to view School 1 class roster', async () => {
      const res = await request(app)
        .get(`/api/v1/academics/class-roster/${school1ClassId}/${school1SectionId}`)
        .set('Authorization', `Bearer ${teacher1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((s: any) => s.id === student1ProfileId)).toBe(true);
    });

    it('should DENY School 1 teacher viewing School 2 class roster with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/academics/class-roster/${school2ClassId}/${school2SectionId}`)
        .set('Authorization', `Bearer ${teacher1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should DENY School 2 teacher viewing School 1 class roster with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/academics/class-roster/${school1ClassId}/${school1SectionId}`)
        .set('Authorization', `Bearer ${teacherHorizonToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should DENY School 1 student viewing School 2 class roster with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/academics/class-roster/${school2ClassId}/${school2SectionId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Attendance Synchronization & Cross-Tenant Isolation', () => {
    it('should synchronize teacher attendance marking with student attendance history', async () => {
      // 1. Teacher marks attendance for Student 1
      const markRes = await request(app)
        .post('/api/v1/attendance/student')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          classId: school1ClassId,
          sectionId: school1SectionId,
          date: testAttendanceDate,
          records: [
            { studentId: student1ProfileId, status: 'PRESENT', remarks: 'On time' },
          ],
        });

      expect(markRes.status).toBe(200);
      expect(markRes.body.success).toBe(true);

      // 2. Student 1 queries own attendance history
      const studentHistoryRes = await request(app)
        .get('/api/v1/attendance/student/my-history')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(studentHistoryRes.status).toBe(200);
      expect(studentHistoryRes.body.success).toBe(true);
      const match = studentHistoryRes.body.data.find(
        (r: any) => r.attendance_date.startsWith(testAttendanceDate)
      );
      expect(match).toBeDefined();
      expect(match.status).toBe('PRESENT');
      expect(match.remarks).toBe('On time');

      // 3. School 2 student must NOT see School 1 student attendance
      const s2HistoryRes = await request(app)
        .get('/api/v1/attendance/student/my-history')
        .set('Authorization', `Bearer ${studentHorizonToken}`);

      expect(s2HistoryRes.status).toBe(200);
      expect(s2HistoryRes.body.data.some((r: any) => r.student_id === student1ProfileId)).toBe(false);
    });

    it('should DENY School 1 teacher marking attendance for School 2 class with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/student')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          classId: school2ClassId,
          sectionId: school2SectionId,
          date: testAttendanceDate,
          records: [
            { studentId: studentHorizonProfileId, status: 'PRESENT' },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Homework Synchronization, Completion Tracking & Isolation', () => {
    let createdHomeworkId: string;

    it('should synchronize teacher homework assignment with student my-class and track completion', async () => {
      // 1. School 1 Teacher creates homework
      const createRes = await request(app)
        .post('/api/v1/homework')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          classId: school1ClassId,
          sectionId: school1SectionId,
          subjectId: school1SubjectId,
          title: 'SaaS Sync Quadratic Equations Practice',
          description: 'Solve exercises 4.1 to 4.3 from textbook.',
          dueDate: '2026-10-30',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      createdHomeworkId = createRes.body.data.id;

      // 2. School 1 Student views my-class homework
      const studentHwRes = await request(app)
        .get('/api/v1/homework/student/my-class')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(studentHwRes.status).toBe(200);
      expect(studentHwRes.body.success).toBe(true);
      const hwItem = studentHwRes.body.data.find((h: any) => h.id === createdHomeworkId);
      expect(hwItem).toBeDefined();
      expect(hwItem.student_status).toBe('PENDING');

      // 3. School 2 Student must NOT see School 1 homework
      const s2HwRes = await request(app)
        .get('/api/v1/homework/student/my-class')
        .set('Authorization', `Bearer ${studentHorizonToken}`);

      expect(s2HwRes.status).toBe(200);
      expect(s2HwRes.body.data.some((h: any) => h.id === createdHomeworkId)).toBe(false);

      // 4. School 1 Student marks homework COMPLETED
      const toggleRes = await request(app)
        .post(`/api/v1/homework/${createdHomeworkId}/completion`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ status: 'COMPLETED' });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.success).toBe(true);
      expect(toggleRes.body.data.status).toBe('COMPLETED');

      // 5. School 1 Teacher views assigned homework and verifies completed_count is updated
      const teacherHwRes = await request(app)
        .get('/api/v1/homework/teacher/my-assigned')
        .set('Authorization', `Bearer ${teacher1Token}`);

      expect(teacherHwRes.status).toBe(200);
      const teacherHwItem = teacherHwRes.body.data.find((h: any) => h.id === createdHomeworkId);
      expect(teacherHwItem).toBeDefined();
      expect(teacherHwItem.completed_count).toBeGreaterThanOrEqual(1);

      // 6. School 2 student attempting to mark School 1 homework completion gets 403
      const crossCompleteRes = await request(app)
        .post(`/api/v1/homework/${createdHomeworkId}/completion`)
        .set('Authorization', `Bearer ${studentHorizonToken}`)
        .send({ status: 'COMPLETED' });

      expect(crossCompleteRes.status).toBe(403);
    });
  });

  describe('5. Profile Updates & Resource-Level Scoping', () => {
    it('should update permitted fields for student and persist accurately', async () => {
      const updateRes = await request(app)
        .patch('/api/v1/profiles/student')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          emergency_phone: '9988776655',
          blood_group: 'AB+',
          medical_notes: 'Mild dust allergy',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.emergency_phone).toBe('9988776655');
      expect(updateRes.body.data.blood_group).toBe('AB+');

      // Verify get student profile
      const getRes = await request(app)
        .get('/api/v1/profiles/student')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.emergency_phone).toBe('9988776655');
      expect(getRes.body.data.blood_group).toBe('AB+');
    });

    it('should update permitted fields for teacher profile', async () => {
      const updateRes = await request(app)
        .patch('/api/v1/profiles/staff')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          qualification: 'M.Sc., M.Ed., Ph.D.',
          blood_group: 'B+',
          emergency_phone: '9888877777',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.qualification).toBe('M.Sc., M.Ed., Ph.D.');
    });
  });

  describe('6. Examination Publication & Cross-Tenant Results Isolation', () => {
    let examId: string;
    let datesheetId: string;
    let coordinatorToken: string;

    beforeAll(async () => {
      const cRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'coordinator1', password: 'Password@123' });
      coordinatorToken = cRes.body.data.token;

      // Fetch School 1 Academic Year & Senior Wing
      const ayRes = await pool.query(
        `SELECT id FROM academic_years WHERE school_id = $1 LIMIT 1;`,
        [school1Id]
      );
      const wingRes = await pool.query(
        `SELECT id FROM wings WHERE school_id = $1 AND name = 'Senior Wing' LIMIT 1;`,
        [school1Id]
      );

      // Create an unpublished exam in School 1
      const examRes = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          academicYearId: ayRes.rows[0].id,
          wingId: wingRes.rows[0].id,
          name: 'Multi-Tenant Term Assessment 2026',
          startDate: '2026-11-01',
          endDate: '2026-11-10',
        });
      examId = examRes.body.data.id;

      // Create datesheet for Math
      const dsRes = await request(app)
        .post(`/api/v1/exams/${examId}/datesheets`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          classId: school1ClassId,
          sectionId: school1SectionId,
          subjectId: school1SubjectId,
          examDate: '2026-11-02',
          startTime: '09:00:00',
          endTime: '12:00:00',
          maxMarks: 100,
          passingMarks: 33,
        });
      datesheetId = dsRes.body.data.id;
    });

    it('should REJECT student accessing unpublished exam details with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${examId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      const errMsg = typeof res.body.error === 'string' ? res.body.error : res.body.error?.message || res.body.message;
      expect(errMsg).toContain('not been published yet');
    });

    it('should REJECT student accessing results for unpublished exam with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${examId}/results/me`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
    });

    it('should enforce report card approval workflow before student can view results', async () => {
      // 1. Teacher enters marks
      const marksRes = await request(app)
        .post(`/api/v1/exams/${examId}/datesheets/${datesheetId}/marks`)
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          submitForVerification: true,
          entries: [
            { student_id: student1ProfileId, marks_obtained: 88.5, is_absent: false },
          ],
        });
      expect(marksRes.status).toBe(200);

      // 2. Coordinator verifies marks
      await request(app)
        .patch(`/api/v1/exams/${examId}/datesheets/${datesheetId}/verify-marks`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      // 3. Class teacher generates report cards (state: GENERATED)
      await request(app)
        .post(`/api/v1/exams/${examId}/classes/${school1ClassId}/sections/${school1SectionId}/generate-report-cards`)
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({ remarks: 'Excellent performance' });

      // 4. Coordinator publishes the exam
      await request(app)
        .patch(`/api/v1/exams/${examId}/publish`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ isPublished: true });

      // 5. Student result still forbidden because report card is not APPROVED yet
      const preApprovalRes = await request(app)
        .get(`/api/v1/exams/${examId}/results/me`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(preApprovalRes.status).toBe(403);
      const preErrMsg = typeof preApprovalRes.body.error === 'string' ? preApprovalRes.body.error : preApprovalRes.body.error?.message || preApprovalRes.body.message;
      expect(preErrMsg).toContain('not been approved and published yet');

      // 6. Coordinator approves report cards
      await request(app)
        .patch(`/api/v1/exams/${examId}/classes/${school1ClassId}/sections/${school1SectionId}/approve-report-cards`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      // 7. Student can now see their approved result
      const approvedRes = await request(app)
        .get(`/api/v1/exams/${examId}/results/me`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(approvedRes.status).toBe(200);
      expect(approvedRes.body.success).toBe(true);
      expect(approvedRes.body.data.reportCard.status).toBe('APPROVED');
      expect(Number(approvedRes.body.data.reportCard.percentage)).toBe(88.5);

      // 8. School 2 student must NOT see School 1 exam results
      const s2ExamRes = await request(app)
        .get(`/api/v1/exams/${examId}/results/me`)
        .set('Authorization', `Bearer ${studentHorizonToken}`);

      expect(s2ExamRes.status).toBe(404); // Exam belongs to school 1, not school 2
    });
  });
});
