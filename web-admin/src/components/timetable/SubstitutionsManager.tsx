'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  Sparkles,
  RefreshCw,
  X,
  Send,
  Building2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SectionSummary, TimetableGridResponse, TimetableSlotEntry } from '@/lib/types';

type SubstitutionItem = {
  id: string;
  timetable_slot_id: string;
  substitution_date: string;
  original_teacher_id: string;
  substitute_teacher_id: string;
  original_teacher_name: string;
  substitute_teacher_name: string;
  class_name: string;
  section_name: string;
  subject_name: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  remarks: string;
  status: string;
};

type SubstitutionsManagerProps = {
  sections: SectionSummary[];
};

export function SubstitutionsManager({ sections }: SubstitutionsManagerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [substitutions, setSubstitutions] = useState<SubstitutionItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Form State
  const [formSectionKey, setFormSectionKey] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimetableSlotEntry[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. Load substitutions & teachers
  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, teachList] = await Promise.all([
        api.admin.getSubstitutions(selectedDate),
        api.admin.getTeachers(),
      ]);
      setSubstitutions(subs || []);
      setTeachers(teachList || []);
      if (sections.length > 0 && !formSectionKey) {
        setFormSectionKey(`${sections[0].class_id}_${sections[0].section_id}`);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load substitutions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // When formSectionKey changes in the modal, load that class's timetable grid to list period slots
  useEffect(() => {
    if (!formSectionKey) return;
    const [cId, sId] = formSectionKey.split('_');
    const loadSlots = async () => {
      try {
        const grid = await api.admin.getTimetableGrid(cId, sId);
        // Calculate weekday for selectedDate (1=Mon..6=Sat)
        const dateObj = new Date(selectedDate);
        let dow = dateObj.getDay();
        if (dow === 0) dow = 7; // Sunday

        const daySlots = (grid.slots || []).filter((s) => s.day_of_week === dow);
        setAvailableSlots(daySlots);
        if (daySlots.length > 0) {
          setSelectedSlotId(daySlots[0].id || '');
        } else {
          setSelectedSlotId('');
        }
      } catch (err) {
        console.error('Failed to load slots for substitution form:', err);
      }
    };
    loadSlots();
  }, [formSectionKey, selectedDate]);

  const handleCreateSubstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId || !substituteTeacherId) {
      setStatusMessage({ type: 'error', text: 'Please select both slot and substitute teacher' });
      return;
    }

    const slot = availableSlots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setStatusMessage({ type: 'error', text: 'Slot not found' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);
      await api.admin.assignSubstitution({
        timetable_slot_id: selectedSlotId,
        substitution_date: selectedDate,
        original_teacher_id: slot.teacher_id,
        substitute_teacher_id: substituteTeacherId,
        remarks: remarks || 'Covering for regular period',
      });

      setStatusMessage({
        type: 'success',
        text: 'Substitution assigned successfully! The substitute teacher will instantly see this on their app.',
      });
      setModalOpen(false);
      setRemarks('');
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to assign substitution' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this substitution?')) return;
    try {
      await api.admin.deleteSubstitution(id);
      setSubstitutions((prev) => prev.filter((s) => s.id !== id));
      setStatusMessage({ type: 'success', text: 'Substitution cancelled successfully' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to cancel substitution' });
    }
  };

  const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Teacher Substitution Control (Live Sync)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            When you assign a substitution here, the teacher immediately sees it upon logging into their mobile app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase px-1">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-900 outline-none"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Substitution</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline hover:opacity-75 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Substitutions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Assigned Substitutions on {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h4>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {substitutions.length}
            </span>
          </div>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Checking active substitutions...</div>
        ) : substitutions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <UserCheck className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No teacher substitutions assigned for this date.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              + Click here to assign one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3">Period & Time</th>
                  <th className="p-3">Class & Section</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Original Faculty</th>
                  <th className="p-3">Substitute Faculty (Assigned)</th>
                  <th className="p-3">Remarks</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {substitutions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900">
                      <div>Period {s.period_number}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      {s.class_name} ({s.section_name})
                    </td>
                    <td className="p-3 font-semibold text-indigo-700">{s.subject_name}</td>
                    <td className="p-3 text-rose-600 flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5" />
                      <span>{s.original_teacher_name}</span>
                    </td>
                    <td className="p-3 text-emerald-700 font-bold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{s.substitute_teacher_name}</span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{s.remarks || '—'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(s.id)}
                        title="Cancel substitution"
                        className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Assign Substitute Faculty</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubstitution} className="space-y-4">
              {/* Target Class/Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Target Class & Section
                </label>
                <select
                  value={formSectionKey}
                  onChange={(e) => setFormSectionKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {sections.map((s) => (
                    <option key={`${s.class_id}_${s.section_id}`} value={`${s.class_id}_${s.section_id}`}>
                      {s.class_name} · Section {s.section_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot / Period Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  2. Select Absent Period / Slot
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    No periods configured in master timetable for this day of the week.
                  </div>
                ) : (
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        Period {slot.period_number} ({slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}) · {slot.subject_name} · Regular: {slot.teacher_name || 'Assigned'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Substitute Teacher Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  3. Substitute Faculty (To cover class)
                </label>
                <select
                  value={substituteTeacherId}
                  onChange={(e) => setSubstituteTeacherId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Faculty...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employee_code || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  4. Remarks / Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regular teacher attending Olympiad duty"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableSlots.length === 0}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign & Sync to App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
