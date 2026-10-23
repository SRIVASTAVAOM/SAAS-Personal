import request from 'supertest';
import app from '../src/app';

describe('Admin Student Directory & Multi-Select Integration Tests', () => {
  let adminToken: string;
  let testStudentId: string;
  let testClassId: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'management1', password: 'Password@123' });
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;
  });

  it('GET /api/v1/admin/students returns all students', async () => {
    const res = await request(app)
      .get('/api/v1/admin/students')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      testStudentId = res.body.data[0].id;
      testClassId = res.body.data[0].class_id;
    }
  });

  it('GET /api/v1/admin/students supports multi-select class_ids', async () => {
    if (!testClassId) return;

    const res = await request(app)
      .get(`/api/v1/admin/students?class_ids=${testClassId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((s: any) => {
      expect(s.class_id).toBe(testClassId);
    });
  });

  it('GET /api/v1/admin/students/:id returns 360-degree student details', async () => {
    if (!testStudentId) return;

    const res = await request(app)
      .get(`/api/v1/admin/students/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testStudentId);
    expect(res.body.data).toHaveProperty('admission_number');
  });

  it('PATCH /api/v1/admin/students/:id updates student basic details', async () => {
    if (!testStudentId) return;

    const updatePayload = {
      emergency_phone: '9876543299',
      medical_notes: 'Updated medical notes test',
      blood_group: 'O+',
    };

    const res = await request(app)
      .patch(`/api/v1/admin/students/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.emergency_phone).toBe('9876543299');
    expect(res.body.data.medical_notes).toBe('Updated medical notes test');
  });
});
