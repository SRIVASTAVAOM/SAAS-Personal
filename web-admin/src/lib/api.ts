import {
  DashboardSummaryResponse,
  GreensheetResponse,
  LoginResponse,
  SubjectItem,
  TimetableGridResponse,
  TimetableSlotEntry,
  ExamItem,
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
  },

  // Academics & Exams Lookups
  academics: {
    getSubjects: async (): Promise<SubjectItem[]> => {
      return request<SubjectItem[]>('/academics/subjects');
    },
  },

  exams: {
    list: async (): Promise<ExamItem[]> => {
      return request<ExamItem[]>('/exams');
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
};
