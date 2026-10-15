import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Profile Viewing & Editing API Tests', () => {
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

  describe('Student Profile Endpoints', () => {
    it('GET /api/v1/profiles/student returns full student profile', async () => {
      const res = await request(app)
        .get('/api/v1/profiles/student')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admission_number).toBe('ADM2026001');
      expect(res.body.data.class_name).toBe('Grade 10');
      expect(res.body.data.section_name).toBe('Section A');
      expect(res.body.data.school_name).toBe('Apex International School');
    });

    it('PATCH /api/v1/profiles/student successfully updates permitted editable fields', async () => {
      const res = await request(app)
        .patch('/api/v1/profiles/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          emergency_phone: '+91 9988776655',
          blood_group: 'B+',
          medical_notes: 'Mild dust allergy',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.emergency_phone).toBe('+91 9988776655');
      expect(res.body.data.blood_group).toBe('B+');
      expect(res.body.data.medical_notes).toBe('Mild dust allergy');
    });

    it('PATCH /api/v1/profiles/student rejects invalid phone format (<5 chars)', async () => {
      const res = await request(app)
        .patch('/api/v1/profiles/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ emergency_phone: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Staff Profile Endpoints', () => {
    it('GET /api/v1/profiles/staff returns staff profile with allocations', async () => {
      const res = await request(app)
        .get('/api/v1/profiles/staff')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employee_code).toBe('EMP-TEACHER1');
      expect(typeof res.body.data.qualification).toBe('string');
      expect(res.body.data.qualification).toBeTruthy();
    });

    it('PATCH /api/v1/profiles/staff updates qualification and emergency contact', async () => {
      const res = await request(app)
        .patch('/api/v1/profiles/staff')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          emergency_phone: '+91 9123456789',
          qualification: 'M.Sc., M.Ed., Ph.D.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.qualification).toBe('M.Sc., M.Ed., Ph.D.');
    });
  });

  describe('Teacher Updating Student Profile (Class Teacher Only)', () => {
    let studentId: string;

    beforeAll(async () => {
      const sRes = await request(app)
        .get('/api/v1/profiles/student')
        .set('Authorization', `Bearer ${studentToken}`);
      studentId = sRes.body.data.id;
    });

    it('PATCH /api/v1/profiles/student/:studentId/by-teacher allows Class Teacher to update permitted fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/profiles/student/${studentId}/by-teacher`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          roll_number: '12',
          blood_group: 'AB+',
          emergency_contact_phone: '+91 9876543210',
          medical_notes: 'Asthma inhaler in bag',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roll_number).toBe('12');
      expect(res.body.data.blood_group).toBe('AB+');
      expect(res.body.data.emergency_phone).toBe('+91 9876543210');
      expect(res.body.data.medical_notes).toBe('Asthma inhaler in bag');
      // Immutable identity fields preserved
      expect(res.body.data.admission_number).toBe('ADM2026001');
    });

    it('PATCH /api/v1/profiles/student/:studentId/by-teacher rejects unauthorized role (STUDENT)', async () => {
      const res = await request(app)
        .patch(`/api/v1/profiles/student/${studentId}/by-teacher`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ roll_number: '99' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/v1/profiles/student/:studentId/by-teacher rejects non-existent student with 404', async () => {
      const res = await request(app)
        .patch('/api/v1/profiles/student/00000000-0000-0000-0000-000000000000/by-teacher')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ roll_number: '15' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

