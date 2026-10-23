import { pool } from '../../config/db.config';
import { TokenPayload } from '../../types/auth.types';

export interface StudentFeeItem {
  id: string;
  fee_title: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  created_at: string;
}

export interface FeeReceiptItem {
  id: string;
  receipt_number: string;
  payment_date: string;
  amount_paid: number;
  payment_mode: string;
  transaction_reference: string | null;
  remarks: string | null;
  fee_title: string | null;
  created_at: string;
}

export interface StudentFeeOverview {
  fees: StudentFeeItem[];
  summary: {
    total_dues: number;
    total_paid: number;
    total_outstanding: number;
  };
}

export class FeeService {
  static async getStudentFees(user: TokenPayload): Promise<StudentFeeOverview> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const query = `
      SELECT 
        id, fee_title, 
        TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
        amount::float AS amount,
        amount_paid::float AS amount_paid,
        status, created_at
      FROM student_fees
      WHERE student_id = $1 AND school_id = $2
      ORDER BY due_date ASC;
    `;
    const { rows } = await pool.query(query, [user.profileId, user.schoolId]);

    let totalDues = 0;
    let totalPaid = 0;

    for (const f of rows) {
      totalDues += Number(f.amount || 0);
      totalPaid += Number(f.amount_paid || 0);
    }

    const totalOutstanding = Math.max(0, totalDues - totalPaid);

    return {
      fees: rows,
      summary: {
        total_dues: totalDues,
        total_paid: totalPaid,
        total_outstanding: totalOutstanding,
      },
    };
  }

  static async getStudentReceipts(user: TokenPayload): Promise<FeeReceiptItem[]> {
    if (!user.profileId) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const query = `
      SELECT 
        r.id, r.receipt_number,
        TO_CHAR(r.payment_date, 'YYYY-MM-DD') AS payment_date,
        r.amount_paid::float AS amount_paid,
        r.payment_mode,
        r.transaction_reference,
        r.remarks,
        f.fee_title,
        r.created_at
      FROM fee_receipts r
      LEFT JOIN student_fees f ON r.student_fee_id = f.id
      WHERE r.student_id = $1 AND r.school_id = $2
      ORDER BY r.payment_date DESC;
    `;
    const { rows } = await pool.query(query, [user.profileId, user.schoolId]);
    return rows;
  }

  /**
   * Admin: Overview with KPIs and filtered student fee records
   */
  static async getAdminOverview(
    user: TokenPayload,
    filters?: { classId?: string; sectionId?: string; status?: string; search?: string }
  ): Promise<any> {
    const listQuery = `
      SELECT 
        f.id,
        f.fee_title,
        TO_CHAR(f.due_date, 'YYYY-MM-DD') AS due_date,
        f.amount::float AS amount,
        f.amount_paid::float AS amount_paid,
        GREATEST(0, (f.amount - f.amount_paid))::float AS balance,
        f.status,
        f.created_at,
        sp.id AS student_id,
        sp.admission_number,
        sp.roll_number,
        CONCAT(sp.first_name, ' ', sp.last_name) AS student_name,
        c.id AS class_id,
        c.name AS class_name,
        s.id AS section_id,
        s.name AS section_name
      FROM student_fees f
      JOIN student_profiles sp ON f.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN classes c ON sp.current_class_id = c.id
      LEFT JOIN sections s ON sp.current_section_id = s.id
      WHERE f.school_id = $1
        AND ($2::uuid IS NULL OR sp.current_class_id = $2::uuid)
        AND ($3::uuid IS NULL OR sp.current_section_id = $3::uuid)
        AND ($4::text IS NULL OR f.status = $4)
        AND (
          $5::text IS NULL OR 
          sp.first_name ILIKE '%' || $5 || '%' OR 
          sp.last_name ILIKE '%' || $5 || '%' OR 
          sp.admission_number ILIKE '%' || $5 || '%' OR
          f.fee_title ILIKE '%' || $5 || '%'
        )
      ORDER BY f.due_date ASC, sp.first_name ASC;
    `;

    const { rows } = await pool.query(listQuery, [
      user.schoolId,
      filters?.classId || null,
      filters?.sectionId || null,
      filters?.status || null,
      filters?.search ? filters.search.trim() : null,
    ]);

    // Aggregate summary stats across school
    const statsQuery = `
      SELECT 
        COALESCE(SUM(amount), 0)::float AS total_receivable,
        COALESCE(SUM(amount_paid), 0)::float AS total_collected
      FROM student_fees
      WHERE school_id = $1;
    `;
    const statsRes = await pool.query(statsQuery, [user.schoolId]);
    const receivable = statsRes.rows[0]?.total_receivable || 0;
    const collected = statsRes.rows[0]?.total_collected || 0;
    const pending = Math.max(0, receivable - collected);
    const collectionPercentage = receivable > 0 ? Math.round((collected / receivable) * 1000) / 10 : 100.0;

    return {
      kpis: {
        total_receivable: receivable,
        total_collected: collected,
        total_pending: pending,
        collection_percentage: collectionPercentage,
      },
      records: rows,
    };
  }

  /**
   * Admin: Collect fee payment, update status, and generate receipt
   */
  static async collectFee(
    user: TokenPayload,
    data: {
      student_id: string;
      student_fee_id?: string;
      amount_paid: number;
      payment_mode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'DEMAND_DRAFT' | 'ONLINE';
      transaction_reference?: string;
      remarks?: string;
    }
  ): Promise<any> {
    if (!data.student_id || !data.amount_paid || data.amount_paid <= 0) {
      const err: any = new Error('Valid student_id and amount_paid are required');
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let targetFeeId = data.student_fee_id;

      // If specific fee head wasn't specified, pick the oldest pending fee head for this student
      if (!targetFeeId) {
        const findFee = await client.query(
          `SELECT id FROM student_fees 
           WHERE student_id = $1 AND school_id = $2 AND status != 'PAID' 
           ORDER BY due_date ASC LIMIT 1;`,
          [data.student_id, user.schoolId]
        );
        if (findFee.rows.length > 0) {
          targetFeeId = findFee.rows[0].id;
        }
      }

      // Update student_fees if matched
      if (targetFeeId) {
        await client.query(
          `UPDATE student_fees
           SET amount_paid = amount_paid + $1,
               status = CASE WHEN (amount_paid + $1) >= amount THEN 'PAID' ELSE 'PARTIAL' END
           WHERE id = $2 AND school_id = $3;`,
          [data.amount_paid, targetFeeId, user.schoolId]
        );
      }

      // Generate unique Receipt Number: REC-YYYYMMDD-XXXX
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `REC-${todayStr}-${randSuffix}`;

      // Insert fee_receipts
      const insertReceipt = await client.query(
        `INSERT INTO fee_receipts (
           school_id, student_fee_id, student_id, receipt_number,
           payment_date, amount_paid, payment_mode, transaction_reference, remarks
         ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
         RETURNING *;`,
        [
          user.schoolId,
          targetFeeId || null,
          data.student_id,
          receiptNumber,
          data.amount_paid,
          data.payment_mode || 'CASH',
          data.transaction_reference || null,
          data.remarks || 'Fee Collection via Admin Portal',
        ]
      );

      await client.query('COMMIT');
      return insertReceipt.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Admin: List all receipts with student and class metadata
   */
  static async getAdminReceipts(
    user: TokenPayload,
    filtersParam?: string | { search?: string; date?: string; mode?: string }
  ): Promise<any[]> {
    const filters = typeof filtersParam === 'string' ? { search: filtersParam } : (filtersParam || {});
    const search = filters.search ? filters.search.trim() : null;
    const date = filters.date ? filters.date.trim() : null;
    const rawMode = filters.mode ? filters.mode.trim().toUpperCase() : null;

    let modeFilterCondition = '';
    const params: any[] = [user.schoolId, search, date];

    if (rawMode && rawMode !== 'ALL') {
      if (rawMode === 'CASH') {
        params.push('CASH');
        modeFilterCondition = `AND r.payment_mode = $${params.length}`;
      } else if (rawMode === 'ONLINE') {
        modeFilterCondition = `AND r.payment_mode IN ('ONLINE', 'BANK_TRANSFER')`;
      } else if (rawMode === 'APP_PAYMENTS' || rawMode === 'APP' || rawMode === 'UPI') {
        modeFilterCondition = `AND r.payment_mode IN ('APP_PAYMENTS', 'APP', 'UPI')`;
      } else if (rawMode === 'CHEQUES' || rawMode === 'CHEQUE') {
        modeFilterCondition = `AND r.payment_mode IN ('CHEQUE', 'CHEQUES', 'DEMAND_DRAFT')`;
      } else {
        params.push(rawMode);
        modeFilterCondition = `AND r.payment_mode = $${params.length}`;
      }
    }

    const query = `
      SELECT 
        r.id,
        r.receipt_number,
        TO_CHAR(r.payment_date, 'YYYY-MM-DD') AS payment_date,
        r.amount_paid::float AS amount_paid,
        r.payment_mode,
        r.transaction_reference,
        r.remarks,
        r.created_at,
        f.fee_title,
        sp.id AS student_id,
        sp.admission_number,
        sp.roll_number,
        CONCAT(sp.first_name, ' ', sp.last_name) AS student_name,
        c.name AS class_name,
        s.name AS section_name
      FROM fee_receipts r
      JOIN student_profiles sp ON r.student_id = sp.id
      LEFT JOIN student_fees f ON r.student_fee_id = f.id
      LEFT JOIN classes c ON sp.current_class_id = c.id
      LEFT JOIN sections s ON sp.current_section_id = s.id
      WHERE r.school_id = $1
        AND (
          $2::text IS NULL OR
          r.receipt_number ILIKE '%' || $2 || '%' OR
          sp.first_name ILIKE '%' || $2 || '%' OR
          sp.last_name ILIKE '%' || $2 || '%' OR
          sp.admission_number ILIKE '%' || $2 || '%' OR
          r.transaction_reference ILIKE '%' || $2 || '%'
        )
        AND ($3::date IS NULL OR r.payment_date = $3::date)
        ${modeFilterCondition}
      ORDER BY r.created_at DESC;
    `;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Admin: Assign new fee head to entire class or school
   */
  static async assignFeeHead(
    user: TokenPayload,
    data: {
      class_id?: string;
      fee_title: string;
      amount: number;
      due_date: string;
    }
  ): Promise<number> {
    if (!data.fee_title?.trim() || !data.amount || !data.due_date) {
      const err: any = new Error('fee_title, amount, and due_date are required');
      err.statusCode = 400;
      throw err;
    }

    // Get active academic year
    const ayRes = await pool.query(
      `SELECT id FROM academic_years WHERE school_id = $1 AND is_current = TRUE LIMIT 1;`,
      [user.schoolId]
    );
    const academicYearId = ayRes.rows[0]?.id;
    if (!academicYearId) {
      const fallbackAy = await pool.query(
        `SELECT id FROM academic_years WHERE school_id = $1 ORDER BY start_date DESC LIMIT 1;`,
        [user.schoolId]
      );
      if (fallbackAy.rows.length === 0) {
        throw new Error('No academic year configured for this school');
      }
    }
    const finalAyId = academicYearId || (await pool.query(`SELECT id FROM academic_years WHERE school_id = $1 LIMIT 1;`, [user.schoolId])).rows[0].id;

    // Fetch target students
    const studentsRes = await pool.query(
      `SELECT sp.id FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE u.school_id = $1 
         AND ($2::uuid IS NULL OR sp.current_class_id = $2::uuid)
         AND u.is_active = TRUE;`,
      [user.schoolId, data.class_id || null]
    );

    if (studentsRes.rows.length === 0) {
      return 0;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const st of studentsRes.rows) {
        await client.query(
          `INSERT INTO student_fees (
             school_id, student_id, academic_year_id, fee_title, due_date, amount, amount_paid, status
           ) VALUES ($1, $2, $3, $4, $5, $6, 0.00, 'PENDING');`,
          [user.schoolId, st.id, finalAyId, data.fee_title.trim(), data.due_date, data.amount]
        );
      }
      await client.query('COMMIT');
      return studentsRes.rows.length;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
