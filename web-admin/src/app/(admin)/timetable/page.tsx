'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays,
  Save,
  Plus,
  Trash2,
  Edit2,
  Clock,
  User,
  BookOpen,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  TimetableGridResponse,
  TimetableSlotEntry,
  SubjectItem,
  SectionSummary,
} from '@/lib/types';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const PERIOD_DEFAULTS = [
  { p: 1, start: '08:00:00', end: '08:45:00', label: '08:00 - 08:45' },
  { p: 2, start: '08:45:00', end: '09:30:00', label: '08:45 - 09:30' },
  { p: 3, start: '09:45:00', end: '10:30:00', label: '09:45 - 10:30' },
  { p: 4, start: '10:30:00', end: '11:15:00', label: '10:30 - 11:15' },
  { p: 5, start: '11:30:00', end: '12:15:00', label: '11:30 - 12:15' },
  { p: 6, start: '12:15:00', end: '13:00:00', label: '12:15 - 01:00' },
  { p: 7, start: '13:45:00', end: '14:30:00', label: '01:45 - 02:30' },
  { p: 8, start: '14:30:00', end: '15:15:00', label: '02:30 - 03:15' },
];

export default function MasterTimetablePage() {
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [gridData, setGridData] = useState<TimetableGridResponse | null>(null);
  const [slots, setSlots] = useState<TimetableSlotEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cell Editor Modal State
  const [editingCell, setEditingCell] = useState<{
    day: number;
    period: number;
  } | null>(null);

  // Multi-slot editor for selected period
  const [cellSlots, setCellSlots] = useState<TimetableSlotEntry[]>([]);

  // 1. Initial Load: Fetch sections & subjects
  useEffect(() => {
    const init = async () => {
      try {
        const [dash, subs] = await Promise.all([
          api.admin.getDashboardSummary(),
          api.academics.getSubjects().catch(() => []),
        ]);

        if (dash.sections && dash.sections.length > 0) {
          setSections(dash.sections);
          setSelectedClassId(dash.sections[0].class_id);
          setSelectedSectionId(dash.sections[0].section_id);
        }
        setSubjects(subs);
      } catch (err: any) {
        console.error('Failed to initialize timetable controls:', err);
      }
    };
    init();
  }, []);

  // 2. Fetch Timetable Grid when Class/Section changes
  const fetchGrid = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await api.admin.getTimetableGrid(selectedClassId, selectedSectionId);
      setGridData(data);
      setSlots(data.slots || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load timetable grid' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      fetchGrid();
    }
  }, [selectedClassId, selectedSectionId]);

  // Matrix Map lookup: day -> period -> slots[]
  const matrixMap = useMemo(() => {
    const map: Record<number, Record<number, TimetableSlotEntry[]>> = {};
    for (let d = 1; d <= 6; d++) {
      map[d] = {};
      for (let p = 1; p <= 8; p++) {
        map[d][p] = [];
      }
    }
    for (const slot of slots) {
      if (map[slot.day_of_week] && map[slot.day_of_week][slot.period_number]) {
        map[slot.day_of_week][slot.period_number].push(slot);
      }
    }
    return map;
  }, [slots]);

  // Open Cell Editor
  const handleOpenEditor = (day: number, period: number) => {
    const existing = matrixMap[day]?.[period] || [];
    setEditingCell({ day, period });
    if (existing.length > 0) {
      setCellSlots(JSON.parse(JSON.stringify(existing)));
    } else {
      const def = PERIOD_DEFAULTS.find((p) => p.p === period)!;
      setCellSlots([
        {
          day_of_week: day,
          period_number: period,
          start_time: def.start,
          end_time: def.end,
          subject_id: subjects[0]?.id || '',
          teacher_id: '',
          teacher_name: '',
          room_number: '',
        },
      ]);
    }
  };

  // Add a split/co-teacher slot in modal
  const handleAddCoTeacherSlot = () => {
    if (!editingCell) return;
    const def = PERIOD_DEFAULTS.find((p) => p.p === editingCell.period)!;
    setCellSlots([
      ...cellSlots,
      {
        day_of_week: editingCell.day,
        period_number: editingCell.period,
        start_time: def.start,
        end_time: def.end,
        subject_id: subjects[0]?.id || '',
        teacher_id: '',
        teacher_name: '',
        room_number: '',
      },
    ]);
  };

  // Save changes from Cell Modal to local slots state
  const handleSaveCellSlots = () => {
    if (!editingCell) return;
    const { day, period } = editingCell;

    // Filter out existing slots for this day & period
    const remaining = slots.filter(
      (s) => !(s.day_of_week === day && s.period_number === period)
    );

    // Filter valid slots from modal
    const valid = cellSlots.filter((s) => !!s.subject_id);

    setSlots([...remaining, ...valid]);
    setEditingCell(null);
  };

  // Clear slots for selected cell
  const handleClearCellSlots = () => {
    if (!editingCell) return;
    const { day, period } = editingCell;
    setSlots(slots.filter((s) => !(s.day_of_week === day && s.period_number === period)));
    setEditingCell(null);
  };

  // Save Master Grid to backend
  const handleSaveGrid = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.admin.saveTimetableGrid({
        class_id: selectedClassId,
        section_id: selectedSectionId,
        academic_year_id: gridData?.academic_year_id,
        slots: slots.map((s) => ({
          day_of_week: s.day_of_week,
          period_number: s.period_number,
          start_time: s.start_time,
          end_time: s.end_time,
          subject_id: s.subject_id,
          teacher_id: s.teacher_id || '91b53941-cf62-421f-827c-3f412f84ee1b', // fallback teacher profile if unassigned
          room_number: s.room_number || null,
        })),
      });
      setGridData(res);
      setSlots(res.slots || []);
      setMessage({ type: 'success', text: 'Master timetable grid committed to database successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to commit master timetable grid' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Accretion+ Master Timetable Grid
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select class and section to view or customize period assignments (Mon–Sat, P1–P8).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class & Section Selectors */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase">Class / Sec:</span>
              <select
                value={`${selectedClassId}_${selectedSectionId}`}
                onChange={(e) => {
                  const [cId, sId] = e.target.value.split('_');
                  setSelectedClassId(cId);
                  setSelectedSectionId(sId);
                }}
                className="py-1 px-2.5 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-900 focus:border-indigo-600 outline-none"
              >
                {sections.map((s) => (
                  <option key={`${s.class_id}_${s.section_id}`} value={`${s.class_id}_${s.section_id}`}>
                    {s.class_name} · Section {s.section_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reload button */}
            <button
              onClick={fetchGrid}
              disabled={loading}
              title="Reload Grid"
              className="p-2 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveGrid}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Committed Changes...' : 'Save Master Grid'}</span>
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mt-4 p-3 rounded text-xs flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Header: Periods 1 to 8 */}
            <thead>
              <tr className="bg-slate-900 text-white divide-x divide-slate-800">
                <th className="px-4 py-3 text-center w-28 uppercase text-[11px] font-bold tracking-wider">
                  Day / Period
                </th>
                {PERIOD_DEFAULTS.map((p) => (
                  <th key={p.p} className="px-3 py-2.5 text-center min-w-[130px]">
                    <div className="font-bold text-xs text-white">Period {p.p}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-normal">
                      {p.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body: Monday to Saturday */}
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {DAYS.map((day) => (
                <tr key={day.id} className="divide-x divide-slate-100 hover:bg-slate-50/40 transition-colors">
                  {/* Day Header Column */}
                  <td className="px-4 py-3 bg-slate-50 font-bold text-slate-900 text-center uppercase tracking-wider text-[11px] border-r border-slate-200">
                    <div>{day.short}</div>
                    <div className="text-[9px] text-slate-400 font-normal">Day {day.id}</div>
                  </td>

                  {/* Period Cells */}
                  {PERIOD_DEFAULTS.map((p) => {
                    const cellList = matrixMap[day.id]?.[p.p] || [];
                    const hasSlots = cellList.length > 0;

                    return (
                      <td
                        key={p.p}
                        onClick={() => handleOpenEditor(day.id, p.p)}
                        className={`p-2 align-top h-24 transition-colors cursor-pointer group relative ${
                          hasSlots
                            ? 'bg-white hover:bg-indigo-50/40'
                            : 'bg-slate-50/30 hover:bg-slate-100/60'
                        }`}
                      >
                        {hasSlots ? (
                          <div className="space-y-1.5 h-full flex flex-col justify-between">
                            {cellList.map((slot, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded bg-indigo-50/80 border border-indigo-200/80 text-[11px]"
                              >
                                <div className="font-bold text-indigo-950 truncate flex items-center justify-between">
                                  <span>{slot.subject_code || slot.subject_name || 'Subject'}</span>
                                  {slot.room_number && (
                                    <span className="text-[9px] font-mono text-indigo-600 bg-white px-1 rounded border border-indigo-200">
                                      {slot.room_number}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-600 truncate mt-0.5 flex items-center gap-1">
                                  <User className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{slot.teacher_name || 'Assigned Faculty'}</span>
                                </div>
                              </div>
                            ))}

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-indigo-600 font-semibold flex items-center gap-1 justify-end">
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] text-slate-300 group-hover:text-indigo-600">
                              Assign
                            </span>
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
      </div>

      {/* 4. CELL PERIOD EDITOR MODAL */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Edit Period {editingCell.period} · {DAYS.find((d) => d.id === editingCell.day)?.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {PERIOD_DEFAULTS.find((p) => p.p === editingCell.period)?.label} · Multi-Teacher Support
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {cellSlots.map((slot, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded border border-slate-200 bg-slate-50/50 space-y-3 relative"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Assignment #{index + 1}</span>
                    {cellSlots.length > 1 && (
                      <button
                        onClick={() =>
                          setCellSlots(cellSlots.filter((_, i) => i !== index))
                        }
                        className="text-rose-600 hover:text-rose-700 text-[11px] flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Subject */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Subject
                      </label>
                      <select
                        value={slot.subject_id}
                        onChange={(e) => {
                          const subId = e.target.value;
                          const sub = subjects.find((s) => s.id === subId);
                          const updated = [...cellSlots];
                          updated[index] = {
                            ...updated[index],
                            subject_id: subId,
                            subject_code: sub?.code,
                            subject_name: sub?.name,
                          };
                          setCellSlots(updated);
                        }}
                        className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-slate-900 focus:border-indigo-600 outline-none"
                      >
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Room */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Room No / Lab
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rm 101 or Lab 2"
                        value={slot.room_number || ''}
                        onChange={(e) => {
                          const updated = [...cellSlots];
                          updated[index].room_number = e.target.value;
                          setCellSlots(updated);
                        }}
                        className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-slate-900 focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Teacher Name / Code */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Faculty / Teacher
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. S. Sharma (Math Faculty)"
                      value={slot.teacher_name || ''}
                      onChange={(e) => {
                        const updated = [...cellSlots];
                        updated[index].teacher_name = e.target.value;
                        setCellSlots(updated);
                      }}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              ))}

              {/* Add Co-Teacher Button */}
              <button
                type="button"
                onClick={handleAddCoTeacherSlot}
                className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-indigo-600 hover:bg-indigo-50/50 rounded text-xs font-semibold text-slate-600 hover:text-indigo-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Co-Teacher or Lab Split Assignment</span>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearCellSlots}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Clear Period
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCellSlots}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  Apply to Grid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
