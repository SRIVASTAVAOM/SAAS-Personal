import { pool } from '../../config/db.config';
import bcrypt from 'bcrypt';

export interface SectionSummary {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  total_students: number;
  is_attendance_marked: boolean;
  present_count: number;
  absent_count: number;
  attendance_status: 'GREEN' | 'RED';
  homework_count: number;
  has_homework: boolean;
  homework_status: 'GREEN' | 'RED';
}

export interface PendingLeaveSummary {
  id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_type: 'STAFF' | 'STUDENT';
  detail: string;
  leave_type?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  document_url?: string | null;
  created_at: string;
}

export interface BirthdaySummary {
  id: string;
  name: string;
  role: 'STUDENT' | 'STAFF';
  detail: string;
  date_of_birth: string;
}

export interface DashboardSummaryResponse {
  date: string;
  sections: SectionSummary[];
  kpis: {
    total_sections: number;
    attendance_marked_sections: number;
    attendance_pending_sections: number;
    homework_assigned_sections: number;
    homework_pending_sections: number;
    total_absent_students: number;
    total_absent_staff: number;
    pending_leaves_count: number;
    today_birthdays_count: number;
  };
  pending_leaves: PendingLeaveSummary[];
  today_birthdays: BirthdaySummary[];
}

export interface TimetableSlotEntry {
  id: string;
  school_id: string;
  academic_year_id: string;
  class_id: string;
  class_name?: string;
  section_id: string;
  section_name?: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  teacher_id: string;
  teacher_name?: string;
  employee_code?: string;
  room_number: string | null;
  created_at: string;
}

export interface TimetableGridResponse {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  academic_year_id: string;
  slots: TimetableSlotEntry[];
  matrix: Record<number, Record<number, TimetableSlotEntry[]>>; // day (1..6) -> period (1..8) -> slots[]
}

export interface GreensheetSubjectHeader {
  datesheet_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  max_marks: number;
  passing_marks: number;
}

export interface GreensheetStudentSubjectMark {
  datesheet_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  max_marks: number;
  passing_marks: number;
  marks_obtained: number | null;
  is_absent: boolean;
  status: 'PASS' | 'FAIL' | 'ABSENT' | 'NOT_ENTERED';
}

export interface GreensheetStudentRow {
  student_id: string;
  admission_number: string;
  roll_number: string;
  student_name: string;
  gender: string;
  subject_marks: GreensheetStudentSubjectMark[];
  total_marks_obtained: number;
  total_max_marks: number;
  percentage: number;
  grade: string;
  result_status: 'PASS' | 'FAIL' | 'ABSENT';
  rank: number;
}

export interface GreensheetResponse {
  exam: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subjects: GreensheetSubjectHeader[];
  students: GreensheetStudentRow[];
  statistics: {
    total_enrolled: number;
    total_appeared: number;
    total_passed: number;
    total_failed: number;
    pass_percentage: number;
    class_average_percentage: number;
    highest_percentage: number;
    lowest_percentage: number;
  };
}

export class AdminRepository {
  /**
   * 1. Get Live Command Center Dashboard Summary
   */
  static async getDashboardSummary(
    schoolId: string,
    targetDateStr?: string
  ): Promise<DashboardSummaryResponse> {
    const today = targetDateStr || new Date().toISOString().split('T')[0];

    // 1. Get all sections
    const sectionsRes = await pool.query(
      `SELECT 
         c.id AS class_id,
         c.name AS class_name,
         s.id AS section_id,
         s.name AS section_name
       FROM sections s
       JOIN classes c ON s.class_id = c.id
       WHERE c.school_id = $1
       ORDER BY c.name ASC, s.name ASC;`,
      [schoolId]
    );

    // 2. Total students per section
    const studentsCountRes = await pool.query(
      `SELECT 
         current_class_id AS class_id,
         current_section_id AS section_id,
         COUNT(*) AS count
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE u.school_id = $1 AND u.is_active = true
       GROUP BY current_class_id, current_section_id;`,
      [schoolId]
    );
    const studentCountMap = new Map<string, number>();
    for (const r of studentsCountRes.rows) {
      studentCountMap.set(`${r.class_id}_${r.section_id}`, parseInt(r.count, 10));
    }

    // 3. Attendance marked today per section
    const attendanceRes = await pool.query(
      `SELECT 
         class_id,
         section_id,
         COUNT(*) AS total_marked,
         COUNT(*) FILTER (WHERE status = 'PRESENT') AS present_count,
         COUNT(*) FILTER (WHERE status = 'ABSENT') AS absent_count
       FROM student_attendance_records
       WHERE school_id = $1 AND attendance_date = $2
       GROUP BY class_id, section_id;`,
      [schoolId, today]
    );
    const attendanceMap = new Map<
      string,
      { total_marked: number; present_count: number; absent_count: number }
    >();
    for (const r of attendanceRes.rows) {
      attendanceMap.set(`${r.class_id}_${r.section_id}`, {
        total_marked: parseInt(r.total_marked, 10),
        present_count: parseInt(r.present_count, 10),
        absent_count: parseInt(r.absent_count, 10),
      });
    }

    // 4. Homework assigned today per section
    const homeworkRes = await pool.query(
      `SELECT 
         class_id,
         section_id,
         COUNT(*) AS homework_count
       FROM homework_assignments
       WHERE school_id = $1 AND (assigned_date = $2 OR created_at::date = $2::date)
       GROUP BY class_id, section_id;`,
      [schoolId, today]
    );
    const homeworkMap = new Map<string, number>();
    for (const r of homeworkRes.rows) {
      homeworkMap.set(`${r.class_id}_${r.section_id}`, parseInt(r.homework_count, 10));
    }

    // Build section summaries
    let attendanceMarkedCount = 0;
    let homeworkAssignedCount = 0;

    const sections: SectionSummary[] = sectionsRes.rows.map((sec) => {
      const key = `${sec.class_id}_${sec.section_id}`;
      const totalStudents = studentCountMap.get(key) || 0;
      const att = attendanceMap.get(key);
      const hwCount = homeworkMap.get(key) || 0;

      const isMarked = !!att && att.total_marked > 0;
      if (isMarked) attendanceMarkedCount++;
      if (hwCount > 0) homeworkAssignedCount++;

      return {
        class_id: sec.class_id,
        class_name: sec.class_name,
        section_id: sec.section_id,
        section_name: sec.section_name,
        total_students: totalStudents,
        is_attendance_marked: isMarked,
        present_count: att ? att.present_count : 0,
        absent_count: att ? att.absent_count : 0,
        attendance_status: isMarked ? 'GREEN' : 'RED',
        homework_count: hwCount,
        has_homework: hwCount > 0,
        homework_status: hwCount > 0 ? 'GREEN' : 'RED',
      };
    });

    // 5. Total absent students today
    const absentStudentsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM student_attendance_records
       WHERE school_id = $1 AND attendance_date = $2 AND status = 'ABSENT';`,
      [schoolId, today]
    );
    const totalAbsentStudents = parseInt(absentStudentsRes.rows[0]?.count || '0', 10);

    // 6. Total absent staff today
    const absentStaffRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM staff_attendance_records sar
       JOIN staff_profiles sp ON sar.staff_id = sp.id
       JOIN users u ON sp.user_id = u.id
       WHERE u.school_id = $1 AND sar.attendance_date = $2 AND sar.status = 'ABSENT';`,
      [schoolId, today]
    );
    const totalAbsentStaff = parseInt(absentStaffRes.rows[0]?.count || '0', 10);

    // 7. Pending leaves
    const staffLeavesRes = await pool.query(
      `SELECT 
         sl.id,
         sl.staff_id AS applicant_id,
         CONCAT(sp.first_name, ' ', sp.last_name) AS applicant_name,
         'STAFF' AS applicant_type,
         CONCAT('Emp: ', sp.employee_code) AS detail,
         sl.leave_type,
         TO_CHAR(sl.start_date, 'YYYY-MM-DD') AS start_date,
         TO_CHAR(sl.end_date, 'YYYY-MM-DD') AS end_date,
         sl.reason,
         sl.status,
         sl.document_url,
         sl.created_at::text
       FROM staff_leaves sl
       JOIN staff_profiles sp ON sl.staff_id = sp.id
       WHERE sl.school_id = $1 AND sl.status = 'PENDING'
       ORDER BY sl.created_at DESC;`,
      [schoolId]
    );

    const studentLeavesRes = await pool.query(
      `SELECT 
         stl.id,
         stl.student_id AS applicant_id,
         CONCAT(stp.first_name, ' ', stp.last_name) AS applicant_name,
         'STUDENT' AS applicant_type,
         CONCAT(c.name, ' - ', s.name) AS detail,
         'STUDENT_LEAVE' AS leave_type,
         TO_CHAR(stl.start_date, 'YYYY-MM-DD') AS start_date,
         TO_CHAR(stl.end_date, 'YYYY-MM-DD') AS end_date,
         stl.reason,
         stl.status,
         stl.document_url,
         stl.created_at::text
       FROM student_leaves stl
       JOIN student_profiles stp ON stl.student_id = stp.id
       LEFT JOIN classes c ON stl.class_id = c.id
       LEFT JOIN sections s ON stl.section_id = s.id
       WHERE stl.school_id = $1 AND stl.status = 'PENDING'
       ORDER BY stl.created_at DESC;`,
      [schoolId]
    );

    const pendingLeaves: PendingLeaveSummary[] = [
      ...staffLeavesRes.rows,
      ...studentLeavesRes.rows,
    ];

    // 8. Today's birthdays
    const studentBirthdaysRes = await pool.query(
      `SELECT 
         stp.id,
         CONCAT(stp.first_name, ' ', stp.last_name) AS name,
         'STUDENT' AS role,
         CONCAT(c.name, ' - ', s.name) AS detail,
         TO_CHAR(stp.date_of_birth, 'YYYY-MM-DD') AS date_of_birth
       FROM student_profiles stp
       JOIN users u ON stp.user_id = u.id
       LEFT JOIN classes c ON stp.current_class_id = c.id
       LEFT JOIN sections s ON stp.current_section_id = s.id
       WHERE u.school_id = $1 AND u.is_active = true
         AND EXTRACT(MONTH FROM stp.date_of_birth) = EXTRACT(MONTH FROM $2::date)
         AND EXTRACT(DAY FROM stp.date_of_birth) = EXTRACT(DAY FROM $2::date);`,
      [schoolId, today]
    );

    const staffBirthdaysRes = await pool.query(
      `SELECT 
         sp.id,
         CONCAT(sp.first_name, ' ', sp.last_name) AS name,
         'STAFF' AS role,
         COALESCE(sp.qualification, 'Faculty') AS detail,
         TO_CHAR(sp.date_of_birth, 'YYYY-MM-DD') AS date_of_birth
       FROM staff_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE u.school_id = $1 AND u.is_active = true
         AND EXTRACT(MONTH FROM sp.date_of_birth) = EXTRACT(MONTH FROM $2::date)
         AND EXTRACT(DAY FROM sp.date_of_birth) = EXTRACT(DAY FROM $2::date);`,
      [schoolId, today]
    );

    const todayBirthdays: BirthdaySummary[] = [
      ...studentBirthdaysRes.rows,
      ...staffBirthdaysRes.rows,
    ];

    return {
      date: today,
      sections,
      kpis: {
        total_sections: sections.length,
        attendance_marked_sections: attendanceMarkedCount,
        attendance_pending_sections: sections.length - attendanceMarkedCount,
        homework_assigned_sections: homeworkAssignedCount,
        homework_pending_sections: sections.length - homeworkAssignedCount,
        total_absent_students: totalAbsentStudents,
        total_absent_staff: totalAbsentStaff,
        pending_leaves_count: pendingLeaves.length,
        today_birthdays_count: todayBirthdays.length,
      },
      pending_leaves: pendingLeaves,
      today_birthdays: todayBirthdays,
    };
  }

  /**
   * 2. Get Master Timetable Grid for a Class & Section
   */
  static async getTimetableGrid(
    schoolId: string,
    classId: string,
    sectionId: string
  ): Promise<TimetableGridResponse> {
    // 1. Resolve class & section details
    const metaRes = await pool.query(
      `SELECT c.name AS class_name, s.name AS section_name
       FROM sections s
       JOIN classes c ON s.class_id = c.id
       WHERE c.school_id = $1 AND c.id = $2 AND s.id = $3 LIMIT 1;`,
      [schoolId, classId, sectionId]
    );

    if (metaRes.rows.length === 0) {
      const error: any = new Error('Class or section not found');
      error.statusCode = 404;
      throw error;
    }

    const { class_name, section_name } = metaRes.rows[0];

    // 2. Fetch slots
    const slotsRes = await pool.query(
      `SELECT 
         ts.id,
         ts.school_id,
         ts.academic_year_id,
         ts.class_id,
         c.name AS class_name,
         ts.section_id,
         sec.name AS section_name,
         ts.day_of_week,
         ts.period_number,
         ts.start_time,
         ts.end_time,
         ts.subject_id,
         sub.name AS subject_name,
         sub.code AS subject_code,
         ts.teacher_id,
         CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
         sp.employee_code,
         ts.room_number,
         ts.created_at::text
       FROM timetable_slots ts
       JOIN classes c ON ts.class_id = c.id
       JOIN sections sec ON ts.section_id = sec.id
       JOIN subjects sub ON ts.subject_id = sub.id
       JOIN staff_profiles sp ON ts.teacher_id = sp.id
       WHERE ts.school_id = $1 AND ts.class_id = $2 AND ts.section_id = $3
       ORDER BY ts.day_of_week ASC, ts.period_number ASC, ts.created_at ASC;`,
      [schoolId, classId, sectionId]
    );

    const slots: TimetableSlotEntry[] = slotsRes.rows;

    // Resolve academic year id (from first slot or active year)
    let academicYearId = slots[0]?.academic_year_id;
    if (!academicYearId) {
      const ayRes = await pool.query(
        `SELECT id FROM academic_years WHERE school_id = $1 AND is_current = true LIMIT 1;`,
        [schoolId]
      );
      academicYearId = ayRes.rows[0]?.id || '';
    }

    // Build day x period matrix (days 1..6, periods 1..8)
    const matrix: Record<number, Record<number, TimetableSlotEntry[]>> = {};
    for (let day = 1; day <= 6; day++) {
      matrix[day] = {};
      for (let p = 1; p <= 8; p++) {
        matrix[day][p] = [];
      }
    }

    for (const slot of slots) {
      if (matrix[slot.day_of_week] && matrix[slot.day_of_week][slot.period_number]) {
        matrix[slot.day_of_week][slot.period_number].push(slot);
      }
    }

    return {
      class_id: classId,
      class_name,
      section_id: sectionId,
      section_name,
      academic_year_id: academicYearId,
      slots,
      matrix,
    };
  }

  /**
   * 3. Save / Update Master Timetable Grid (Atomic transaction, supports split/combined periods)
   */
  static async saveTimetableGrid(
    schoolId: string,
    data: {
      class_id: string;
      section_id: string;
      academic_year_id?: string;
      slots: Array<{
        day_of_week: number;
        period_number: number;
        start_time: string;
        end_time: string;
        subject_id: string;
        teacher_id: string;
        room_number?: string | null;
      }>;
    }
  ): Promise<TimetableGridResponse> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Resolve academic year
      let academicYearId = data.academic_year_id;
      if (!academicYearId) {
        const ayRes = await client.query(
          `SELECT id FROM academic_years WHERE school_id = $1 AND is_current = true LIMIT 1;`,
          [schoolId]
        );
        academicYearId = ayRes.rows[0]?.id;
        if (!academicYearId) {
          throw new Error('No active academic year found for this school');
        }
      }

      // Delete existing slots for this class, section, and academic year
      await client.query(
        `DELETE FROM timetable_slots 
         WHERE school_id = $1 AND class_id = $2 AND section_id = $3 AND academic_year_id = $4;`,
        [schoolId, data.class_id, data.section_id, academicYearId]
      );

      // Insert new slots
      const insertQuery = `
        INSERT INTO timetable_slots (
          school_id, academic_year_id, class_id, section_id,
          day_of_week, period_number, start_time, end_time,
          subject_id, teacher_id, room_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
      `;

      for (const slot of data.slots) {
        await client.query(insertQuery, [
          schoolId,
          academicYearId,
          data.class_id,
          data.section_id,
          slot.day_of_week,
          slot.period_number,
          slot.start_time,
          slot.end_time,
          slot.subject_id,
          slot.teacher_id,
          slot.room_number || null,
        ]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return this.getTimetableGrid(schoolId, data.class_id, data.section_id);
  }

  /**
   * 4. Compute and Return Master Greensheet (Tabulation Marksheet)
   */
  static async getGreensheet(
    schoolId: string,
    classId: string,
    sectionId: string,
    examId?: string
  ): Promise<GreensheetResponse> {
    // 1. Resolve exam
    let targetExamId = examId;
    if (!targetExamId) {
      const examRes = await pool.query(
        `SELECT id, name, TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date, TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date 
         FROM exams 
         WHERE school_id = $1 
         ORDER BY start_date DESC LIMIT 1;`,
        [schoolId]
      );
      if (examRes.rows.length === 0) {
        const error: any = new Error('No examinations found for this school');
        error.statusCode = 404;
        throw error;
      }
      targetExamId = examRes.rows[0].id;
    }

    const examDetailsRes = await pool.query(
      `SELECT id, name, TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date, TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date 
       FROM exams 
       WHERE id = $1 AND school_id = $2;`,
      [targetExamId, schoolId]
    );

    if (examDetailsRes.rows.length === 0) {
      const error: any = new Error('Examination not found');
      error.statusCode = 404;
      throw error;
    }
    const examInfo = examDetailsRes.rows[0];

    // 2. Resolve Class and Section names
    const classSecRes = await pool.query(
      `SELECT c.name AS class_name, s.name AS section_name 
       FROM sections s 
       JOIN classes c ON s.class_id = c.id 
       WHERE c.school_id = $1 AND c.id = $2 AND s.id = $3 LIMIT 1;`,
      [schoolId, classId, sectionId]
    );
    const className = classSecRes.rows[0]?.class_name || 'Class';
    const sectionName = classSecRes.rows[0]?.section_name || 'Section';

    // 3. Get all scheduled datesheets / subjects for this exam & class
    const datesheetsRes = await pool.query(
      `SELECT 
         ed.id AS datesheet_id,
         ed.subject_id,
         sub.name AS subject_name,
         sub.code AS subject_code,
         ed.max_marks::float,
         ed.passing_marks::float
       FROM exam_datesheets ed
       JOIN subjects sub ON ed.subject_id = sub.id
       WHERE ed.exam_id = $1 AND ed.class_id = $2
         AND (ed.section_id IS NULL OR ed.section_id = $3)
       ORDER BY ed.exam_date ASC, ed.start_time ASC;`,
      [targetExamId, classId, sectionId]
    );

    const subjects: GreensheetSubjectHeader[] = datesheetsRes.rows;
    const datesheetIds = subjects.map((s) => s.datesheet_id);

    // 4. Get all enrolled students in that class & section
    const studentsRes = await pool.query(
      `SELECT 
         stp.id AS student_id,
         stp.admission_number,
         COALESCE(stp.roll_number, '') AS roll_number,
         CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
         COALESCE(stp.gender, 'Unspecified') AS gender
       FROM student_profiles stp
       JOIN users u ON stp.user_id = u.id
       WHERE u.school_id = $1 AND u.is_active = true
         AND stp.current_class_id = $2 AND stp.current_section_id = $3
       ORDER BY LPAD(COALESCE(stp.roll_number, '999'), 5, '0') ASC, stp.first_name ASC;`,
      [schoolId, classId, sectionId]
    );

    // 5. Get marks for all these students in datesheetIds
    const marksMap = new Map<string, { marks_obtained: number | null; is_absent: boolean }>();
    if (datesheetIds.length > 0) {
      const marksRes = await pool.query(
        `SELECT 
           student_id,
           exam_datesheet_id,
           marks_obtained::float,
           is_absent
         FROM exam_marks
         WHERE exam_datesheet_id = ANY($1::uuid[]);`,
        [datesheetIds]
      );
      for (const m of marksRes.rows) {
        marksMap.set(`${m.student_id}_${m.exam_datesheet_id}`, {
          marks_obtained: m.marks_obtained,
          is_absent: m.is_absent,
        });
      }
    }

    // Total possible maximum marks across all subjects
    const totalPossibleMaxMarks = subjects.reduce((acc, s) => acc + s.max_marks, 0);

    // 6. Compute rows for each student
    const studentRows: GreensheetStudentRow[] = [];

    for (const student of studentsRes.rows) {
      let totalObtained = 0;
      let allPassed = subjects.length > 0;
      let allAbsent = subjects.length > 0;
      const subjectMarks: GreensheetStudentSubjectMark[] = [];

      for (const sub of subjects) {
        const markEntry = marksMap.get(`${student.student_id}_${sub.datesheet_id}`);

        if (!markEntry) {
          subjectMarks.push({
            datesheet_id: sub.datesheet_id,
            subject_id: sub.subject_id,
            subject_name: sub.subject_name,
            subject_code: sub.subject_code,
            max_marks: sub.max_marks,
            passing_marks: sub.passing_marks,
            marks_obtained: null,
            is_absent: false,
            status: 'NOT_ENTERED',
          });
          allPassed = false;
        } else if (markEntry.is_absent) {
          subjectMarks.push({
            datesheet_id: sub.datesheet_id,
            subject_id: sub.subject_id,
            subject_name: sub.subject_name,
            subject_code: sub.subject_code,
            max_marks: sub.max_marks,
            passing_marks: sub.passing_marks,
            marks_obtained: null,
            is_absent: true,
            status: 'ABSENT',
          });
          allPassed = false;
        } else {
          allAbsent = false;
          const score = markEntry.marks_obtained ?? 0;
          totalObtained += score;
          const isPassed = score >= sub.passing_marks;
          if (!isPassed) allPassed = false;

          subjectMarks.push({
            datesheet_id: sub.datesheet_id,
            subject_id: sub.subject_id,
            subject_name: sub.subject_name,
            subject_code: sub.subject_code,
            max_marks: sub.max_marks,
            passing_marks: sub.passing_marks,
            marks_obtained: score,
            is_absent: false,
            status: isPassed ? 'PASS' : 'FAIL',
          });
        }
      }

      const percentage =
        totalPossibleMaxMarks > 0
          ? Math.round((totalObtained / totalPossibleMaxMarks) * 10000) / 100
          : 0.0;

      // Grade calculation
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else if (percentage >= 33) grade = 'D';

      const resultStatus: 'PASS' | 'FAIL' | 'ABSENT' = allAbsent
        ? 'ABSENT'
        : allPassed
        ? 'PASS'
        : 'FAIL';

      studentRows.push({
        student_id: student.student_id,
        admission_number: student.admission_number,
        roll_number: student.roll_number,
        student_name: student.student_name,
        gender: student.gender,
        subject_marks: subjectMarks,
        total_marks_obtained: totalObtained,
        total_max_marks: totalPossibleMaxMarks,
        percentage,
        grade,
        result_status: resultStatus,
        rank: 0, // Assigned below
      });
    }

    // 7. Assign Ranks based on percentage descending
    const sortedForRank = [...studentRows].sort((a, b) => b.percentage - a.percentage);
    sortedForRank.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    // 8. Calculate Class Statistics
    const totalEnrolled = studentRows.length;
    const appearedList = studentRows.filter((s) => s.result_status !== 'ABSENT');
    const totalAppeared = appearedList.length;
    const totalPassed = studentRows.filter((s) => s.result_status === 'PASS').length;
    const totalFailed = totalAppeared - totalPassed;

    const passPercentage =
      totalAppeared > 0 ? Math.round((totalPassed / totalAppeared) * 10000) / 100 : 0.0;

    const sumPercentage = appearedList.reduce((acc, s) => acc + s.percentage, 0);
    const classAvg =
      totalAppeared > 0 ? Math.round((sumPercentage / totalAppeared) * 100) / 100 : 0.0;

    const highest =
      appearedList.length > 0 ? Math.max(...appearedList.map((s) => s.percentage)) : 0.0;
    const lowest =
      appearedList.length > 0 ? Math.min(...appearedList.map((s) => s.percentage)) : 0.0;

    return {
      exam: examInfo,
      class_id: classId,
      class_name: className,
      section_id: sectionId,
      section_name: sectionName,
      subjects,
      students: studentRows,
      statistics: {
        total_enrolled: totalEnrolled,
        total_appeared: totalAppeared,
        total_passed: totalPassed,
        total_failed: totalFailed,
        pass_percentage: passPercentage,
        class_average_percentage: classAvg,
        highest_percentage: highest,
        lowest_percentage: lowest,
      },
    };
  }

  /**
   * 4. Get active teachers for allocations and substitutions
   */
  static async getTeachers(schoolId: string): Promise<any[]> {
    const query = `
      SELECT DISTINCT
        sp.id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS name,
        sp.employee_code,
        sp.qualification,
        u.email
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.school_id = $1 
        AND r.name IN ('TEACHER', 'COORDINATOR') 
        AND sp.is_active = TRUE
      ORDER BY name ASC;
    `;
    const { rows } = await pool.query(query, [schoolId]);
    return rows;
  }

  /**
   * 4b. Get individual teacher timetable
   */
  static async getTeacherTimetable(schoolId: string, teacherId: string): Promise<any[]> {
    const query = `
      SELECT 
        ts.id,
        ts.day_of_week,
        ts.period_number,
        ts.start_time,
        ts.end_time,
        ts.class_id,
        c.name AS class_name,
        ts.section_id,
        s.name AS section_name,
        ts.subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        ts.room_number,
        CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name
      FROM timetable_slots ts
      JOIN classes c ON ts.class_id = c.id
      JOIN sections s ON ts.section_id = s.id
      JOIN subjects sub ON ts.subject_id = sub.id
      JOIN staff_profiles sp ON ts.teacher_id = sp.id
      WHERE ts.school_id = $1 AND ts.teacher_id = $2
      ORDER BY ts.day_of_week ASC, ts.period_number ASC;
    `;
    const { rows } = await pool.query(query, [schoolId, teacherId]);
    return rows;
  }

  /**
   * 5. Get all substitutions for a given date or all upcoming
   */
  static async getSubstitutions(schoolId: string, targetDate?: string): Promise<any[]> {
    const query = `
      SELECT 
        sub.id,
        sub.timetable_slot_id,
        sub.substitution_date::text AS substitution_date,
        sub.original_teacher_id,
        sub.substitute_teacher_id,
        sub.remarks,
        sub.status,
        ts.day_of_week,
        ts.period_number,
        ts.start_time,
        ts.end_time,
        c.name AS class_name,
        sec.name AS section_name,
        subj.name AS subject_name,
        CONCAT(orig.first_name, ' ', orig.last_name) AS original_teacher_name,
        CONCAT(subs.first_name, ' ', subs.last_name) AS substitute_teacher_name
      FROM teacher_substitutions sub
      JOIN timetable_slots ts ON sub.timetable_slot_id = ts.id
      JOIN classes c ON ts.class_id = c.id
      JOIN sections sec ON ts.section_id = sec.id
      JOIN subjects subj ON ts.subject_id = subj.id
      JOIN staff_profiles orig ON sub.original_teacher_id = orig.id
      JOIN staff_profiles subs ON sub.substitute_teacher_id = subs.id
      WHERE sub.school_id = $1 
        AND ($2::date IS NULL OR sub.substitution_date = $2::date)
      ORDER BY sub.substitution_date DESC, ts.period_number ASC;
    `;
    const { rows } = await pool.query(query, [schoolId, targetDate || null]);
    return rows;
  }

  /**
   * 6. Assign / Update Teacher Substitution
   */
  static async assignSubstitution(
    schoolId: string,
    data: {
      timetable_slot_id: string;
      substitution_date: string;
      original_teacher_id: string;
      substitute_teacher_id: string;
      remarks?: string;
    }
  ): Promise<any> {
    const query = `
      INSERT INTO teacher_substitutions (
        school_id, timetable_slot_id, substitution_date,
        original_teacher_id, substitute_teacher_id, remarks, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'ASSIGNED')
      ON CONFLICT (timetable_slot_id, substitution_date)
      DO UPDATE SET
        substitute_teacher_id = EXCLUDED.substitute_teacher_id,
        remarks = EXCLUDED.remarks,
        status = 'ASSIGNED',
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      schoolId,
      data.timetable_slot_id,
      data.substitution_date,
      data.original_teacher_id,
      data.substitute_teacher_id,
      data.remarks || 'Admin assigned substitution period',
    ]);
    return rows[0];
  }

  /**
   * 7. Delete Substitution
   */
  static async deleteSubstitution(schoolId: string, id: string): Promise<boolean> {
    const query = `
      DELETE FROM teacher_substitutions
      WHERE id = $1 AND school_id = $2
      RETURNING id;
    `;
    const { rows } = await pool.query(query, [id, schoolId]);
    return rows.length > 0;
  }

  /**
   * 8. Comprehensive Students Directory with real-time attendance and fee metrics
   */
  static async getStudentsList(
    schoolId: string,
    filters: { classId?: string; sectionId?: string; search?: string }
  ): Promise<any[]> {
    const query = `
      SELECT 
        sp.id,
        sp.user_id,
        sp.admission_number,
        sp.roll_number,
        CONCAT(sp.first_name, ' ', sp.last_name) AS full_name,
        sp.first_name,
        sp.last_name,
        sp.gender,
        sp.date_of_birth::text AS date_of_birth,
        sp.admission_date::text AS admission_date,
        sp.father_name,
        sp.mother_name,
        sp.emergency_phone,
        u.identifier,
        u.email,
        u.phone,
        u.is_active,
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name,
        COALESCE(att.attendance_percentage, 100.0) AS attendance_percentage,
        COALESCE(fee.total_dues, 0.0) AS total_fee_dues,
        COALESCE(fee.total_paid, 0.0) AS total_fee_paid
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN classes c ON sp.current_class_id = c.id
      LEFT JOIN sections s ON sp.current_section_id = s.id
      LEFT JOIN (
        SELECT 
          student_id,
          ROUND(
            (COUNT(CASE WHEN status IN ('PRESENT', 'LATE') THEN 1 END)::numeric / 
             NULLIF(COUNT(*), 0)::numeric) * 100, 1
          ) AS attendance_percentage
        FROM student_attendances
        GROUP BY student_id
      ) att ON att.student_id = sp.id
      LEFT JOIN (
        SELECT 
          student_id,
          SUM(amount) AS total_dues,
          SUM(amount_paid) AS total_paid
        FROM student_fees
        GROUP BY student_id
      ) fee ON fee.student_id = sp.id
      WHERE u.school_id = $1
        AND ($2::uuid IS NULL OR sp.current_class_id = $2::uuid)
        AND ($3::uuid IS NULL OR sp.current_section_id = $3::uuid)
        AND (
          $4::text IS NULL OR 
          sp.first_name ILIKE '%' || $4 || '%' OR 
          sp.last_name ILIKE '%' || $4 || '%' OR 
          sp.admission_number ILIKE '%' || $4 || '%' OR
          u.identifier ILIKE '%' || $4 || '%'
        )
      ORDER BY c.name ASC, s.name ASC, sp.roll_number ASC, sp.first_name ASC;
    `;
    const { rows } = await pool.query(query, [
      schoolId,
      filters.classId || null,
      filters.sectionId || null,
      filters.search ? filters.search.trim() : null,
    ]);
    return rows;
  }

  /**
   * 9. 360-degree Student Details
   */
  static async getStudentDetails(schoolId: string, studentId: string): Promise<any> {
    const query = `
      SELECT 
        sp.*,
        u.identifier, u.email, u.phone, u.is_active,
        c.name AS class_name, s.name AS section_name
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN classes c ON sp.current_class_id = c.id
      LEFT JOIN sections s ON sp.current_section_id = s.id
      WHERE sp.id = $1 AND u.school_id = $2;
    `;
    const { rows } = await pool.query(query, [studentId, schoolId]);
    return rows[0] || null;
  }

  /**
   * 10. Staff Management: Get All Staff
   */
  static async getAllStaff(schoolId: string, search?: string): Promise<any[]> {
    const query = `
      SELECT 
        sp.id,
        sp.user_id,
        sp.employee_code,
        sp.first_name,
        sp.last_name,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        sp.gender,
        sp.phone,
        sp.emergency_phone,
        sp.qualification,
        sp.blood_group,
        sp.department,
        sp.designation,
        TO_CHAR(sp.joining_date, 'YYYY-MM-DD') AS joining_date,
        TO_CHAR(sp.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
        sp.is_active,
        u.email,
        u.identifier,
        COALESCE(r.name, 'TEACHER') AS role,
        w.name AS wing_name,
        sa.assignment_type
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN staff_assignments sa ON sp.id = sa.staff_id
      LEFT JOIN wings w ON sa.wing_id = w.id
      WHERE u.school_id = $1
        AND ($2::text IS NULL OR (
          CONCAT(sp.first_name, ' ', sp.last_name) ILIKE '%' || $2 || '%' OR
          sp.employee_code ILIKE '%' || $2 || '%' OR
          u.email ILIKE '%' || $2 || '%' OR
          u.identifier ILIKE '%' || $2 || '%'
        ))
      ORDER BY sp.first_name ASC, sp.last_name ASC;
    `;
    const { rows } = await pool.query(query, [schoolId, search ? search.trim() : null]);
    return rows;
  }

  /**
   * 11. Staff Management: Create Staff
   */
  static async createStaff(schoolId: string, data: any): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userCheck = await client.query(
        'SELECT id FROM users WHERE (identifier = $1 OR (email IS NOT NULL AND email = $2)) AND school_id = $3',
        [data.identifier.trim(), data.email ? data.email.trim().toLowerCase() : null, schoolId]
      );
      if (userCheck.rows.length > 0) {
        throw new Error('A user with this username/identifier or email already exists.');
      }

      const empCheck = await client.query(
        'SELECT id FROM staff_profiles WHERE employee_code = $1',
        [data.employee_code.trim()]
      );
      if (empCheck.rows.length > 0) {
        throw new Error('A staff member with this Employee Code already exists.');
      }

      const password = data.password || 'Staff@123';
      const passwordHash = await bcrypt.hash(password, 12);

      const userRes = await client.query(
        `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          schoolId,
          data.identifier.trim(),
          data.email ? data.email.trim().toLowerCase() : null,
          data.phone || null,
          passwordHash,
          true,
        ]
      );
      const userId = userRes.rows[0].id;

      const roleName = data.role || 'TEACHER';
      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
      if (roleRes.rows.length > 0) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, roleRes.rows[0].id]
        );
      }

      const staffRes = await client.query(
        `INSERT INTO staff_profiles (
          user_id, employee_code, first_name, last_name, gender, date_of_birth,
          qualification, joining_date, emergency_phone, phone, blood_group,
          department, designation, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          userId,
          data.employee_code.trim(),
          data.first_name.trim(),
          data.last_name ? data.last_name.trim() : '',
          data.gender || null,
          data.date_of_birth || null,
          data.qualification || null,
          data.joining_date || new Date().toISOString().split('T')[0],
          data.emergency_phone || null,
          data.phone || null,
          data.blood_group || null,
          data.department || null,
          data.designation || null,
          true,
        ]
      );

      if (data.wing_id) {
        await client.query(
          `INSERT INTO staff_assignments (staff_id, wing_id, assignment_type)
           VALUES ($1, $2, $3)`,
          [staffRes.rows[0].id, data.wing_id, data.assignment_type || roleName]
        );
      }

      await client.query('COMMIT');
      return staffRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 12. Staff Management: Update Staff
   */
  static async updateStaff(schoolId: string, staffId: string, data: any): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const checkRes = await client.query(
        `SELECT sp.id, sp.user_id FROM staff_profiles sp 
         JOIN users u ON sp.user_id = u.id 
         WHERE sp.id = $1 AND u.school_id = $2`,
        [staffId, schoolId]
      );
      if (checkRes.rows.length === 0) {
        throw new Error('Staff member not found.');
      }
      const userId = checkRes.rows[0].user_id;

      await client.query(
        `UPDATE staff_profiles SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          employee_code = COALESCE($3, employee_code),
          gender = COALESCE($4, gender),
          date_of_birth = COALESCE($5, date_of_birth),
          qualification = COALESCE($6, qualification),
          joining_date = COALESCE($7, joining_date),
          emergency_phone = COALESCE($8, emergency_phone),
          phone = COALESCE($9, phone),
          blood_group = COALESCE($10, blood_group),
          department = COALESCE($11, department),
          designation = COALESCE($12, designation),
          is_active = COALESCE($13, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $14`,
        [
          data.first_name ? data.first_name.trim() : null,
          data.last_name !== undefined ? data.last_name.trim() : null,
          data.employee_code ? data.employee_code.trim() : null,
          data.gender ?? null,
          data.date_of_birth ?? null,
          data.qualification ?? null,
          data.joining_date ?? null,
          data.emergency_phone ?? null,
          data.phone ?? null,
          data.blood_group ?? null,
          data.department ?? null,
          data.designation ?? null,
          data.is_active !== undefined ? data.is_active : null,
          staffId,
        ]
      );

      await client.query(
        `UPDATE users SET
          email = COALESCE($1, email),
          phone = COALESCE($2, phone),
          is_active = COALESCE($3, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4`,
        [
          data.email ? data.email.trim().toLowerCase() : null,
          data.phone ?? null,
          data.is_active !== undefined ? data.is_active : null,
          userId,
        ]
      );

      if (data.password && data.password.trim()) {
        const hash = await bcrypt.hash(data.password.trim(), 12);
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
      }

      if (data.role) {
        const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [data.role]);
        if (roleRes.rows.length > 0) {
          await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
          await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [
            userId,
            roleRes.rows[0].id,
          ]);
        }
      }

      await client.query('COMMIT');
      return { success: true, message: 'Staff profile updated successfully' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 13. Staff Management: Remove Staff (Deactivate)
   */
  static async deleteStaff(schoolId: string, staffId: string): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const check = await client.query(
        `SELECT sp.user_id FROM staff_profiles sp
         JOIN users u ON sp.user_id = u.id
         WHERE sp.id = $1 AND u.school_id = $2`,
        [staffId, schoolId]
      );
      if (check.rows.length === 0) {
        throw new Error('Staff member not found.');
      }
      const userId = check.rows[0].user_id;

      await client.query('UPDATE staff_profiles SET is_active = FALSE WHERE id = $1', [staffId]);
      await client.query('UPDATE users SET is_active = FALSE WHERE id = $1', [userId]);

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 14. View Homework: All assignments across school with teacher names and progress
   */
  static async getAdminHomework(
    schoolId: string,
    filters: { classId?: string; sectionId?: string; subjectId?: string; search?: string }
  ): Promise<any[]> {
    const query = `
      SELECT 
        ha.id,
        ha.title,
        ha.description,
        TO_CHAR(ha.assigned_date, 'YYYY-MM-DD') AS assigned_date,
        TO_CHAR(ha.due_date, 'YYYY-MM-DD') AS due_date,
        ha.s3_attachment_key,
        ha.attachment_name,
        ha.created_at,
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name,
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        sp.id AS teacher_id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
        sp.employee_code AS teacher_emp_code,
        (SELECT COUNT(*) FROM student_homework_completions shc WHERE shc.homework_id = ha.id AND shc.status = 'COMPLETED')::int AS completed_submissions_count,
        (SELECT COUNT(*) FROM student_profiles stp WHERE stp.current_class_id = ha.class_id AND stp.current_section_id = ha.section_id AND stp.is_active = TRUE)::int AS total_students_count
      FROM homework_assignments ha
      JOIN classes c ON ha.class_id = c.id
      JOIN sections s ON ha.section_id = s.id
      JOIN subjects sub ON ha.subject_id = sub.id
      JOIN staff_profiles sp ON ha.assigned_by_staff_id = sp.id
      WHERE ha.school_id = $1
        AND ($2::uuid IS NULL OR ha.class_id = $2::uuid)
        AND ($3::uuid IS NULL OR ha.section_id = $3::uuid)
        AND ($4::uuid IS NULL OR ha.subject_id = $4::uuid)
        AND ($5::text IS NULL OR (
          ha.title ILIKE '%' || $5 || '%' OR
          ha.description ILIKE '%' || $5 || '%' OR
          CONCAT(sp.first_name, ' ', sp.last_name) ILIKE '%' || $5 || '%' OR
          sub.name ILIKE '%' || $5 || '%'
        ))
      ORDER BY ha.assigned_date DESC, ha.created_at DESC;
    `;
    const { rows } = await pool.query(query, [
      schoolId,
      filters.classId || null,
      filters.sectionId || null,
      filters.subjectId || null,
      filters.search ? filters.search.trim() : null,
    ]);
    return rows;
  }

  /**
   * 15. View Feedback & Complaints
   */
  static async getAdminFeedback(schoolId: string): Promise<{ feedback: any[]; complaints: any[] }> {
    const feedbackQuery = `
      SELECT 
        f.id,
        f.category,
        f.rating,
        f.feedback_text,
        f.created_at,
        stp.id AS student_id,
        CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
        stp.admission_number,
        stp.roll_number,
        c.name AS class_name,
        s.name AS section_name
      FROM school_feedback f
      JOIN student_profiles stp ON f.student_id = stp.id
      LEFT JOIN classes c ON stp.current_class_id = c.id
      LEFT JOIN sections s ON stp.current_section_id = s.id
      WHERE f.school_id = $1
      ORDER BY f.created_at DESC;
    `;

    const complaintsQuery = `
      SELECT 
        cmp.id,
        cmp.title,
        cmp.category,
        cmp.description,
        cmp.status,
        cmp.resolution_notes,
        cmp.created_at,
        cmp.updated_at,
        stp.id AS student_id,
        CONCAT(stp.first_name, ' ', stp.last_name) AS student_name,
        stp.admission_number,
        stp.roll_number,
        c.name AS class_name,
        s.name AS section_name
      FROM student_complaints cmp
      JOIN student_profiles stp ON cmp.student_id = stp.id
      LEFT JOIN classes c ON stp.current_class_id = c.id
      LEFT JOIN sections s ON stp.current_section_id = s.id
      WHERE cmp.school_id = $1
      ORDER BY cmp.created_at DESC;
    `;

    const [fbRes, cmpRes] = await Promise.all([
      pool.query(feedbackQuery, [schoolId]),
      pool.query(complaintsQuery, [schoolId]),
    ]);

    return {
      feedback: fbRes.rows,
      complaints: cmpRes.rows,
    };
  }

  /**
   * 16. Update Student Complaint / Grievance Status
   */
  static async updateComplaintStatus(
    schoolId: string,
    complaintId: string,
    data: { status: string; resolution_notes?: string }
  ): Promise<any> {
    const query = `
      UPDATE student_complaints SET
        status = $1,
        resolution_notes = COALESCE($2, resolution_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND school_id = $4
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      data.status,
      data.resolution_notes || null,
      complaintId,
      schoolId,
    ]);
    return rows[0] || null;
  }
}

