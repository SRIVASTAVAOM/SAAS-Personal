'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  RefreshCw,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ClassItem } from '@/lib/types';

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'LOW_ATTENDANCE' | 'FEE_DUES'>('ALL');

  // Drawer / Modal for Student Details
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        api.admin.getStudents({
          class_id: selectedClassId || undefined,
          section_id: selectedSectionId || undefined,
          search: search || undefined,
        }),
        api.academics.getClasses().catch(() => []),
      ]);
      setStudents(studentsData || []);
      setClasses(classesData || []);
    } catch (err) {
      console.error('Failed to load students directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId, selectedSectionId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenDetails = async (studentId: string) => {
    try {
      setDetailLoading(true);
      const details = await api.admin.getStudentDetails(studentId);
      setSelectedStudent(details);
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.class_id === selectedClassId);

  // Quick filter logic
  const filteredStudents = students.filter((s) => {
    if (quickFilter === 'LOW_ATTENDANCE') {
      return Number(s.attendance_percentage || 0) < 75;
    }
    if (quickFilter === 'FEE_DUES') {
      return Number(s.total_fee_dues || 0) > Number(s.total_fee_paid || 0);
    }
    return true;
  });

  // Calculate Metrics
  const totalStudents = students.length;
  const avgAttendance =
    totalStudents > 0
      ? Math.round(
          students.reduce((acc, s) => acc + Number(s.attendance_percentage || 0), 0) /
            totalStudents
        )
      : 100;
  const totalDuesPending = students.reduce((acc, s) => {
    const due = Number(s.total_fee_dues || 0) - Number(s.total_fee_paid || 0);
    return due > 0 ? acc + due : acc;
  }, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <Users className="w-4 h-4" />
            Student Master Database
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Student Directory &amp; 360° Profiles
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete records, academic enrollment, real-time attendance tracking, and parent contact details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Directory"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Students</span>
            <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
            <span className="text-[11px] text-slate-400">Actively Enrolled</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Average Attendance</span>
            <div className="text-2xl font-bold text-slate-900">{avgAttendance}%</div>
            <span className="text-[11px] text-emerald-600 font-medium">Class Attendance Sync</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Fee Balance Dues</span>
            <div className="text-2xl font-bold text-slate-900">
              ₹{totalDuesPending.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">Pending Across School</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Select */}
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId('');
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.class_id} value={c.class_id}>
                Class {c.class_name}
              </option>
            ))}
          </select>

          {/* Section Select */}
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={!selectedClassId}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">All Sections</option>
            {selectedClass?.sections.map((s) => (
              <option key={s.id} value={s.id}>
                Section {s.name}
              </option>
            ))}
          </select>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setQuickFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                quickFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setQuickFilter('LOW_ATTENDANCE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                quickFilter === 'LOW_ATTENDANCE'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              &lt;75% Attendance
            </button>
            <button
              onClick={() => setQuickFilter('FEE_DUES')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                quickFilter === 'FEE_DUES'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fee Dues
            </button>
          </div>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 md:w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500">Loading student directory...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-medium">No students found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3.5 pl-6">Student</th>
                  <th className="p-3.5">Admission No</th>
                  <th className="p-3.5">Class &amp; Section</th>
                  <th className="p-3.5">Father / Guardian</th>
                  <th className="p-3.5">Emergency Contact</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Fee Status</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const att = Number(s.attendance_percentage || 0);
                  const feeDues = Number(s.total_fee_dues || 0) - Number(s.total_fee_paid || 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {s.first_name?.[0] || 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {s.full_name || `${s.first_name} ${s.last_name}`}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              User: {s.identifier}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-700 font-medium">
                        {s.admission_number}
                        {s.roll_number && (
                          <span className="text-[10px] text-slate-400 block font-sans">
                            Roll: {s.roll_number}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800">
                        {s.class_name ? `Class ${s.class_name} (${s.section_name})` : 'Unassigned'}
                      </td>

                      <td className="p-3.5 text-slate-600">{s.father_name || '—'}</td>

                      <td className="p-3.5 text-slate-600 font-mono">
                        {s.emergency_phone || s.phone || '—'}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            att >= 75
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : att >= 60
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {att}%
                        </span>
                      </td>

                      <td className="p-3.5">
                        {feeDues <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Paid Up
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                            Due ₹{feeDues.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 pr-6 text-right">
                        <button
                          onClick={() => handleOpenDetails(s.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 360-degree Student Details Slide-over Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg uppercase">
                  {selectedStudent.first_name?.[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Admission No: <span className="font-mono font-semibold">{selectedStudent.admission_number}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Academic Class &amp; Sec</span>
                <div className="font-bold text-slate-900 text-sm">
                  Class {selectedStudent.class_name} ({selectedStudent.section_name})
                </div>
                <div className="text-slate-500">Roll No: {selectedStudent.roll_number || 'N/A'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">App Login Username</span>
                <div className="font-mono font-bold text-indigo-700 text-sm">
                  {selectedStudent.identifier}
                </div>
                <div className="text-slate-500">
                  Status: {selectedStudent.is_active ? 'Active User' : 'Deactivated'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Father / Guardian</span>
                <div className="font-semibold text-slate-900">{selectedStudent.father_name || '—'}</div>
                <div className="text-slate-500">Mother: {selectedStudent.mother_name || '—'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Emergency Phone</span>
                <div className="font-mono font-semibold text-slate-900">
                  {selectedStudent.emergency_phone || selectedStudent.phone || '—'}
                </div>
                <div className="text-slate-500">Email: {selectedStudent.email || '—'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Date of Birth &amp; Gender</span>
                <div className="font-semibold text-slate-900">
                  {selectedStudent.date_of_birth || '—'}
                </div>
                <div className="text-slate-500">Gender: {selectedStudent.gender || '—'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Admission Date</span>
                <div className="font-semibold text-slate-900">
                  {selectedStudent.admission_date || '—'}
                </div>
                <div className="text-slate-500">ERP Enrolled</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
