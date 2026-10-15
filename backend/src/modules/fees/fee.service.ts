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
}
