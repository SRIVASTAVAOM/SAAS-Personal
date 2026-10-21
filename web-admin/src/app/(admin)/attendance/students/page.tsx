'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
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
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ClassItem } from '@/lib/types';

interface StudentRosterItem {
  id?: string;
  student_id: string;
  admission_number: string;
  roll_number: string | null;
  student_name: string;
  class_id?: string;
  section_id?: string;
  attendance_date?: string;
  status: 'PRESENT' | 'ABSENT' | null;
  remarks: string | null;
  marked_by_name: string | null;
}

export default function StudentsAttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Roster state
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [savedRoster, setSavedRoster] = useState<StudentRosterItem[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch available classes & sections on mount
  useEffect(() => {
    async function loadAcademicClasses() {
      try {
        setLoadingClasses(true);
        const data = await api.academics.getClasses();
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClassId(data[0].id);
          if (data[0].sections && data[0].sections.length > 0) {
            setSelectedSectionId(data[0].sections[0].id);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load class list');
      } finally {
        setLoadingClasses(false);
      }
    }
    loadAcademicClasses();
  }, []);

  // Update selectedSectionId when selectedClassId changes
  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  useEffect(() => {
    if (currentClass && currentClass.sections && currentClass.sections.length > 0) {
      // If current section does not belong to new class, select first section
      const exists = currentClass.sections.some((s) => s.id === selectedSectionId);
      if (!exists) {
        setSelectedSectionId(currentClass.sections[0].id);
      }
    } else {
      setSelectedSectionId('');
    }
  }, [currentClass, selectedSectionId]);

  // 2. Fetch class student attendance roster whenever class, section, or date changes
  useEffect(() => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) return;

    async function loadRoster() {
      try {
        setLoadingRoster(true);
        setErrorMessage(null);
        setSaveSuccessMessage(null);

        const data = await api.attendance.getClassStudentAttendance(
          selectedClassId,
          selectedSectionId,
          selectedDate
        );

        // Normalize data
        const normalized: StudentRosterItem[] = (data || []).map((row: any) => ({
          id: row.id,
          student_id: row.student_id,
          admission_number: row.admission_number || 'N/A',
          roll_number: row.roll_number,
          student_name: row.student_name || 'Unnamed Student',
          class_id: row.class_id,
          section_id: row.section_id,
          attendance_date: row.attendance_date,
          status: row.status as 'PRESENT' | 'ABSENT' | null,
          remarks: row.remarks || '',
          marked_by_name: row.marked_by_name || null,
        }));

        setRoster(normalized);
        setSavedRoster(normalized);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load student attendance roster');
        setRoster([]);
        setSavedRoster([]);
      } finally {
        setLoadingRoster(false);
      }
    }

    loadRoster();
  }, [selectedClassId, selectedSectionId, selectedDate]);

  // Status updates
  const setStudentStatus = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status } : s))
    );
  };

  const setStudentRemarks = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, remarks } : s))
    );
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
  };

  const resetRoster = () => {
    setRoster(savedRoster);
    setSaveSuccessMessage(null);
  };

  // KPIs
  const totalStudents = roster.length;
  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const unmarkedCount = roster.filter((r) => !r.status).length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Filtered view by search
  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return roster;
    const q = searchQuery.toLowerCase();
    return roster.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        s.admission_number.toLowerCase().includes(q) ||
        (s.roll_number && s.roll_number.toLowerCase().includes(q))
    );
  }, [roster, searchQuery]);

  // Check if dirty
  const isDirty = useMemo(() => {
    if (roster.length !== savedRoster.length) return false;
    for (let i = 0; i < roster.length; i++) {
      if (
        roster[i].status !== savedRoster[i].status ||
        (roster[i].remarks || '') !== (savedRoster[i].remarks || '')
      ) {
        return true;
      }
    }
    return false;
  }, [roster, savedRoster]);

  // 3. Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) return;

    if (roster.length === 0) {
      setErrorMessage('No students available in this class to mark.');
      return;
    }

    const unmarked = roster.filter((r) => !r.status);
    if (unmarked.length > 0) {
      if (
        !window.confirm(
          `${unmarked.length} student(s) are unmarked. Marking now will default them to ABSENT. Proceed?`
        )
      ) {
        return;
      }
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccessMessage(null);

      const recordsToCommit = roster.map((r) => ({
        student_id: r.student_id,
        status: (r.status || 'ABSENT') as 'PRESENT' | 'ABSENT',
        remarks: r.remarks && r.remarks.trim() ? r.remarks.trim() : null,
      }));

      await api.attendance.markStudentAttendance({
        class_id: selectedClassId,
        section_id: selectedSectionId,
        attendance_date: selectedDate,
        records: recordsToCommit,
      });

      // Update local saved state
      const updatedRoster = roster.map((r) => ({
        ...r,
        status: (r.status || 'ABSENT') as 'PRESENT' | 'ABSENT',
      }));
      setRoster(updatedRoster);
      setSavedRoster(updatedRoster);

      setSaveSuccessMessage(
        `Attendance recorded successfully for ${recordsToCommit.length} student(s)! Live synced to Mobile Apps.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save student attendance');
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
              Menu 5 • Student Attendance
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Mobile App Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-400" />
            Class Student Attendance
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Check, record, and update daily attendance class-wise and section-wise for any date.
            Marked records immediately sync with the Student & Parent Flutter mobile apps.
          </p>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              onClick={resetRoster}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-slate-300 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2 border border-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              Discard Edits
            </button>
          )}

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loadingRoster || roster.length === 0}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg transition-all ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing to Mobile App...
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

      {/* Alert Banners */}
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

      {/* Control Bar: Class, Section, Date, Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Class Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={loadingClasses || loadingRoster}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Class {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            Select Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={loadingClasses || loadingRoster || !currentClass?.sections?.length}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          >
            {currentClass?.sections?.map((sec) => (
              <option key={sec.id} value={sec.id}>
                Section {sec.name}
              </option>
            ))}
          </select>
        </div>

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
            disabled={loadingRoster}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            Search Student
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, roll, admission..."
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
            <p className="text-xs text-slate-500 font-medium">Total Students</p>
            <p className="text-xl font-bold text-slate-800">{totalStudents}</p>
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
            <p className="text-xs text-slate-500 font-medium">Unmarked</p>
            <p className="text-xl font-bold text-amber-700">{unmarkedCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold">
            %
          </div>
          <div>
            <p className="text-xs text-indigo-100 font-medium">Attendance Rate</p>
            <p className="text-xl font-bold">{attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">
              Class {currentClass?.name || '—'} • Section{' '}
              {currentClass?.sections?.find((s) => s.id === selectedSectionId)?.name || '—'}
            </span>
            <span className="text-xs text-slate-500">
              ({filteredRoster.length} student{filteredRoster.length !== 1 ? 's' : ''} listed)
            </span>
          </div>

          {/* Quick Bulk Marking Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('PRESENT')}
              disabled={loadingRoster || roster.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark All Present
            </button>
            <button
              onClick={() => markAll('ABSENT')}
              disabled={loadingRoster || roster.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loadingRoster ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading class attendance register...</p>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No students found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? 'No students match your search filter.'
                : 'There are no active students enrolled in this class & section.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Roll</th>
                  <th className="py-3.5 px-4">Student Details</th>
                  <th className="py-3.5 px-4">Admission No.</th>
                  <th className="py-3.5 px-6 text-center">Attendance Status</th>
                  <th className="py-3.5 px-4">Remarks / Leave Note</th>
                  <th className="py-3.5 px-4 text-right">Previously Marked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((student) => {
                  const isPresent = student.status === 'PRESENT';
                  const isAbsent = student.status === 'ABSENT';
                  const isUnmarked = !student.status;

                  return (
                    <tr
                      key={student.student_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAbsent ? 'bg-rose-50/30' : isPresent ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Roll Number */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-700 text-xs bg-slate-100 px-2.5 py-1 rounded-md">
                          {student.roll_number || '—'}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {student.student_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {student.student_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Admission Number */}
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">
                        {student.admission_number}
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="py-3 px-6 text-center">
                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.student_id, 'PRESENT')}
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
                            onClick={() => setStudentStatus(student.student_id, 'ABSENT')}
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

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional note (e.g. sick leave, late)"
                          value={student.remarks || ''}
                          onChange={(e) =>
                            setStudentRemarks(student.student_id, e.target.value)
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        />
                      </td>

                      {/* Marked By Info */}
                      <td className="py-3 px-4 text-right text-xs text-slate-400">
                        {student.marked_by_name ? (
                          <span className="text-slate-600 font-medium">
                            {student.marked_by_name}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Unrecorded</span>
                        )}
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
