import { pool } from '../../config/db.config';

export interface ExamRecord {
  id: string;
  school_id: string;
  academic_year_id: string;
  academic_year_label?: string;
  wing_id: string | null;
  wing_name?: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_published: boolean;
  created_by_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamDatesheetRecord {
  id: string;
  exam_id: string;
  exam_name?: string;
  school_id?: string;
  class_id: string;
  class_name?: string;
  wing_id?: string | null;
  section_id: string | null;
  section_name?: string | null;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  max_marks: number;
  passing_marks: number;
  invigilator_staff_id: string | null;
  invigilator_name?: string | null;
  is_published?: boolean;
  is_locked?: boolean;
  created_at: string;
}

export interface StudentMarkRosterItem {
  student_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  roll_number: string;
  mark_id: string | null;
  marks_obtained: number | null;
  is_absent: boolean;
  remarks: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'NOT_ENTERED';
  entered_by_name: string | null;
  verified_at: string | null;
}

export interface MarkInputEntry {
  student_id: string;
  marks_obtained: number | null;
  is_absent: boolean;
  remarks?: string | null;
  change_reason?: string | null;
}

export interface DatesheetSummary {
  datesheet_id: string;
  subject_name: string;
  max_marks: number;
  total_students: number;
  entered_count: number;
  absent_count: number;
  missing_count: number;
  average_marks: number | null;
  highest_marks: number | null;
  lowest_marks: number | null;
  status: 'NOT_ENTERED' | 'DRAFT' | 'SUBMITTED' | 'VERIFIED';
}

export interface ReportCardRecord {
  id: string;
  exam_id: string;
  student_id: string;
  student_name?: string;
  roll_number?: string;
  admission_number?: string;
  class_id: string;
  class_name?: string;
  section_id: string;
  section_name?: string;
  total_marks_obtained: number;
  total_max_marks: number;
  percentage: number;
  subjects_evaluated_count: number;
  subjects_absent_count: number;
  status: 'GENERATED' | 'APPROVED' | 'PUBLISHED';
  class_teacher_remarks: string | null;
  generated_by_staff_id: string | null;
  generated_at: string;
  approved_by_staff_id: string | null;
  approved_at: string | null;
}

export class ExamsRepository {
  // 1. Create Exam
  static async createExam(data: {
    school_id: string;
    academic_year_id: string;
    wing_id?: string | null;
    name: string;
    description?: string | null;
    start_date: string;
    end_date: string;
    created_by_staff_id?: string | null;
  }): Promise<ExamRecord> {
    const query = `
      INSERT INTO exams (school_id, academic_year_id, wing_id, name, description, start_date, end_date, created_by_staff_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      data.school_id,
      data.academic_year_id,
      data.wing_id || null,
      data.name,
      data.description || null,
      data.start_date,
      data.end_date,
      data.created_by_staff_id || null,
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  // 2. List Exams
  static async getExams(
    schoolId: string,
    filters?: { wingId?: string; academicYearId?: string; isPublished?: boolean }
  ): Promise<ExamRecord[]> {
    let query = `
      SELECT e.*, ay.label as academic_year_label, w.name as wing_name
      FROM exams e
      JOIN academic_years ay ON e.academic_year_id = ay.id
      LEFT JOIN wings w ON e.wing_id = w.id
      WHERE e.school_id = $1
    `;
    const params: any[] = [schoolId];

    if (filters?.wingId) {
      params.push(filters.wingId);
      query += ` AND (e.wing_id = $${params.length} OR e.wing_id IS NULL)`;
    }
    if (filters?.academicYearId) {
      params.push(filters.academicYearId);
      query += ` AND e.academic_year_id = $${params.length}`;
    }
    if (filters?.isPublished !== undefined) {
      params.push(filters.isPublished);
      query += ` AND e.is_published = $${params.length}`;
    }

    query += ` ORDER BY e.start_date DESC;`;
    const res = await pool.query(query, params);
    return res.rows;
  }

  // 3. Get Exam By ID
  static async getExamById(id: string, schoolId: string): Promise<ExamRecord | null> {
    const query = `
      SELECT e.*, ay.label as academic_year_label, w.name as wing_name
      FROM exams e
      JOIN academic_years ay ON e.academic_year_id = ay.id
      LEFT JOIN wings w ON e.wing_id = w.id
      WHERE e.id = $1 AND e.school_id = $2;
    `;
    const res = await pool.query(query, [id, schoolId]);
    return res.rows[0] || null;
  }

  // 4. Publish / Unpublish Exam
  static async setExamPublishStatus(id: string, schoolId: string, isPublished: boolean): Promise<ExamRecord | null> {
    const query = `
      UPDATE exams
      SET is_published = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND school_id = $3
      RETURNING *;
    `;
    const res = await pool.query(query, [isPublished, id, schoolId]);
    return res.rows[0] || null;
  }

  // 5. Create Exam Datesheet
  static async createDatesheet(data: {
    exam_id: string;
    class_id: string;
    section_id?: string | null;
    subject_id: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    max_marks: number;
    passing_marks?: number;
    invigilator_staff_id?: string | null;
  }): Promise<ExamDatesheetRecord> {
    const query = `
      INSERT INTO exam_datesheets (
        exam_id, class_id, section_id, subject_id,
        exam_date, start_time, end_time, max_marks, passing_marks, invigilator_staff_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      data.exam_id,
      data.class_id,
      data.section_id || null,
      data.subject_id,
      data.exam_date,
      data.start_time,
      data.end_time,
      data.max_marks,
      data.passing_marks ?? 33.0,
      data.invigilator_staff_id || null,
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  // 6. Check Datesheet Time Conflict for Class
  static async checkScheduleConflict(
    examId: string,
    classId: string,
    examDate: string,
    startTime: string,
    endTime: string,
    excludeDatesheetId?: string
  ): Promise<boolean> {
    let query = `
      SELECT id FROM exam_datesheets
      WHERE exam_id = $1 AND class_id = $2 AND exam_date = $3
        AND (start_time < $5 AND end_time > $4)
    `;
    const params: any[] = [examId, classId, examDate, startTime, endTime];
    if (excludeDatesheetId) {
      params.push(excludeDatesheetId);
      query += ` AND id != $${params.length}`;
    }
    const res = await pool.query(query, params);
    return res.rows.length > 0;
  }

  // 7. Get Datesheets for an Exam
  static async getDatesheets(examId: string, classId?: string): Promise<ExamDatesheetRecord[]> {
    let query = `
      SELECT ds.*, e.name as exam_name, e.is_published, c.name as class_name, sec.name as section_name,
             sub.name as subject_name, sub.code as subject_code,
             concat(sp.first_name, ' ', sp.last_name) as invigilator_name
      FROM exam_datesheets ds
      JOIN exams e ON ds.exam_id = e.id
      JOIN classes c ON ds.class_id = c.id
      LEFT JOIN sections sec ON ds.section_id = sec.id
      JOIN subjects sub ON ds.subject_id = sub.id
      LEFT JOIN staff_profiles sp ON ds.invigilator_staff_id = sp.id
      WHERE ds.exam_id = $1
    `;
    const params: any[] = [examId];
    if (classId) {
      params.push(classId);
      query += ` AND ds.class_id = $${params.length}`;
    }
    query += ` ORDER BY ds.exam_date ASC, ds.start_time ASC;`;
    const res = await pool.query(query, params);
    return res.rows;
  }

  // 8. Get Datesheet By ID
  static async getDatesheetById(datesheetId: string): Promise<ExamDatesheetRecord | null> {
    const query = `
      SELECT ds.*, e.name as exam_name, e.school_id, e.is_published, c.name as class_name, c.wing_id,
             sec.name as section_name, sub.name as subject_name, sub.code as subject_code
      FROM exam_datesheets ds
      JOIN exams e ON ds.exam_id = e.id
      JOIN classes c ON ds.class_id = c.id
      LEFT JOIN sections sec ON ds.section_id = sec.id
      JOIN subjects sub ON ds.subject_id = sub.id
      WHERE ds.id = $1;
    `;
    const res = await pool.query(query, [datesheetId]);
    return res.rows[0] || null;
  }

  // 8b. Check if marks for this datesheet are locked
  static async isDatesheetMarksLocked(datesheetId: string): Promise<{ locked: boolean; reason?: string }> {
    const query = `
      SELECT 
        e.is_published as exam_published,
        EXISTS(SELECT 1 FROM exam_marks WHERE exam_datesheet_id = $1 AND status = 'VERIFIED') as has_verified_marks,
        EXISTS(
          SELECT 1 FROM report_cards rc 
          WHERE rc.exam_id = ds.exam_id 
            AND rc.class_id = ds.class_id 
            AND (ds.section_id IS NULL OR rc.section_id = ds.section_id)
            AND rc.status IN ('APPROVED', 'PUBLISHED')
        ) as report_card_finalized
      FROM exam_datesheets ds
      JOIN exams e ON ds.exam_id = e.id
      WHERE ds.id = $1;
    `;
    const res = await pool.query(query, [datesheetId]);
    if (res.rows.length === 0) return { locked: false };
    const row = res.rows[0];
    if (row.exam_published || row.has_verified_marks || row.report_card_finalized) {
      return { locked: true, reason: 'Marks are locked after verification or publication.' };
    }
    return { locked: false };
  }

  // 9. Get Student Marks Roster for Datesheet
  static async getMarksRoster(datesheetId: string, classId: string, sectionId?: string | null): Promise<StudentMarkRosterItem[]> {
    let query = `
      SELECT sp.id as student_id, sp.first_name, sp.last_name, sp.admission_number, sp.roll_number,
             em.id as mark_id, em.marks_obtained, em.is_absent, em.remarks,
             COALESCE(em.status, 'NOT_ENTERED') as status,
             concat(stf.first_name, ' ', stf.last_name) as entered_by_name,
             em.verified_at
      FROM student_profiles sp
      LEFT JOIN exam_marks em ON em.exam_datesheet_id = $1 AND em.student_id = sp.id
      LEFT JOIN staff_profiles stf ON em.entered_by_staff_id = stf.id
      WHERE sp.current_class_id = $2
    `;
    const params: any[] = [datesheetId, classId];
    if (sectionId) {
      params.push(sectionId);
      query += ` AND sp.current_section_id = $${params.length}`;
    }
    query += ` ORDER BY sp.roll_number ASC, sp.first_name ASC;`;
    const res = await pool.query(query, params);
    return res.rows.map((row) => ({
      ...row,
      marks_obtained: row.marks_obtained !== null ? parseFloat(row.marks_obtained) : null,
      is_absent: Boolean(row.is_absent),
    }));
  }

  // 10. Upsert Marks for Datesheet with Audit Logging
  static async upsertMarksWithAudit(
    datesheetId: string,
    entries: MarkInputEntry[],
    staffId: string,
    submitForVerification: boolean
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const targetStatus = submitForVerification ? 'SUBMITTED' : 'DRAFT';

      for (const entry of entries) {
        // Check existing mark
        const existingRes = await client.query(
          `SELECT id, marks_obtained, is_absent, status FROM exam_marks WHERE exam_datesheet_id = $1 AND student_id = $2;`,
          [datesheetId, entry.student_id]
        );

        const marksObtained = entry.is_absent ? null : entry.marks_obtained;

        if (existingRes.rows.length === 0) {
          // Insert new mark
          await client.query(
            `INSERT INTO exam_marks (
               exam_datesheet_id, student_id, marks_obtained, is_absent, remarks,
               entered_by_staff_id, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
            [
              datesheetId,
              entry.student_id,
              marksObtained,
              entry.is_absent,
              entry.remarks || null,
              staffId,
              targetStatus,
            ]
          );
        } else {
          const old = existingRes.rows[0];
          const oldMarks = old.marks_obtained !== null ? parseFloat(old.marks_obtained) : null;
          const oldAbsent = Boolean(old.is_absent);

          // Update mark
          const updateRes = await client.query(
            `UPDATE exam_marks
             SET marks_obtained = $1, is_absent = $2, remarks = $3,
                 entered_by_staff_id = $4, status = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING id;`,
            [
              marksObtained,
              entry.is_absent,
              entry.remarks || null,
              staffId,
              targetStatus,
              old.id,
            ]
          );

          // If values changed, record audit entry
          if (oldMarks !== marksObtained || oldAbsent !== entry.is_absent) {
            await client.query(
              `INSERT INTO exam_marks_audit (
                 exam_mark_id, changed_by_staff_id, previous_marks, previous_is_absent,
                 new_marks, new_is_absent, change_reason
               ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
              [
                old.id,
                staffId,
                oldMarks,
                oldAbsent,
                marksObtained,
                entry.is_absent,
                entry.change_reason || 'Marks revised by teacher',
              ]
            );
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 11. Coordinator Verify Marks for Datesheet
  static async verifyDatesheetMarks(datesheetId: string, coordinatorStaffId: string): Promise<number> {
    const query = `
      UPDATE exam_marks
      SET status = 'VERIFIED',
          verified_by_coordinator_id = $1,
          verified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE exam_datesheet_id = $2
      RETURNING id;
    `;
    const res = await pool.query(query, [coordinatorStaffId, datesheetId]);
    return res.rowCount || 0;
  }

  // 12. Datesheet Marks Summary & Analysis
  static async getDatesheetSummary(datesheetId: string): Promise<DatesheetSummary | null> {
    const query = `
      SELECT 
        ds.id as datesheet_id,
        sub.name as subject_name,
        ds.max_marks,
        COUNT(sp.id)::int as total_students,
        COUNT(em.id) FILTER (WHERE em.marks_obtained IS NOT NULL OR em.is_absent = true)::int as entered_count,
        COUNT(em.id) FILTER (WHERE em.is_absent = true)::int as absent_count,
        COUNT(sp.id) FILTER (WHERE em.id IS NULL OR (em.marks_obtained IS NULL AND em.is_absent = false))::int as missing_count,
        ROUND(AVG(em.marks_obtained)::numeric, 2)::float as average_marks,
        MAX(em.marks_obtained)::float as highest_marks,
        MIN(em.marks_obtained)::float as lowest_marks,
        CASE 
          WHEN COUNT(em.id) = 0 THEN 'NOT_ENTERED'
          WHEN BOOL_AND(em.status = 'VERIFIED') THEN 'VERIFIED'
          WHEN BOOL_AND(em.status IN ('SUBMITTED', 'VERIFIED')) THEN 'SUBMITTED'
          ELSE 'DRAFT'
        END as status
      FROM exam_datesheets ds
      JOIN subjects sub ON ds.subject_id = sub.id
      JOIN student_profiles sp ON ds.class_id = sp.current_class_id
        AND (ds.section_id IS NULL OR ds.section_id = sp.current_section_id)
      LEFT JOIN exam_marks em ON em.exam_datesheet_id = ds.id AND em.student_id = sp.id
      WHERE ds.id = $1
      GROUP BY ds.id, sub.name, ds.max_marks;
    `;
    const res = await pool.query(query, [datesheetId]);
    return res.rows[0] || null;
  }

  // 13. Authoritative Class Report Card Generation
  static async generateReportCards(
    examId: string,
    classId: string,
    sectionId: string,
    generatedByStaffId: string,
    remarks?: string
  ): Promise<ReportCardRecord[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get all active students in class & section
      const studentsRes = await client.query(
        `SELECT id, first_name, last_name, roll_number FROM student_profiles
         WHERE current_class_id = $1 AND current_section_id = $2
         ORDER BY roll_number ASC;`,
        [classId, sectionId]
      );
      const students = studentsRes.rows;

      // 2. Get all scheduled datesheets for this exam & class
      const datesheetsRes = await client.query(
        `SELECT id, max_marks FROM exam_datesheets
         WHERE exam_id = $1 AND class_id = $2
           AND (section_id IS NULL OR section_id = $3);`,
        [examId, classId, sectionId]
      );
      const datesheets = datesheetsRes.rows;
      const totalMaxMarks = datesheets.reduce((acc, d) => acc + parseFloat(d.max_marks), 0);

      const generatedCards: ReportCardRecord[] = [];

      for (const student of students) {
        // Fetch student's marks for all datesheets
        const marksRes = await client.query(
          `SELECT marks_obtained, is_absent FROM exam_marks
           WHERE student_id = $1 AND exam_datesheet_id = ANY($2::uuid[]);`,
          [student.id, datesheets.map((d) => d.id)]
        );

        let totalMarksObtained = 0;
        let evaluatedCount = 0;
        let absentCount = 0;

        for (const m of marksRes.rows) {
          if (m.is_absent) {
            absentCount++;
          } else if (m.marks_obtained !== null) {
            totalMarksObtained += parseFloat(m.marks_obtained);
            evaluatedCount++;
          }
        }

        // Authoritative calculation
        const percentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 10000) / 100 : 0.0;

        // Upsert report card
        const cardRes = await client.query(
          `INSERT INTO report_cards (
             exam_id, student_id, class_id, section_id,
             total_marks_obtained, total_max_marks, percentage,
             subjects_evaluated_count, subjects_absent_count,
             status, class_teacher_remarks, generated_by_staff_id, generated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'GENERATED', $10, $11, CURRENT_TIMESTAMP)
           ON CONFLICT (exam_id, student_id) DO UPDATE SET
             total_marks_obtained = EXCLUDED.total_marks_obtained,
             total_max_marks = EXCLUDED.total_max_marks,
             percentage = EXCLUDED.percentage,
             subjects_evaluated_count = EXCLUDED.subjects_evaluated_count,
             subjects_absent_count = EXCLUDED.subjects_absent_count,
             status = 'GENERATED',
             class_teacher_remarks = COALESCE(EXCLUDED.class_teacher_remarks, report_cards.class_teacher_remarks),
             generated_by_staff_id = EXCLUDED.generated_by_staff_id,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *;`,
          [
            examId,
            student.id,
            classId,
            sectionId,
            totalMarksObtained,
            totalMaxMarks,
            percentage,
            evaluatedCount,
            absentCount,
            remarks || null,
            generatedByStaffId,
          ]
        );
        generatedCards.push(cardRes.rows[0]);
      }

      await client.query('COMMIT');
      return generatedCards;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 14. Get Class Report Cards
  static async getClassReportCards(examId: string, classId: string, sectionId: string): Promise<ReportCardRecord[]> {
    const query = `
      SELECT rc.*, 
             concat(sp.first_name, ' ', sp.last_name) as student_name,
             sp.roll_number, sp.admission_number,
             c.name as class_name, sec.name as section_name
      FROM report_cards rc
      JOIN student_profiles sp ON rc.student_id = sp.id
      JOIN classes c ON rc.class_id = c.id
      JOIN sections sec ON rc.section_id = sec.id
      WHERE rc.exam_id = $1 AND rc.class_id = $2 AND rc.section_id = $3
      ORDER BY sp.roll_number ASC, sp.first_name ASC;
    `;
    const res = await pool.query(query, [examId, classId, sectionId]);
    return res.rows.map((r) => ({
      ...r,
      total_marks_obtained: parseFloat(r.total_marks_obtained),
      total_max_marks: parseFloat(r.total_max_marks),
      percentage: parseFloat(r.percentage),
    }));
  }

  // 15. Coordinator Approve Report Cards for Class
  static async approveClassReportCards(
    examId: string,
    classId: string,
    sectionId: string,
    coordinatorStaffId: string
  ): Promise<number> {
    const query = `
      UPDATE report_cards
      SET status = 'APPROVED',
          approved_by_staff_id = $1,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE exam_id = $2 AND class_id = $3 AND section_id = $4
      RETURNING id;
    `;
    const res = await pool.query(query, [coordinatorStaffId, examId, classId, sectionId]);
    return res.rowCount || 0;
  }

  // 16. Student View Own Report Card & Subject-wise Breakdown
  static async getStudentResult(
    examId: string,
    studentId: string
  ): Promise<{
    reportCard: ReportCardRecord | null;
    subjectMarks: {
      subject_name: string;
      subject_code: string;
      max_marks: number;
      passing_marks: number;
      marks_obtained: number | null;
      is_absent: boolean;
      remarks: string | null;
      status: string;
    }[];
  }> {
    // 1. Fetch Report Card
    const cardRes = await pool.query(
      `SELECT rc.*, 
              concat(sp.first_name, ' ', sp.last_name) as student_name,
              sp.roll_number, sp.admission_number,
              c.name as class_name, sec.name as section_name
       FROM report_cards rc
       JOIN student_profiles sp ON rc.student_id = sp.id
       JOIN classes c ON rc.class_id = c.id
       JOIN sections sec ON rc.section_id = sec.id
       WHERE rc.exam_id = $1 AND rc.student_id = $2;`,
      [examId, studentId]
    );

    const reportCard = cardRes.rows[0]
      ? {
          ...cardRes.rows[0],
          total_marks_obtained: parseFloat(cardRes.rows[0].total_marks_obtained),
          total_max_marks: parseFloat(cardRes.rows[0].total_max_marks),
          percentage: parseFloat(cardRes.rows[0].percentage),
        }
      : null;

    // 2. Fetch Subject-wise marks breakdown
    const marksRes = await pool.query(
      `SELECT sub.name as subject_name, sub.code as subject_code,
              ds.max_marks::float, ds.passing_marks::float,
              em.marks_obtained::float, em.is_absent, em.remarks,
              COALESCE(em.status, 'NOT_ENTERED') as status
       FROM exam_datesheets ds
       JOIN subjects sub ON ds.subject_id = sub.id
       JOIN student_profiles sp ON ds.class_id = sp.current_class_id
       LEFT JOIN exam_marks em ON em.exam_datesheet_id = ds.id AND em.student_id = sp.id
       WHERE ds.exam_id = $1 AND sp.id = $2
       ORDER BY ds.exam_date ASC, ds.start_time ASC;`,
      [examId, studentId]
    );

    return {
      reportCard,
      subjectMarks: marksRes.rows.map((r) => ({
        ...r,
        is_absent: Boolean(r.is_absent),
      })),
    };
  }
}
