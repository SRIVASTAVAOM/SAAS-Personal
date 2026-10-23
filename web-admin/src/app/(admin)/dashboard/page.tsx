'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  GraduationCap,
  UserCheck,
  IndianRupee,
  AlertTriangle,
  UserX,
  Clock,
  Cake,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  BookOpen,
  Check,
  X,
  Paperclip,
  LayoutGrid,
  ClipboardList,
  Banknote,
  CreditCard,
  Smartphone,
  Landmark,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardSummaryResponse, SectionSummary, PendingLeaveSummary } from '@/lib/types';
import {
  AttendanceBarChart,
  CHART_COLORS,
  DonutChart,
  DonutSlice,
  EnrollmentBars,
} from '@/components/dashboard/DashboardCharts';

type Tone = 'indigo' | 'slate' | 'emerald' | 'amber' | 'rose' | 'purple';

// Literal class names so Tailwind generates them.
const TONE: Record<Tone, { top: string; left: string; icon: string; value: string }> = {
  indigo: { top: 'border-t-indigo-500', left: 'border-l-indigo-500', icon: 'bg-indigo-50 text-indigo-600', value: 'text-slate-900' },
  slate: { top: 'border-t-slate-400', left: 'border-l-slate-400', icon: 'bg-slate-100 text-slate-600', value: 'text-slate-900' },
  emerald: { top: 'border-t-emerald-500', left: 'border-l-emerald-500', icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-700' },
  amber: { top: 'border-t-amber-500', left: 'border-l-amber-500', icon: 'bg-amber-50 text-amber-600', value: 'text-slate-900' },
  rose: { top: 'border-t-rose-500', left: 'border-l-rose-500', icon: 'bg-rose-50 text-rose-600', value: 'text-rose-600' },
  purple: { top: 'border-t-purple-500', left: 'border-l-purple-500', icon: 'bg-purple-50 text-purple-600', value: 'text-purple-700' },
};

function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
  href,
  onClick,
}: {
  label: string;
  value: string;
  description: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  href?: string;
  onClick?: () => void;
}) {
  const router = useRouter();
  const t = TONE[tone];
  const isClickable = Boolean(href || onClick);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`bg-white p-5 rounded-xl border border-slate-200 border-t-4 ${t.top} shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
        isClickable ? 'cursor-pointer group' : ''
      }`}
      title={isClickable ? `View ${label}` : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">{label}</span>
          {isClickable && (
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 group-hover:bg-indigo-100 transition shrink-0">
              List <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.icon} ${isClickable ? 'group-hover:scale-105 transition-transform' : ''}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${t.value}`}>{value}</div>
      <div className="mt-1.5 text-xs text-slate-500">{description}</div>
    </div>
  );
}

function FeeRealizedCard({
  feeRealized,
  hasData,
  loading,
}: {
  feeRealized?: DashboardSummaryResponse['fee_realized'];
  hasData: boolean;
  loading: boolean;
}) {
  const router = useRouter();
  const total = feeRealized?.total ?? 0;
  const byMode = feeRealized?.by_mode ?? { cash: 0, online: 0, app_payments: 0, cheques: 0 };

  const handleCardClick = () => {
    router.push('/reports/daily-transactions');
  };

  const handleModeClick = (e: React.MouseEvent, mode: string) => {
    e.stopPropagation();
    router.push(`/reports/daily-transactions?mode=${encodeURIComponent(mode)}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-amber-500 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      title="Click to view Daily Transaction Report"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Fee Realized (M-T-D)
            </span>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 group-hover:bg-amber-100 transition">
              Report <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-900">
          {loading ? '…' : hasData ? `₹${total.toLocaleString('en-IN')}` : '—'}
        </div>
      </div>

      {/* Payment Modes Grid (Cash, Online, App Payments, Cheques) */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={(e) => handleModeClick(e, 'CASH')}
          className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100 transition text-left cursor-pointer"
          title="Filter by Cash in Daily Transaction Report"
        >
          <div className="flex items-center gap-1 min-w-0">
            <Banknote className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="text-[10px] font-semibold text-emerald-800 truncate">Cash</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 tabular-nums ml-1">
            ₹{byMode.cash.toLocaleString('en-IN')}
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => handleModeClick(e, 'ONLINE')}
          className="flex items-center justify-between p-1.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/80 border border-blue-100 transition text-left cursor-pointer"
          title="Filter by Online in Daily Transaction Report"
        >
          <div className="flex items-center gap-1 min-w-0">
            <CreditCard className="w-3 h-3 text-blue-600 shrink-0" />
            <span className="text-[10px] font-semibold text-blue-800 truncate">Online</span>
          </div>
          <span className="text-[11px] font-bold text-blue-700 tabular-nums ml-1">
            ₹{byMode.online.toLocaleString('en-IN')}
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => handleModeClick(e, 'APP_PAYMENTS')}
          className="flex items-center justify-between p-1.5 rounded-lg bg-purple-50/70 hover:bg-purple-100/80 border border-purple-100 transition text-left cursor-pointer"
          title="Filter by App Payments in Daily Transaction Report"
        >
          <div className="flex items-center gap-1 min-w-0">
            <Smartphone className="w-3 h-3 text-purple-600 shrink-0" />
            <span className="text-[10px] font-semibold text-purple-800 truncate">App</span>
          </div>
          <span className="text-[11px] font-bold text-purple-700 tabular-nums ml-1">
            ₹{byMode.app_payments.toLocaleString('en-IN')}
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => handleModeClick(e, 'CHEQUES')}
          className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/70 hover:bg-amber-100/80 border border-amber-100 transition text-left cursor-pointer"
          title="Filter by Cheques in Daily Transaction Report"
        >
          <div className="flex items-center gap-1 min-w-0">
            <Landmark className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="text-[10px] font-semibold text-amber-800 truncate">Cheques</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700 tabular-nums ml-1">
            ₹{byMode.cheques.toLocaleString('en-IN')}
          </span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-indigo-600 transition font-medium">
        <span>Daily Transaction Register</span>
        <span className="flex items-center gap-0.5">
          View Details →
        </span>
      </div>
    </div>
  );
}

function DailyStudentOverviewCard({
  totalPresent,
  totalAbsent,
  attendanceRatio,
  hasData,
  loading,
  onOpenModal,
}: {
  totalPresent: number;
  totalAbsent: number;
  attendanceRatio: number | null;
  hasData: boolean;
  loading: boolean;
  onOpenModal: (initialTab: 'PRESENT' | 'ABSENT') => void;
}) {
  return (
    <div
      onClick={() => onOpenModal('PRESENT')}
      className="group bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-emerald-500 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      title="Click to view Present and Absent student lists"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
              Daily Student Overview
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 group-hover:bg-emerald-100 transition shrink-0">
              List <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight tabular-nums text-emerald-700">
            {loading ? '…' : hasData ? totalPresent.toLocaleString('en-IN') : '—'}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            present ({attendanceRatio !== null ? `${attendanceRatio}%` : '—'})
          </span>
        </div>
      </div>

      {/* Present & Absent Quick Chips */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal('PRESENT');
          }}
          className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100 transition text-left cursor-pointer"
          title="View Present Students List"
        >
          <div className="flex items-center gap-1 min-w-0">
            <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="text-[10px] font-semibold text-emerald-800 truncate">Present</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 tabular-nums ml-1">
            {totalPresent}
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal('ABSENT');
          }}
          className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100 transition text-left cursor-pointer"
          title="View Absent Students List"
        >
          <div className="flex items-center gap-1 min-w-0">
            <UserX className="w-3 h-3 text-rose-600 shrink-0" />
            <span className="text-[10px] font-semibold text-rose-800 truncate">Absent</span>
          </div>
          <span className="text-[11px] font-bold text-rose-700 tabular-nums ml-1">
            {totalAbsent}
          </span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-emerald-700 transition font-medium">
        <span>Check Roster Status</span>
        <span className="flex items-center gap-0.5">
          View Details →
        </span>
      </div>
    </div>
  );
}

function CounterCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  valueClass,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  valueClass?: string;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  const isClickable = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      className={`bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 ${t.left} shadow-2xs flex items-center gap-3 hover:shadow-md transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:-translate-y-0.5 group' : ''
      }`}
      title={isClickable ? `Click to view details` : undefined}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.icon} ${isClickable ? 'group-hover:scale-105 transition-transform' : ''}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate">{label}</div>
        <div className={`text-lg font-bold tabular-nums leading-tight ${valueClass ?? t.value}`}>{value}</div>
        <div className="text-[11px] text-slate-500 truncate">{hint}</div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  className = '',
  legend,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
      {legend && <div className="mt-4 pt-3 border-t border-slate-100">{legend}</div>}
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
      <span>{label}</span>
      {value !== undefined && <span className="font-semibold text-slate-900 tabular-nums">{value}</span>}
    </span>
  );
}

function ChartSkeleton() {
  return <div className="h-56 rounded-lg bg-slate-100 animate-pulse" />;
}

function formatDashboardDate(value?: string) {
  if (!value) return null;
  // Date-only strings are read as local dates so they do not shift a day.
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ATT_PENDING' | 'HW_PENDING' | 'COMPLETED'>('ALL');
  const [activeTab, setActiveTab] = useState<'SECTIONS' | 'LEAVES' | 'BIRTHDAYS'>('SECTIONS');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Attendance inspection modal state
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceModalTab, setAttendanceModalTab] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [attendanceSearch, setAttendanceSearch] = useState('');

  const handleLeaveAction = async (
    leave: PendingLeaveSummary,
    action: 'APPROVED' | 'REJECTED'
  ) => {
    setActionLoadingId(leave.id);
    try {
      if (leave.applicant_type === 'STAFF') {
        await api.leaves.decideStaffLeave(leave.id, action);
      } else {
        await api.leaves.updateStudentLeaveStatus(leave.id, action);
      }
      setActionMessage(`Leave application ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully.`);
      setTimeout(() => setActionMessage(null), 4000);
      await fetchSummary();
    } catch (err: any) {
      alert(err.message || `Failed to process leave action`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await api.admin.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Compute metrics
  const totalStudents = useMemo(() => {
    if (!data?.sections) return 0;
    return data.sections.reduce((acc, s) => acc + (s.total_students || 0), 0);
  }, [data]);

  const totalPresentToday = useMemo(() => {
    if (!data?.sections) return 0;
    return data.sections.reduce((acc, s) => acc + (s.present_count || 0), 0);
  }, [data]);

  const totalAbsentMarked = useMemo(() => {
    if (!data?.sections) return 0;
    return data.sections.reduce((acc, s) => acc + (s.absent_count || 0), 0);
  }, [data]);

  const filteredSections = useMemo(() => {
    if (!data?.sections) return [];
    return data.sections.filter((s) => {
      const matchSearch =
        `${s.class_name} ${s.section_name}`.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (filterType === 'ATT_PENDING') return s.attendance_status === 'RED';
      if (filterType === 'HW_PENDING') return s.homework_status === 'RED';
      if (filterType === 'COMPLETED')
        return s.attendance_status === 'GREEN' && s.homework_status === 'GREEN';
      return true;
    });
  }, [data, searchQuery, filterType]);

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

  // Values shown when the summary is not loaded: a dash, or an ellipsis while loading.
  const hasData = data !== null;
  const dash = loading ? '…' : '—';
  const absentStudents = data?.kpis.total_absent_students ?? 0;
  const attendanceRatio =
    totalStudents > 0 ? Math.round(((totalStudents - absentStudents) / totalStudents) * 100) : null;

  // Today's split, built from the same per-section counts as the grid.
  const notMarkedStudents = Math.max(0, totalStudents - totalPresentToday - totalAbsentMarked);
  const presentPct = totalStudents > 0 ? Math.round((totalPresentToday / totalStudents) * 100) : 0;
  const attendanceSlices: DonutSlice[] = [
    { label: 'Present', value: totalPresentToday, color: CHART_COLORS.present },
    { label: 'Absent', value: totalAbsentMarked, color: CHART_COLORS.absent },
    { label: 'Not marked', value: notMarkedStudents, color: CHART_COLORS.notMarked },
  ];

  const sections: SectionSummary[] = data?.sections ?? [];
  const attendanceDate = formatDashboardDate(data?.date);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
            {attendanceDate ?? 'Today'}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 tracking-tight">
            Institutional Command Center
          </h2>
          <p className="text-sm text-slate-500">
            Daily real-time attendance compliance, homework submissions, and operational KPIs.
          </p>
        </div>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: primary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Enrolled"
          value={hasData ? totalStudents.toLocaleString('en-IN') : dash}
          description={
            <>
              <span className="font-semibold text-emerald-600">Active roster</span> across {sections.length} sections
            </>
          }
          icon={GraduationCap}
          tone="indigo"
          href="/students"
        />
        <KpiCard
          label="Total Faculty"
          value={hasData && data?.kpis?.total_faculty !== undefined ? data.kpis.total_faculty.toLocaleString('en-IN') : dash}
          description={
            <>
              <span className="font-semibold text-slate-700">Teaching & admin</span> staff
            </>
          }
          icon={Users}
          tone="slate"
          href="/staff"
        />
        <DailyStudentOverviewCard
          totalPresent={totalPresentToday}
          totalAbsent={absentStudents}
          attendanceRatio={attendanceRatio}
          hasData={hasData}
          loading={loading}
          onOpenModal={(tab) => {
            setAttendanceModalTab(tab);
            setAttendanceModalOpen(true);
          }}
        />
        <FeeRealizedCard
          feeRealized={data?.fee_realized}
          hasData={hasData}
          loading={loading}
        />
      </div>

      {/* Row 2: compact operational counters */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <CounterCard
          label="Absent Staff"
          value={hasData ? String(data?.kpis.total_absent_staff ?? 0) : dash}
          hint="Staff marked absent today"
          icon={UserX}
          tone="rose"
          valueClass="text-rose-600"
        />
        <CounterCard
          label="Absent Students"
          value={hasData ? String(absentStudents) : dash}
          hint="Students marked absent today"
          icon={UserX}
          tone="amber"
          onClick={() => {
            setAttendanceModalTab('ABSENT');
            setAttendanceModalOpen(true);
          }}
        />
        <CounterCard
          label="Pending Leaves"
          value={hasData ? String(data?.kpis.pending_leaves_count ?? 0) : dash}
          hint="Awaiting a decision"
          icon={Clock}
          tone="indigo"
          valueClass="text-indigo-700"
        />
        <CounterCard
          label="Today's Birthdays"
          value={hasData ? String(data?.kpis.today_birthdays_count ?? 0) : dash}
          hint="Staff and students"
          icon={Cake}
          tone="purple"
        />
      </div>

      {/* Row 3: attendance chart (2/3) and today's split donut (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard
          title="Student Attendance"
          subtitle={`Present and absent students per section${attendanceDate ? `, ${attendanceDate}` : ''}`}
          icon={UserCheck}
          className="xl:col-span-2"
          legend={
            <div className="flex flex-wrap items-center gap-4">
              <LegendItem color={CHART_COLORS.present} label="Present" value={hasData ? String(totalPresentToday) : undefined} />
              <LegendItem color={CHART_COLORS.absent} label="Absent" value={hasData ? String(totalAbsentMarked) : undefined} />
              <LegendItem color={CHART_COLORS.notMarked} label="Not marked" value={hasData ? String(notMarkedStudents) : undefined} />
            </div>
          }
        >
          {loading && !hasData ? (
            <ChartSkeleton />
          ) : !hasData ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400 text-center px-6">
              {error ? 'Attendance data is unavailable right now. Use Refresh Data to try again.' : 'No data yet.'}
            </div>
          ) : sections.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              No sections are set up for attendance yet.
            </div>
          ) : (
            <AttendanceBarChart sections={sections} />
          )}
        </ChartCard>

        <ChartCard
          title="Today's Split"
          subtitle="Students by attendance status"
          icon={CheckCircle}
        >
          {loading && !hasData ? (
            <ChartSkeleton />
          ) : !hasData || totalStudents === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400 text-center px-6">
              {hasData ? 'No enrolled students in the current sections.' : 'Split is unavailable right now.'}
            </div>
          ) : (
            <div className="space-y-4">
              <DonutChart
                slices={attendanceSlices}
                centerValue={`${presentPct}%`}
                centerLabel="present"
              />
              <div className="space-y-2">
                {attendanceSlices.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <LegendItem color={s.color} label={s.label} />
                    <span className="tabular-nums text-slate-700">
                      <span className="font-semibold text-slate-900">{s.value}</span>
                      <span className="text-slate-400 ml-1.5">
                        {Math.round((s.value / totalStudents) * 100)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 4: enrolment by section (1/3) and operational panels (2/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <ChartCard
          title="Enrolment by Section"
          subtitle={hasData ? `${sections.length} sections · ${totalStudents.toLocaleString('en-IN')} students` : 'Students per section'}
          icon={GraduationCap}
        >
          {loading && !hasData ? (
            <ChartSkeleton />
          ) : !hasData || sections.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400 text-center px-6">
              {hasData ? 'No sections to show.' : 'Enrolment is unavailable right now.'}
            </div>
          ) : (
            <EnrollmentBars sections={sections} />
          )}
        </ChartCard>

        {/* Operational panels: Live Section Grid, Pending Leaves, Today's Birthdays */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100">
              <button
                onClick={() => setActiveTab('SECTIONS')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'SECTIONS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Live Section Grid ({data?.sections?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('LEAVES')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'LEAVES'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Pending Leaves ({data?.pending_leaves?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('BIRTHDAYS')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'BIRTHDAYS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Cake className="w-3.5 h-3.5" />
                Today's Birthdays ({data?.today_birthdays?.length || 0})
              </button>
            </div>

            {activeTab === 'SECTIONS' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter section..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:border-indigo-500 outline-none w-36 sm:w-48 text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="py-1.5 px-2 text-xs rounded-md border border-slate-200 text-slate-700 bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="ALL">All Sections</option>
                  <option value="ATT_PENDING">Attendance Pending (Red)</option>
                  <option value="HW_PENDING">Homework Pending (Red)</option>
                  <option value="COMPLETED">Fully Compliant (Green)</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: LIVE SECTION STATUS GRID */}
          {activeTab === 'SECTIONS' && (
            <div className="p-5">
              {loading && !hasData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-36 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filteredSections.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {hasData ? 'No sections matched the current filter criteria.' : error ?? 'No section data yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredSections.map((sec) => {
                    const isAttGreen = sec.attendance_status === 'GREEN';
                    const isHwGreen = sec.homework_status === 'GREEN';
                    const markedPct =
                      sec.total_students > 0 ? Math.round((sec.present_count / sec.total_students) * 100) : 0;

                    return (
                      <div
                        key={`${sec.class_id}_${sec.section_id}`}
                        className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5"
                      >
                        {/* Section Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-sm truncate">
                                {sec.class_name} · Sec {sec.section_name}
                              </div>
                              <div className="text-[11px] text-slate-500">{sec.total_students} Enrolled Students</div>
                            </div>
                          </div>
                        </div>

                        {/* Attendance progress (present out of enrolled) */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>Present today</span>
                            <span className="font-semibold text-slate-700 tabular-nums">{markedPct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, markedPct)}%` }}
                            />
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-100">
                          {/* Attendance Pill */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 text-[11px] font-medium">Attendance:</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isAttGreen
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isAttGreen ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Marked ({sec.present_count}P / {sec.absent_count}A)</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Unmarked</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Homework Pill */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 text-[11px] font-medium">Homework:</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isHwGreen
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isHwGreen ? (
                                <>
                                  <BookOpen className="w-3 h-3 text-emerald-600" />
                                  <span>{sec.homework_count} Task{sec.homework_count > 1 ? 's' : ''} Posted</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Pending</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PENDING LEAVES TABLE */}
          {activeTab === 'LEAVES' && (
            <div className="overflow-x-auto">
              {actionMessage && (
                <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <span className="font-medium">{actionMessage}</span>
                  <button
                    onClick={() => setActionMessage(null)}
                    className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!data?.pending_leaves || data.pending_leaves.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No pending leave requests at this time.
                      </td>
                    </tr>
                  ) : (
                    data.pending_leaves.map((leave) => {
                      const isProcessing = actionLoadingId === leave.id;
                      return (
                        <tr key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">
                            {leave.applicant_name}
                            <div className="text-[10px] font-normal text-slate-500">{leave.detail}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {leave.applicant_type} · {leave.leave_type || 'CASUAL'}
                            </span>
                          </td>
                          <td className="px-5 py-3 tabular-nums">
                            {leave.start_date} to {leave.end_date}
                          </td>
                          <td className="px-5 py-3 max-w-xs truncate text-slate-600">{leave.reason}</td>
                          <td className="px-5 py-3">
                            {leave.document_url ? (
                              <a
                                href={leave.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>View Doc</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              PENDING
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleLeaveAction(leave, 'APPROVED')}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                                title="Approve leave application"
                              >
                                <Check className="w-3 h-3" />
                                <span>{isProcessing ? 'Saving...' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => handleLeaveAction(leave, 'REJECTED')}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                                title="Reject leave application"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: TODAY'S BIRTHDAYS TABLE */}
          {activeTab === 'BIRTHDAYS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Affiliation / Class</th>
                    <th className="px-5 py-3">Date of Birth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!data?.today_birthdays || data.today_birthdays.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No staff or student birthdays recorded for today.
                      </td>
                    </tr>
                  ) : (
                    data.today_birthdays.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900 flex items-center gap-2">
                          <Cake className="w-3.5 h-3.5 text-purple-600" />
                          {b.name}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                            {b.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{b.detail}</td>
                        <td className="px-5 py-3 tabular-nums text-slate-500">{b.date_of_birth}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Daily Student Overview - Attendance Modal */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Daily Student Overview</h3>
                  <p className="text-xs text-slate-500">
                    Live attendance compliance & roster records for today ({attendanceDate || 'Today'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAttendanceModalTab('PRESENT')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    attendanceModalTab === 'PRESENT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Present Students ({modalPresentList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceModalTab('ABSENT')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    attendanceModalTab === 'ABSENT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Absent Students ({modalAbsentList.length})</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  placeholder="Filter student or roll..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
                />
              </div>
            </div>

            {/* Table of Present or Absent Students */}
            <div className="overflow-y-auto flex-1 min-h-[220px] rounded-xl border border-slate-200">
              {filteredModalList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-700">
                    No students found in {attendanceModalTab === 'PRESENT' ? 'Present' : 'Absent'} list.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {attendanceSearch ? 'Try a different search query' : 'Attendance might not be marked for this category yet.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                      <th className="p-3 pl-4">Roll #</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Class & Section</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredModalList.map((st, idx) => (
                      <tr key={st.id || idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 pl-4 font-mono font-medium text-slate-700">
                          {st.roll_number || '—'}
                          <span className="block text-[10px] text-slate-400">
                            {st.admission_number || ''}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {st.student_name}
                        </td>
                        <td className="p-3 text-slate-600">
                          {st.class_name ? `Class ${st.class_name} (${st.section_name || ''})` : '—'}
                        </td>
                        <td className="p-3">
                          {st.status === 'PRESENT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <UserX className="w-3 h-3" />
                              Absent
                            </span>
                          )}
                        </td>
                        <td className="p-3 pr-4 text-slate-500 italic text-[11px]">
                          {st.remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAttendanceModalOpen(false);
                  router.push('/attendance/students');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Class Attendance Register</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setAttendanceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer transition"
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
