import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Daily Attendance API Tests', () => {
  let studentToken: string;
  let teacherToken: string;
  let coordinatorToken: string;
  let managementToken: string;
  let classId: string;
  let sectionId: string;
  let student1ProfileId: string;
  let student2ProfileId: string;
  let wingId: string;

  beforeAll(async () => {
    // Login Student 1
    const sRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    studentToken = sRes.body.data.token;
    classId = sRes.body.data.user.classId;
    sectionId = sRes.body.data.user.sectionId;
    student1ProfileId = sRes.body.data.user.profileId;

    // Login Teacher 1
    const tRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    teacherToken = tRes.body.data.token;

    // Login Coordinator 1
    const cRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'coordinator1', password: 'Password@123' });
    coordinatorToken = cRes.body.data.token;
    wingId = cRes.body.data.user.wingId;

    // Login Management 1
    const mRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'management1', password: 'Password@123' });
    managementToken = mRes.body.data.token;

    // Get Student 2 profile ID
    const s2Res = await pool.query(
      `SELECT stp.id FROM student_profiles stp JOIN users u ON stp.user_id = u.id WHERE u.identifier = 'student2';`
    );
    student2ProfileId = s2Res.rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/attendance/student (Mark Attendance)', () => {
    const testDate = '2026-10-15';

    it('should allow teacher to mark student attendance for their allocated class', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/student')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          sectionId,
          date: testDate,
          records: [
            { studentId: student1ProfileId, status: 'PRESENT', remarks: 'Present in class' },
            { studentId: student2ProfileId, status: 'ABSENT', remarks: 'Sick' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB that exactly 2 records were inserted/updated
      const check = await pool.query(
        `SELECT * FROM student_attendance_records WHERE attendance_date = $1 AND class_id = $2;`,
        [testDate, classId]
      );
      expect(check.rows.length).toBe(2);
    });

    it('should support snake_case payload from Flutter mobile client', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/student')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          section_id: sectionId,
          attendance_date: testDate,
          records: [
            { student_id: student1ProfileId, status: 'PRESENT', remarks: 'Present via mobile' },
            { student_id: student2ProfileId, status: 'PRESENT', remarks: 'Present via mobile' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update existing record and PREVENT duplicate records when re-marking for same student & date', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/student')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          sectionId,
          date: testDate,
          records: [
            { studentId: student2ProfileId, status: 'PRESENT', remarks: 'Marked present on correction' },
          ],
        });

      expect(res.status).toBe(200);

      // Verify DB count remains 2 (zero duplicate rows) and status updated
      const check = await pool.query(
        `SELECT * FROM student_attendance_records WHERE attendance_date = $1 AND student_id = $2;`,
        [testDate, student2ProfileId]
      );
      expect(check.rows.length).toBe(1);
      expect(check.rows[0].status).toBe('PRESENT');
      expect(check.rows[0].remarks).toBe('Marked present on correction');
    });

    it('should REJECT teacher marking attendance for an unallocated class with 403 Forbidden', async () => {
      const unallocatedClassId = '00000000-0000-0000-0000-000000000099';
      const unallocatedSectionId = '00000000-0000-0000-0000-000000000098';

      const res = await request(app)
        .post('/api/v1/attendance/student')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: unallocatedClassId,
          sectionId: unallocatedSectionId,
          date: testDate,
          records: [
            { studentId: student1ProfileId, status: 'PRESENT' },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not authorized');
    });

    it('should REJECT student trying to mark attendance with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          sectionId,
          date: testDate,
          records: [{ studentId: student1ProfileId, status: 'PRESENT' }],
        });

      expect(res.status).toBe(403);
    });

    it('should REJECT unsupported attendance status (e.g. HALF_DAY) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/student')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          sectionId,
          date: testDate,
          records: [{ studentId: student1ProfileId, status: 'HALF_DAY' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/attendance/student/class/:classId/:sectionId', () => {
    it('should return class attendance for authorized teacher', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/student/class/${classId}/${sectionId}?date=2026-10-15`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should REJECT student accessing class attendance endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/student/class/${classId}/${sectionId}?date=2026-10-15`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/attendance/student/my-history', () => {
    it('should return student own attendance history only', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/student/my-history')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Ensure all returned records belong to student1 only
      for (const rec of res.body.data) {
        expect(rec.student_id).toBe(student1ProfileId);
      }
    });

    it('should reject teacher accessing student my-history with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/student/my-history')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Staff Attendance Endpoints', () => {
    it('GET /api/v1/attendance/staff/my-history should return teacher own attendance', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/staff/my-history')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].employee_code).toBe('EMP-TEACHER1');
    });

    it('GET /api/v1/attendance/staff/wing/:wingId returns wing staff attendance for Coordinator', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/staff/wing/${wingId}?date=2026-10-09`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('Coordinator CANNOT view staff attendance for an unassigned wing (returns 403)', async () => {
      const unassignedWingId = '00000000-0000-0000-0000-000000000077';
      const res = await request(app)
        .get(`/api/v1/attendance/staff/wing/${unassignedWingId}?date=2026-10-09`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/attendance/staff/management-overview returns all staff for Management', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/staff/management-overview?date=2026-10-14')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      const teacher = res.body.data.find((s: any) => s.employee_code === 'EMP-TEACHER1');
      expect(teacher).toBeDefined();
    });

    it('GET /api/v1/attendance/staff/management-overview REJECTS Teacher with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/staff/management-overview')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/attendance/staff allows Management to mark teacher attendance', async () => {
      // Find teacher staffId from management overview
      const overviewRes = await request(app)
        .get('/api/v1/attendance/staff/management-overview?date=2026-10-16')
        .set('Authorization', `Bearer ${managementToken}`);

      const teacher = overviewRes.body.data.find((s: any) => s.employee_code === 'EMP-TEACHER1');
      expect(teacher).toBeDefined();

      const markRes = await request(app)
        .post('/api/v1/attendance/staff')
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          date: '2026-10-16',
          records: [
            {
              staffId: teacher.staff_id,
              status: 'PRESENT',
              inTime: '08:15:00',
              outTime: '15:30:00',
              remarks: 'Marked by Management',
            },
          ],
        });

      expect(markRes.status).toBe(200);
      expect(markRes.body.success).toBe(true);
      expect(markRes.body.message).toBe('Staff attendance marked successfully');

      // Verify that teacher sees this attendance in their history
      const historyRes = await request(app)
        .get('/api/v1/attendance/staff/my-history')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(historyRes.status).toBe(200);
      const todayRecord = historyRes.body.data.find((r: any) => r.attendance_date.startsWith('2026-10-16'));
      expect(todayRecord).toBeDefined();
      expect(todayRecord.status).toBe('PRESENT');
      expect(todayRecord.remarks).toBe('Marked by Management');
    });

    it('POST /api/v1/attendance/staff REJECTS Teacher or Student with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/staff')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: '2026-10-16',
          records: [{ staffId: '5bdfcb13-5b3e-41d6-9d78-32e2f22bd597', status: 'PRESENT' }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
