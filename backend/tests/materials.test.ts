import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Academic Materials & S3 Pre-signed URL API Tests', () => {
  let teacherToken: string;
  let studentToken: string;
  let classId: string;
  let mathSubjectId: string;
  let materialId: string;

  beforeAll(async () => {
    // Login Teacher1
    const tLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    teacherToken = tLogin.body.data.token;

    // Login Student1
    const sLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    studentToken = sLogin.body.data.token;

    // Fetch Class & Subject
    const classRes = await pool.query(`SELECT id FROM classes WHERE name = 'Grade 10' LIMIT 1;`);
    classId = classRes.rows[0].id;

    const subRes = await pool.query(`SELECT id FROM subjects WHERE code = 'MATH10' LIMIT 1;`);
    mathSubjectId = subRes.rows[0].id;
  });

  afterAll(async () => {
    if (materialId) {
      await pool.query(`DELETE FROM academic_materials WHERE id = $1;`, [materialId]);
    }
    await pool.end();
  });

  describe('POST /api/v1/materials/presigned-upload-url (Upload Initiation)', () => {
    it('should generate pre-signed upload URL for authorized teacher with valid PDF metadata', async () => {
      const res = await request(app)
        .post('/api/v1/materials/presigned-upload-url')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          subjectId: mathSubjectId,
          title: 'Trigonometry Concept Map',
          description: 'High-yield memory map for trigonometric identities.',
          fileName: 'trig_concept_map.pdf',
          fileSizeBytes: 1048576, // 1 MB
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('uploadUrl');
      expect(res.body.data).toHaveProperty('fileKey');
      expect(res.body.data).toHaveProperty('materialId');
      expect(res.body.data.fileKey).toContain(`schools/`);
      materialId = res.body.data.materialId;
    });

    it('should REJECT file upload when contentType is not in allowed list', async () => {
      const res = await request(app)
        .post('/api/v1/materials/presigned-upload-url')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          subjectId: mathSubjectId,
          title: 'Malicious Executable Attempt',
          fileName: 'script.sh',
          fileSizeBytes: 500,
          contentType: 'application/x-sh',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/is not permitted/i);
    });

    it('should REJECT file upload when file size exceeds 10MB limit', async () => {
      const res = await request(app)
        .post('/api/v1/materials/presigned-upload-url')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          subjectId: mathSubjectId,
          title: 'Oversized Video File',
          fileName: 'large_lecture.mp4',
          fileSizeBytes: 25 * 1024 * 1024, // 25 MB > 10 MB
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/exceeds the allowed maximum limit/i);
    });

    it('should REJECT student attempting to request upload URL with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/materials/presigned-upload-url')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          subjectId: mathSubjectId,
          title: 'Student Attempted Material',
          fileName: 'notes.pdf',
          fileSizeBytes: 1000,
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/materials/:id/verify-upload', () => {
    it('should verify uploaded material and mark it as active', async () => {
      const res = await request(app)
        .post(`/api/v1/materials/${materialId}/verify-upload`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_verified).toBe(true);
    });
  });

  describe('GET /api/v1/materials/class/:classId/:subjectId', () => {
    it('should allow student in that class to list verified materials', async () => {
      const res = await request(app)
        .get(`/api/v1/materials/class/${classId}/${mathSubjectId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/materials/:id/download-url', () => {
    it('should generate pre-signed download URL for enrolled student', async () => {
      const res = await request(app)
        .get(`/api/v1/materials/${materialId}/download-url`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('downloadUrl');
      expect(res.body.data).toHaveProperty('fileName');
      expect(res.body.data).toHaveProperty('contentType');
    });
  });

  describe('Simulation Mock S3 Endpoints', () => {
    it('should handle simulated direct PUT upload gracefully', async () => {
      const res = await request(app)
        .put('/api/v1/materials/mock-s3-upload?key=test_key')
        .send(Buffer.from('PDF byte stream content'));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle simulated GET download gracefully', async () => {
      const res = await request(app)
        .get('/api/v1/materials/mock-s3-download?key=test_key');

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('application/pdf');
    });
  });
});
