export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface UserSession {
  userId: string;
  schoolId: string | null;
  identifier: string;
  email: string | null;
  roles: UserRole[];
  profileId: string | null;
  wingId: string | null;
  classId: string | null;
  sectionId: string | null;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: UserSession;
  };
  error?: string;
}

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
  fee_realized?: {
    total: number;
    by_mode: {
      cash: number;
      online: number;
      app_payments: number;
      cheques: number;
    };
    counts?: {
      cash: number;
      online: number;
      app_payments: number;
      cheques: number;
    };
  };
  today_student_attendance?: StudentAttendanceRecordSummary[];
  pending_leaves: PendingLeaveSummary[];
  today_birthdays: BirthdaySummary[];
}

export interface TimetableSlotEntry {
  id?: string;
  school_id?: string;
  academic_year_id?: string;
  class_id?: string;
  class_name?: string;
  section_id?: string;
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
  room_number?: string | null;
}

export interface TimetableGridResponse {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  academic_year_id: string;
  slots: TimetableSlotEntry[];
  matrix: Record<string, Record<string, TimetableSlotEntry[]>>;
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
  rank: number;
  result_status: 'PASS' | 'FAIL' | 'INCOMPLETE';
}

export interface GreensheetStatistics {
  total_enrolled: number;
  total_appeared: number;
  total_passed: number;
  total_failed: number;
  pass_percentage: number;
  class_average_percentage: number;
  highest_percentage: number;
  lowest_percentage: number;
}

export interface GreensheetResponse {
  school_name: string;
  academic_year_name: string;
  exam_name: string;
  class_name: string;
  section_name: string;
  subjects: GreensheetSubjectHeader[];
  students: GreensheetStudentRow[];
  statistics: GreensheetStatistics;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

export interface SubjectMasterItem {
  id: string;
  name: string;
  code: string;
  type?: string;
  is_active?: boolean;
  created_at?: string;
  classes?: { id: string; name: string }[];
  teachers_count?: number;
}

export interface TeacherItem {
  id: string;
  name: string;
  employee_code?: string;
}

export interface ExamItem {
  id: string;
  name: string;
  term?: string;
  is_published?: boolean;
}

export type UploadCategory =
  | 'Study Material'
  | 'Syllabus'
  | 'Assignment'
  | 'Practice Sheet'
  | 'Datesheet'
  | 'Holiday HW'
  | 'Daily HW Message';

export interface RecentUploadItem {
  id: string;
  title: string;
  type?: UploadCategory | string;
  material_type?: string;
  class_id?: string;
  class_name: string;
  section_id?: string | null;
  section_name?: string | null;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  file_name?: string;
  file_size_bytes?: number | string;
  content_type?: string;
  s3_file_key?: string;
  description?: string | null;
  is_verified?: boolean;
  created_at: string;
  status?: 'Active' | 'Archived';
}

export interface SectionItem {
  id: string;
  name: string;
}

export interface ClassItem {
  id: string;
  name: string;
  class_id: string;
  class_name: string;
  sections: SectionItem[];
}

export interface AdminNoticeItem {
  id: string;
  title: string;
  content: string;
  target_role: string;
  priority: 'INFO' | 'NORMAL' | 'URGENT';
  target_class_id?: string | null;
  target_section_id?: string | null;
  class_name?: string | null;
  section_name?: string | null;
  published_at: string;
  created_at: string;
}

export interface SuperAdminMetrics {
  schools: {
    total_schools: number;
    active_schools: number;
    suspended_schools: number;
  };
  users: {
    total_students: number;
    total_staff: number;
  };
  planBreakdown: Array<{ plan: string; count: number }>;
  recentSchools: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    plan: string;
    admin_name: string;
    admin_email: string;
    created_at: string;
    student_count: number;
  }>;
}

export interface SchoolRecord {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'SUSPENDED';
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  max_students: number;
  subscription_expires_at: string;
  admin_name: string;
  admin_email: string;
  admin_phone?: string;
  address?: string;
  created_at: string;
  student_count: number;
  staff_count: number;
}

export interface OnboardSchoolPayload {
  name: string;
  code: string;
  plan?: 'FREE' | 'PRO' | 'ENTERPRISE';
  maxStudents?: number;
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword?: string;
  address?: string;
}
