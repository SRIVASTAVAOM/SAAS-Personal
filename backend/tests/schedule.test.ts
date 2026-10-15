import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Schedule Module Integration Tests (/api/v1/schedule)', () => {
  let teacherToken: string;
  let teacherProfileId: string;
  let studentToken: string;
  let schoolId: string;
  let classId: string;
  let sectionId: string;
  let subjectId: string;

  beforeAll(async () => {
    // Authenticate teacher
    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    expect(teacherLogin.status).toBe(200);
    teacherToken = teacherLogin.body.data.token;
    teacherProfileId = teacherLogin.body.data.user.profileId;
    schoolId = teacherLogin.body.data.user.schoolId;

    // Authenticate student
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    expect(studentLogin.status).toBe(200);
    studentToken = studentLogin.body.data.token;
    classId = studentLogin.body.data.user.classId;
    sectionId = studentLogin.body.data.user.sectionId;

    // Get a valid subject ID allocated to teacher
    const subjectRes = await pool.query(
      `SELECT id FROM subjects WHERE school_id = $1 AND code = 'MATH10' LIMIT 1;`,
      [schoolId]
    );
    subjectId = subjectRes.rows[0].id;
  });

  afterAll(async () => {
    // Keep pool open or jest will finish
  });

  describe('GET /api/v1/schedule/timetable/my-teacher', () => {
    it('returns the authenticated teacher day-wise periods', async () => {
      const res = await request(app)
        .get('/api/v1/schedule/timetable/my-teacher')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const slot = res.body.data[0];
      expect(slot).toHaveProperty('period_number');
      expect(slot).toHaveProperty('day_of_week');
      expect(slot).toHaveProperty('class_name');
      expect(slot).toHaveProperty('subject_name');
    });

    it('denies access to a student with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/schedule/timetable/my-teacher')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/schedule/substitutions/my-teacher', () => {
    it('returns substitutions split into assigned_to_me and covering_for_me', async () => {
      const res = await request(app)
        .get('/api/v1/schedule/substitutions/my-teacher')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('assigned_to_me');
      expect(res.body.data).toHaveProperty('covering_for_me');
      expect(Array.isArray(res.body.data.assigned_to_me)).toBe(true);
      expect(Array.isArray(res.body.data.covering_for_me)).toBe(true);
    });

    it('denies access to a student with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/schedule/substitutions/my-teacher')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Online Classes Workflow', () => {
    let createdSessionId: string;

    it('allows an authorized teacher to schedule an online class with an https link', async () => {
      const res = await request(app)
        .post('/api/v1/schedule/online-classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          section_id: sectionId,
          subject_id: subjectId,
          title: 'Automated Test: Quadratic Equations Interactive Session',
          scheduled_date: '2026-10-20',
          start_time: '11:00 AM',
          duration_minutes: 45,
          meeting_url: 'https://meet.google.com/abc-test-xyz',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Automated Test: Quadratic Equations Interactive Session');
      expect(res.body.data.meeting_url).toBe('https://meet.google.com/abc-test-xyz');
      createdSessionId = res.body.data.id;
    });

    it('rejects scheduling an online class with a non-https meeting link', async () => {
      const res = await request(app)
        .post('/api/v1/schedule/online-classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          section_id: sectionId,
          subject_id: subjectId,
          title: 'Insecure link test',
          scheduled_date: '2026-10-20',
          start_time: '11:00 AM',
          duration_minutes: 45,
          meeting_url: 'http://insecure-meeting.example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns the scheduled session in teacher online classes list', async () => {
      const res = await request(app)
        .get('/api/v1/schedule/online-classes')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const session = res.body.data.find((s: any) => s.id === createdSessionId);
      expect(session).toBeDefined();
      expect(session.class_name).toBeDefined();
      expect(session.subject_name).toBeDefined();
    });

    it('returns the scheduled session in student online classes list for enrolled class/section', async () => {
      const res = await request(app)
        .get('/api/v1/schedule/online-classes')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const session = res.body.data.find((s: any) => s.id === createdSessionId);
      expect(session).toBeDefined();
      expect(session.teacher_name).toBeDefined();
    });

    it('denies a student from creating an online class', async () => {
      const res = await request(app)
        .post('/api/v1/schedule/online-classes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          class_id: classId,
          section_id: sectionId,
          subject_id: subjectId,
          title: 'Student Attempted Session',
          scheduled_date: '2026-10-20',
          start_time: '11:00 AM',
          meeting_url: 'https://meet.google.com/stu-dent-xyz',
        });

      expect(res.status).toBe(403);
    });

    it('allows the creating teacher to delete / cancel the online class session', async () => {
      const res = await request(app)
        .delete(`/api/v1/schedule/online-classes/${createdSessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it is no longer listed
      const checkRes = await request(app)
        .get('/api/v1/schedule/online-classes')
        .set('Authorization', `Bearer ${teacherToken}`);

      const found = checkRes.body.data.find((s: any) => s.id === createdSessionId);
      expect(found).toBeUndefined();
    });
  });
});
