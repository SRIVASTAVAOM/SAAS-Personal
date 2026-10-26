import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Password Management, Security & Reset Desk Tests', () => {
  let adminToken: string;
  let studentUserId: string;
  let studentProfileId: string;
  let testAdmissionNo: string;
  let testDob = '2010-05-15';
  let testPhone = '9876543210';

  beforeAll(async () => {
    // 1. Login as Admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'management1', password: 'Password@123' });
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;
    const schoolId = loginRes.body.data.user.schoolId;

    // 2. Fetch or create a test student
    testAdmissionNo = `ADM_TEST_${Date.now()}`;
    const bulkRes = await request(app)
      .post('/api/v1/admin/students/bulk-upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        students: [
          {
            admission_no: testAdmissionNo,
            first_name: 'SecurityTest',
            last_name: 'Student',
            dob: testDob,
            emergency_phone: testPhone,
            phone: testPhone,
            class_name: 'Grade 9',
            section_name: 'Section Alpha',
            password: 'Student@123',
          },
        ],
      });
    expect(bulkRes.status).toBe(200);

    // Fetch the created student
    const stdRes = await request(app)
      .get(`/api/v1/admin/students?search=${testAdmissionNo}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(stdRes.status).toBe(200);
    expect(stdRes.body.data.length).toBeGreaterThan(0);
    const stu = stdRes.body.data[0];
    studentProfileId = stu.id;
    studentUserId = stu.user_id;
  });

  describe('Method 2: Identity Verification Challenge (Forgot Password)', () => {
    it('GET /api/v1/auth/forgot-password/requirements - returns challenge requirements and masked phone', async () => {
      const res = await request(app)
        .get(`/api/v1/auth/forgot-password/requirements?identifier=${testAdmissionNo}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userType).toBe('STUDENT');
      expect(res.body.data.maskedPhone).toContain('3210');
    });

    it('POST /api/v1/auth/forgot-password/verify - REJECTS when DOB or Phone is wrong (prevents account takeover)', async () => {
      // Wrong Phone
      const wrongPhoneRes = await request(app)
        .post('/api/v1/auth/forgot-password/verify')
        .send({
          identifier: testAdmissionNo,
          phone: '9999999999',
          dob: testDob,
        });
      expect(wrongPhoneRes.status).toBe(401);
      expect(wrongPhoneRes.body.success).toBe(false);

      // Wrong DOB
      const wrongDobRes = await request(app)
        .post('/api/v1/auth/forgot-password/verify')
        .send({
          identifier: testAdmissionNo,
          phone: testPhone,
          dob: '2005-01-01',
        });
      expect(wrongDobRes.status).toBe(401);
      expect(wrongDobRes.body.success).toBe(false);
    });

    it('POST /api/v1/auth/forgot-password/verify - ACCEPTS when Phone & DOB match, returns resetToken', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password/verify')
        .send({
          identifier: testAdmissionNo,
          phone: testPhone,
          dob: testDob,
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toBeDefined();

      const resetToken = res.body.data.resetToken;

      // Now reset password
      const resetRes = await request(app)
        .post('/api/v1/auth/forgot-password/reset')
        .send({
          resetToken,
          newPassword: 'NewSecurePassword@999',
        });
      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify can login with new password
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testAdmissionNo,
          password: 'NewSecurePassword@999',
        });
      expect(newLoginRes.status).toBe(200);
    });
  });

  describe('Inside-App: Change Password (Authenticated User)', () => {
    it('POST /api/v1/auth/change-password - changes password when current password is provided', async () => {
      // Login with current password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testAdmissionNo,
          password: 'NewSecurePassword@999',
        });
      expect(loginRes.status).toBe(200);
      const studentToken = loginRes.body.data.token;

      // Try wrong current password
      const wrongCurrentRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'AnotherPassword@123',
        });
      expect(wrongCurrentRes.status).toBe(400);

      // Correct current password
      const changeRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          currentPassword: 'NewSecurePassword@999',
          newPassword: 'AnotherPassword@123',
        });
      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Verify login with latest password
      const latestLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testAdmissionNo,
          password: 'AnotherPassword@123',
        });
      expect(latestLogin.status).toBe(200);
    });
  });

  describe('Method 3: Admin Reset Desk (1-Click Reset to Default)', () => {
    it('POST /api/v1/admin/students/:id/reset-password - resets student password to Student@123', async () => {
      const resetRes = await request(app)
        .post(`/api/v1/admin/students/${studentProfileId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);
      expect(resetRes.body.data.newPassword).toBe('Student@123');

      // Verify login with Student@123
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testAdmissionNo,
          password: 'Student@123',
        });
      expect(loginRes.status).toBe(200);
    });

    it('GET /api/v1/admin/students - includes password field for admin visibility', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/students?search=${testAdmissionNo}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data[0].password).toBe('Student@123');
    });
  });
});
