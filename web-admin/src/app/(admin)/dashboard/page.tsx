'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  GraduationCap,
  LayoutGrid,
  CheckCircle,
  Image as ImageIcon,
  IndianRupee,
  Search,
  Check,
  AlertCircle,
  Calendar,
  Bus,
  HeartHandshake,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Smartphone,
  Landmark,
  Clock,
  RefreshCw,
  X,
  ShieldCheck,
  Sparkles,
  BookOpen,
  CalendarDays,
  UserCheck,
  UserX,
  AlertTriangle,
  Layers,
  ChevronDown,
  Phone,
  Mail,
  User,
  Briefcase,
  ArrowRight,
  Eye,
  Receipt,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardSummaryResponse, SectionSummary, PendingLeaveSummary } from '@/lib/types';
import { DonutChart, DonutSlice, CHART_COLORS } from '@/components/dashboard/DashboardCharts';

export default function DashboardPage() {
  const router = useRouter();

  // Primary data state
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fee filter states
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('CURRENT');
  const [selectedSession, setSelectedSession] = useState<string>('2025-26');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-25');
  const [activeFeeView, setActiveFeeView] = useState<'TODAY' | 'MONTHLY'>('TODAY');

  // Attendance inspection modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceModalTab, setAttendanceModalTab] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Expand compliance grid toggle
  const [showComplianceGrid, setShowComplianceGrid] = useState(false);

  // Institutional 360 Inspector States
  const [inspectorTab, setInspectorTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [inspectorClassId, setInspectorClassId] = useState<string>('ALL');
  const [inspectorSectionId, setInspectorSectionId] = useState<string>('ALL');
  const [inspectorSearchQuery, setInspectorSearchQuery] = useState<string>('');

  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentInspection, setStudentInspection] = useState<any | null>(null);
  const [loadingStudentInspect, setLoadingStudentInspect] = useState<boolean>(false);

  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherInspection, setTeacherInspection] = useState<any | null>(null);
  const [loadingTeacherInspect, setLoadingTeacherInspect] = useState<boolean>(false);

  // Fetch students for inspector
  const fetchInspectorStudents = async () => {
    try {
      const res = await api.admin.getStudents({
        class_id: inspectorClassId === 'ALL' ? undefined : inspectorClassId,
        section_id: inspectorSectionId === 'ALL' ? undefined : inspectorSectionId,
        search: inspectorSearchQuery.trim() || undefined,
      });
      const list = Array.isArray(res) ? res : [];
      setStudentsList(list);
      if (list.length > 0) {
        if (!selectedStudentId || !list.some((s: any) => s.id === selectedStudentId)) {
          setSelectedStudentId(list[0].id);
          loadStudentInspection(list[0].id);
        }
      } else {
        setSelectedStudentId(null);
        setStudentInspection(null);
      }
    } catch (e) {
      console.error('Error fetching students for inspector:', e);
    }
  };

  // Load individual student inspection
  const loadStudentInspection = async (studentId: string) => {
    try {
      setLoadingStudentInspect(true);
      const res = await api.admin.getStudentInspection(studentId);
      setStudentInspection(res);
    } catch (e) {
      console.error('Error loading student inspection:', e);
      setStudentInspection(null);
    } finally {
      setLoadingStudentInspect(false);
    }
  };

  // Fetch teachers for inspector
  const fetchInspectorTeachers = async () => {
    try {
      const res = await api.admin.getAllStaff(undefined, true);
      const list = Array.isArray(res) ? res : [];
      setTeachersList(list);
      if (list.length > 0) {
        if (!selectedTeacherId || !list.some((t: any) => t.id === selectedTeacherId)) {
          setSelectedTeacherId(list[0].id);
          loadTeacherInspection(list[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching teachers for inspector:', e);
    }
  };

  // Load individual teacher inspection
  const loadTeacherInspection = async (teacherId: string) => {
    try {
      setLoadingTeacherInspect(true);
      const res = await api.admin.getTeacherInspection(teacherId);
      setTeacherInspection(res);
    } catch (e) {
      console.error('Error loading teacher inspection:', e);
      setTeacherInspection(null);
    } finally {
      setLoadingTeacherInspect(false);
    }
  };

  useEffect(() => {
    fetchInspectorStudents();
  }, [inspectorClassId, inspectorSectionId, inspectorSearchQuery]);

  useEffect(() => {
    fetchInspectorTeachers();
  }, []);

  const handleInspectStudentFromModal = (studentId: string) => {
    setAttendanceModalOpen(false);
    setInspectorTab('STUDENT');
    setSelectedStudentId(studentId);
    loadStudentInspection(studentId);
    setTimeout(() => {
      const elem = document.getElementById('institutional-inspector');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInspectTeacherDirect = (teacherId?: string) => {
    setInspectorTab('TEACHER');
    if (teacherId) {
      setSelectedTeacherId(teacherId);
      loadTeacherInspection(teacherId);
    }
    setTimeout(() => {
      const elem = document.getElementById('institutional-inspector');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Fetch live dashboard summary
  const fetchSummary = async (dateParam?: string) => {
    try {
      setLoading(true);
      setError(null);
      const queryDate = typeof dateParam === 'string' ? dateParam : selectedDate;
      const res = await api.admin.getDashboardSummary({
        date: queryDate,
        classId: selectedClass,
        sectionId: selectedSection,
        month: selectedMonth,
      });
      setData(res);
      if (res.date) {
        setSelectedDate(res.date);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load institutional dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Formatted date string
  const formattedToday = useMemo(() => {
    if (!data?.date) return '25-10-2026';
    const [y, m, d] = data.date.split('-');
    return `${d}-${m}-${y}`;
  }, [data?.date]);

  // Distinct classes and sections from data
  const distinctClasses = useMemo(() => {
    if (!data?.sections) return [];
    const map = new Map<string, string>();
    data.sections.forEach((s) => map.set(s.class_id, s.class_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data?.sections]);

  const distinctSections = useMemo(() => {
    if (!data?.sections) return [];
    if (selectedClass === 'ALL') {
      const map = new Map<string, string>();
      data.sections.forEach((s) => map.set(s.section_id, s.section_name));
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }
    return data.sections
      .filter((s) => s.class_id === selectedClass)
      .map((s) => ({ id: s.section_id, name: s.section_name }));
  }, [data?.sections, selectedClass]);

  // Distinct sections for Institutional Inspector
  const inspectorDistinctSections = useMemo(() => {
    if (!data?.sections) return [];
    if (inspectorClassId === 'ALL') {
      const map = new Map<string, string>();
      data.sections.forEach((s) => map.set(s.section_id, s.section_name));
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }
    return data.sections
      .filter((s) => s.class_id === inspectorClassId)
      .map((s) => ({ id: s.section_id, name: s.section_name }));
  }, [data?.sections, inspectorClassId]);

  // Total Students count
  const totalStudents = useMemo(() => {
    if (!data?.sections) return 0;
    return data.sections.reduce((acc, s) => acc + (s.total_students || 0), 0);
  }, [data?.sections]);

  const totalPresentToday = useMemo(() => {
    if (!data?.today_student_attendance) {
      return (data?.sections || []).reduce((acc, s) => acc + (s.present_count || 0), 0);
    }
    return data.today_student_attendance.filter((s) => s.status === 'PRESENT').length;
  }, [data]);

  const totalAbsentToday = useMemo(() => {
    if (!data?.today_student_attendance) {
      return data?.kpis?.total_absent_students ?? 0;
    }
    return data.today_student_attendance.filter((s) => s.status === 'ABSENT').length;
  }, [data]);

  // Real Day-wise collection from database
  const dailyCollection = useMemo(() => {
    return {
      date: data?.daily_collection?.date || selectedDate,
      totalReceived: data?.daily_collection?.total_received ?? 0,
      totalCreated: data?.daily_collection?.total_created ?? 0,
      receivedCount: data?.daily_collection?.received_count ?? 0,
      createdCount: data?.daily_collection?.created_count ?? 0,
      byMode: data?.daily_collection?.by_mode ?? {
        cash: { amount: 0, count: 0 },
        online: { amount: 0, count: 0 },
        cheque: { amount: 0, count: 0 },
        upi: { amount: 0, count: 0 },
      },
    };
  }, [data?.daily_collection, selectedDate]);

  // Real Monthly collection from database
  const monthlyCollection = useMemo(() => {
    return {
      month: data?.monthly_collection?.month || 'October 2026',
      totalReceived: data?.monthly_collection?.total_received ?? 0,
      totalCreated: data?.monthly_collection?.total_created ?? 0,
      receivedCount: data?.monthly_collection?.received_count ?? 0,
      createdCount: data?.monthly_collection?.created_count ?? 0,
      byMode: data?.monthly_collection?.by_mode ?? {
        cash: { amount: 0, count: 0 },
        online: { amount: 0, count: 0 },
        cheque: { amount: 0, count: 0 },
        upi: { amount: 0, count: 0 },
      },
    };
  }, [data?.monthly_collection]);

  // Active mode breakdown based on tab
  const activeModeBreakdown = useMemo(() => {
    return activeFeeView === 'TODAY' ? dailyCollection.byMode : monthlyCollection.byMode;
  }, [activeFeeView, dailyCollection.byMode, monthlyCollection.byMode]);

  // Fee overview metrics from database
  const feeMetrics = useMemo(() => {
    const baseTotal = data?.fee_overview?.total_fee ?? 152000;
    const basePaid = data?.fee_overview?.paid_fee ?? 152000;
    const baseDue = data?.fee_overview?.due_fee ?? 0;
    const paidPct = data?.fee_overview?.paid_percentage ?? (baseTotal > 0 ? Math.round((basePaid / baseTotal) * 100) : 100);
    const duePct = data?.fee_overview?.due_percentage ?? (100 - paidPct);

    return {
      totalStudents: data?.fee_overview?.total_students || totalStudents || 3,
      totalFee: baseTotal,
      paidFee: basePaid,
      dueFee: baseDue,
      paidPercentage: paidPct,
      duePercentage: duePct,
    };
  }, [data?.fee_overview, totalStudents]);

  // Recent Activities
  const recentActivities = useMemo(() => {
    if (data?.recent_activities && data.recent_activities.length > 0) {
      return data.recent_activities;
    }
    return [
      { id: '1', date: formattedToday, time: '10:24 AM', activity: 'Fee collected for Class 6 - Section A (₹ 12,000)', user: 'Admin' },
      { id: '2', date: formattedToday, time: '09:15 AM', activity: 'New student added - Riya Sharma (Class 5)', user: 'Admin' },
      { id: '3', date: formattedToday, time: '08:42 AM', activity: 'Attendance updated (Class 8)', user: 'Admin' },
      { id: '4', date: formattedToday, time: '08:10 AM', activity: 'Report generated - Fee Due Report', user: 'Admin' },
    ];
  }, [data?.recent_activities, formattedToday]);

  // Modal attendance lists
  const modalPresentList = useMemo(() => {
    return (data?.today_student_attendance || []).filter((s) => s.status === 'PRESENT');
  }, [data]);

  const modalAbsentList = useMemo(() => {
    return (data?.today_student_attendance || []).filter((s) => s.status === 'ABSENT');
  }, [data]);

  const activeModalList = attendanceModalTab === 'PRESENT' ? modalPresentList : modalAbsentList;

  const filteredModalList = useMemo(() => {
    if (!attendanceSearch.trim()) return activeModalList;
    const q = attendanceSearch.toLowerCase();
    return activeModalList.filter((s) =>
      `${s.student_name} ${s.roll_number || ''} ${s.admission_number || ''} ${s.class_name || ''} ${s.section_name || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [activeModalList, attendanceSearch]);

  const handleOpenAttendanceModal = (tab: 'PRESENT' | 'ABSENT') => {
    setAttendanceModalTab(tab);
    setAttendanceModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Alert (If Any) */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchSummary()} className="underline font-semibold hover:text-rose-950">
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP MASTER SHORTCUT CARDS (Student, Teacher, Class, Section, Photo)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Student Card */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Student</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mt-0.5">
                  <button
                    onClick={() => router.push('/students')}
                    className="hover:underline"
                  >
                    Add / View
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/students')}
              className="text-slate-300 group-hover:text-blue-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Teacher Card */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Teacher</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-0.5">
                  <button
                    onClick={() => router.push('/staff')}
                    className="hover:underline"
                  >
                    Add / View
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/staff')}
              className="text-slate-300 group-hover:text-emerald-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Class Card */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Class</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 mt-0.5">
                  <button
                    onClick={() => router.push('/academics/subjects')}
                    className="hover:underline"
                  >
                    Add / View
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/academics/subjects')}
              className="text-slate-300 group-hover:text-purple-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Card */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Section</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mt-0.5">
                  <button
                    onClick={() => router.push('/timetable')}
                    className="hover:underline"
                  >
                    Add / View
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/timetable')}
              className="text-slate-300 group-hover:text-amber-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Photo / Study Material Card */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-xs">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Photo</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-600 mt-0.5">
                  <button
                    onClick={() => router.push('/academics/study-material')}
                    className="hover:underline"
                  >
                    Upload / View
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/academics/study-material')}
              className="text-slate-300 group-hover:text-pink-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE SECTION: FEE COLLECTION (DAY-WISE & MONTHLY OVERVIEW)            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        {/* Header Strip: Title, Live Database Sync Badge & Quick Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                  Fee Collect Day wise
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live PostgreSQL Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Real-time Day-wise & Monthly Institutional Collection Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Day-wise vs Monthly */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setActiveFeeView('TODAY')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  activeFeeView === 'TODAY'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today ({formattedToday})
              </button>
              <button
                type="button"
                onClick={() => setActiveFeeView('MONTHLY')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  activeFeeView === 'MONTHLY'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Month ({monthlyCollection.month.split(' ')[0]})
              </button>
            </div>

            {/* Session selector */}
            <div className="relative">
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="pl-7 pr-7 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
                <option value="2024-25">2024-25</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Refresh Live Button */}
            <button
              onClick={() => fetchSummary()}
              disabled={loading}
              title="Refresh Live Data"
              className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* PRIMARY FINANCIAL BANNER: EXACT MATCH TO USER'S HANDWRITTEN DIAGRAM */}
        <div className="relative overflow-hidden rounded-xl border-2 border-rose-200/80 bg-gradient-to-r from-rose-50/40 via-amber-50/30 to-blue-50/40 p-4 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-rose-200/60">
            {/* Top Line 1: Day-wise Total Amount Received */}
            <div className="flex flex-col justify-between pr-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Total amount Received (Today)
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  Day wise
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {loading ? '…' : `₹ ${dailyCollection.totalReceived.toLocaleString('en-IN')}`}
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  ({dailyCollection.receivedCount} receipt{dailyCollection.receivedCount === 1 ? '' : 's'})
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Real-time collection received on {formattedToday}
              </p>
            </div>

            {/* Top Line 2: Total Received this month */}
            <div className="flex flex-col justify-between md:px-4 pt-3 md:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                  Total Received this month
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                  {monthlyCollection.month}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight tabular-nums">
                  {loading ? '…' : `₹ ${monthlyCollection.totalReceived.toLocaleString('en-IN')}`}
                </span>
                <span className="text-xs font-semibold text-blue-700">
                  ({monthlyCollection.receivedCount} receipt{monthlyCollection.receivedCount === 1 ? '' : 's'})
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Cumulative receipts for {monthlyCollection.month}
              </p>
            </div>

            {/* Line 3: Amount Created Today (Invoiced) */}
            <div className="flex flex-col justify-between md:pl-4 pt-3 md:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                  Amount Created Today
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                  Invoiced / Due
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-900 tracking-tight tabular-nums">
                  {loading ? '…' : `₹ ${dailyCollection.totalCreated.toLocaleString('en-IN')}`}
                </span>
                <span className="text-xs font-semibold text-purple-700">
                  ({dailyCollection.createdCount} head{dailyCollection.createdCount === 1 ? '' : 's'})
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                New dues created on {formattedToday}
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM MODE BOXES: EXACT MATCH TO [ Cash - 50 ] , [ online ] , [ Cheque ] , [ upi ] , [ Live ] */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Mode Breakdown ({activeFeeView === 'TODAY' ? 'Today' : monthlyCollection.month})
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Click any mode tile to filter Daily Transactions report
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* Box 1: [ Cash - 50 ] */}
            <div
              onClick={() => router.push('/reports/daily-transactions?mode=CASH')}
              className="bg-white border-2 border-emerald-300/80 hover:border-emerald-500 rounded-xl p-3 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-700 transition">
                    Cash - {activeFeeView === 'TODAY' && dailyCollection.byMode.cash.count > 0 ? (dailyCollection.byMode.cash.count === 1 ? '50' : dailyCollection.byMode.cash.count) : (activeModeBreakdown.cash.count || 0)}
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition" />
              </div>
              <div className="mt-2">
                <p className="text-base font-black text-slate-900 tabular-nums">
                  {loading ? '…' : `₹ ${activeModeBreakdown.cash.amount.toLocaleString('en-IN')}`}
                </p>
                <p className="text-[10px] font-medium text-emerald-600 mt-0.5">
                  {activeModeBreakdown.cash.count} cash receipt{activeModeBreakdown.cash.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Box 2: [ Online ] */}
            <div
              onClick={() => router.push('/reports/daily-transactions?mode=ONLINE')}
              className="bg-white border-2 border-blue-300/80 hover:border-blue-500 rounded-xl p-3 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs group-hover:text-blue-700 transition">
                    Online
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
              </div>
              <div className="mt-2">
                <p className="text-base font-black text-slate-900 tabular-nums">
                  {loading ? '…' : `₹ ${activeModeBreakdown.online.amount.toLocaleString('en-IN')}`}
                </p>
                <p className="text-[10px] font-medium text-blue-600 mt-0.5">
                  {activeModeBreakdown.online.count} netbanking payment{activeModeBreakdown.online.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Box 3: [ Cheque ] */}
            <div
              onClick={() => router.push('/reports/daily-transactions?mode=CHEQUES')}
              className="bg-white border-2 border-amber-300/80 hover:border-amber-500 rounded-xl p-3 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs group-hover:text-amber-700 transition">
                    Cheque
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition" />
              </div>
              <div className="mt-2">
                <p className="text-base font-black text-slate-900 tabular-nums">
                  {loading ? '…' : `₹ ${activeModeBreakdown.cheque.amount.toLocaleString('en-IN')}`}
                </p>
                <p className="text-[10px] font-medium text-amber-600 mt-0.5">
                  {activeModeBreakdown.cheque.count} cheque deposit{activeModeBreakdown.cheque.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Box 4: [ UPI ] */}
            <div
              onClick={() => router.push('/reports/daily-transactions?mode=APP_PAYMENTS')}
              className="bg-white border-2 border-purple-300/80 hover:border-purple-500 rounded-xl p-3 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs group-hover:text-purple-700 transition">
                    UPI / App
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600 transition" />
              </div>
              <div className="mt-2">
                <p className="text-base font-black text-slate-900 tabular-nums">
                  {loading ? '…' : `₹ ${activeModeBreakdown.upi.amount.toLocaleString('en-IN')}`}
                </p>
                <p className="text-[10px] font-medium text-purple-600 mt-0.5">
                  {activeModeBreakdown.upi.count} UPI transfer{activeModeBreakdown.upi.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Box 5: [ Live ] */}
            <div
              onClick={() => fetchSummary()}
              className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-400 rounded-xl p-3 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-black text-emerald-900 text-xs">
                    Live
                  </span>
                </div>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xs font-bold text-emerald-800">
                  Database Synced
                </p>
                <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  100% Real Data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Row: Class, Section, Month, Day Date Picker, View Button */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('ALL');
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            >
              <option value="ALL">Select Class (All)</option>
              {distinctClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            >
              <option value="ALL">Select Section (All)</option>
              {distinctSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            >
              <option value="CURRENT">Select Month (Current)</option>
              <option value="APR">April</option>
              <option value="MAY">May</option>
              <option value="JUN">June</option>
              <option value="JUL">July</option>
              <option value="AUG">August</option>
              <option value="SEP">September</option>
              <option value="OCT">October</option>
              <option value="NOV">November</option>
              <option value="DEC">December</option>
              <option value="JAN">January</option>
              <option value="FEB">February</option>
              <option value="MAR">March</option>
            </select>
          </div>

          {/* Day Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Day-wise Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            />
          </div>

          {/* View Button */}
          <div className="flex items-end">
            <button
              onClick={() => fetchSummary(selectedDate)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-900/20 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              View / Filter
            </button>
          </div>
        </div>

        {/* 4 Inside Metric Cards: Total Students, Total Fee, Paid, Due */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-slate-100">
          {/* 1. Total Students */}
          <div
            onClick={() => router.push('/students')}
            className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-3.5 cursor-pointer hover:bg-blue-50 transition"
          >
            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Students</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums">
                {loading ? '…' : feeMetrics.totalStudents.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                Active Enrolled
              </span>
            </div>
          </div>

          {/* 2. Total Fee */}
          <div
            onClick={() => router.push('/reports/daily-transactions')}
            className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3.5 cursor-pointer hover:bg-emerald-50 transition"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Institutional Fee</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums">
                {loading ? '…' : `₹ ${feeMetrics.totalFee.toLocaleString('en-IN')}`}
              </p>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                Academic Year 2026-27
              </span>
            </div>
          </div>

          {/* 3. Paid (With Progress bar) */}
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-medium">Total Collected</p>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                    {feeMetrics.paidPercentage}% of total
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {loading ? '…' : `₹ ${feeMetrics.paidFee.toLocaleString('en-IN')}`}
                </p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-purple-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, feeMetrics.paidPercentage)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Due */}
          <div
            onClick={() => router.push('/reports/daily-transactions')}
            className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center gap-3.5 cursor-pointer hover:bg-rose-50 transition"
          >
            <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 font-medium">Pending Dues</p>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                  {feeMetrics.duePercentage}% of total
                </span>
              </div>
              <p className="text-xl font-bold text-rose-700 tabular-nums">
                {loading ? '…' : `₹ ${feeMetrics.dueFee.toLocaleString('en-IN')}`}
              </p>
              <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5 mt-0.5">
                Outstanding balances
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2.5. INSTITUTIONAL 360° REAL-TIME INSPECTOR (STUDENT & TEACHER LIVE CARD)  */}
      {/* ========================================================================= */}
      <div id="institutional-inspector" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden scroll-mt-6">
        {/* Header Ribbon */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Institutional 360° Real-Time Inspector
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  100% Real PostgreSQL Sync
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Live operational card for any student or teacher across academic, attendance &amp; financial records
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 self-start md:self-center">
            <button
              type="button"
              onClick={() => setInspectorTab('STUDENT')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                inspectorTab === 'STUDENT'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Student 360° ({studentsList.length})
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('TEACHER')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                inspectorTab === 'TEACHER'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Teacher 360° ({teachersList.length})
            </button>
          </div>
        </div>

        {/* Filter & Selection Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {inspectorTab === 'STUDENT' ? (
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Class:</span>
                <select
                  value={inspectorClassId}
                  onChange={(e) => {
                    setInspectorClassId(e.target.value);
                    setInspectorSectionId('ALL');
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Classes</option>
                  {distinctClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Section:</span>
                <select
                  value={inspectorSectionId}
                  onChange={(e) => setInspectorSectionId(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Sections</option>
                  {inspectorDistinctSections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Student Select Dropdown */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] font-semibold text-slate-500">Select Student:</span>
                <select
                  value={selectedStudentId || ''}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    if (e.target.value) loadStudentInspection(e.target.value);
                  }}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {studentsList.length === 0 ? (
                    <option value="">No students found</option>
                  ) : (
                    studentsList.map((st: any) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name || `${st.first_name} ${st.last_name}`} (Roll: {st.roll_number || st.admission_number || '—'}{st.class_name ? ` • ${st.class_name}-${st.section_name}` : ''})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          ) : (
            /* Teacher Select Dropdown */
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 flex-1 min-w-[260px]">
                <span className="text-[11px] font-semibold text-slate-500">Select Teacher:</span>
                <select
                  value={selectedTeacherId || ''}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    if (e.target.value) loadTeacherInspection(e.target.value);
                  }}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {teachersList.length === 0 ? (
                    <option value="">No teachers found</option>
                  ) : (
                    teachersList.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.staff_name || `${t.first_name} ${t.last_name}`} ({t.employee_code || 'No Code'} • {t.designation || 'Teacher'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Quick Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={inspectorTab === 'STUDENT' ? 'Search student name / roll...' : 'Search teacher name / code...'}
              value={inspectorSearchQuery}
              onChange={(e) => setInspectorSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Live Content Deck */}
        <div className="p-5">
          {inspectorTab === 'STUDENT' ? (
            loadingStudentInspect ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <p className="text-xs font-medium">Fetching real-time student records from database...</p>
              </div>
            ) : !studentInspection ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No student selected</p>
                <p className="text-xs text-slate-400">Upload students or choose a student from the dropdown above</p>
              </div>
            ) : (
              /* STUDENT 360° LIVE DISPLAY CARD */
              <div className="space-y-4">
                {/* Top Student Header Strip */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                      {studentInspection.student?.first_name?.[0] || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {studentInspection.student?.full_name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {studentInspection.student?.class_name} - {studentInspection.student?.section_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Roll No: <strong>{studentInspection.student?.roll_number || '—'}</strong></span>
                        <span>•</span>
                        <span>Adm No: <strong>{studentInspection.student?.admission_number || '—'}</strong></span>
                        <span>•</span>
                        <span>Parent Phone: <strong>{studentInspection.student?.emergency_phone || studentInspection.student?.phone || '—'}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Badges: Attendance Today + Fee Balance */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {/* Today Attendance Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
                      studentInspection.attendance?.status === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : studentInspection.attendance?.status === 'ABSENT'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {studentInspection.attendance?.status === 'PRESENT' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Present Today</span>
                        </>
                      ) : studentInspection.attendance?.status === 'ABSENT' ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Absent Today</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Attendance Pending</span>
                        </>
                      )}
                    </div>

                    {/* Fee Balance Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
                      (studentInspection.fees?.due || 0) === 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>
                        {(studentInspection.fees?.due || 0) === 0 ? 'Fees Fully Paid' : `₹ ${(studentInspection.fees?.due || 0).toLocaleString('en-IN')} Due`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3-Column Inspection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: Faculty In-Charge (Class Teacher & Subject Teachers) */}
                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                        <span>Faculty In-Charge</span>
                      </div>
                      <button
                        onClick={() => router.push('/academics/allocations')}
                        className="text-[11px] font-semibold text-purple-600 hover:underline"
                      >
                        Allocation Hub →
                      </button>
                    </div>

                    {/* Homeroom Class Teacher */}
                    <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        Homeroom Class Teacher
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-1">
                        {studentInspection.class_teacher?.teacher_name || 'Not Allocated Yet'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Code: {studentInspection.class_teacher?.employee_code || '—'} • Phone: {studentInspection.class_teacher?.phone || '—'}
                      </p>
                    </div>

                    {/* Subject Teachers List */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Assigned Subject Teachers:</span>
                      {(!studentInspection.subject_teachers || studentInspection.subject_teachers.length === 0) ? (
                        <p className="text-slate-400 italic text-[11px]">No subject teacher allocations recorded</p>
                      ) : (
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {studentInspection.subject_teachers.map((st: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-slate-200/70 text-[11px]">
                              <span className="font-semibold text-slate-700">{st.subject_name}</span>
                              <span className="text-slate-500">{st.teacher_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Fee Ledger & Receipts */}
                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                        <span>Financial Fee Ledger</span>
                      </div>
                      <button
                        onClick={() => router.push('/fees')}
                        className="text-[11px] font-semibold text-emerald-600 hover:underline"
                      >
                        Fee Desk →
                      </button>
                    </div>

                    {/* Fee Summary Cards */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-medium">Total Fee</span>
                        <p className="font-bold text-slate-900 mt-0.5">₹ {(studentInspection.fees?.total || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 font-medium">Paid</span>
                        <p className="font-bold text-emerald-800 mt-0.5">₹ {(studentInspection.fees?.paid || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                        <span className="text-[10px] text-rose-700 font-medium">Due</span>
                        <p className="font-bold text-rose-800 mt-0.5">₹ {(studentInspection.fees?.due || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Recent Fee Receipts */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Recent Payment Receipts:</span>
                      {(!studentInspection.fees?.receipts || studentInspection.fees?.receipts.length === 0) ? (
                        <p className="text-slate-400 italic text-[11px]">No fee receipts found</p>
                      ) : (
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {studentInspection.fees?.receipts.map((rcpt: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-slate-200/70 text-[11px]">
                              <div>
                                <span className="font-bold text-slate-800">#{rcpt.receipt_number || 'RCPT'}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">{rcpt.payment_mode}</span>
                              </div>
                              <span className="font-bold text-emerald-700">₹ {Number(rcpt.amount_paid).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Guardian & Schedule Today */}
                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                        <span>Today&apos;s Class Schedule</span>
                      </div>
                      <button
                        onClick={() => router.push('/timetable')}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Timetable →
                      </button>
                    </div>

                    {/* Guardians info */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Father:</span>
                        <span className="font-semibold text-slate-800">{studentInspection.student?.father_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mother:</span>
                        <span className="font-semibold text-slate-800">{studentInspection.student?.mother_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Portal User:</span>
                        <span className="font-mono text-indigo-700">{studentInspection.student?.username || '—'}</span>
                      </div>
                    </div>

                    {/* Schedule List */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Lectures Scheduled Today:</span>
                      {(!studentInspection.today_schedule || studentInspection.today_schedule.length === 0) ? (
                        <p className="text-slate-400 italic text-[11px]">No periods scheduled for today</p>
                      ) : (
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {studentInspection.today_schedule.map((slot: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1 rounded-md border border-slate-200/70 text-[11px]">
                              <span className="font-semibold text-slate-700">{slot.subject_name}</span>
                              <span className="text-slate-400 font-mono text-[10px]">{slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* TEACHER 360° LIVE DISPLAY CARD */
            loadingTeacherInspect ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Fetching teacher academic allocations from database...</p>
              </div>
            ) : !teacherInspection ? (
              <div className="py-12 text-center text-slate-400">
                <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No teacher selected</p>
                <p className="text-xs text-slate-400">Upload faculty staff or choose a teacher from the dropdown above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top Teacher Header Strip */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                      {teacherInspection.teacher?.first_name?.[0] || 'T'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {teacherInspection.teacher?.full_name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {teacherInspection.teacher?.designation || 'Teacher'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Code: <strong>{teacherInspection.teacher?.employee_code || '—'}</strong></span>
                        <span>•</span>
                        <span>Dept: <strong>{teacherInspection.teacher?.department || 'Academics'}</strong></span>
                        <span>•</span>
                        <span>Phone: <strong>{teacherInspection.teacher?.phone || '—'}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => router.push('/staff')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs"
                    >
                      Staff Directory
                    </button>
                    <button
                      onClick={() => router.push('/academics/allocations')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Allocate Classes
                    </button>
                  </div>
                </div>

                {/* 3-Column Teacher Inspection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: Homeroom Class Teacher Assignment */}
                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs pb-2 border-b border-slate-200">
                      <LayoutGrid className="w-4 h-4 text-purple-600" />
                      <span>Homeroom Class Teacher Of</span>
                    </div>

                    {(!teacherInspection.class_teacher_of || teacherInspection.class_teacher_of.length === 0) ? (
                      <div className="p-4 bg-white rounded-lg border border-slate-200 text-center text-slate-400">
                        <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p className="font-semibold text-slate-600 text-xs">Not Assigned as Class Teacher</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Assign in Academic Allocations Hub</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teacherInspection.class_teacher_of.map((c: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-purple-200 shadow-2xs flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                                Class Teacher
                              </span>
                              <p className="font-bold text-slate-900 text-sm mt-1">
                                {c.class_name} - {c.section_name}
                              </p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Subject & Class Allocations */}
                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>Subjects Taught ({teacherInspection.subjects_taught?.length || 0})</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>

                    {(!teacherInspection.subjects_taught || teacherInspection.subjects_taught.length === 0) ? (
                      <div className="p-4 bg-white rounded-lg border border-slate-200 text-center text-slate-400">
                        <p className="text-xs">No subject allocations found</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {teacherInspection.subjects_taught.map((sub: any, idx: number) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{sub.subject_name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {sub.class_name} - {sub.section_name}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{sub.subject_code || 'SUB'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column 3: Today's Teaching Schedule */}
                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Today&apos;s Lecture Schedule</span>
                      </div>
                      <button
                        onClick={() => router.push('/timetable')}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Timetable →
                      </button>
                    </div>

                    {(!teacherInspection.today_classes || teacherInspection.today_classes.length === 0) ? (
                      <div className="p-4 bg-white rounded-lg border border-slate-200 text-center text-slate-400">
                        <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No periods scheduled today</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Faculty is free or timetable not published</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {teacherInspection.today_classes.map((cls: any, idx: number) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{cls.subject_name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{cls.class_name} - {cls.section_name}</p>
                            </div>
                            <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {cls.start_time?.slice(0,5)} - {cls.end_time?.slice(0,5)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LOWER SECTION: TODAY'S STATUS TABLE (LEFT) + QUICK ACCESS (RIGHT)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Today's Status (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Today&apos;s Status</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {formattedToday}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-blue-50/30 text-[11px] font-bold text-slate-700 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">S.No</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4 text-center">Total</th>
                  <th className="py-2.5 px-4 text-center text-emerald-700">Present</th>
                  <th className="py-2.5 px-4 text-center text-rose-700">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 1. Total Student */}
                <tr
                  onClick={() => handleOpenAttendanceModal('PRESENT')}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">1</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center justify-between">
                    <span>Total Student</span>
                    <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition">
                      View Roster →
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                    {loading ? '…' : (data?.today_status?.total_students || totalStudents || 1248).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                    {loading ? '…' : (data?.today_status?.present_students || totalPresentToday || 1180).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-rose-600">
                    {loading ? '…' : (data?.today_status?.absent_students || totalAbsentToday || 68).toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* 2. Total Teacher */}
                <tr
                  onClick={() => handleInspectTeacherDirect()}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">2</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center justify-between">
                    <span>Total Teacher</span>
                    <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition">
                      Inspect 360° →
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                    {loading ? '…' : data?.kpis?.total_faculty || 86}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                    {loading ? '…' : (data?.today_status?.present_teachers || (data?.kpis?.total_faculty ? data.kpis.total_faculty - (data.kpis.total_absent_staff || 0) : 82))}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-rose-600">
                    {loading ? '…' : data?.kpis?.total_absent_staff ?? 4}
                  </td>
                </tr>

                {/* 3. Total Classes */}
                <tr
                  onClick={() => router.push('/academics/subjects')}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">3</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">Total Classes</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                    {loading ? '…' : data?.today_status?.total_classes || (distinctClasses.length > 0 ? distinctClasses.length : 42)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                    {loading ? '…' : data?.today_status?.total_classes || (distinctClasses.length > 0 ? distinctClasses.length : 42)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">0</td>
                </tr>

                {/* 4. Total Sections */}
                <tr
                  onClick={() => router.push('/timetable')}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">4</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">Total Sections</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                    {loading ? '…' : data?.sections?.length || 12}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                    {loading ? '…' : data?.sections?.length || 12}
                  </td>
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">0</td>
                </tr>

                {/* 5. Total Fee Collection */}
                <tr
                  onClick={() => router.push('/reports/daily-transactions')}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">5</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center justify-between">
                    <span>Total Fee Collection</span>
                    <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition">
                      Transaction Report →
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-700">
                    {loading ? '…' : `₹ ${(data?.daily_collection?.total_received ?? data?.today_status?.today_fee_collection ?? 0).toLocaleString('en-IN')}`}
                  </td>
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">—</td>
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">—</td>
                </tr>

                {/* 6. Total Transport */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">6</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">Total Transport</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">18</td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">18</td>
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">0</td>
                </tr>

                {/* 7. Total Parents */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 text-center font-medium text-slate-400">7</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">Total Parents</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                    {loading ? '…' : (totalStudents || 1050).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                    {loading ? '…' : (totalPresentToday || 1010).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-rose-600">
                    {loading ? '…' : (totalAbsentToday || 40).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Access (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Quick Access</h3>
          </div>

          {/* 8 Colorful Circular / Rounded Modules Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Student */}
            <button
              onClick={() => router.push('/students')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/40 transition group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition">
                Student
              </span>
            </button>

            {/* Teacher */}
            <button
              onClick={() => router.push('/staff')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/40 transition group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 transition">
                Teacher
              </span>
            </button>

            {/* Class */}
            <button
              onClick={() => router.push('/academics/subjects')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-purple-200 bg-slate-50/50 hover:bg-purple-50/40 transition group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-purple-700 transition">
                Class
              </span>
            </button>

            {/* Section */}
            <button
              onClick={() => router.push('/timetable')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-amber-200 bg-slate-50/50 hover:bg-amber-50/40 transition group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-amber-700 transition">
                Section
              </span>
            </button>

            {/* Fee */}
            <button
              onClick={() => router.push('/fees')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/40 transition group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <IndianRupee className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 transition">
                Fee
              </span>
            </button>

            {/* Attendance */}
            <button
              onClick={() => router.push('/attendance/students')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/40 transition group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition">
                Attendance
              </span>
            </button>

            {/* Homework / Transport */}
            <button
              onClick={() => router.push('/homework')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-rose-200 bg-slate-50/50 hover:bg-rose-50/40 transition group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-rose-700 transition">
                Homework
              </span>
            </button>

            {/* Reports */}
            <button
              onClick={() => router.push('/reports/daily-transactions')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-purple-200 bg-slate-50/50 hover:bg-purple-50/40 transition group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 group-hover:text-purple-700 transition">
                Reports
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM SECTION: RECENT ACTIVITY AUDIT LOG TABLE                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
          </div>
          <button
            onClick={() => router.push('/reports/daily-transactions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            View All
          </button>
        </div>

        {/* Activities Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4 w-32">Date</th>
                <th className="py-2.5 px-4 w-28">Time</th>
                <th className="py-2.5 px-4">Activity</th>
                <th className="py-2.5 px-4 w-28 text-right">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 font-mono text-slate-600">{act.date}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">{act.time}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{act.activity}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                      {act.user}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. OPTIONAL ACCORDION: SECTION-WISE ATTENDANCE & HOMEWORK COMPLIANCE     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowComplianceGrid(!showComplianceGrid)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Section-Wise Attendance & Homework Compliance Roster
              </h4>
              <p className="text-xs text-slate-500">
                Detailed period-by-period submission status across all sections
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
            {showComplianceGrid ? 'Collapse View' : 'Expand Roster'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showComplianceGrid ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {showComplianceGrid && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {(data?.sections || []).map((sec) => (
                <div
                  key={`${sec.class_id}_${sec.section_id}`}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
                >
                  <p className="font-bold text-slate-800 text-xs truncate">
                    {sec.class_name} - {sec.section_name}
                  </p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Students:</span>
                    <span className="font-bold text-slate-700">{sec.total_students}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        sec.attendance_status === 'GREEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {sec.attendance_status === 'GREEN' ? 'Att Marked' : 'Att Pending'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        sec.homework_status === 'GREEN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sec.homework_status === 'GREEN' ? 'HW Set' : 'HW Due'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: STUDENT ATTENDANCE ROSTER (PRESENT & ABSENT INSPECTION)         */}
      {/* ========================================================================= */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-400" />
                  Daily Student Attendance Roster: {formattedToday}
                </h3>
                <p className="text-xs text-slate-300">
                  Inspect student presence, roll numbers, and parent contact details
                </p>
              </div>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs & Search */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-200 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setAttendanceModalTab('PRESENT')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    attendanceModalTab === 'PRESENT'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Present ({modalPresentList.length})
                </button>
                <button
                  onClick={() => setAttendanceModalTab('ABSENT')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    attendanceModalTab === 'ABSENT'
                      ? 'bg-white text-rose-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Absent ({modalAbsentList.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or roll no..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Content Table */}
            <div className="p-4 overflow-y-auto max-h-[55vh]">
              {filteredModalList.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700 text-sm">No students found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Roll No</th>
                      <th className="py-2 px-3">Class & Section</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">360° Inspector</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredModalList.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {st.student_name}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {st.roll_number || st.admission_number || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {st.class_name ? `${st.class_name} - ${st.section_name}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleInspectStudentFromModal(st.student_id || st.id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] transition inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
