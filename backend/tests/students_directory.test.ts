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

  describe('POST /api/v1/admin/students (Single Student Admission Form)', () => {
    const testAdmNo = `ADM-TEST-${Date.now().toString().slice(-6)}`;

    it('should successfully admit a new student with generated credentials', async () => {
      const admissionData = {
        first_name: 'Aarav',
        last_name: 'Sharma',
        admission_number: testAdmNo,
        roll_number: '55',
        phone: '9876500001',
        emergency_phone: '9876500002',
        father_name: 'Ramesh Sharma',
        mother_name: 'Sunita Sharma',
        gender: 'Male',
        dob: '2015-05-15',
        blood_group: 'B+',
        address: '42 Lotus Enclave, New Delhi',
        caste: 'General',
        religion: 'Hindu',
        current_class_id: testClassId || null,
        password: 'Student@123',
      };

      const res = await request(app)
        .post('/api/v1/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(admissionData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.first_name).toBe('Aarav');
      expect(res.body.data.admission_number).toBe(testAdmNo);
      expect(res.body.data.father_name).toBe('Ramesh Sharma');
      expect(res.body.data.password).toBe('Student@123');
    });

    it('should reject student admission when first_name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          admission_number: 'ADM-FAIL-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should dynamically create and resolve class (e.g. Class 7) and store 94 ERP fields', async () => {
      const dynamicAdmNo = `ADM-C7-${Date.now().toString().slice(-6)}`;
      const res = await request(app)
        .post('/api/v1/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stu_name: 'Kabir Verma',
          adm_no: dynamicAdmNo,
          class: 'Class 7',
          sec: 'Section B',
          fat_name: 'Manish Verma',
          fat_occu: 'Chartered Accountant',
          fat_income: '1200000',
          mot_name: 'Priya Verma',
          mot_occ: 'Professor',
          house: 'Green House',
          stream: 'General',
          lang: 'Hindi',
          cast_cert_no: 'CC-9988-77',
          school1_name: 'St. Paul School',
          school1_class: 'Class 6',
          tc_issue: 'Yes',
          fee_cat: 'Standard',
          session: '2026-2027',
          student_aadhar: '998877665544',
          mobile: '9876543321',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admission_number).toBe(dynamicAdmNo);
      expect(res.body.data.class_name).toBe('Class 7');
      expect(res.body.data.section_name).toBe('Section B');
      expect(res.body.data.extra_data.fat_occu).toBe('Chartered Accountant');
      expect(res.body.data.extra_data.school1_name).toBe('St. Paul School');
    });
  });
});

