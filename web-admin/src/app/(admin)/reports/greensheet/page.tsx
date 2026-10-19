'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
  Award,
  TrendingUp,
  RefreshCw,
  Search,
  Users,
  UserCheck,
  Percent,
  Gauge,
  TrendingDown,
  Activity,
  PieChart,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  GreensheetResponse,
  SectionSummary,
  ExamItem,
} from '@/lib/types';
import { DonutChart, DonutSlice } from '@/components/dashboard/DashboardCharts';
import { ColumnChart, ColumnItem } from '@/components/uploads/UploadCharts';

const STUDENT_PASS = '#22C55E';
const STUDENT_FAIL = '#F43F5E';
const STUDENT_INCOMPLETE = '#F59E0B';
const SUBJECT_PALETTE = ['#7560E8', '#3B82F6', '#22C55E', '#F59E0B', '#EC4899', '#A78BFA', '#14B8A6', '#F97316'];

// Accent colours for the summary cards. Literal class names so Tailwind generates them.
const STAT_TONE = {
  slate: { icon: 'bg-slate-100 text-slate-600', value: 'text-slate-900' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600', value: 'text-indigo-700' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-700' },
  rose: { icon: 'bg-rose-50 text-rose-600', value: 'text-rose-600' },
  amber: { icon: 'bg-amber-50 text-amber-600', value: 'text-slate-900' },
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof STAT_TONE;
}) {
  const t = STAT_TONE[tone];
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate">{label}</span>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.icon}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
      </div>
      <div className={`mt-2.5 text-2xl font-bold tabular-nums ${t.value}`}>{value}</div>
    </div>
  );
}

export default function GreensheetPage() {
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [greensheet, setGreensheet] = useState<GreensheetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  // 1. Initial Load: Sections & Exams
  useEffect(() => {
    const initLookups = async () => {
      try {
        const [dash, examList] = await Promise.all([
          api.admin.getDashboardSummary(),
          api.exams.list().catch(() => []),
        ]);

        if (dash.sections && dash.sections.length > 0) {
          setSections(dash.sections);
          setSelectedClassId(dash.sections[0].class_id);
          setSelectedSectionId(dash.sections[0].section_id);
        }
        setExams(examList);
        if (examList.length > 0) {
          setSelectedExamId(examList[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load lookups for greensheet:', err);
      }
    };
    initLookups();
  }, []);

  // 2. Fetch Greensheet Tabulation
  const fetchGreensheet = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getGreensheet(
        selectedClassId,
        selectedSectionId,
        selectedExamId || undefined
      );
      setGreensheet(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate greensheet marksheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      fetchGreensheet();
    }
  }, [selectedClassId, selectedSectionId, selectedExamId]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Chart data comes from the loaded greensheet, so it covers the whole class.
  // The table search does not change the charts.
  const studentChartItems: ColumnItem[] = (greensheet?.students ?? []).map((st) => {
    const color =
      st.result_status === 'PASS' ? STUDENT_PASS : st.result_status === 'FAIL' ? STUDENT_FAIL : STUDENT_INCOMPLETE;
    return {
      label: st.roll_number,
      tooltip: st.student_name,
      value: st.percentage,
      valueLabel: `${st.percentage}%`,
      color,
      rows: [
        { label: 'Grand total', value: `${st.total_marks_obtained} / ${st.total_max_marks}` },
        { label: 'Percentage', value: `${st.percentage}%` },
        { label: 'Result', value: st.result_status, color },
      ],
    };
  });

  const subjectChartItems: ColumnItem[] = (greensheet?.subjects ?? []).map((sub, i) => {
    const marks = (greensheet?.students ?? []).flatMap((st) =>
      st.subject_marks.filter((sm) => sm.subject_id === sub.subject_id)
    );
    // Absent students and entries without marks are left out of the average.
    const counted = marks.filter((sm) => !sm.is_absent && sm.marks_obtained !== null && sub.max_marks > 0);
    const average = counted.length
      ? (counted.reduce((acc, sm) => acc + (sm.marks_obtained as number) / sub.max_marks, 0) / counted.length) * 100
      : 0;
    return {
      label: sub.subject_code || sub.subject_name,
      tooltip: sub.subject_name,
      value: Math.round(average * 10) / 10,
      valueLabel: counted.length ? `${average.toFixed(1)}%` : '—',
      color: SUBJECT_PALETTE[i % SUBJECT_PALETTE.length],
      rows: [
        { label: 'Class average', value: counted.length ? `${average.toFixed(1)}%` : 'No marks yet' },
        { label: 'Students counted', value: `${counted.length}` },
        { label: 'Max marks', value: `${sub.max_marks}` },
      ],
    };
  });

  const passFailSlices: DonutSlice[] = [
    { label: 'Passed', value: greensheet?.statistics.total_passed ?? 0, color: STUDENT_PASS },
    { label: 'Failed', value: greensheet?.statistics.total_failed ?? 0, color: STUDENT_FAIL },
  ];

  const filteredStudents = greensheet?.students.filter((st) => {
    return (
      st.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.roll_number.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.admission_number.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Printable Official Header (Displayed only when printing) */}
      <div className="hidden print:block text-center pb-4 mb-4 border-b-2 border-slate-900">
        <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
          {greensheet?.school_name || 'Springfield International School'}
        </h1>
        <p className="text-xs text-slate-600 font-semibold tracking-wide">
          MASTER TABULATION REGISTER / GREENSHEET REPORT CARD · ACADEMIC YEAR {greensheet?.academic_year_name || '2025-2026'}
        </p>
        <p className="text-xs text-slate-700 mt-1">
          <span className="font-bold">{greensheet?.class_name} - Section {greensheet?.section_name}</span> · Examination: <span className="font-bold">{greensheet?.exam_name}</span>
        </p>
      </div>

      {/* Screen Control Panel */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Master Greensheet Tabulation Portal
              </h2>
              <p className="text-sm text-slate-500">
                Comprehensive official tabulation register across subjects, marks, percentages, and grade rankings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class & Section */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase">Class:</span>
              <select
                value={`${selectedClassId}_${selectedSectionId}`}
                onChange={(e) => {
                  const [c, s] = e.target.value.split('_');
                  setSelectedClassId(c);
                  setSelectedSectionId(s);
                }}
                className="py-1.5 px-2.5 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer transition-shadow"
              >
                {sections.map((s) => (
                  <option key={`${s.class_id}_${s.section_id}`} value={`${s.class_id}_${s.section_id}`}>
                    {s.class_name} · Sec {s.section_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Selector */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase">Exam:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="py-1.5 px-2.5 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer transition-shadow"
              >
                <option value="">Consolidated (All Exams)</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Print / Export PDF Action */}
            <button
              onClick={handlePrint}
              disabled={!greensheet || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Summary Statistics Banner (OEM Standard) */}
      {greensheet?.statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard label="Enrolled" value={greensheet.statistics.total_enrolled} icon={Users} tone="slate" />
          <StatCard label="Appeared" value={greensheet.statistics.total_appeared} icon={UserCheck} tone="slate" />
          <StatCard label="Passed" value={greensheet.statistics.total_passed} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Failed" value={greensheet.statistics.total_failed} icon={XCircle} tone="rose" />
          <StatCard label="Pass Rate" value={`${greensheet.statistics.pass_percentage}%`} icon={Percent} tone="indigo" />
          <StatCard
            label="Class Avg"
            value={`${greensheet.statistics.class_average_percentage}%`}
            icon={Gauge}
            tone="slate"
          />
          <StatCard
            label="Highest %"
            value={`${greensheet.statistics.highest_percentage}%`}
            icon={TrendingUp}
            tone="emerald"
          />
          <StatCard
            label="Lowest %"
            value={`${greensheet.statistics.lowest_percentage}%`}
            icon={TrendingDown}
            tone="amber"
          />
        </div>
      )}

      {/* Performance analytics: screen only, so the printed register stays unchanged */}
      {greensheet && greensheet.students.length > 0 && (
        <div className="no-print space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Student Performance Overview</span>
              </h3>
              <p className="text-xs text-slate-500">Percentage per student · green pass, rose fail · hover a bar for details</p>
            </div>
            <ColumnChart
              items={studentChartItems}
              height={200}
              fluid={false}
              minWidth={640}
              unitLabel="Percentage"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 hover:shadow-md transition-shadow duration-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Subject-wise Class Performance</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">Average percentage per subject, absent students excluded</p>
              {subjectChartItems.length > 0 ? (
                <ColumnChart
                  items={subjectChartItems}
                  height={200}
                  fluid={false}
                  minWidth={480}
                  unitLabel="Average"
                />
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                  No subjects in this exam.
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 hover:shadow-md transition-shadow duration-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Pass vs Fail</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">Students who appeared</p>
              <DonutChart
                slices={passFailSlices}
                centerValue={String(greensheet.statistics.total_appeared)}
                centerLabel="appeared"
                unitLabel="Students"
              />
              <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
                {passFailSlices.map((s) => {
                  const appeared = greensheet.statistics.total_appeared;
                  const pct = appeared > 0 ? Math.round((s.value / appeared) * 100) : 0;
                  return (
                    <div key={s.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                        {s.label}
                      </span>
                      <span className="tabular-nums">
                        <span className="font-semibold text-slate-900">{s.value}</span>
                        <span className="text-slate-400 ml-1.5">{pct}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabulation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden print-container">
        {/* Search header (no-print) */}
        <div className="no-print px-5 py-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">
            Student Marks Register <span className="text-slate-500 font-medium">({filteredStudents.length} Students)</span>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student name, roll number or admission number..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800 placeholder:text-slate-400 transition-shadow"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Computing master greensheet marksheet...
          </div>
        ) : !greensheet || greensheet.students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No student marksheet records found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* Primary Header */}
                <tr className="bg-slate-900 text-white divide-x divide-slate-800">
                  <th className="px-3 py-2.5 text-center w-14 font-bold text-[10px] uppercase">Roll</th>
                  <th className="px-3 py-2.5 text-center w-24 font-bold text-[10px] uppercase">Adm No</th>
                  <th className="px-4 py-2.5 font-bold text-xs uppercase min-w-[160px]">Student Name</th>
                  <th className="px-2 py-2.5 text-center w-10 font-bold text-[10px] uppercase">Gen</th>

                  {/* Subject Columns */}
                  {greensheet.subjects.map((sub) => (
                    <th key={sub.subject_id} className="px-3 py-2 text-center min-w-[90px]">
                      <div className="font-bold text-xs truncate">{sub.subject_code || sub.subject_name}</div>
                      <div className="text-[9px] text-slate-400 font-normal">
                        Max: {sub.max_marks} | Pass: {sub.passing_marks}
                      </div>
                    </th>
                  ))}

                  {/* Aggregates Header */}
                  <th className="px-3 py-2.5 text-center font-bold text-xs uppercase">Grand Total</th>
                  <th className="px-3 py-2.5 text-center font-bold text-xs uppercase">%</th>
                  <th className="px-2 py-2.5 text-center font-bold text-xs uppercase">Grd</th>
                  <th className="px-2 py-2.5 text-center font-bold text-xs uppercase">Rnk</th>
                  <th className="px-3 py-2.5 text-center font-bold text-xs uppercase">Result</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium text-xs">
                {filteredStudents.map((st) => {
                  const isPass = st.result_status === 'PASS';

                  return (
                    <tr
                      key={st.student_id}
                      className="divide-x divide-slate-100 hover:bg-indigo-50/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center tabular-nums font-bold text-slate-700 bg-slate-50/40">
                        {st.roll_number}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-slate-500 font-mono text-[11px]">
                        {st.admission_number}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {st.student_name}
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-500 text-[10px] uppercase">
                        {st.gender?.slice(0, 1) || 'M'}
                      </td>

                      {/* Subject Marks */}
                      {st.subject_marks.map((sm) => {
                        const isAbsent = sm.is_absent;
                        const isFail = sm.status === 'FAIL';

                        return (
                          <td
                            key={sm.subject_id}
                            className={`px-3 py-2.5 text-center tabular-nums ${
                              isAbsent
                                ? 'bg-amber-50/60 text-amber-700 font-bold'
                                : isFail
                                ? 'bg-rose-50/50 text-rose-700 font-bold'
                                : 'text-slate-900'
                            }`}
                          >
                            {isAbsent
                              ? 'AB'
                              : sm.marks_obtained !== null
                              ? sm.marks_obtained
                              : '-'}
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="px-3 py-2.5 text-center tabular-nums font-bold text-slate-900 bg-slate-50/40">
                        {st.total_marks_obtained}
                        <span className="text-[10px] text-slate-400 font-normal">
                          /{st.total_max_marks}
                        </span>
                      </td>

                      {/* Percentage */}
                      <td className="px-3 py-2.5 text-center tabular-nums font-bold text-slate-900">
                        {st.percentage}%
                      </td>

                      {/* Grade */}
                      <td className="px-2 py-2.5 text-center font-bold text-indigo-700">
                        {st.grade}
                      </td>

                      {/* Rank */}
                      <td className="px-2 py-2.5 text-center font-bold text-slate-700 tabular-nums">
                        #{st.rank}
                      </td>

                      {/* Result Status */}
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPass
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isPass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
