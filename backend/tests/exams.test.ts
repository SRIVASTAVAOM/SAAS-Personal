import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Examinations, Marks & Report Cards API Tests', () => {
  let coordinatorToken: string;
  let teacherToken: string;
  let studentToken: string;
  let student2Token: string;

  let schoolId: string;
  let academicYearId: string;
  let seniorWingId: string;
  let classId: string;
  let sectionId: string;
  let mathSubjectId: string;
  let sciSubjectId: string;

  let testExamId: string;
  let testDatesheetId: string;
  let student1ProfileId: string;
  let student2ProfileId: string;

  beforeAll(async () => {
    // 1. Login Coordinator1
    const cLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'coordinator1', password: 'Password@123' });
    coordinatorToken = cLogin.body.data.token;

    // 2. Login Teacher1
    const tLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher1', password: 'Password@123' });
    teacherToken = tLogin.body.data.token;

    // 3. Login Student1
    const sLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student1', password: 'Password@123' });
    studentToken = sLogin.body.data.token;

    // 4. Login Student2
    const s2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student2', password: 'Password@123' });
    student2Token = s2Login.body.data.token;

    // Fetch baseline ids
    const sch = await pool.query(`SELECT id FROM schools LIMIT 1;`);
    schoolId = sch.rows[0].id;

    const ay = await pool.query(`SELECT id FROM academic_years WHERE school_id = $1 LIMIT 1;`, [schoolId]);
    academicYearId = ay.rows[0].id;

    const w = await pool.query(`SELECT id FROM wings WHERE name = 'Senior Wing' LIMIT 1;`);
    seniorWingId = w.rows[0].id;

    const cls = await pool.query(`SELECT id FROM classes WHERE name = 'Grade 10' LIMIT 1;`);
    classId = cls.rows[0].id;

    const sec = await pool.query(`SELECT id FROM sections WHERE class_id = $1 LIMIT 1;`, [classId]);
    sectionId = sec.rows[0].id;

    const subMath = await pool.query(`SELECT id FROM subjects WHERE code = 'MATH10' LIMIT 1;`);
    mathSubjectId = subMath.rows[0].id;

    const subSci = await pool.query(`SELECT id FROM subjects WHERE code = 'SCI10' LIMIT 1;`);
    sciSubjectId = subSci.rows[0].id;

    const std1 = await pool.query(
      `SELECT sp.id FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE u.identifier = 'student1';`
    );
    student1ProfileId = std1.rows[0].id;

    const std2 = await pool.query(
      `SELECT sp.id FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE u.identifier = 'student2';`
    );
    student2ProfileId = std2.rows[0].id;
  });

  afterAll(async () => {
    if (testExamId) {
      await pool.query(`DELETE FROM exams WHERE id = $1;`, [testExamId]);
    }
    await pool.end();
  });

  // --------------------------------------------------------------------------
  // Phase 1: Exam Creation & Listing
  // --------------------------------------------------------------------------
  describe('POST /api/v1/exams', () => {
    it('should allow Coordinator to create a new examination', async () => {
      const res = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          academicYearId,
          wingId: seniorWingId,
          name: 'Unit Test Exam 2026',
          description: 'Class assessment exam',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Unit Test Exam 2026');
      expect(res.body.data.is_published).toBe(false);
      testExamId = res.body.data.id;
    });

    it('should REJECT exam creation when end date is earlier than start date (400)', async () => {
      const res = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          academicYearId,
          wingId: seniorWingId,
          name: 'Invalid Date Exam',
          startDate: '2026-12-10',
          endDate: '2026-12-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should REJECT student attempting to create an examination with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          academicYearId,
          name: 'Student Attempted Exam',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
        });

      expect(res.status).toBe(403);
    });

    it('should list exams for teacher and coordinator', async () => {
      const res = await request(app)
        .get('/api/v1/exams')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Phase 2: Datesheet Scheduling & Conflict Prevention
  // --------------------------------------------------------------------------
  describe('POST /api/v1/exams/:id/datesheets', () => {
    it('should allow Coordinator to schedule a datesheet for a subject', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/datesheets`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          classId,
          sectionId,
          subjectId: mathSubjectId,
          examDate: '2026-12-02',
          startTime: '09:00:00',
          endTime: '11:00:00',
          maxMarks: 50.0,
          passingMarks: 18.0,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(parseFloat(res.body.data.max_marks)).toBe(50.0);
      testDatesheetId = res.body.data.id;
    });

    it('should REJECT overlapping exam schedule for the same class on same day with 409 Conflict', async () => {
      // Overlaps 09:30 to 11:30 with existing 09:00 to 11:00
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/datesheets`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          classId,
          sectionId,
          subjectId: sciSubjectId,
          examDate: '2026-12-02',
          startTime: '09:30:00',
          endTime: '11:30:00',
          maxMarks: 50.0,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('conflict');
    });

    it('should REJECT datesheet when max marks is <= 0 with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/datesheets`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          classId,
          sectionId,
          subjectId: sciSubjectId,
          examDate: '2026-12-03',
          startTime: '09:00:00',
          endTime: '11:00:00',
          maxMarks: -10,
        });

      expect(res.status).toBe(400);
    });

    it('should allow student to fetch datesheet for their enrolled class', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${testExamId}/datesheets`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].subject_name).toBe('Mathematics');
    });
  });

  // --------------------------------------------------------------------------
  // Phase 3: Teacher Marks Entry & Audit Logging
  // --------------------------------------------------------------------------
  describe('Teacher Marks Entry & Audit Logging', () => {
    it('should allow allocated Teacher to fetch marks roster for the scheduled datesheet', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/marks-roster`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('datesheet');
      expect(res.body.data).toHaveProperty('roster');
      expect(Array.isArray(res.body.data.roster)).toBe(true);
      expect(res.body.data.roster.length).toBeGreaterThan(0);
    });

    it('should REJECT student trying to view marks entry roster with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/marks-roster`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should REJECT marks entry if marks_obtained exceeds maximum marks (50.0)', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          entries: [
            {
              student_id: student1ProfileId,
              marks_obtained: 55.0, // max is 50.0
              is_absent: false,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('maximum marks');
    });

    it('should REJECT marks entry if marks are provided when is_absent is true', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          entries: [
            {
              student_id: student2ProfileId,
              marks_obtained: 25.0,
              is_absent: true, // cannot have both marks and absent
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('absent cannot have numeric marks');
    });

    it('should successfully save draft marks and absent status for students', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          submitForVerification: false,
          entries: [
            {
              student_id: student1ProfileId,
              marks_obtained: 44.5,
              is_absent: false,
              remarks: 'Strong problem-solving',
            },
            {
              student_id: student2ProfileId,
              marks_obtained: null,
              is_absent: true,
              remarks: 'Absent due to illness',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify marks were stored
      const rosterRes = await request(app)
        .get(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/marks-roster`)
        .set('Authorization', `Bearer ${teacherToken}`);

      const s1 = rosterRes.body.data.roster.find((r: any) => r.student_id === student1ProfileId);
      const s2 = rosterRes.body.data.roster.find((r: any) => r.student_id === student2ProfileId);
      expect(s1.marks_obtained).toBe(44.5);
      expect(s1.is_absent).toBe(false);
      expect(s2.marks_obtained).toBe(null);
      expect(s2.is_absent).toBe(true);
    });

    it('should successfully save marks when sent using camelCase entries format from mobile client', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          submitForVerification: false,
          entries: [
            {
              studentId: student1ProfileId,
              marksObtained: 44.5,
              isAbsent: false,
              remarks: 'Consistent performance',
            },
            {
              studentId: student2ProfileId,
              marksObtained: null,
              isAbsent: true,
              remarks: 'Absent certified',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should record an audit entry when teacher revises previously entered marks', async () => {
      // Revise student1's mark from 44.5 to 46.0
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          submitForVerification: true,
          entries: [
            {
              student_id: student1ProfileId,
              marks_obtained: 46.0,
              is_absent: false,
              change_reason: 'Recounting of question 4 marks',
            },
          ],
        });

      expect(res.status).toBe(200);

      // Check audit log in DB
      const auditRes = await pool.query(
        `SELECT ema.* FROM exam_marks_audit ema
         JOIN exam_marks em ON ema.exam_mark_id = em.id
         WHERE em.student_id = $1 AND em.exam_datesheet_id = $2;`,
        [student1ProfileId, testDatesheetId]
      );
      expect(auditRes.rows.length).toBeGreaterThan(0);
      const log = auditRes.rows[0];
      expect(parseFloat(log.previous_marks)).toBe(44.5);
      expect(parseFloat(log.new_marks)).toBe(46.0);
      expect(log.change_reason).toBe('Recounting of question 4 marks');
    });
  });

  // --------------------------------------------------------------------------
  // Phase 4: Coordinator Marks Verification & Analysis Summary
  // --------------------------------------------------------------------------
  describe('Coordinator Marks Verification', () => {
    it('should provide complete analysis summary of datesheet marks', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/summary`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_students).toBeGreaterThanOrEqual(2);
      expect(res.body.data.entered_count).toBeGreaterThanOrEqual(2);
      expect(res.body.data.absent_count).toBe(1);
      expect(res.body.data.highest_marks).toBe(46.0);
    });

    it('should allow Coordinator to verify marks for the datesheet', async () => {
      const res = await request(app)
        .patch(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/verify-marks`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verifiedCount).toBeGreaterThanOrEqual(1);

      // Verify status changed to VERIFIED
      const summaryRes = await request(app)
        .get(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/summary`)
        .set('Authorization', `Bearer ${coordinatorToken}`);
      expect(summaryRes.body.data.status).toBe('VERIFIED');
    });

    it('should REJECT teacher attempting to verify marks with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/exams/${testExamId}/datesheets/${testDatesheetId}/verify-marks`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });
  });

  // --------------------------------------------------------------------------
  // Phase 5: Class Report Card Generation, Approval & Student Publication
  // --------------------------------------------------------------------------
  describe('Report Cards & Student Result Publication', () => {
    it('should allow Class Teacher to generate class report cards with authoritative calculations', async () => {
      const res = await request(app)
        .post(`/api/v1/exams/${testExamId}/classes/${classId}/sections/${sectionId}/generate-report-cards`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ remarks: 'Class performance evaluated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const s1Card = res.body.data.find((c: any) => c.student_id === student1ProfileId);
      expect(s1Card).toBeDefined();
      expect(parseFloat(s1Card.total_marks_obtained)).toBe(46.0);
      expect(parseFloat(s1Card.total_max_marks)).toBe(50.0);
      expect(parseFloat(s1Card.percentage)).toBe(92.0); // (46 / 50) * 100 = 92%
      expect(s1Card.status).toBe('GENERATED');
    });

    it('should allow Coordinator to approve class report cards', async () => {
      const res = await request(app)
        .patch(`/api/v1/exams/${testExamId}/classes/${classId}/sections/${sectionId}/approve-report-cards`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvedCount).toBeGreaterThan(0);
    });

    it('should REJECT Student viewing result when examination is NOT published (403)', async () => {
      // testExam is currently unpublished (is_published = false)
      const res = await request(app)
        .get(`/api/v1/exams/${testExamId}/results/me`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('not been published');
    });

    it('should allow Coordinator to publish the examination', async () => {
      const res = await request(app)
        .patch(`/api/v1/exams/${testExamId}/publish`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ isPublished: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_published).toBe(true);
    });

    it('should allow Student to view their own result once exam is published and approved', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${testExamId}/results/me`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportCard');
      expect(res.body.data).toHaveProperty('subjectMarks');

      const card = res.body.data.reportCard;
      expect(card.total_marks_obtained).toBe(46.0);
      expect(card.total_max_marks).toBe(50.0);
      expect(card.percentage).toBe(92.0);
      expect(card.status).toBe('APPROVED');

      const mathMark = res.body.data.subjectMarks.find((s: any) => s.subject_name === 'Mathematics');
      expect(mathMark).toBeDefined();
      expect(mathMark.marks_obtained).toBe(46.0);
      expect(mathMark.max_marks).toBe(50.0);
      expect(mathMark.is_absent).toBe(false);
    });

    it('should allow Student 2 to view their own result with absent status correctly displayed', async () => {
      const res = await request(app)
        .get(`/api/v1/exams/${testExamId}/results/me`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const mathMark = res.body.data.subjectMarks.find((s: any) => s.subject_name === 'Mathematics');
      expect(mathMark.is_absent).toBe(true);
      expect(mathMark.marks_obtained).toBe(null);
    });
  });
});
