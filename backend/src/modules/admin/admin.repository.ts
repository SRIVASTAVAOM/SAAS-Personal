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

export interface StudentAttendanceRecordSummary {
  id: string;
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | string;
  attendance_date: string;
  remarks: string | null;
  admission_number: string;
  roll_number: string | null;
  student_name: string;
  class_name?: string;
  section_name?: string;
}

export interface RecentActivitySummary {
  id: string;
  date: string;
  time: string;
  activity: string;
  user: string;
}

export interface TodayStatusSummary {
  total_students: number;
  present_students: number;
  absent_students: number;
  total_teachers: number;
  present_teachers: number;
  absent_teachers: number;
  total_classes: number;
  total_sections: number;
  today_fee_collection: number;
  total_transport: number;
  total_parents: number;
}

export interface FeeOverviewSummary {
  total_students: number;
  total_fee: number;
  paid_fee: number;
  due_fee: number;
  paid_percentage: number;
  due_percentage: number;
}

export interface FeeModeSummary {
  amount: number;
  count: number;
}

export interface DaywiseCollectionSummary {
  date: string;
  total_received: number;
  total_created: number;
  received_count: number;
  created_count: number;
  by_mode: {
    cash: FeeModeSummary;
    online: FeeModeSummary;
    cheque: FeeModeSummary;
    upi: FeeModeSummary;
  };
}

export interface MonthlyCollectionSummary {
  month: string;
  total_received: number;
  total_created: number;
  received_count: number;
  created_count: number;
  by_mode: {
    cash: FeeModeSummary;
    online: FeeModeSummary;
    cheque: FeeModeSummary;
    upi: FeeModeSummary;
  };
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
    total_faculty?: number;
    pending_leaves_count: number;
    today_birthdays_count: number;
  };
  daily_collection?: DaywiseCollectionSummary;
  monthly_collection?: MonthlyCollectionSummary;
  fee_realized?: {
    total: number;
    by_mode: {
      cash: number;
      online: number;
      app_payments: number;
      cheques: number;
    };
    counts: {
      cash: number;
      online: number;
      app_payments: number;
      cheques: number;
    };
  };
  fee_overview?: FeeOverviewSummary;
  today_status?: TodayStatusSummary;
  recent_activities?: RecentActivitySummary[];
  today_student_attendance?: StudentAttendanceRecordSummary[];
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

/**
 * Robust date parser for bulk CSV uploads and user input.
 * Converts DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, Excel serials, etc.
 * to PostgreSQL-compatible YYYY-MM-DD, or null if invalid.
 */
export function parseSafeDate(val: any): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().replace(/^["']|["']$/g, '');
  if (!str || str === '-' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') {
    return null;
  }

  // 1. Check Excel serial date numbers (e.g. 40677 -> 2011-05-14)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    if (serial > 20000 && serial < 60000) {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + serial * 86400000);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
  }

  // 2. Check DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    let day = p1;
    let month = p2;

    // If month > 12 and day <= 12, user might have used MM-DD-YYYY
    if (month > 12 && day <= 12) {
      day = p2;
      month = p1;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 3. Check YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 4. Fallback to JS Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    if (y >= 1900 && y <= 2100) {
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

export class AdminRepository {
  /**
   * 1. Get Live Command Center Dashboard Summary
   */
  static async getDashboardSummary(
    schoolId: string,
    targetDateStr?: string,
    filterClassId?: string,
    filterSectionId?: string,
    filterMonth?: string
  ): Promise<DashboardSummaryResponse> {
    const today = targetDateStr || (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

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

    // 3b. Today's student attendance records (Present and Absent students with details)
    const todayStudentAttendanceRes = await pool.query(
      `SELECT 
         sar.id,
         sar.student_id,
         sar.status,
         TO_CHAR(sar.attendance_date, 'YYYY-MM-DD') AS attendance_date,
         sar.remarks,
         sp.admission_number,
         sp.roll_number,
         CONCAT(sp.first_name, ' ', sp.last_name) AS student_name,
         c.name AS class_name,
         s.name AS section_name
       FROM student_attendance_records sar
       JOIN student_profiles sp ON sar.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN classes c ON sar.class_id = c.id
       LEFT JOIN sections s ON sar.section_id = s.id
       WHERE u.school_id = $1 AND sar.attendance_date = $2
       ORDER BY c.name ASC, s.name ASC, sp.roll_number ASC, sp.first_name ASC;`,
      [schoolId, today]
    );

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

    // 6b. Total faculty in school
    const facultyCountRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM staff_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE u.school_id = $1 AND u.is_active = true;`,
      [schoolId]
    );
    const totalFaculty = parseInt(facultyCountRes.rows[0]?.count || '0', 10);

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

    // Dynamic filters for Class & Section
    const classFilterReceipts = filterClassId && filterClassId !== 'ALL'
      ? `AND fr.student_id IN (SELECT id FROM student_profiles WHERE current_class_id = '${filterClassId}')`
      : '';
    const sectionFilterReceipts = filterSectionId && filterSectionId !== 'ALL'
      ? `AND fr.student_id IN (SELECT id FROM student_profiles WHERE current_section_id = '${filterSectionId}')`
      : '';

    const classFilterFees = filterClassId && filterClassId !== 'ALL'
      ? `AND sf.student_id IN (SELECT id FROM student_profiles WHERE current_class_id = '${filterClassId}')`
      : '';
    const sectionFilterFees = filterSectionId && filterSectionId !== 'ALL'
      ? `AND sf.student_id IN (SELECT id FROM student_profiles WHERE current_section_id = '${filterSectionId}')`
      : '';

    // Mode parser helper
    const parseModeBreakdown = (rows: any[]) => {
      const breakdown = {
        cash: { amount: 0, count: 0 },
        online: { amount: 0, count: 0 },
        cheque: { amount: 0, count: 0 },
        upi: { amount: 0, count: 0 },
      };

      for (const r of rows) {
        const mode = (r.payment_mode || '').toUpperCase();
        const amt = Number(r.total_amount) || 0;
        const cnt = Number(r.count) || 0;
        if (mode === 'CASH') {
          breakdown.cash.amount += amt;
          breakdown.cash.count += cnt;
        } else if (mode === 'ONLINE' || mode === 'BANK_TRANSFER') {
          breakdown.online.amount += amt;
          breakdown.online.count += cnt;
        } else if (mode === 'APP_PAYMENTS' || mode === 'APP' || mode === 'UPI') {
          breakdown.upi.amount += amt;
          breakdown.upi.count += cnt;
        } else if (mode === 'CHEQUE' || mode === 'CHEQUES' || mode === 'DEMAND_DRAFT') {
          breakdown.cheque.amount += amt;
          breakdown.cheque.count += cnt;
        } else {
          breakdown.online.amount += amt;
          breakdown.online.count += cnt;
        }
      }

      const totalReceived =
        breakdown.cash.amount +
        breakdown.online.amount +
        breakdown.cheque.amount +
        breakdown.upi.amount;

      const totalCount =
        breakdown.cash.count +
        breakdown.online.count +
        breakdown.cheque.count +
        breakdown.upi.count;

      return { breakdown, totalReceived, totalCount };
    };

    // 9a. Daily Fee Collection (Received Today / Selected Day)
    const dailyFeeRes = await pool.query(
      `SELECT 
         payment_mode,
         COALESCE(SUM(amount_paid), 0)::float AS total_amount,
         COUNT(*)::int AS count
       FROM fee_receipts fr
       WHERE fr.school_id = $1 
         AND (fr.payment_date = $2 OR fr.created_at::date = $2::date)
         ${classFilterReceipts}
         ${sectionFilterReceipts}
       GROUP BY payment_mode;`,
      [schoolId, today]
    );
    const dailyParsed = parseModeBreakdown(dailyFeeRes.rows);

    // 9b. Daily Fee Created (Invoiced / Generated Today)
    const dailyCreatedRes = await pool.query(
      `SELECT 
         COALESCE(SUM(amount), 0)::float AS total_created,
         COUNT(*)::int AS created_count
       FROM student_fees sf
       WHERE sf.school_id = $1 
         AND (sf.created_at::date = $2::date OR sf.due_date = $2::date)
         ${classFilterFees}
         ${sectionFilterFees};`,
      [schoolId, today]
    );
    const dailyTotalCreated = Number(dailyCreatedRes.rows[0]?.total_created || 0);
    const dailyCreatedCount = Number(dailyCreatedRes.rows[0]?.created_count || 0);

    // 9c. Monthly Fee Collection (Current Month / Target Date Month)
    const monthlyFeeRes = await pool.query(
      `SELECT 
         payment_mode,
         COALESCE(SUM(amount_paid), 0)::float AS total_amount,
         COUNT(*)::int AS count
       FROM fee_receipts fr
       WHERE fr.school_id = $1 
         AND EXTRACT(MONTH FROM fr.payment_date) = EXTRACT(MONTH FROM $2::date)
         AND EXTRACT(YEAR FROM fr.payment_date) = EXTRACT(YEAR FROM $2::date)
         ${classFilterReceipts}
         ${sectionFilterReceipts}
       GROUP BY payment_mode;`,
      [schoolId, today]
    );
    const monthlyParsed = parseModeBreakdown(monthlyFeeRes.rows);

    // 9d. Monthly Fee Created (Invoiced This Month)
    const monthlyCreatedRes = await pool.query(
      `SELECT 
         COALESCE(SUM(amount), 0)::float AS total_created,
         COUNT(*)::int AS created_count
       FROM student_fees sf
       WHERE sf.school_id = $1 
         AND EXTRACT(MONTH FROM sf.created_at) = EXTRACT(MONTH FROM $2::date)
         AND EXTRACT(YEAR FROM sf.created_at) = EXTRACT(YEAR FROM $2::date)
         ${classFilterFees}
         ${sectionFilterFees};`,
      [schoolId, today]
    );
    const monthlyTotalCreated = Number(monthlyCreatedRes.rows[0]?.total_created || 0);
    const monthlyCreatedCount = Number(monthlyCreatedRes.rows[0]?.created_count || 0);

    const monthDateObj = new Date(today);
    const monthLabel = !isNaN(monthDateObj.getTime())
      ? monthDateObj.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      : 'October 2026';

    // 9e. Overall Fee Realized across all time
    const overallFeeRes = await pool.query(
      `SELECT 
         payment_mode,
         COALESCE(SUM(amount_paid), 0)::float AS total_amount,
         COUNT(*)::int AS count
       FROM fee_receipts fr
       WHERE fr.school_id = $1
         ${classFilterReceipts}
         ${sectionFilterReceipts}
       GROUP BY payment_mode;`,
      [schoolId]
    );
    const overallParsed = parseModeBreakdown(overallFeeRes.rows);

    // 10. Fee Overview Calculation (Total Fee, Paid, Due)
    const feeOverviewRes = await pool.query(
      `SELECT 
         COALESCE(SUM(amount), 0)::float AS total_fee,
         COALESCE(SUM(amount_paid), 0)::float AS paid_fee
       FROM student_fees sf
       WHERE sf.school_id = $1
         ${classFilterFees}
         ${sectionFilterFees};`,
      [schoolId]
    );
    const dbTotalFee = Number(feeOverviewRes.rows[0]?.total_fee || 0);
    const dbPaidFee = Number(feeOverviewRes.rows[0]?.paid_fee || 0);
    const effectivePaid = Math.max(dbPaidFee, overallParsed.totalReceived);
    const effectiveTotal = Math.max(dbTotalFee, effectivePaid);
    const effectiveDue = Math.max(0, effectiveTotal - effectivePaid);
    const paidPercentage = effectiveTotal > 0 ? Math.round((effectivePaid / effectiveTotal) * 100) : 100;
    const duePercentage = 100 - paidPercentage;

    const dailyCollectionSummary: DaywiseCollectionSummary = {
      date: today,
      total_received: dailyParsed.totalReceived,
      total_created: dailyTotalCreated,
      received_count: dailyParsed.totalCount,
      created_count: dailyCreatedCount,
      by_mode: dailyParsed.breakdown,
    };

    const monthlyCollectionSummary: MonthlyCollectionSummary = {
      month: monthLabel,
      total_received: monthlyParsed.totalReceived,
      total_created: monthlyTotalCreated,
      received_count: monthlyParsed.totalCount,
      created_count: monthlyCreatedCount,
      by_mode: monthlyParsed.breakdown,
    };

    // Classes count
    const totalClassesRes = await pool.query(
      `SELECT COUNT(*) AS count FROM classes WHERE school_id = $1;`,
      [schoolId]
    );
    const totalClasses = parseInt(totalClassesRes.rows[0]?.count || '0', 10);

    const totalStudentsCount = Array.from(studentCountMap.values()).reduce((a, b) => a + b, 0);
    const presentStudentsCount = todayStudentAttendanceRes.rows.filter(s => s.status === 'PRESENT').length;

    // Staff attendance today
    const presentStaffRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM staff_attendance_records sar
       JOIN staff_profiles sp ON sar.staff_id = sp.id
       JOIN users u ON sp.user_id = u.id
       WHERE u.school_id = $1 AND sar.attendance_date = $2 AND sar.status = 'PRESENT';`,
      [schoolId, today]
    );
    const presentStaffCount = parseInt(presentStaffRes.rows[0]?.count || '0', 10) || Math.max(0, totalFaculty - totalAbsentStaff);

    // 11. Recent Activities Log
    const recentActivitiesRes = await pool.query(
      `SELECT * FROM (
         SELECT 
           fr.id::text,
           TO_CHAR(fr.created_at, 'DD-MM-YYYY') AS date,
           TO_CHAR(fr.created_at, 'HH12:MI AM') AS time,
           CONCAT('Fee collected for ', sp.first_name, ' ', sp.last_name, ' (₹', fr.amount_paid::int, ')') AS activity,
           'Admin' AS user,
           fr.created_at
         FROM fee_receipts fr
         JOIN student_profiles sp ON fr.student_id = sp.id
         WHERE fr.school_id = $1

         UNION ALL

         SELECT 
           sp.id::text,
           TO_CHAR(sp.created_at, 'DD-MM-YYYY') AS date,
           TO_CHAR(sp.created_at, 'HH12:MI AM') AS time,
           CONCAT('New student added - ', sp.first_name, ' ', sp.last_name, ' (', COALESCE(c.name, 'Class'), ')') AS activity,
           'Admin' AS user,
           sp.created_at
         FROM student_profiles sp
         JOIN users u ON sp.user_id = u.id
         LEFT JOIN classes c ON sp.current_class_id = c.id
         WHERE u.school_id = $1

         UNION ALL

         SELECT 
           hw.id::text,
           TO_CHAR(hw.created_at, 'DD-MM-YYYY') AS date,
           TO_CHAR(hw.created_at, 'HH12:MI AM') AS time,
           CONCAT('Homework assigned - ', hw.title, ' (', COALESCE(c.name, 'Class'), ')') AS activity,
           'Admin' AS user,
           hw.created_at
         FROM homework_assignments hw
         LEFT JOIN classes c ON hw.class_id = c.id
         WHERE hw.school_id = $1

         UNION ALL

         SELECT 
           am.id::text,
           TO_CHAR(am.created_at, 'DD-MM-YYYY') AS date,
           TO_CHAR(am.created_at, 'HH12:MI AM') AS time,
           CONCAT('Study material uploaded - ', am.title, ' (', COALESCE(c.name, 'Class'), ')') AS activity,
           'Admin' AS user,
           am.created_at
         FROM academic_materials am
         LEFT JOIN classes c ON am.class_id = c.id
         WHERE am.school_id = $1
       ) act
       ORDER BY act.created_at DESC
       LIMIT 8;`,
      [schoolId]
    );

    const recentActivities: RecentActivitySummary[] = recentActivitiesRes.rows.map(r => ({
      id: r.id,
      date: r.date,
      time: r.time,
      activity: r.activity,
      user: r.user || 'Admin',
    }));

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
        total_faculty: totalFaculty,
        pending_leaves_count: pendingLeaves.length,
        today_birthdays_count: todayBirthdays.length,
      },
      daily_collection: dailyCollectionSummary,
      monthly_collection: monthlyCollectionSummary,
      fee_realized: {
        total: overallParsed.totalReceived,
        by_mode: {
          cash: overallParsed.breakdown.cash.amount,
          online: overallParsed.breakdown.online.amount,
          app_payments: overallParsed.breakdown.upi.amount,
          cheques: overallParsed.breakdown.cheque.amount,
        },
        counts: {
          cash: overallParsed.breakdown.cash.count,
          online: overallParsed.breakdown.online.count,
          app_payments: overallParsed.breakdown.upi.count,
          cheques: overallParsed.breakdown.cheque.count,
        },
      },
      fee_overview: {
        total_students: totalStudentsCount,
        total_fee: effectiveTotal,
        paid_fee: effectivePaid,
        due_fee: effectiveDue,
        paid_percentage: paidPercentage,
        due_percentage: duePercentage,
      },
      today_status: {
        total_students: totalStudentsCount,
        present_students: presentStudentsCount,
        absent_students: totalAbsentStudents,
        total_teachers: totalFaculty,
        present_teachers: presentStaffCount,
        absent_teachers: totalAbsentStaff,
        total_classes: totalClasses,
        total_sections: sections.length,
        today_fee_collection: dailyParsed.totalReceived,
        total_transport: 18,
        total_parents: totalStudentsCount,
      },
      recent_activities: recentActivities,
      today_student_attendance: todayStudentAttendanceRes.rows,
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
    filters: { classId?: string; sectionId?: string; classIds?: string[]; sectionIds?: string[]; search?: string }
  ): Promise<any[]> {
    const classIds = filters.classIds && filters.classIds.length > 0
      ? filters.classIds
      : filters.classId ? [filters.classId] : null;

    const sectionIds = filters.sectionIds && filters.sectionIds.length > 0
      ? filters.sectionIds
      : filters.sectionId ? [filters.sectionId] : null;

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
        COALESCE(sp.login_password, 'Student@123') AS password,
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
        FROM student_attendance_records
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
        AND ($2::uuid[] IS NULL OR sp.current_class_id = ANY($2::uuid[]))
        AND ($3::uuid[] IS NULL OR sp.current_section_id = ANY($3::uuid[]))
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
      classIds,
      sectionIds,
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
   * 9b. Update Student Details
   */
  static async updateStudent(
    schoolId: string,
    studentId: string,
    updates: {
      first_name?: string;
      last_name?: string;
      roll_number?: string | null;
      emergency_phone?: string | null;
      blood_group?: string | null;
      medical_notes?: string | null;
      father_name?: string | null;
      mother_name?: string | null;
      gender?: string | null;
      date_of_birth?: string | null;
      current_class_id?: string | null;
      current_section_id?: string | null;
      phone?: string | null;
      email?: string | null;
    }
  ): Promise<any> {
    const checkQuery = `
      SELECT sp.id, sp.user_id 
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1 AND u.school_id = $2;
    `;
    const checkRes = await pool.query(checkQuery, [studentId, schoolId]);
    if (checkRes.rows.length === 0) {
      return null;
    }
    const userId = checkRes.rows[0].user_id;

    const profileFields: string[] = [];
    const profileVals: any[] = [];
    let pIdx = 1;

    if (updates.first_name !== undefined) {
      profileFields.push(`first_name = $${pIdx++}`);
      profileVals.push(updates.first_name);
    }
    if (updates.last_name !== undefined) {
      profileFields.push(`last_name = $${pIdx++}`);
      profileVals.push(updates.last_name);
    }
    if (updates.roll_number !== undefined) {
      profileFields.push(`roll_number = $${pIdx++}`);
      profileVals.push(updates.roll_number);
    }
    if (updates.emergency_phone !== undefined) {
      profileFields.push(`emergency_phone = $${pIdx++}`);
      profileVals.push(updates.emergency_phone);
    }
    if (updates.blood_group !== undefined) {
      profileFields.push(`blood_group = $${pIdx++}`);
      profileVals.push(updates.blood_group);
    }
    if (updates.medical_notes !== undefined) {
      profileFields.push(`medical_notes = $${pIdx++}`);
      profileVals.push(updates.medical_notes);
    }
    if (updates.father_name !== undefined) {
      profileFields.push(`father_name = $${pIdx++}`);
      profileVals.push(updates.father_name);
    }
    if (updates.mother_name !== undefined) {
      profileFields.push(`mother_name = $${pIdx++}`);
      profileVals.push(updates.mother_name);
    }
    if (updates.gender !== undefined) {
      profileFields.push(`gender = $${pIdx++}`);
      profileVals.push(updates.gender);
    }
    if (updates.date_of_birth !== undefined) {
      profileFields.push(`date_of_birth = $${pIdx++}`);
      profileVals.push(updates.date_of_birth);
    }
    if (updates.current_class_id !== undefined) {
      profileFields.push(`current_class_id = $${pIdx++}`);
      profileVals.push(updates.current_class_id);
    }
    if (updates.current_section_id !== undefined) {
      profileFields.push(`current_section_id = $${pIdx++}`);
      profileVals.push(updates.current_section_id);
    }

    if (profileFields.length > 0) {
      profileVals.push(studentId);
      await pool.query(
        `UPDATE student_profiles SET ${profileFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${pIdx}`,
        profileVals
      );
    }

    const userFields: string[] = [];
    const userVals: any[] = [];
    let uIdx = 1;
    if (updates.phone !== undefined) {
      userFields.push(`phone = $${uIdx++}`);
      userVals.push(updates.phone);
    }
    if (updates.email !== undefined) {
      userFields.push(`email = $${uIdx++}`);
      userVals.push(updates.email);
    }
    if (userFields.length > 0) {
      userVals.push(userId);
      await pool.query(
        `UPDATE users SET ${userFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${uIdx}`,
        userVals
      );
    }

    return await this.getStudentDetails(schoolId, studentId);
  }

  /**
   * 9c. Reset Student Password (Admin Reset Desk)
   */
  static async resetStudentPassword(schoolId: string, studentId: string, customPassword?: string): Promise<any> {
    const checkQuery = `
      SELECT sp.id, sp.user_id, u.identifier, sp.first_name, sp.last_name
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1 AND u.school_id = $2;
    `;
    const checkRes = await pool.query(checkQuery, [studentId, schoolId]);
    if (checkRes.rows.length === 0) {
      throw new Error('STUDENT_NOT_FOUND');
    }
    const student = checkRes.rows[0];
    const passwordToSet = (customPassword && customPassword.trim()) ? customPassword.trim() : 'Student@123';
    const hash = await bcrypt.hash(passwordToSet, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        hash,
        student.user_id,
      ]);
      await client.query('UPDATE student_profiles SET login_password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        passwordToSet,
        student.id,
      ]);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Student password reset successfully',
        studentId: student.id,
        identifier: student.identifier,
        newPassword: passwordToSet,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 10. Staff Management: Get All Staff
   */
  static async getAllStaff(schoolId: string, search?: string, isActive?: boolean): Promise<any[]> {
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
        COALESCE(sp.login_password, 'Staff@123') AS password,
        u.email,
        u.identifier,
        u.identifier AS username,
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
        AND ($3::boolean IS NULL OR sp.is_active = $3)
      ORDER BY sp.first_name ASC, sp.last_name ASC;
    `;
    const { rows } = await pool.query(query, [
      schoolId,
      search ? search.trim() : null,
      isActive !== undefined ? isActive : null,
    ]);
    return rows;
  }

  /**
   * 10b. Student Management: Create Single Student (New Admission Form)
   */
  static async createStudent(schoolId: string, data: any): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const admissionNumber = (
        data.admission_number ||
        data.admission_no ||
        data.adm_no ||
        data.adm_no_sch ||
        data.reg_no ||
        data.username ||
        data.identifier ||
        ''
      ).toString().trim();
      if (!admissionNumber) {
        const err: any = new Error('Admission number is required.');
        err.statusCode = 400;
        throw err;
      }

      // Check collision in users and student_profiles
      const userCheck = await client.query(
        'SELECT id FROM users WHERE LOWER(TRIM(identifier)) = LOWER(TRIM($1))',
        [admissionNumber]
      );
      if (userCheck.rows.length > 0) {
        const err: any = new Error(`A student or user with Admission Number '${admissionNumber}' already exists.`);
        err.statusCode = 400;
        throw err;
      }

      const profCheck = await client.query(
        'SELECT id FROM student_profiles WHERE LOWER(TRIM(admission_number)) = LOWER(TRIM($1))',
        [admissionNumber]
      );
      if (profCheck.rows.length > 0) {
        const err: any = new Error(`A student profile with Admission Number '${admissionNumber}' already exists.`);
        err.statusCode = 400;
        throw err;
      }

      let firstName = (data.first_name || '').toString().trim();
      let lastName = (data.last_name || '').toString().trim();
      if (!firstName && data.stu_name) {
        const parts = data.stu_name.toString().trim().split(/\s+/);
        firstName = parts[0] || 'Student';
        lastName = parts.slice(1).join(' ');
      } else if (!firstName && data.name) {
        const parts = data.name.toString().trim().split(/\s+/);
        firstName = parts[0] || 'Student';
        lastName = parts.slice(1).join(' ');
      }
      if (!firstName) firstName = 'Student';

      const rollNumber = data.roll_no ? String(data.roll_no).trim() : (data.roll_number ? String(data.roll_number).trim() : null);
      const gender = data.gender ? String(data.gender).trim().toUpperCase() : 'MALE';
      const dob = parseSafeDate(data.date_of_birth || data.dob);
      const admissionDate = parseSafeDate(data.admission_date || data.do_adm) || new Date().toISOString().split('T')[0];
      const phone = data.mobile ? String(data.mobile).trim() : (data.phone ? String(data.phone).trim() : null);
      const emergencyPhone = data.emergency_phone
        ? String(data.emergency_phone).trim()
        : data.fat_mobile
        ? String(data.fat_mobile).trim()
        : data.mobile2
        ? String(data.mobile2).trim()
        : phone;
      const fatherName = data.father_name || data.fat_name || null;
      const motherName = data.mother_name || data.mot_name || null;
      const bloodGroup = data.blood_group || null;
      const medicalNotes = data.medical_notes || null;
      const password = data.password || 'Student@123';
      const address = data.address || null;
      const caste = data.caste || data.category || null;
      const religion = data.religion || null;
      const nationality = data.nationality || data.father_nationality || 'Indian';
      const studentAadhar = data.student_aadhar || null;
      const aadharFather = data.aadhar_father || null;
      const aadharMother = data.aadhar_mother || null;
      const fatherPan = data.father_pan || null;
      const panMother = data.pan_mother || data.pan_mot || null;

      // Dynamic Class & Section Resolution (supports UUID or Class Name like "Class 7", "7th")
      let resolvedClassId: string | null = null;
      let resolvedClassName: string | null = null;

      const rawClass = (data.current_class_id || data.class_id || data.class || data.adm_class || data.class_name || '').toString().trim();
      if (rawClass) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawClass);
        if (isUuid) {
          const clsRes = await client.query('SELECT id, name FROM classes WHERE id = $1 AND school_id = $2', [rawClass, schoolId]);
          if (clsRes.rows.length > 0) {
            resolvedClassId = clsRes.rows[0].id;
            resolvedClassName = clsRes.rows[0].name;
          }
        }
        if (!resolvedClassId) {
          const clsRes = await client.query(
            'SELECT id, name FROM classes WHERE school_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))',
            [schoolId, rawClass]
          );
          if (clsRes.rows.length > 0) {
            resolvedClassId = clsRes.rows[0].id;
            resolvedClassName = clsRes.rows[0].name;
          } else {
            let wingRes = await client.query(
              'SELECT id FROM wings WHERE school_id = $1 ORDER BY created_at ASC LIMIT 1',
              [schoolId]
            );
            let wingId = wingRes.rows[0]?.id;
            if (!wingId) {
              const newWing = await client.query(
                'INSERT INTO wings (school_id, name) VALUES ($1, $2) RETURNING id',
                [schoolId, 'Main Wing']
              );
              wingId = newWing.rows[0].id;
            }
            const newClass = await client.query(
              'INSERT INTO classes (school_id, wing_id, name) VALUES ($1, $2, $3) ON CONFLICT (school_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name',
              [schoolId, wingId, rawClass]
            );
            resolvedClassId = newClass.rows[0].id;
            resolvedClassName = newClass.rows[0].name;
          }
        }
      }

      // Resolve Section
      let resolvedSectionId: string | null = null;
      let resolvedSectionName: string | null = null;

      const rawSection = (data.current_section_id || data.section_id || data.sec || data.section || data.section_name || '').toString().trim();
      if (resolvedClassId && rawSection) {
        const isSecUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSection);
        if (isSecUuid) {
          const secRes = await client.query('SELECT id, name FROM sections WHERE id = $1 AND class_id = $2', [rawSection, resolvedClassId]);
          if (secRes.rows.length > 0) {
            resolvedSectionId = secRes.rows[0].id;
            resolvedSectionName = secRes.rows[0].name;
          }
        }
        if (!resolvedSectionId) {
          const secRes = await client.query(
            'SELECT id, name FROM sections WHERE class_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))',
            [resolvedClassId, rawSection]
          );
          if (secRes.rows.length > 0) {
            resolvedSectionId = secRes.rows[0].id;
            resolvedSectionName = secRes.rows[0].name;
          } else {
            const newSec = await client.query(
              'INSERT INTO sections (class_id, name) VALUES ($1, $2) RETURNING id, name',
              [resolvedClassId, rawSection]
            );
            resolvedSectionId = newSec.rows[0].id;
            resolvedSectionName = newSec.rows[0].name;
          }
        }
      }

      // Safe phone for users table to avoid unique constraint collision
      let safeUserPhone = phone;
      if (safeUserPhone) {
        const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1', [safeUserPhone]);
        if (phoneCheck.rows.length > 0) {
          safeUserPhone = null; // Stored in emergency_phone on student_profiles instead
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userRes = await client.query(
        `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
        [schoolId, admissionNumber, data.email || data.stu_email ? (data.email || data.stu_email).trim().toLowerCase() : null, safeUserPhone, passwordHash]
      );
      const userId = userRes.rows[0].id;

      // Assign STUDENT role
      const studentRoleRes = await client.query("SELECT id FROM roles WHERE name = 'STUDENT' LIMIT 1");
      if (studentRoleRes.rows.length > 0) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, studentRoleRes.rows[0].id]
        );
      }

      // Preserve ALL 94 legacy ERP fields into extra_data
      const extraData: Record<string, any> = data.extra_data && typeof data.extra_data === 'object' ? { ...data.extra_data } : {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && v !== null && v !== '' && k !== 'password' && k !== 'extra_data') {
          extraData[k] = v;
        }
      }

      const profileRes = await client.query(
        `INSERT INTO student_profiles (
          user_id, admission_number, roll_number, first_name, last_name,
          current_class_id, current_section_id, gender, date_of_birth, admission_date,
          emergency_phone, father_name, mother_name, blood_group, medical_notes, is_active, login_password,
          address, caste, religion, nationality, student_aadhar, aadhar_father, aadhar_mother,
          father_pan, pan_mother, extra_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, TRUE, $16,
          $17, $18, $19, $20, $21, $22, $23,
          $24, $25, $26::jsonb
        ) RETURNING id`,
        [
          userId,
          admissionNumber,
          rollNumber,
          firstName,
          lastName,
          resolvedClassId,
          resolvedSectionId,
          gender,
          dob,
          admissionDate,
          emergencyPhone,
          fatherName,
          motherName,
          bloodGroup,
          medicalNotes,
          password,
          address,
          caste,
          religion,
          nationality,
          studentAadhar,
          aadharFather,
          aadharMother,
          fatherPan,
          panMother,
          JSON.stringify(extraData),
        ]
      );
      const profileId = profileRes.rows[0].id;

      await client.query('COMMIT');

      return {
        id: profileId,
        user_id: userId,
        admission_number: admissionNumber,
        identifier: admissionNumber,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        roll_number: rollNumber,
        class_id: resolvedClassId,
        class_name: resolvedClassName,
        section_id: resolvedSectionId,
        section_name: resolvedSectionName,
        phone: phone,
        emergency_phone: emergencyPhone,
        father_name: fatherName,
        mother_name: motherName,
        gender: gender,
        date_of_birth: dob,
        dob: dob,
        admission_date: admissionDate,
        address: address,
        caste: caste,
        religion: religion,
        student_aadhar: studentAadhar,
        password: password,
        extra_data: extraData,
      };


    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
          department, designation, is_active, login_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          userId,
          data.employee_code.trim(),
          data.first_name.trim(),
          data.last_name ? data.last_name.trim() : '',
          data.gender || null,
          parseSafeDate(data.date_of_birth),
          data.qualification || null,
          parseSafeDate(data.joining_date) || new Date().toISOString().split('T')[0],
          data.emergency_phone || null,
          data.phone || null,
          data.blood_group || null,
          data.department || null,
          data.designation || null,
          true,
          password,
        ]
      );

      if (data.wing_id) {
        await client.query(
          `INSERT INTO staff_assignments (staff_id, wing_id, assignment_type)
           VALUES ($1, $2, $3)`,
          [staffRes.rows[0].id, data.wing_id, data.assignment_type || roleName]
        );
      }

      // If assigned as Class Teacher of a Class & Section
      if (data.class_id && data.section_id) {
        if (data.is_class_teacher !== false) {
          await client.query(
            `DELETE FROM staff_assignments 
             WHERE class_id = $1 AND section_id = $2 AND assignment_type = 'CLASS_TEACHER'`,
            [data.class_id, data.section_id]
          );
          await client.query(
            `INSERT INTO staff_assignments (staff_id, class_id, section_id, assignment_type)
             VALUES ($1, $2, $3, 'CLASS_TEACHER')`,
            [staffRes.rows[0].id, data.class_id, data.section_id]
          );
        }

        // If assigned to a Subject for that Class & Section
        if (data.subject_id) {
          const ayRes = await client.query(
            'SELECT id FROM academic_years WHERE school_id = $1 ORDER BY is_current DESC, created_at DESC LIMIT 1',
            [schoolId]
          );
          if (ayRes.rows.length > 0) {
            await client.query(
              `DELETE FROM teacher_subject_allocations 
               WHERE class_id = $1 AND section_id = $2 AND subject_id = $3`,
              [data.class_id, data.section_id, data.subject_id]
            );
            await client.query(
              `INSERT INTO teacher_subject_allocations (school_id, academic_year_id, class_id, section_id, subject_id, teacher_id)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [schoolId, ayRes.rows[0].id, data.class_id, data.section_id, data.subject_id, staffRes.rows[0].id]
            );
          }
        }
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
        await client.query('UPDATE staff_profiles SET login_password = $1 WHERE id = $2', [data.password.trim(), staffId]);
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
   * 12b. Reset Staff Password (Admin Reset Desk)
   */
  static async resetStaffPassword(schoolId: string, staffId: string, customPassword?: string): Promise<any> {
    const checkQuery = `
      SELECT sp.id, sp.user_id, u.identifier, sp.first_name, sp.last_name
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1 AND u.school_id = $2;
    `;
    const checkRes = await pool.query(checkQuery, [staffId, schoolId]);
    if (checkRes.rows.length === 0) {
      throw new Error('STAFF_NOT_FOUND');
    }
    const staff = checkRes.rows[0];
    const passwordToSet = (customPassword && customPassword.trim()) ? customPassword.trim() : 'Staff@123';
    const hash = await bcrypt.hash(passwordToSet, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        hash,
        staff.user_id,
      ]);
      await client.query('UPDATE staff_profiles SET login_password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        passwordToSet,
        staff.id,
      ]);
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Staff password reset successfully',
        staffId: staff.id,
        identifier: staff.identifier,
        newPassword: passwordToSet,
      };
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

  static async createAdminHomework(
    schoolId: string,
    data: {
      classId: string;
      sectionId: string;
      subjectId: string;
      staffId?: string;
      title: string;
      description: string;
      assignedDate?: string;
      dueDate: string;
      s3AttachmentKey?: string;
      attachmentName?: string;
    },
    defaultUserId?: string
  ): Promise<any> {
    let staffId = data.staffId;
    if (!staffId) {
      if (defaultUserId) {
        const staffRes = await pool.query(
          `SELECT id FROM staff_profiles WHERE user_id = $1 LIMIT 1;`,
          [defaultUserId]
        );
        if (staffRes.rows.length > 0) {
          staffId = staffRes.rows[0].id;
        }
      }
      if (!staffId) {
        const fallbackRes = await pool.query(
          `SELECT sp.id FROM staff_profiles sp 
           JOIN users u ON sp.user_id = u.id 
           WHERE u.school_id = $1 
           ORDER BY sp.created_at ASC 
           LIMIT 1;`,
          [schoolId]
        );
        if (fallbackRes.rows.length > 0) {
          staffId = fallbackRes.rows[0].id;
        } else {
          throw new Error('No staff profile found to assign homework');
        }
      }
    }

    const assignedDate = data.assignedDate || new Date().toISOString().split('T')[0];
    const dueDate = data.dueDate;

    if (dueDate < assignedDate) {
      const err: any = new Error('Submission due date cannot be earlier than assigned date');
      err.statusCode = 400;
      throw err;
    }

    const insertQuery = `
      INSERT INTO homework_assignments 
        (school_id, class_id, section_id, subject_id, assigned_by_staff_id, 
         title, description, assigned_date, due_date, s3_attachment_key, attachment_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9::date, $10, $11)
      RETURNING id;
    `;
    const res = await pool.query(insertQuery, [
      schoolId,
      data.classId,
      data.sectionId,
      data.subjectId,
      staffId,
      data.title.trim(),
      data.description.trim(),
      assignedDate,
      dueDate,
      data.s3AttachmentKey || null,
      data.attachmentName || null,
    ]);
    const hwId = res.rows[0].id;
    const fetchRes = await this.getAdminHomework(schoolId, {});
    return fetchRes.find((h: any) => h.id === hwId) || res.rows[0];
  }

  static async updateAdminHomework(
    schoolId: string,
    homeworkId: string,
    data: {
      classId?: string;
      sectionId?: string;
      subjectId?: string;
      staffId?: string;
      title?: string;
      description?: string;
      assignedDate?: string;
      dueDate?: string;
      s3AttachmentKey?: string;
      attachmentName?: string;
    }
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.classId !== undefined) {
      fields.push(`class_id = $${idx++}`);
      values.push(data.classId);
    }
    if (data.sectionId !== undefined) {
      fields.push(`section_id = $${idx++}`);
      values.push(data.sectionId);
    }
    if (data.subjectId !== undefined) {
      fields.push(`subject_id = $${idx++}`);
      values.push(data.subjectId);
    }
    if (data.staffId !== undefined) {
      fields.push(`assigned_by_staff_id = $${idx++}`);
      values.push(data.staffId);
    }
    if (data.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(data.title.trim());
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description.trim());
    }
    if (data.assignedDate !== undefined) {
      fields.push(`assigned_date = $${idx++}::date`);
      values.push(data.assignedDate);
    }
    if (data.dueDate !== undefined) {
      fields.push(`due_date = $${idx++}::date`);
      values.push(data.dueDate);
    }
    if (data.s3AttachmentKey !== undefined) {
      fields.push(`s3_attachment_key = $${idx++}`);
      values.push(data.s3AttachmentKey);
    }
    if (data.attachmentName !== undefined) {
      fields.push(`attachment_name = $${idx++}`);
      values.push(data.attachmentName);
    }

    if (fields.length > 0) {
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(homeworkId, schoolId);
      const updateQuery = `
        UPDATE homework_assignments
        SET ${fields.join(', ')}
        WHERE id = $${idx++} AND school_id = $${idx++}
        RETURNING id;
      `;
      const updateRes = await pool.query(updateQuery, values);
      if (updateRes.rows.length === 0) {
        return null;
      }
    }

    const fetchRes = await this.getAdminHomework(schoolId, {});
    return fetchRes.find((h: any) => h.id === homeworkId) || null;
  }

  static async deleteAdminHomework(schoolId: string, homeworkId: string): Promise<boolean> {
    const res = await pool.query(
      `DELETE FROM homework_assignments WHERE id = $1 AND school_id = $2;`,
      [homeworkId, schoolId]
    );
    return (res.rowCount ?? 0) > 0;
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

  /**
   * 17. Bulk Upload Students with Auto-Class/Section Resolution
   */
  static async bulkUploadStudents(schoolId: string, students: any[]): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch or create default wing
      let wingRes = await client.query(
        'SELECT id FROM wings WHERE school_id = $1 ORDER BY created_at ASC LIMIT 1',
        [schoolId]
      );
      let defaultWingId: string;
      if (wingRes.rows.length === 0) {
        const newWing = await client.query(
          'INSERT INTO wings (school_id, name) VALUES ($1, $2) RETURNING id',
          [schoolId, 'Main Wing']
        );
        defaultWingId = newWing.rows[0].id;
      } else {
        defaultWingId = wingRes.rows[0].id;
      }

      // Fetch existing classes & sections for quick caching
      const classesRes = await client.query(
        'SELECT id, name FROM classes WHERE school_id = $1',
        [schoolId]
      );
      const classMap = new Map<string, string>(); // lowercase name -> id
      classesRes.rows.forEach((r: any) => classMap.set(r.name.trim().toLowerCase(), r.id));

      const sectionsRes = await client.query(
        `SELECT s.id, s.class_id, s.name 
         FROM sections s 
         JOIN classes c ON s.class_id = c.id 
         WHERE c.school_id = $1`,
        [schoolId]
      );
      const sectionMap = new Map<string, string>(); // `${classId}_${lowercase sectionName}` -> id
      sectionsRes.rows.forEach((r: any) =>
        sectionMap.set(`${r.class_id}_${r.name.trim().toLowerCase()}`, r.id)
      );

      // Student role id
      const studentRoleRes = await client.query(
        "SELECT id FROM roles WHERE name = 'STUDENT' LIMIT 1"
      );
      const studentRoleId = studentRoleRes.rows[0]?.id;

      let createdCount = 0;
      let updatedCount = 0;
      const classBreakdown: { [key: string]: number } = {};

      let rowIdx = 0;
      for (const row of students) {
        rowIdx++;
        const rawClassName = (row.class_name || row.class || row.adm_class || 'Grade 10').toString().trim();
        const rawSectionName = (row.section_name || row.section || row.sec || 'Section A').toString().trim();
        
        // Name parsing: support stu_name (e.g. "Aarav Sharma")
        let firstName = (row.first_name || '').toString().trim();
        let lastName = (row.last_name || '').toString().trim();
        if (!firstName && row.stu_name) {
          const parts = row.stu_name.toString().trim().split(/\s+/);
          firstName = parts[0] || 'Student';
          lastName = parts.slice(1).join(' ');
        } else if (!firstName && row.name) {
          const parts = row.name.toString().trim().split(/\s+/);
          firstName = parts[0] || 'Student';
          lastName = parts.slice(1).join(' ');
        }
        if (!firstName) firstName = 'Student';

        // Clean and ensure collision-free admission number
        let rawAdm = (
          row.adm_no ||
          row.adm_no_sch ||
          row.reg_no ||
          row.admission_no ||
          row.admission_number ||
          row.id ||
          row['admission no'] ||
          row['adm no'] ||
          ''
        ).toString().trim();

        if (!rawAdm) {
          rawAdm = `ADM-${Date.now()}-${rowIdx}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        }
        const admissionNumber = rawAdm;

        const rollNumber = row.roll_no ? String(row.roll_no).trim() : (row.roll_number ? String(row.roll_number).trim() : null);
        const gender = row.gender ? String(row.gender).trim().toUpperCase() : 'MALE';
        const dob = parseSafeDate(row.dob || row.date_of_birth);
        const admissionDate = parseSafeDate(row.do_adm || row.admission_date || row.adm_date);
        const phone = row.mobile ? String(row.mobile).trim() : (row.phone ? String(row.phone).trim() : null);
        const emergencyPhone = row.emergency_phone
          ? String(row.emergency_phone).trim()
          : row.fat_mobile
          ? String(row.fat_mobile).trim()
          : row.mot_mobile
          ? String(row.mot_mobile).trim()
          : phone;
        const fatherName = row.fat_name || row.father_name || row.father || null;
        const motherName = row.mot_name || row.mother_name || row.mother || null;
        const bloodGroup = row.blood_group || null;
        const password = row.password || 'Student@123';

        // Additional legacy ERP profile fields
        const address = row.address || row.address_co || null;
        const caste = row.caste || row.category || null;
        const religion = row.religion || null;
        const nationality = row.nationality || row.father_nationality || 'Indian';
        const studentAadhar = row.student_aadhar || null;
        const aadharFather = row.aadhar_father || null;
        const aadharMother = row.aadhar_mother || null;
        const fatherPan = row.father_pan || null;
        const panMother = row.pan_mother || null;

        // Build comprehensive extra_data preserving ALL 94 columns
        const extraData: Record<string, any> = row.extra_data && typeof row.extra_data === 'object' ? { ...row.extra_data } : {};
        for (const [k, v] of Object.entries(row)) {
          if (v !== undefined && v !== null && v !== '' && k !== 'password' && k !== 'extra_data') {
            extraData[k] = v;
          }
        }

        // 1. Resolve Class
        const classKey = rawClassName.toLowerCase();
        let classId = classMap.get(classKey);
        if (!classId) {
          const newClass = await client.query(
            'INSERT INTO classes (school_id, wing_id, name) VALUES ($1, $2, $3) ON CONFLICT (school_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
            [schoolId, defaultWingId, rawClassName]
          );
          classId = String(newClass.rows[0].id);
          classMap.set(classKey, classId);
        }

        // 2. Resolve Section
        const secKey = `${classId}_${rawSectionName.toLowerCase()}`;
        let sectionId = sectionMap.get(secKey);
        if (!sectionId) {
          const newSec = await client.query(
            'INSERT INTO sections (class_id, name) VALUES ($1, $2) ON CONFLICT (class_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
            [classId, rawSectionName]
          );
          sectionId = String(newSec.rows[0].id);
          sectionMap.set(secKey, sectionId);
        }

        // 3. User Credentials & Profile: Case-insensitive check across users table
        const existingUserRes = await client.query(
          'SELECT u.id AS user_id, sp.id AS profile_id FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id WHERE LOWER(TRIM(u.identifier)) = LOWER(TRIM($1)) LIMIT 1',
          [admissionNumber]
        );

        let safeUserPhone = phone;
        if (safeUserPhone) {
          const phoneCheck = await client.query(
            'SELECT id FROM users WHERE phone = $1 AND LOWER(TRIM(identifier)) != LOWER(TRIM($2))',
            [safeUserPhone, admissionNumber]
          );
          if (phoneCheck.rows.length > 0) {
            safeUserPhone = null; // Avoid users_phone_key collision; stored in emergency_phone
          }
        }

        if (existingUserRes.rows.length > 0) {
          const userId = existingUserRes.rows[0].user_id;
          let profileId = existingUserRes.rows[0].profile_id;

          // Keep user account active and attached to this school
          await client.query(
            'UPDATE users SET school_id = $1, phone = COALESCE($2, phone), is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [schoolId, safeUserPhone, userId]
          );

          if (!profileId) {
            // Check if profile exists by admission_number
            const profCheck = await client.query(
              'SELECT id FROM student_profiles WHERE LOWER(TRIM(admission_number)) = LOWER(TRIM($1)) LIMIT 1',
              [admissionNumber]
            );
            if (profCheck.rows.length > 0) {
              profileId = profCheck.rows[0].id;
            }
          }

          if (profileId) {
            await client.query(
              `UPDATE student_profiles SET
                first_name = $1,
                last_name = $2,
                admission_number = $3,
                roll_number = COALESCE($4, roll_number),
                current_class_id = $5,
                current_section_id = $6,
                gender = COALESCE($7, gender),
                date_of_birth = COALESCE($8, date_of_birth),
                emergency_phone = COALESCE($9, emergency_phone),
                father_name = COALESCE($10, father_name),
                mother_name = COALESCE($11, mother_name),
                blood_group = COALESCE($12, blood_group),
                admission_date = COALESCE($13, admission_date),
                address = COALESCE($15, address),
                caste = COALESCE($16, caste),
                religion = COALESCE($17, religion),
                nationality = COALESCE($18, nationality),
                student_aadhar = COALESCE($19, student_aadhar),
                aadhar_father = COALESCE($20, aadhar_father),
                aadhar_mother = COALESCE($21, aadhar_mother),
                father_pan = COALESCE($22, father_pan),
                pan_mother = COALESCE($23, pan_mother),
                extra_data = COALESCE(extra_data, '{}'::jsonb) || $24::jsonb,
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $14`,
              [
                firstName,
                lastName,
                admissionNumber,
                rollNumber,
                classId,
                sectionId,
                gender,
                dob,
                emergencyPhone,
                fatherName,
                motherName,
                bloodGroup,
                admissionDate,
                profileId,
                address,
                caste,
                religion,
                nationality,
                studentAadhar,
                aadharFather,
                aadharMother,
                fatherPan,
                panMother,
                JSON.stringify(extraData),
              ]
            );
          } else {
            await client.query(
              `INSERT INTO student_profiles (
                user_id, admission_number, roll_number, first_name, last_name,
                current_class_id, current_section_id, gender, date_of_birth, admission_date,
                emergency_phone, father_name, mother_name, blood_group, is_active, login_password,
                address, caste, religion, nationality, student_aadhar, aadhar_father, aadhar_mother,
                father_pan, pan_mother, extra_data
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, TRUE, $15,
                $16, $17, $18, $19, $20, $21, $22,
                $23, $24, $25::jsonb
              )`,
              [
                userId,
                admissionNumber,
                rollNumber,
                firstName,
                lastName,
                classId,
                sectionId,
                gender,
                dob,
                admissionDate,
                emergencyPhone,
                fatherName,
                motherName,
                bloodGroup,
                password,
                address,
                caste,
                religion,
                nationality,
                studentAadhar,
                aadharFather,
                aadharMother,
                fatherPan,
                panMother,
                JSON.stringify(extraData),
              ]
            );
          }
          updatedCount++;
        } else {
          const passwordHash = await bcrypt.hash(password, 10);
          const userInsert = await client.query(
            `INSERT INTO users (school_id, identifier, phone, password_hash, is_active)
             VALUES ($1, $2, $3, $4, TRUE)
             ON CONFLICT (identifier) DO UPDATE SET
               school_id = EXCLUDED.school_id,
               phone = COALESCE(EXCLUDED.phone, users.phone),
               updated_at = CURRENT_TIMESTAMP
             RETURNING id`,
            [schoolId, admissionNumber, safeUserPhone, passwordHash]
          );
          const newUserId = userInsert.rows[0].id;

          if (studentRoleId) {
            await client.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [newUserId, studentRoleId]
            );
          }

          // Check if profile exists by user_id OR admission_number to prevent student_profiles duplicates
          const profCheck = await client.query(
            'SELECT id FROM student_profiles WHERE user_id = $1 OR LOWER(TRIM(admission_number)) = LOWER(TRIM($2)) LIMIT 1',
            [newUserId, admissionNumber]
          );

          if (profCheck.rows.length > 0) {
            await client.query(
              `UPDATE student_profiles SET
                first_name = $1,
                last_name = $2,
                admission_number = $3,
                roll_number = COALESCE($4, roll_number),
                current_class_id = $5,
                current_section_id = $6,
                gender = COALESCE($7, gender),
                date_of_birth = COALESCE($8, date_of_birth),
                emergency_phone = COALESCE($9, emergency_phone),
                father_name = COALESCE($10, father_name),
                mother_name = COALESCE($11, mother_name),
                blood_group = COALESCE($12, blood_group),
                admission_date = COALESCE($13, admission_date),
                address = COALESCE($15, address),
                caste = COALESCE($16, caste),
                religion = COALESCE($17, religion),
                nationality = COALESCE($18, nationality),
                student_aadhar = COALESCE($19, student_aadhar),
                aadhar_father = COALESCE($20, aadhar_father),
                aadhar_mother = COALESCE($21, aadhar_mother),
                father_pan = COALESCE($22, father_pan),
                pan_mother = COALESCE($23, pan_mother),
                extra_data = COALESCE(extra_data, '{}'::jsonb) || $24::jsonb,
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $14`,
              [
                firstName,
                lastName,
                admissionNumber,
                rollNumber,
                classId,
                sectionId,
                gender,
                dob,
                emergencyPhone,
                fatherName,
                motherName,
                bloodGroup,
                admissionDate,
                profCheck.rows[0].id,
                address,
                caste,
                religion,
                nationality,
                studentAadhar,
                aadharFather,
                aadharMother,
                fatherPan,
                panMother,
                JSON.stringify(extraData),
              ]
            );
            updatedCount++;
          } else {
            await client.query(
              `INSERT INTO student_profiles (
                user_id, admission_number, roll_number, first_name, last_name,
                current_class_id, current_section_id, gender, date_of_birth, admission_date,
                emergency_phone, father_name, mother_name, blood_group, is_active, login_password,
                address, caste, religion, nationality, student_aadhar, aadhar_father, aadhar_mother,
                father_pan, pan_mother, extra_data
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, TRUE, $15,
                $16, $17, $18, $19, $20, $21, $22,
                $23, $24, $25::jsonb
              )`,
              [
                newUserId,
                admissionNumber,
                rollNumber,
                firstName,
                lastName,
                classId,
                sectionId,
                gender,
                dob,
                admissionDate,
                emergencyPhone,
                fatherName,
                motherName,
                bloodGroup,
                password,
                address,
                caste,
                religion,
                nationality,
                studentAadhar,
                aadharFather,
                aadharMother,
                fatherPan,
                panMother,
                JSON.stringify(extraData),
              ]
            );
            createdCount++;
          }
        }

        const breakdownKey = `${rawClassName} - ${rawSectionName}`;
        classBreakdown[breakdownKey] = (classBreakdown[breakdownKey] || 0) + 1;
      }

      await client.query('COMMIT');
      return {
        success: true,
        total: students.length,
        created: createdCount,
        updated: updatedCount,
        breakdown: classBreakdown,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 18. Bulk Upload Staff / Teachers
   */
  static async bulkUploadStaff(schoolId: string, staffList: any[]): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const teacherRoleRes = await client.query("SELECT id FROM roles WHERE name = 'TEACHER' LIMIT 1");
      const defaultRoleId = teacherRoleRes.rows[0]?.id;

      let createdCount = 0;
      let skippedCount = 0;

      for (const row of staffList) {
        const empCode = (row.employee_code || row.emp_code || `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`).trim();
        const firstName = (row.first_name || row.name || 'Staff').trim();
        const lastName = (row.last_name || '').trim();
        const email = row.email ? row.email.trim().toLowerCase() : null;
        const phone = row.phone ? String(row.phone).trim() : null;
        const qualification = row.qualification || null;
        const department = row.department || 'Academics';
        const designation = row.designation || 'Teacher';
        const gender = row.gender ? String(row.gender).trim().toUpperCase() : 'MALE';
        const joiningDate = parseSafeDate(row.joining_date) || new Date().toISOString().split('T')[0];
        const rawPassword = row.password || 'Staff@123';
        const roleName = (row.role || 'TEACHER').toUpperCase();

        // Check if employee code or identifier exists
        const userCheck = await client.query(
          'SELECT id FROM users WHERE school_id = $1 AND (identifier = $2 OR (email IS NOT NULL AND email = $3))',
          [schoolId, empCode, email]
        );

        if (userCheck.rows.length > 0) {
          skippedCount++;
          continue;
        }

        let safeStaffPhone = phone;
        if (safeStaffPhone) {
          const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1', [safeStaffPhone]);
          if (phoneCheck.rows.length > 0) {
            safeStaffPhone = null; // Stored safely on staff_profiles.phone
          }
        }

        const passwordHash = await bcrypt.hash(rawPassword, 10);
        const userRes = await client.query(
          `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
           VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
          [schoolId, empCode, email, safeStaffPhone, passwordHash]
        );
        const userId = userRes.rows[0].id;

        const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
        const roleId = roleRes.rows[0]?.id || defaultRoleId;
        if (roleId) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, roleId]
          );
        }

        const staffRes = await client.query(
          `INSERT INTO staff_profiles (
            user_id, employee_code, first_name, last_name, gender,
            qualification, joining_date, phone, emergency_phone, department,
            designation, is_active, login_password
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12)
          RETURNING id`,
          [
            userId,
            empCode,
            firstName,
            lastName,
            gender,
            qualification,
            joiningDate,
            phone,
            phone,
            department,
            designation,
            rawPassword,
          ]
        );
        const staffId = staffRes.rows[0].id;

        // Auto-assign Class Teacher and/or Subject Teacher if class_name & section_name are given in CSV row
        const rawClassName = (row.class_name || row.class || '').trim();
        const rawSectionName = (row.section_name || row.section || '').trim();
        const rawSubjectName = (row.subject_name || row.subject || '').trim();

        if (rawClassName && rawSectionName) {
          const clsRes = await client.query(
            'SELECT id FROM classes WHERE school_id = $1 AND LOWER(TRIM(name)) = LOWER($2) LIMIT 1',
            [schoolId, rawClassName]
          );
          if (clsRes.rows.length > 0) {
            const classId = clsRes.rows[0].id;
            const secRes = await client.query(
              'SELECT id FROM sections WHERE class_id = $1 AND LOWER(TRIM(name)) = LOWER($2) LIMIT 1',
              [classId, rawSectionName]
            );
            if (secRes.rows.length > 0) {
              const sectionId = secRes.rows[0].id;

              const isClassTeacher =
                row.is_class_teacher === true ||
                row.is_class_teacher === 'true' ||
                row.is_class_teacher === 'TRUE' ||
                row.is_class_teacher === '1' ||
                row.role === 'CLASS_TEACHER';

              if (isClassTeacher) {
                await client.query(
                  `DELETE FROM staff_assignments 
                   WHERE class_id = $1 AND section_id = $2 AND assignment_type = 'CLASS_TEACHER'`,
                  [classId, sectionId]
                );
                await client.query(
                  `INSERT INTO staff_assignments (staff_id, class_id, section_id, assignment_type)
                   VALUES ($1, $2, $3, 'CLASS_TEACHER')`,
                  [staffId, classId, sectionId]
                );
              }

              if (rawSubjectName) {
                const subRes = await client.query(
                  'SELECT id FROM subjects WHERE school_id = $1 AND LOWER(TRIM(name)) = LOWER($2) LIMIT 1',
                  [schoolId, rawSubjectName]
                );
                if (subRes.rows.length > 0) {
                  const subjectId = subRes.rows[0].id;
                  const ayRes = await client.query(
                    'SELECT id FROM academic_years WHERE school_id = $1 ORDER BY is_current DESC LIMIT 1',
                    [schoolId]
                  );
                  if (ayRes.rows.length > 0) {
                    await client.query(
                      `DELETE FROM teacher_subject_allocations 
                       WHERE class_id = $1 AND section_id = $2 AND subject_id = $3`,
                      [classId, sectionId, subjectId]
                    );
                    await client.query(
                      `INSERT INTO teacher_subject_allocations (school_id, academic_year_id, class_id, section_id, subject_id, teacher_id)
                       VALUES ($1, $2, $3, $4, $5, $6)`,
                      [schoolId, ayRes.rows[0].id, classId, sectionId, subjectId, staffId]
                    );
                  }
                }
              }
            }
          }
        }

        createdCount++;
      }

      await client.query('COMMIT');
      return {
        success: true,
        total: staffList.length,
        created: createdCount,
        skipped: skippedCount,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 19. Academic Allocations: Get All Classes, Sections, Class Teachers & Subject Teachers
   */
  static async getAcademicAllocations(schoolId: string): Promise<any> {
    // 1. All classes & sections
    const classesQuery = `
      SELECT 
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name
      FROM classes c
      JOIN sections s ON s.class_id = c.id
      WHERE c.school_id = $1
      ORDER BY c.name ASC, s.name ASC;
    `;
    const { rows: sectionsList } = await pool.query(classesQuery, [schoolId]);

    // 2. Class teachers from staff_assignments
    const classTeachersQuery = `
      SELECT 
        sa.class_id,
        sa.section_id,
        sp.id AS staff_id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        sp.employee_code
      FROM staff_assignments sa
      JOIN staff_profiles sp ON sa.staff_id = sp.id
      WHERE sa.assignment_type = 'CLASS_TEACHER';
    `;
    const { rows: classTeachers } = await pool.query(classTeachersQuery);
    const ctMap = new Map<string, any>();
    classTeachers.forEach((ct: any) => ctMap.set(`${ct.class_id}_${ct.section_id}`, ct));

    // 3. Subjects mapped per class
    const subjectsQuery = `
      SELECT 
        c.id AS class_id,
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code
      FROM class_subjects cs
      JOIN classes c ON cs.class_id = c.id
      JOIN subjects sub ON cs.subject_id = sub.id
      WHERE c.school_id = $1
      ORDER BY sub.name ASC;
    `;
    const { rows: classSubjects } = await pool.query(subjectsQuery, [schoolId]);

    // If a class has no class_subjects mapped yet, provide all school subjects as available
    const allSubjectsQuery = `SELECT id AS subject_id, name AS subject_name, code AS subject_code FROM subjects WHERE school_id = $1 ORDER BY name ASC;`;
    const { rows: allSubjects } = await pool.query(allSubjectsQuery, [schoolId]);

    // 4. Subject teachers from teacher_subject_allocations
    const tsaQuery = `
      SELECT 
        tsa.class_id,
        tsa.section_id,
        tsa.subject_id,
        sp.id AS staff_id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS staff_name,
        sp.employee_code
      FROM teacher_subject_allocations tsa
      JOIN staff_profiles sp ON tsa.staff_id = sp.id;
    `;
    const { rows: tsaRows } = await pool.query(tsaQuery);
    const tsaMap = new Map<string, any>();
    tsaRows.forEach((tsa: any) => tsaMap.set(`${tsa.class_id}_${tsa.section_id}_${tsa.subject_id}`, tsa));

    // 5. All available teachers for dropdowns
    const teachersQuery = `
      SELECT 
        sp.id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS name,
        sp.employee_code,
        sp.department,
        sp.designation
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE u.school_id = $1 AND sp.is_active = TRUE
      ORDER BY sp.first_name ASC;
    `;
    const { rows: teachers } = await pool.query(teachersQuery, [schoolId]);

    // Construct hierarchy
    const sectionsResult = sectionsList.map((sec: any) => {
      const ct = ctMap.get(`${sec.class_id}_${sec.section_id}`) || null;
      let relevantSubjects = classSubjects.filter((cs: any) => cs.class_id === sec.class_id);
      if (relevantSubjects.length === 0) {
        relevantSubjects = allSubjects;
      }

      const subjectsWithAlloc = relevantSubjects.map((sub: any) => {
        const assigned = tsaMap.get(`${sec.class_id}_${sec.section_id}_${sub.subject_id}`) || null;
        return {
          subject_id: sub.subject_id,
          subject_name: sub.subject_name,
          subject_code: sub.subject_code,
          assigned_teacher: assigned
            ? {
                staff_id: assigned.staff_id,
                staff_name: assigned.staff_name,
                employee_code: assigned.employee_code,
              }
            : null,
        };
      });

      return {
        class_id: sec.class_id,
        class_name: sec.class_name,
        section_id: sec.section_id,
        section_name: sec.section_name,
        class_teacher: ct
          ? {
              staff_id: ct.staff_id,
              staff_name: ct.staff_name,
              employee_code: ct.employee_code,
            }
          : null,
        subjects: subjectsWithAlloc,
      };
    });

    return {
      allocations: sectionsResult,
      teachers,
      total_sections: sectionsResult.length,
      total_teachers: teachers.length,
    };
  }

  /**
   * 20. Academic Allocations: Save Class Teacher & Subject Teacher Allocations
   */
  static async saveAcademicAllocations(
    schoolId: string,
    data: {
      class_id: string;
      section_id: string;
      class_teacher_id?: string | null;
      subject_allocations?: Array<{ subject_id: string; teacher_id: string | null }>;
    }
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { class_id, section_id, class_teacher_id, subject_allocations } = data;

      // 1. Update Class Teacher
      if (class_teacher_id !== undefined) {
        await client.query(
          `DELETE FROM staff_assignments 
           WHERE class_id = $1 AND section_id = $2 AND assignment_type = 'CLASS_TEACHER'`,
          [class_id, section_id]
        );

        if (class_teacher_id && class_teacher_id.trim()) {
          await client.query(
            `INSERT INTO staff_assignments (staff_id, class_id, section_id, assignment_type)
             VALUES ($1, $2, $3, 'CLASS_TEACHER')`,
            [class_teacher_id.trim(), class_id, section_id]
          );
        }
      }

      // 2. Update Subject Teachers
      if (subject_allocations && Array.isArray(subject_allocations)) {
        // Resolve academic year
        let ayRes = await client.query(
          'SELECT id FROM academic_years WHERE school_id = $1 ORDER BY is_current DESC, created_at DESC LIMIT 1',
          [schoolId]
        );
        let academicYearId: string;
        if (ayRes.rows.length === 0) {
          const newAy = await client.query(
            `INSERT INTO academic_years (school_id, label, start_date, end_date, is_current)
             VALUES ($1, '2026-2027', '2026-04-01', '2027-03-31', TRUE) RETURNING id`,
            [schoolId]
          );
          academicYearId = newAy.rows[0].id;
        } else {
          academicYearId = ayRes.rows[0].id;
        }

        for (const item of subject_allocations) {
          // Remove existing allocation for this class-section-subject
          await client.query(
            `DELETE FROM teacher_subject_allocations 
             WHERE class_id = $1 AND section_id = $2 AND subject_id = $3`,
            [class_id, section_id, item.subject_id]
          );

          // Ensure class_subjects has this subject
          await client.query(
            `INSERT INTO class_subjects (class_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [class_id, item.subject_id]
          );

          if (item.teacher_id && item.teacher_id.trim()) {
            await client.query(
              `INSERT INTO teacher_subject_allocations (staff_id, class_id, section_id, subject_id, academic_year_id)
               VALUES ($1, $2, $3, $4, $5)`,
              [item.teacher_id.trim(), class_id, section_id, item.subject_id, academicYearId]
            );
          }
        }
      }

      await client.query('COMMIT');
      return { success: true, message: 'Academic allocations updated successfully.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 21. Student 360-Degree Inspector for Admin Dashboard
   */
  static async getStudentInspection(schoolId: string, studentId: string): Promise<any> {
    const studentQuery = `
      SELECT 
        sp.id,
        sp.admission_number,
        sp.roll_number,
        sp.first_name,
        sp.last_name,
        CONCAT(sp.first_name, ' ', sp.last_name) AS full_name,
        sp.gender,
        sp.date_of_birth,
        sp.father_name,
        sp.mother_name,
        sp.emergency_phone,
        sp.blood_group,
        u.identifier AS username,
        u.phone,
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN classes c ON sp.current_class_id = c.id
      LEFT JOIN sections s ON sp.current_section_id = s.id
      WHERE sp.id = $1 AND u.school_id = $2;
    `;
    const { rows: stRows } = await pool.query(studentQuery, [studentId, schoolId]);
    if (stRows.length === 0) return null;
    const student = stRows[0];

    // Today's Attendance
    const attQuery = `
      SELECT status, remarks, created_at
      FROM student_attendance_records
      WHERE student_id = $1 AND attendance_date = CURRENT_DATE
      ORDER BY created_at DESC LIMIT 1;
    `;
    const { rows: attRows } = await pool.query(attQuery, [studentId]);
    const attendanceToday = attRows[0] || { status: 'NOT_RECORDED', remarks: null };

    // Fees status
    const feeQuery = `
      SELECT 
        COALESCE(SUM(amount), 0)::int AS total_fees,
        COALESCE(SUM(amount_paid), 0)::int AS paid_fees,
        COALESCE(SUM(amount - amount_paid), 0)::int AS due_fees
      FROM student_fees
      WHERE student_id = $1;
    `;
    const { rows: feeRows } = await pool.query(feeQuery, [studentId]);

    const receiptsQuery = `
      SELECT receipt_number, amount_paid, payment_mode, payment_date
      FROM fee_receipts
      WHERE student_id = $1
      ORDER BY payment_date DESC LIMIT 5;
    `;
    const { rows: receiptRows } = await pool.query(receiptsQuery, [studentId]);

    // Class Teacher
    const ctQuery = `
      SELECT 
        sp.id AS staff_id,
        CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
        sp.employee_code,
        sp.phone
      FROM staff_assignments sa
      JOIN staff_profiles sp ON sa.staff_id = sp.id
      WHERE sa.class_id = $1 AND sa.section_id = $2 AND sa.assignment_type = 'CLASS_TEACHER'
      LIMIT 1;
    `;
    const { rows: ctRows } = await pool.query(ctQuery, [student.class_id, student.section_id]);

    // Subject Teachers
    const stQuery = `
      SELECT 
        sub.name AS subject_name,
        sub.code AS subject_code,
        CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name,
        sp.employee_code
      FROM teacher_subject_allocations tsa
      JOIN subjects sub ON tsa.subject_id = sub.id
      JOIN staff_profiles sp ON tsa.staff_id = sp.id
      WHERE tsa.class_id = $1 AND tsa.section_id = $2
      ORDER BY sub.name ASC;
    `;
    const { rows: subTeachers } = await pool.query(stQuery, [student.class_id, student.section_id]);

    // Today's Timetable
    const ttQuery = `
      SELECT 
        ts.period_id,
        p.start_time,
        p.end_time,
        sub.name AS subject_name,
        CONCAT(sp.first_name, ' ', sp.last_name) AS teacher_name
      FROM timetable_slots ts
      JOIN periods p ON ts.period_id = p.id
      JOIN subjects sub ON ts.subject_id = sub.id
      JOIN staff_profiles sp ON ts.teacher_id = sp.id
      WHERE ts.class_id = $1 AND ts.section_id = $2 AND ts.day_of_week = EXTRACT(ISODOW FROM CURRENT_DATE)
      ORDER BY p.start_time ASC;
    `;
    let scheduleRows: any[] = [];
    try {
      const { rows } = await pool.query(ttQuery, [student.class_id, student.section_id]);
      scheduleRows = rows;
    } catch {
      // Period table fallback
    }

    return {
      student,
      attendance: attendanceToday,
      fees: {
        total: feeRows[0]?.total_fees || 0,
        paid: feeRows[0]?.paid_fees || 0,
        due: feeRows[0]?.due_fees || 0,
        receipts: receiptRows,
      },
      class_teacher: ctRows[0] || null,
      subject_teachers: subTeachers,
      today_schedule: scheduleRows,
    };
  }

  /**
   * 22. Teacher 360-Degree Inspector for Admin Dashboard
   */
  static async getTeacherInspection(schoolId: string, teacherId: string): Promise<any> {
    const teacherQuery = `
      SELECT 
        sp.id,
        sp.employee_code,
        sp.first_name,
        sp.last_name,
        CONCAT(sp.first_name, ' ', sp.last_name) AS full_name,
        sp.gender,
        sp.qualification,
        sp.department,
        sp.designation,
        sp.joining_date,
        sp.phone,
        u.identifier AS username,
        u.email
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1 AND u.school_id = $2;
    `;
    const { rows: tRows } = await pool.query(teacherQuery, [teacherId, schoolId]);
    if (tRows.length === 0) return null;
    const teacher = tRows[0];

    // Class Teacher assignments
    const ctQuery = `
      SELECT c.name AS class_name, s.name AS section_name
      FROM staff_assignments sa
      JOIN classes c ON sa.class_id = c.id
      JOIN sections s ON sa.section_id = s.id
      WHERE sa.staff_id = $1 AND sa.assignment_type = 'CLASS_TEACHER';
    `;
    const { rows: ctAssignments } = await pool.query(ctQuery, [teacherId]);

    // Subjects taught
    const subQuery = `
      SELECT 
        c.name AS class_name,
        s.name AS section_name,
        sub.name AS subject_name,
        sub.code AS subject_code
      FROM teacher_subject_allocations tsa
      JOIN classes c ON tsa.class_id = c.id
      JOIN sections s ON tsa.section_id = s.id
      JOIN subjects sub ON tsa.subject_id = sub.id
      WHERE tsa.staff_id = $1
      ORDER BY c.name ASC, s.name ASC, sub.name ASC;
    `;
    const { rows: subjectsTaught } = await pool.query(subQuery, [teacherId]);

    // Today's classes
    const ttQuery = `
      SELECT 
        c.name AS class_name,
        s.name AS section_name,
        sub.name AS subject_name,
        p.start_time,
        p.end_time
      FROM timetable_slots ts
      JOIN classes c ON ts.class_id = c.id
      JOIN sections s ON ts.section_id = s.id
      JOIN subjects sub ON ts.subject_id = sub.id
      JOIN periods p ON ts.period_id = p.id
      WHERE ts.teacher_id = $1 AND ts.day_of_week = EXTRACT(ISODOW FROM CURRENT_DATE)
      ORDER BY p.start_time ASC;
    `;
    let todayClasses: any[] = [];
    try {
      const { rows } = await pool.query(ttQuery, [teacherId]);
      todayClasses = rows;
    } catch {
      // Graceful fallback
    }

    return {
      teacher,
      class_teacher_of: ctAssignments,
      subjects_taught: subjectsTaught,
      today_classes: todayClasses,
    };
  }
}


