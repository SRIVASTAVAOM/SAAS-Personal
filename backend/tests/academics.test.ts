import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Academics Master & Rosters API Tests', () => {
  let studentToken: string;
  let teacherToken: string;
  let classId: string;
  let sectionId: string;

  beforeAll(async () => {
    // Login Student1
    const sRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    studentToken = sRes.body.data.token;
    classId = sRes.body.data.user.classId;
    sectionId = sRes.body.data.user.sectionId;

    // Login Teacher1
    const tRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    teacherToken = tRes.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/v1/academics/subjects', () => {
    it('should return list of subjects for authenticated users', async () => {
      const res = await request(app)
        .get('/api/v1/academics/subjects')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data.some((s: any) => s.code === 'MATH10')).toBe(true);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/academics/subjects');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/academics/class-roster/:classId/:sectionId', () => {
    it('should allow student to fetch their own class roster', async () => {
      const res = await request(app)
        .get(`/api/v1/academics/class-roster/${classId}/${sectionId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // student1 and student2
      expect(res.body.data.some((s: any) => s.admission_number === 'ADM2026001')).toBe(true);
      expect(res.body.data.some((s: any) => s.admission_number === 'ADM2026002')).toBe(true);
    });

    it('should REJECT student trying to view another class roster with 403 Forbidden', async () => {
      const randomClassId = '00000000-0000-0000-0000-000000000099';
      const randomSectionId = '00000000-0000-0000-0000-000000000098';

      const res = await request(app)
        .get(`/api/v1/academics/class-roster/${randomClassId}/${randomSectionId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('outside your assigned scope');
    });

    it('should allow teacher to fetch roster for their allocated class', async () => {
      const res = await request(app)
        .get(`/api/v1/academics/class-roster/${classId}/${sectionId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/v1/academics/my-roster', () => {
    it('should return taught students for teacher', async () => {
      const res = await request(app)
        .get('/api/v1/academics/my-roster')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject student accessing my-roster with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/academics/my-roster')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/academics/subject-teachers', () => {
    it('should return allocated subject teachers for student', async () => {
      const res = await request(app)
        .get('/api/v1/academics/subject-teachers')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((t: any) => t.subject_name === 'Mathematics')).toBe(true);
      expect(res.body.data.some((t: any) => t.subject_name === 'Science')).toBe(true);
    });
  });
});
