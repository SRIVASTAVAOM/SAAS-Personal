import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Role-Based Authorization & Scope Tests', () => {
  let studentToken: string;
  let studentProfileId: string;
  let teacherToken: string;
  let accountantToken: string;
  let coordinatorToken: string;
  let coordinatorWingId: string;
  let managementToken: string;

  beforeAll(async () => {
    // 1. Login Student
    const studentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    studentToken = studentRes.body.data.token;
    studentProfileId = studentRes.body.data.user.profileId;

    // 2. Login Teacher
    const teacherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    teacherToken = teacherRes.body.data.token;

    // 3. Login Accountant
    const accountantRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'accountant1', password: 'Password@123' });
    accountantToken = accountantRes.body.data.token;

    // 4. Login Coordinator
    const coordinatorRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'coordinator1', password: 'Password@123' });
    coordinatorToken = coordinatorRes.body.data.token;
    coordinatorWingId = coordinatorRes.body.data.user.wingId;

    // 5. Login Management
    const mgmtRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'management1', password: 'Password@123' });
    managementToken = mgmtRes.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Role-Based Restrictions (Cross-Role Protection)', () => {
    it('Accountant can access /accountant-zone', async () => {
      const res = await request(app)
        .get('/api/v1/test-rbac/accountant-zone')
        .set('Authorization', `Bearer ${accountantToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Student CANNOT access /accountant-zone (must return 403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/test-rbac/accountant-zone')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('Teacher CANNOT access /management-zone (must return 403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/test-rbac/management-zone')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Management can access /management-zone', async () => {
      const res = await request(app)
        .get('/api/v1/test-rbac/management-zone')
        .set('Authorization', `Bearer ${managementToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Teacher can access /teacher-zone', async () => {
      const res = await request(app)
        .get('/api/v1/test-rbac/teacher-zone')
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Student can access /student-zone', async () => {
      const res = await request(app)
        .get('/api/v1/test-rbac/student-zone')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Coordinator can access /coordinator-zone', async () => {
      const res = await request(app)
        .get('/api/v1/test-rbac/coordinator-zone')
        .set('Authorization', `Bearer ${coordinatorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Resource-Level Scope Enforcement', () => {
    it('Coordinator CAN access their assigned wing', async () => {
      const res = await request(app)
        .get(`/api/v1/test-rbac/coordinator-wing/${coordinatorWingId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Coordinator CANNOT access an unassigned wing (returns 403 Forbidden)', async () => {
      const randomWingId = '00000000-0000-0000-0000-000000000099';
      const res = await request(app)
        .get(`/api/v1/test-rbac/coordinator-wing/${randomWingId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not assigned to this wing scope');
    });

    it('Student CAN access their own student profile ID', async () => {
      const res = await request(app)
        .get(`/api/v1/test-rbac/student-profile/${studentProfileId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Student CANNOT access another student profile ID (returns 403 Forbidden)', async () => {
      const otherStudentProfileId = '00000000-0000-0000-0000-000000000088';
      const res = await request(app)
        .get(`/api/v1/test-rbac/student-profile/${otherStudentProfileId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Students can only access their own records');
    });
  });
});
