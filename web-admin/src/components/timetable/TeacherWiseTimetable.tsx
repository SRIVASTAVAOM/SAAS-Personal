'use client';

import React, { useState, useEffect } from 'react';
import { User, BookOpen, Clock, MapPin, Calendar, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const PERIOD_DEFAULTS = [
  { p: 1, label: '08:00 - 08:45' },
  { p: 2, label: '08:45 - 09:30' },
  { p: 3, label: '09:45 - 10:30' },
  { p: 4, label: '10:30 - 11:15' },
  { p: 5, label: '11:30 - 12:15' },
  { p: 6, label: '12:15 - 01:00' },
  { p: 7, label: '01:45 - 02:30' },
  { p: 8, label: '02:30 - 03:15' },
];

export function TeacherWiseTimetable() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingSlots, setFetchingSlots] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load teachers on mount
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoading(true);
        const list = await api.admin.getTeachers();
        setTeachers(list || []);
        if (list && list.length > 0) {
          setSelectedTeacherId(list[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load teachers list');
      } finally {
        setLoading(false);
      }
    };
    loadTeachers();
  }, []);

  // Fetch slots whenever selectedTeacherId changes
  useEffect(() => {
    if (!selectedTeacherId) return;
    const fetchTeacherSlots = async () => {
      try {
        setFetchingSlots(true);
        const data = await api.admin.getTeacherTimetable(selectedTeacherId);
        setSlots(data || []);
      } catch (err: any) {
        console.error('Failed to fetch teacher timetable slots:', err);
      } finally {
        setFetchingSlots(false);
      }
    };
    fetchTeacherSlots();
  }, [selectedTeacherId]);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  // Build matrix: day (1..6) -> period (1..8) -> slot
  const matrix: Record<number, Record<number, any>> = {};
  slots.forEach((s) => {
    if (!matrix[s.day_of_week]) matrix[s.day_of_week] = {};
    matrix[s.day_of_week][s.period_number] = s;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Teacher-wise Weekly Timetable</h3>
            <p className="text-xs text-slate-500">
              Inspect schedule, period load, and room allocations for any faculty member.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Select Faculty:</label>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.employee_code || 'Faculty'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teacher Profile Summary Card */}
      {selectedTeacher && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {selectedTeacher.name?.slice(0, 2).toUpperCase() || 'TR'}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{selectedTeacher.name}</div>
              <div className="text-xs text-slate-500">
                Code: {selectedTeacher.employee_code || 'N/A'} · Qualification: {selectedTeacher.qualification || 'Graduate'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Total Assigned Periods:</span>{' '}
              <strong className="text-indigo-600">{slots.length} periods/week</strong>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {fetchingSlots ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
          Loading faculty timetable grid...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-3 w-28 border-r border-slate-200">Day</th>
                {PERIOD_DEFAULTS.map((p) => (
                  <th key={p.p} className="p-2.5 text-center border-r border-slate-200 last:border-r-0">
                    <div>Period {p.p}</div>
                    <div className="text-[10px] font-normal text-slate-400">{p.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DAYS.map((day) => (
                <tr key={day.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/40">
                    {day.name}
                  </td>
                  {PERIOD_DEFAULTS.map((p) => {
                    const slot = matrix[day.id]?.[p.p];
                    return (
                      <td key={p.p} className="p-2 border-r border-slate-100 last:border-r-0 align-top">
                        {slot ? (
                          <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200/60 space-y-1">
                            <div className="font-bold text-indigo-900 truncate">{slot.subject_name}</div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              {slot.class_name} ({slot.section_name})
                            </div>
                            {slot.room_number && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> Rm {slot.room_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-16 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300">
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
