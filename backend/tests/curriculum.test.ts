import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Curriculum & Syllabus API Tests', () => {
  let teacherToken: string;
  let studentToken: string;
  let coordinatorToken: string;
  let classId: string;
  let mathSubjectId: string;
  let createdUnitId: string;

  beforeAll(async () => {
    // 1. Login Teacher1
    const tLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    teacherToken = tLogin.body.data.token;

    // 2. Login Student1
    const sLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    studentToken = sLogin.body.data.token;

    // 3. Login Coordinator1
    const cLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'coordinator1', password: 'Password@123' });
    coordinatorToken = cLogin.body.data.token;

    // Fetch Class & Subject
    const classRes = await pool.query(`SELECT id FROM classes WHERE name = 'Grade 10' LIMIT 1;`);
    classId = classRes.rows[0].id;

    const subRes = await pool.query(`SELECT id FROM subjects WHERE code = 'MATH10' LIMIT 1;`);
    mathSubjectId = subRes.rows[0].id;
  });

  afterAll(async () => {
    if (createdUnitId) {
      await pool.query(`DELETE FROM curriculum_units WHERE id = $1;`, [createdUnitId]);
    }
    await pool.end();
  });

  describe('GET /api/v1/curriculum/units', () => {
    it('should return curriculum units and nested topics for student enrolled in class', async () => {
      const res = await request(app)
        .get(`/api/v1/curriculum/units?classId=${classId}&subjectId=${mathSubjectId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      const unit = res.body.data[0];
      expect(unit).toHaveProperty('unit_number');
      expect(unit).toHaveProperty('topics');
      expect(Array.isArray(unit.topics)).toBe(true);
    });

    it('should reject when classId or subjectId query params are missing', async () => {
      const res = await request(app)
        .get('/api/v1/curriculum/units')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/curriculum/units & POST /api/v1/curriculum/topics', () => {
    it('should allow allocated teacher to create a curriculum unit', async () => {
      const res = await request(app)
        .post('/api/v1/curriculum/units')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          subjectId: mathSubjectId,
          unitNumber: 99,
          title: 'Advanced Coordinate Geometry',
          description: 'Section formula and area of triangles.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Advanced Coordinate Geometry');
      createdUnitId = res.body.data.id;
    });

    it('should allow teacher to add a topic to the created unit', async () => {
      const res = await request(app)
        .post('/api/v1/curriculum/topics')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          unitId: createdUnitId,
          topicNumber: 1,
          title: 'Distance and Section Formulas',
          description: 'Derivation and Cartesian plane applications.',
          learningObjectives: 'Apply section formula to divide line segments in ratio m:n',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Distance and Section Formulas');
    });

    it('should REJECT student attempting to create a curriculum unit with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/curriculum/units')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          subjectId: mathSubjectId,
          unitNumber: 100,
          title: 'Student Attempted Unit',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
