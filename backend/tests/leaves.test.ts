import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Leave Management API Tests', () => {
  let studentToken: string;
  let teacherToken: string;
  let coordinatorToken: string;
  let managementToken: string;
  let createdStaffLeaveId: string;

  beforeAll(async () => {
    // Login Student 1
    const sRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    studentToken = sRes.body.data.token;

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

    // Login Management 1
    const mRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'management1', password: 'Password@123' });
    managementToken = mRes.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Staff Leave Submission & Tracking', () => {
    it('should allow teacher to submit leave application with valid dates', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/staff')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          leaveType: 'SICK',
          startDate: '2026-11-01',
          endDate: '2026-11-03',
          reason: 'Severe viral fever and recovery rest',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.leave_type).toBe('SICK');
      createdStaffLeaveId = res.body.data.id;
    });

    it('should allow teacher to apply staff leave using snake_case payload from mobile client', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/staff')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          start_date: '2026-11-20',
          end_date: '2026-11-21',
          leave_type: 'CASUAL',
          reason: 'Personal urgent work at hometown',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.leave_type).toBe('CASUAL');
    });

    it('should reject staff leave when end date is earlier than start date', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/staff')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          leaveType: 'CASUAL',
          startDate: '2026-11-05',
          endDate: '2026-11-01',
          reason: 'Invalid date range test',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('earlier than start date');
    });

    it('should allow teacher to fetch their own leaves list', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/staff/my-leaves')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((l: any) => l.id === createdStaffLeaveId)).toBe(true);
    });
  });

  describe('Staff Leave Coordinator Recommendation', () => {
    it('should allow coordinator to recommend a pending teacher leave', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/staff/${createdStaffLeaveId}/recommend`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          recommendation: 'Syllabus covered. Recommend approval.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RECOMMENDED');
      expect(res.body.data.coordinator_recommendation).toBe('Syllabus covered. Recommend approval.');
      expect(res.body.data.recommended_by_name).toBeTruthy();
    });

    it('should REJECT teacher trying to recommend a leave with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/staff/${createdStaffLeaveId}/recommend`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          recommendation: 'Unauthorized self-recommendation',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Staff Leave Management Decision (Approve / Reject)', () => {
    it('should allow Management to view the pending approval queue', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/staff/management-queue')
        .set('Authorization', `Bearer ${managementToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should REJECT coordinator trying to execute final sanction with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/staff/${createdStaffLeaveId}/decide`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          decision: 'APPROVED',
          comment: 'Coordinator unauthorized to approve',
        });

      expect(res.status).toBe(403);
    });

    it('should allow Management to approve the recommended teacher leave', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/staff/${createdStaffLeaveId}/decide`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          decision: 'APPROVED',
          comment: 'Sanctioned with full pay.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.management_comment).toBe('Sanctioned with full pay.');
      expect(res.body.data.sanctioned_at).toBeTruthy();
    });

    it('should prevent altering decision for an already sanctioned leave (Invalid state transition)', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/staff/${createdStaffLeaveId}/decide`)
        .set('Authorization', `Bearer ${managementToken}`)
        .send({
          decision: 'REJECTED',
          comment: 'Attempting override after approval',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already sanctioned');
    });
  });

  describe('Student Leave Endpoints', () => {
    let studentLeaveId: string;

    it('should allow student to submit a leave application', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          startDate: '2026-11-10',
          endDate: '2026-11-12',
          reason: 'Family out of station travel',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      studentLeaveId = res.body.data.id;
    });

    it('should allow coordinator to recommend a pending teacher leave using note field from mobile client', async () => {
      // First create another leave to recommend with note
      const createRes = await request(app)
        .post('/api/v1/leaves/staff')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          leaveType: 'CASUAL',
          startDate: '2026-11-25',
          endDate: '2026-11-26',
          reason: 'Personal work',
        });

      const noteRes = await request(app)
        .patch(`/api/v1/leaves/staff/${createRes.body.data.id}/recommend`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          note: 'Substitute assigned. Recommended.',
        });

      expect(noteRes.status).toBe(200);
      expect(noteRes.body.data.status).toBe('RECOMMENDED');
      expect(noteRes.body.data.coordinator_recommendation).toBe('Substitute assigned. Recommended.');
    });

    it('should allow student to submit a leave application using snake_case payload from mobile client', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          start_date: '2026-11-15',
          end_date: '2026-11-16',
          reason: 'Family urgent wedding ceremony',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should allow student to view their own submitted leave applications', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/student/my-leaves')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((l: any) => l.id === studentLeaveId)).toBe(true);
    });

    it('should verify that unconfirmed student leave approval endpoint is NOT exposed (returns 404)', async () => {
      // Per client directives, student leave approval path is withheld pending workflow confirmation
      const res = await request(app)
        .patch(`/api/v1/leaves/student/${studentLeaveId}/approve`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(404);
    });
  });
});
