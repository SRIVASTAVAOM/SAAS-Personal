import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Student Dashboard Features API Tests', () => {
  let studentToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    const sRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    studentToken = sRes.body.data.token;

    const tRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    teacherToken = tRes.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('1. Class Teacher & Subject Teachers', () => {
    it('GET /api/v1/academics/subject-teachers returns Class Teacher and subject teachers', async () => {
      const res = await request(app)
        .get('/api/v1/academics/subject-teachers')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify Class Teacher is present
      const classTeacher = res.body.data.find((t: any) => t.is_class_teacher === true);
      expect(classTeacher).toBeDefined();
      expect(classTeacher.subject_name).toContain('Class Teacher');
      expect(classTeacher.teacher_name).toBeDefined();
    });
  });

  describe('2. Classmates Birthdays', () => {
    it('GET /api/v1/academics/classmates-birthdays returns birthdays for same class & section', async () => {
      const res = await request(app)
        .get('/api/v1/academics/classmates-birthdays')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const first = res.body.data[0];
      expect(first.first_name).toBeDefined();
      expect(first.birth_month).toBeDefined();
      expect(first.birth_day).toBeDefined();
      expect(first.birthday_formatted).toBeDefined();
      // Verify year is NOT exposed for privacy
      expect(first.date_of_birth).toBeUndefined();
    });
  });

  describe('3. Notices for Student', () => {
    it('GET /api/v1/notices/student returns applicable notices', async () => {
      const res = await request(app)
        .get('/api/v1/notices/student')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const notice = res.body.data[0];
      expect(notice.title).toBeDefined();
      expect(notice.content).toBeDefined();
      expect(notice.priority).toBeDefined();
    });

    it('REJECTS unauthenticated access to /notices/student with 401', async () => {
      const res = await request(app).get('/api/v1/notices/student');
      expect(res.status).toBe(401);
    });
  });

  describe('4. Student Fees & Receipts', () => {
    it('GET /api/v1/fees/my-fees returns fee items and dues summary', async () => {
      const res = await request(app)
        .get('/api/v1/fees/my-fees')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.fees)).toBe(true);
      expect(res.body.data.fees.length).toBeGreaterThanOrEqual(1);

      const summary = res.body.data.summary;
      expect(summary.total_dues).toBeGreaterThan(0);
      expect(summary.total_paid).toBeGreaterThanOrEqual(0);
      expect(summary.total_outstanding).toBeDefined();
    });

    it('GET /api/v1/fees/my-receipts returns recorded payment receipts', async () => {
      const res = await request(app)
        .get('/api/v1/fees/my-receipts')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const receipt = res.body.data[0];
      expect(receipt.receipt_number).toBeDefined();
      expect(receipt.amount_paid).toBeGreaterThan(0);
      expect(receipt.payment_mode).toBeDefined();
    });

    it('REJECTS teacher accessing student fee endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/fees/my-fees')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('5. Complaints & Feedback', () => {
    it('POST /api/v1/support/complaints submits a new complaint', async () => {
      const res = await request(app)
        .post('/api/v1/support/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Physics Lab Apparatus issue',
          category: 'FACILITY',
          description: 'The ammeter in Table 3 was giving unstable readings during experiment.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Physics Lab Apparatus issue');
      expect(res.body.data.status).toBe('PENDING');
    });

    it('GET /api/v1/support/complaints returns student complaints history', async () => {
      const res = await request(app)
        .get('/api/v1/support/complaints')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/v1/support/feedback submits student feedback', async () => {
      const res = await request(app)
        .post('/api/v1/support/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'CURRICULUM',
          rating: 5,
          feedback_text: 'The syllabus progression is well-structured.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
    });

    it('GET /api/v1/support/feedback returns student feedback history', async () => {
      const res = await request(app)
        .get('/api/v1/support/feedback')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
