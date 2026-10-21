'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  Sparkles,
  Users,
  AlertCircle,
  Loader2,
  Clock,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

interface StaffAttendanceItem {
  staff_id: string;
  employee_code: string;
  staff_name: string;
  assignment_type: string | null;
  wing_id: string | null;
  wing_name: string | null;
  attendance_date: string;
  status: 'PRESENT' | 'ABSENT' | null;
  in_time: string | null;
  out_time: string | null;
  remarks: string | null;
}

export default function StaffAttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedWing, setSelectedWing] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<StaffAttendanceItem[]>([]);
  const [savedRecords, setSavedRecords] = useState<StaffAttendanceItem[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load staff attendance for the selected date
  useEffect(() => {
    async function loadStaffAttendance() {
      try {
        setLoading(true);
        setErrorMessage(null);
        setSaveSuccessMessage(null);

        const data = await api.attendance.getAllStaffAttendance(selectedDate);

        const normalized: StaffAttendanceItem[] = (data || []).map((row: any) => ({
          staff_id: row.staff_id,
          employee_code: row.employee_code || 'EMP-000',
          staff_name: row.staff_name || 'Staff Member',
          assignment_type: row.assignment_type || null,
          wing_id: row.wing_id || null,
          wing_name: row.wing_name || null,
          attendance_date: row.attendance_date || selectedDate,
          status: row.status as 'PRESENT' | 'ABSENT' | null,
          in_time: row.in_time || null,
          out_time: row.out_time || null,
          remarks: row.remarks || '',
        }));

        setRecords(normalized);
        setSavedRecords(normalized);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load staff attendance');
        setRecords([]);
        setSavedRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadStaffAttendance();
  }, [selectedDate]);

  // Extract unique wings for filtering
  const wingsList = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.wing_id && r.wing_name) {
        map.set(r.wing_id, r.wing_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [records]);

  // Status updates
  const setStaffStatus = (staffId: string, status: 'PRESENT' | 'ABSENT') => {
    setRecords((prev) =>
      prev.map((s) => {
        if (s.staff_id !== staffId) return s;
        return {
          ...s,
          status,
          in_time: status === 'PRESENT' && !s.in_time ? '08:00 AM' : s.in_time,
          out_time: status === 'PRESENT' && !s.out_time ? '03:30 PM' : s.out_time,
        };
      })
    );
  };

  const setStaffField = (
    staffId: string,
    field: 'in_time' | 'out_time' | 'remarks',
    value: string
  ) => {
    setRecords((prev) =>
      prev.map((s) => (s.staff_id === staffId ? { ...s, [field]: value } : s))
    );
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setRecords((prev) =>
      prev.map((s) => ({
        ...s,
        status,
        in_time: status === 'PRESENT' ? s.in_time || '08:00 AM' : null,
        out_time: status === 'PRESENT' ? s.out_time || '03:30 PM' : null,
      }))
    );
  };

  const autofillStandardHours = () => {
    setRecords((prev) =>
      prev.map((s) => {
        if (s.status === 'PRESENT' || !s.status) {
          return {
            ...s,
            status: 'PRESENT',
            in_time: '08:00 AM',
            out_time: '03:30 PM',
          };
        }
        return s;
      })
    );
  };

  const resetRecords = () => {
    setRecords(savedRecords);
    setSaveSuccessMessage(null);
  };

  // KPIs
  const totalStaff = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const unmarkedCount = records.filter((r) => !r.status).length;
  const attendanceRate = totalStaff > 0 ? Math.round((presentCount / totalStaff) * 100) : 0;

  // Filtered staff list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesWing = selectedWing === 'ALL' || r.wing_id === selectedWing;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        r.staff_name.toLowerCase().includes(q) ||
        r.employee_code.toLowerCase().includes(q) ||
        (r.wing_name && r.wing_name.toLowerCase().includes(q)) ||
        (r.assignment_type && r.assignment_type.toLowerCase().includes(q));

      return matchesWing && matchesSearch;
    });
  }, [records, selectedWing, searchQuery]);

  // Dirty check
  const isDirty = useMemo(() => {
    if (records.length !== savedRecords.length) return false;
    for (let i = 0; i < records.length; i++) {
      if (
        records[i].status !== savedRecords[i].status ||
        (records[i].in_time || '') !== (savedRecords[i].in_time || '') ||
        (records[i].out_time || '') !== (savedRecords[i].out_time || '') ||
        (records[i].remarks || '') !== (savedRecords[i].remarks || '')
      ) {
        return true;
      }
    }
    return false;
  }, [records, savedRecords]);

  // Save staff attendance
  const handleSaveAttendance = async () => {
    if (!selectedDate || records.length === 0) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccessMessage(null);

      const payloadRecords = records.map((r) => ({
        staffId: r.staff_id,
        status: (r.status || 'ABSENT') as 'PRESENT' | 'ABSENT',
        inTime: r.status === 'PRESENT' ? r.in_time || null : null,
        outTime: r.status === 'PRESENT' ? r.out_time || null : null,
        remarks: r.remarks && r.remarks.trim() ? r.remarks.trim() : null,
      }));

      await api.attendance.markStaffAttendance({
        attendance_date: selectedDate,
        records: payloadRecords,
      });

      const updated = records.map((r) => ({
        ...r,
        status: (r.status || 'ABSENT') as 'PRESENT' | 'ABSENT',
      }));
      setRecords(updated);
      setSavedRecords(updated);

      setSaveSuccessMessage(
        `Staff attendance saved for ${payloadRecords.length} staff member(s)! Records updated in real time.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save staff attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Menu 6 • Staff Attendance
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Real-time Payroll & App Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-indigo-400" />
            Staff & Faculty Attendance Register
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Check and edit staff daily punch-in, check-out, and attendance status for any date.
            All modifications instantly sync with teacher mobile apps and payroll ledger.
          </p>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              onClick={resetRecords}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-slate-300 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2 border border-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              Discard Edits
            </button>
          )}

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || records.length === 0}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg transition-all ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing Attendance...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isDirty ? 'Save & Sync Changes' : 'Save Attendance'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveSuccessMessage}</span>
        </div>
      )}

      {/* Control Bar: Date, Wing Filter, Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Attendance Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Wing Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            Wing / Department
          </label>
          <select
            value={selectedWing}
            onChange={(e) => setSelectedWing(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          >
            <option value="ALL">All Departments / Wings</option>
            {wingsList.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            Search Staff
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, employee code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Staff</p>
            <p className="text-xl font-bold text-slate-800">{totalStaff}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Present</p>
            <p className="text-xl font-bold text-emerald-700">
              {presentCount}{' '}
              <span className="text-xs font-normal text-emerald-600">
                ({attendanceRate}%)
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Absent</p>
            <p className="text-xl font-bold text-rose-700">{absentCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Unrecorded</p>
            <p className="text-xl font-bold text-amber-700">{unmarkedCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold">
            %
          </div>
          <div>
            <p className="text-xs text-indigo-100 font-medium">Presence Rate</p>
            <p className="text-xl font-bold">{attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Staff Roster Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">
              Staff Members Register
            </span>
            <span className="text-xs text-slate-500">
              ({filteredRecords.length} staff member{filteredRecords.length !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Quick Bulk Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('PRESENT')}
              disabled={loading || records.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark All Present
            </button>
            <button
              onClick={autofillStandardHours}
              disabled={loading || records.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" />
              Standard Hours (8AM-3:30PM)
            </button>
            <button
              onClick={() => markAll('ABSENT')}
              disabled={loading || records.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading staff attendance register...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No staff members found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? 'No staff match your search query.'
                : 'No staff profiles recorded in this school.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Emp Code</th>
                  <th className="py-3.5 px-4">Wing / Role</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-4">In Time</th>
                  <th className="py-3.5 px-4">Out Time</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((staff) => {
                  const isPresent = staff.status === 'PRESENT';
                  const isAbsent = staff.status === 'ABSENT';
                  const isUnmarked = !staff.status;

                  return (
                    <tr
                      key={staff.staff_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAbsent ? 'bg-rose-50/30' : isPresent ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {staff.staff_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {staff.staff_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Employee Code */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {staff.employee_code}
                      </td>

                      {/* Wing & Assignment */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {staff.wing_name || staff.assignment_type || 'Faculty'}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-6 text-center">
                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setStaffStatus(staff.staff_id, 'PRESENT')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffStatus(staff.staff_id, 'ABSENT')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Absent
                          </button>
                        </div>
                        {isUnmarked && (
                          <span className="block text-[10px] text-amber-600 font-medium mt-1">
                            Not yet marked
                          </span>
                        )}
                      </td>

                      {/* In Time */}
                      <td className="py-3 px-4 w-32">
                        <input
                          type="text"
                          placeholder="08:00 AM"
                          disabled={isAbsent}
                          value={staff.in_time || ''}
                          onChange={(e) =>
                            setStaffField(staff.staff_id, 'in_time', e.target.value)
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>

                      {/* Out Time */}
                      <td className="py-3 px-4 w-32">
                        <input
                          type="text"
                          placeholder="03:30 PM"
                          disabled={isAbsent}
                          value={staff.out_time || ''}
                          onChange={(e) =>
                            setStaffField(staff.staff_id, 'out_time', e.target.value)
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional notes..."
                          value={staff.remarks || ''}
                          onChange={(e) =>
                            setStaffField(staff.staff_id, 'remarks', e.target.value)
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        />
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
