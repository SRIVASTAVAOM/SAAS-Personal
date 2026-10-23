import {
  DashboardSummaryResponse,
  GreensheetResponse,
  LoginResponse,
  SubjectItem,
  SubjectMasterItem,
  TimetableGridResponse,
  TimetableSlotEntry,
  ExamItem,
  ClassItem,
  AdminNoticeItem,
  SuperAdminMetrics,
  SchoolRecord,
  OnboardSchoolPayload,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_erp_token');
}

export function setSession(token: string, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('school_erp_token', token);
  localStorage.setItem('school_erp_user', JSON.stringify(user));
  // Set cookie for quick check if needed
  document.cookie = `school_erp_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('school_erp_token');
  localStorage.removeItem('school_erp_user');
  document.cookie = 'school_erp_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export function getCurrentUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('school_erp_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    throw new ApiError(
      json.error || json.message || `Request failed with status ${response.status}`,
      response.status,
      json.details
    );
  }

  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Auth
  auth: {
    login: async (identifier: string, password: string): Promise<LoginResponse['data']> => {
      const res = await request<LoginResponse['data']>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      return res;
    },
  },

  // Admin Command Center & Core
  admin: {
    getDashboardSummary: async (date?: string): Promise<DashboardSummaryResponse> => {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<DashboardSummaryResponse>(`/admin/dashboard/summary${query}`);
    },

    getTimetableGrid: async (
      classId: string,
      sectionId: string
    ): Promise<TimetableGridResponse> => {
      return request<TimetableGridResponse>(
        `/admin/timetable/grid?class_id=${encodeURIComponent(classId)}&section_id=${encodeURIComponent(sectionId)}`
      );
    },

    saveTimetableGrid: async (payload: {
      class_id: string;
      section_id: string;
      academic_year_id?: string;
      slots: TimetableSlotEntry[];
    }): Promise<TimetableGridResponse> => {
      return request<TimetableGridResponse>('/admin/timetable/grid', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    getGreensheet: async (
      classId: string,
      sectionId: string,
      examId?: string
    ): Promise<GreensheetResponse> => {
      const examQuery = examId ? `&exam_id=${encodeURIComponent(examId)}` : '';
      return request<GreensheetResponse>(
        `/admin/reports/greensheet?class_id=${encodeURIComponent(classId)}&section_id=${encodeURIComponent(sectionId)}${examQuery}`
      );
    },

    getTeachers: async (): Promise<any[]> => {
      return request<any[]>('/admin/staff/teachers');
    },

    getTeacherTimetable: async (teacherId: string): Promise<any[]> => {
      return request<any[]>(`/admin/timetable/teacher/${encodeURIComponent(teacherId)}`);
    },

    getSubstitutions: async (date?: string): Promise<any[]> => {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<any[]>(`/admin/timetable/substitutions${query}`);
    },

    assignSubstitution: async (payload: {
      timetable_slot_id: string;
      substitution_date: string;
      original_teacher_id: string;
      substitute_teacher_id: string;
      remarks?: string;
    }): Promise<any> => {
      return request('/admin/timetable/substitutions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    deleteSubstitution: async (id: string): Promise<any> => {
      return request(`/admin/timetable/substitutions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    getStudents: async (filters?: {
      class_id?: string;
      section_id?: string;
      class_ids?: string[];
      section_ids?: string[];
      search?: string;
    }): Promise<any[]> => {
      const params = new URLSearchParams();
      if (filters?.class_id) params.set('class_id', filters.class_id);
      if (filters?.section_id) params.set('section_id', filters.section_id);
      if (filters?.class_ids && filters.class_ids.length > 0) {
        params.set('class_ids', filters.class_ids.join(','));
      }
      if (filters?.section_ids && filters.section_ids.length > 0) {
        params.set('section_ids', filters.section_ids.join(','));
      }
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/admin/students${qs}`);
    },

    getStudentDetails: async (id: string): Promise<any> => {
      return request<any>(`/admin/students/${encodeURIComponent(id)}`);
    },

    updateStudent: async (id: string, payload: any): Promise<any> => {
      return request<any>(`/admin/students/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    // Staff Directory & Management
    getAllStaff: async (search?: string, isActive?: boolean): Promise<any[]> => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('is_active', String(isActive));
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/admin/staff${qs}`);
    },

    createStaff: async (payload: any): Promise<any> => {
      return request('/admin/staff', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    updateStaff: async (id: string, payload: any): Promise<any> => {
      return request(`/admin/staff/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    deleteStaff: async (id: string): Promise<any> => {
      return request(`/admin/staff/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    // Homework Management (View & Assign)
    getHomework: async (filters?: {
      class_id?: string;
      section_id?: string;
      subject_id?: string;
      search?: string;
    }): Promise<any[]> => {
      const params = new URLSearchParams();
      if (filters?.class_id) params.set('class_id', filters.class_id);
      if (filters?.section_id) params.set('section_id', filters.section_id);
      if (filters?.subject_id) params.set('subject_id', filters.subject_id);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/admin/homework${qs}`);
    },

    createHomework: async (payload: {
      class_id: string;
      section_id: string;
      subject_id: string;
      staff_id?: string;
      title: string;
      description?: string;
      assigned_date?: string;
      due_date: string;
      attachment_name?: string;
      s3_attachment_key?: string;
    }): Promise<any> => {
      return request('/admin/homework', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    updateHomework: async (
      id: string,
      payload: {
        class_id?: string;
        section_id?: string;
        subject_id?: string;
        staff_id?: string;
        title?: string;
        description?: string;
        assigned_date?: string;
        due_date?: string;
        attachment_name?: string;
        s3_attachment_key?: string;
      }
    ): Promise<any> => {
      return request(`/admin/homework/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    deleteHomework: async (id: string): Promise<any> => {
      return request(`/admin/homework/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    // Feedback & Complaints
    getFeedback: async (): Promise<{ feedback: any[]; complaints: any[] }> => {
      return request<{ feedback: any[]; complaints: any[] }>('/admin/feedback');
    },

    updateComplaintStatus: async (
      id: string,
      payload: { status: string; resolution_notes?: string }
    ): Promise<any> => {
      return request(`/admin/complaints/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    // Study Materials & Academic Repository (Live sync with Student & Teacher Apps)
    getMaterials: async (filters?: {
      class_id?: string;
      section_id?: string;
      subject_id?: string;
      type?: string;
      search?: string;
    }): Promise<any[]> => {
      const params = new URLSearchParams();
      if (filters?.class_id) params.set('class_id', filters.class_id);
      if (filters?.section_id) params.set('section_id', filters.section_id);
      if (filters?.subject_id) params.set('subject_id', filters.subject_id);
      if (filters?.type && filters.type !== 'ALL') params.set('type', filters.type);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/admin/materials${qs}`);
    },

    createMaterial: async (payload: {
      class_id: string;
      section_id?: string;
      subject_id: string;
      staff_id?: string;
      title: string;
      description?: string;
      material_type?: string;
      file_name: string;
      file_size_bytes?: number;
      content_type?: string;
      s3_file_key?: string;
    }): Promise<any> => {
      return request('/admin/materials', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    updateMaterial: async (
      id: string,
      payload: {
        class_id?: string;
        section_id?: string | null;
        subject_id?: string;
        title?: string;
        description?: string;
        material_type?: string;
        file_name?: string;
      }
    ): Promise<any> => {
      return request(`/admin/materials/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    deleteMaterial: async (id: string): Promise<any> => {
      return request(`/admin/materials/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    getMaterialDownloadUrl: async (id: string): Promise<{ downloadUrl: string; fileName: string; isMock: boolean }> => {
      return request<{ downloadUrl: string; fileName: string; isMock: boolean }>(`/materials/${encodeURIComponent(id)}/download-url`);
    },
  },

  // Academics & Exams Lookups
  academics: {
    getSubjects: async (): Promise<SubjectItem[]> => {
      return request<SubjectItem[]>('/academics/subjects');
    },
    getSubjectsMaster: async (): Promise<SubjectMasterItem[]> => {
      return request<SubjectMasterItem[]>('/academics/subjects/master');
    },
    createSubject: async (payload: { name: string; code: string; type?: string; class_ids?: string[] }): Promise<any> => {
      return request<any>('/academics/subjects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updateSubject: async (id: string, payload: { name?: string; code?: string; type?: string; is_active?: boolean; class_ids?: string[] }): Promise<any> => {
      return request<any>(`/academics/subjects/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    deleteSubject: async (id: string): Promise<any> => {
      return request<any>(`/academics/subjects/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    getClasses: async (): Promise<ClassItem[]> => {
      return request<ClassItem[]>('/academics/classes');
    },
  },

  exams: {
    list: async (): Promise<ExamItem[]> => {
      return request<ExamItem[]>('/exams');
    },
  },

  // Notices Management (Live sync with Student and Teacher Apps)
  notices: {
    list: async (): Promise<AdminNoticeItem[]> => {
      return request<AdminNoticeItem[]>('/notices');
    },
    create: async (data: {
      title: string;
      content: string;
      target_role?: string;
      target_class_id?: string | null;
      target_section_id?: string | null;
      target_student_id?: string | null;
      priority?: 'INFO' | 'NORMAL' | 'URGENT';
      channel?: 'IN_APP' | 'PUSH' | 'SMS' | 'EMAIL';
    }): Promise<AdminNoticeItem> => {
      return request<AdminNoticeItem>('/notices', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<any> => {
      return request(`/notices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  },

  // Leave Management (Dual-visibility Approvals)
  leaves: {
    updateStudentLeaveStatus: async (
      id: string,
      status: 'APPROVED' | 'REJECTED',
      remarks?: string
    ): Promise<any> => {
      return request(`/leaves/student/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, remarks }),
      });
    },

    decideStaffLeave: async (
      id: string,
      decision: 'APPROVED' | 'REJECTED',
      comment?: string
    ): Promise<any> => {
      return request(`/leaves/staff/${encodeURIComponent(id)}/decide`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, comment }),
      });
    },
  },

  // Fee Management & Collections (Live sync with Student Receipts)
  fees: {
    getOverview: async (filters?: {
      class_id?: string;
      section_id?: string;
      status?: string;
      search?: string;
    }): Promise<{
      kpis: {
        total_receivable: number;
        total_collected: number;
        total_pending: number;
        collection_percentage: number;
      };
      records: any[];
    }> => {
      const params = new URLSearchParams();
      if (filters?.class_id) params.set('class_id', filters.class_id);
      if (filters?.section_id) params.set('section_id', filters.section_id);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request(`/fees/admin/overview${qs}`);
    },

    collectFee: async (payload: {
      student_id: string;
      student_fee_id?: string;
      amount_paid: number;
      payment_mode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'DEMAND_DRAFT' | 'ONLINE';
      transaction_reference?: string;
      remarks?: string;
    }): Promise<any> => {
      return request('/fees/admin/collect', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    getReceipts: async (
      params?: string | { search?: string; date?: string; mode?: string }
    ): Promise<any[]> => {
      let qs = '';
      if (typeof params === 'string') {
        qs = params ? `?search=${encodeURIComponent(params)}` : '';
      } else if (params) {
        const query = new URLSearchParams();
        if (params.search) query.set('search', params.search);
        if (params.date) query.set('date', params.date);
        if (params.mode) query.set('mode', params.mode);
        const str = query.toString();
        qs = str ? `?${str}` : '';
      }
      return request<any[]>(`/fees/admin/receipts${qs}`);
    },

    assignFeeHead: async (payload: {
      class_id?: string;
      fee_title: string;
      amount: number;
      due_date: string;
    }): Promise<any> => {
      return request('/fees/admin/assign', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // Attendance Management (Students & Staff)
  attendance: {
    getClassStudentAttendance: async (
      classId: string,
      sectionId: string,
      date: string
    ): Promise<any[]> => {
      return request<any[]>(
        `/attendance/student/class/${encodeURIComponent(classId)}/${encodeURIComponent(sectionId)}?date=${encodeURIComponent(date)}`
      );
    },

    markStudentAttendance: async (payload: {
      class_id: string;
      section_id: string;
      attendance_date: string;
      records: Array<{ student_id: string; status: 'PRESENT' | 'ABSENT'; remarks?: string | null }>;
    }): Promise<any> => {
      return request('/attendance/student', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    getAllStaffAttendance: async (date: string): Promise<any[]> => {
      return request<any[]>(
        `/attendance/staff/management-overview?date=${encodeURIComponent(date)}`
      );
    },

    markStaffAttendance: async (payload: {
      attendance_date: string;
      records: Array<{
        staffId: string;
        status: 'PRESENT' | 'ABSENT';
        inTime?: string | null;
        outTime?: string | null;
        remarks?: string | null;
      }>;
    }): Promise<any> => {
      return request('/attendance/staff', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // Level 1: Super Admin (Platform Owner)
  superAdmin: {
    getMetrics: async (): Promise<SuperAdminMetrics> => {
      return request<SuperAdminMetrics>('/super-admin/metrics');
    },

    getSchools: async (filters?: { search?: string; status?: string; plan?: string }): Promise<SchoolRecord[]> => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.plan) params.append('plan', filters.plan);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return request<SchoolRecord[]>(`/super-admin/schools${queryStr}`);
    },

    getSchoolById: async (schoolId: string): Promise<any> => {
      return request(`/super-admin/schools/${encodeURIComponent(schoolId)}`);
    },

    onboardSchool: async (payload: OnboardSchoolPayload): Promise<{ school: SchoolRecord; adminCredentials: any }> => {
      return request('/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    updateSchoolStatus: async (schoolId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<any> => {
      return request(`/super-admin/schools/${encodeURIComponent(schoolId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    updateSchoolPlan: async (schoolId: string, payload: { plan: string; maxStudents?: number; subscriptionExpiresAt?: string }): Promise<any> => {
      return request(`/super-admin/schools/${encodeURIComponent(schoolId)}/plan`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  },
};
