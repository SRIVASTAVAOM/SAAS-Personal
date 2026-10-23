'use client';

import React, { useEffect, useState, useMemo, useSyncExternalStore, useRef } from 'react';
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
  X,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  TimetableGridResponse,
  TimetableSlotEntry,
  SubjectItem,
  SectionSummary,
  ClassItem,
} from '@/lib/types';
import { TeacherWiseTimetable } from '@/components/timetable/TeacherWiseTimetable';
import { SubstitutionsManager } from '@/components/timetable/SubstitutionsManager';

export interface StaffOption {
  id: string;
  name: string;
  employee_code?: string;
  role?: string;
}

function StaffSearchSelect({
  staffList,
  selectedTeacherId,
  selectedTeacherName,
  onSelect,
}: {
  staffList: StaffOption[];
  selectedTeacherId?: string;
  selectedTeacherName?: string;
  onSelect: (staff: StaffOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffList;
    const q = search.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.employee_code && s.employee_code.toLowerCase().includes(q)) ||
        (s.role && s.role.toLowerCase().includes(q))
    );
  }, [staffList, search]);

  const currentSelected = staffList.find((s) => s.id === selectedTeacherId);
  const displayName = currentSelected ? currentSelected.name : selectedTeacherName;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-left flex items-center justify-between hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
            {displayName ? displayName[0]?.toUpperCase() : <User className="w-3 h-3" />}
          </div>
          <span className={displayName ? 'font-semibold text-slate-800' : 'text-slate-400 font-normal'}>
            {displayName || 'Select staff member from list...'}
          </span>
          {currentSelected?.employee_code && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {currentSelected.employee_code}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search staff by name or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Scrollable Staff List */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filteredStaff.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No staff found matching &quot;{search}&quot;
              </div>
            ) : (
              filteredStaff.map((staff) => {
                const isSelected = staff.id === selectedTeacherId;
                return (
                  <div
                    key={staff.id}
                    onClick={() => {
                      onSelect(staff);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none transition ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                        {staff.name[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{staff.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          {staff.employee_code && <span>{staff.employee_code}</span>}
                          {staff.role && <span>· {staff.role}</span>}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

const TOTAL_PERIODS = DAYS.length * PERIOD_DEFAULTS.length;

// Subject colours are assigned in legend order. Each colour is a hex value so
// the card tint can be built with an alpha suffix.
const SUBJECT_COLORS = ['#635BFF', '#16A34A', '#F59E0B', '#0EA5E9', '#F43F5E', '#8B5CF6', '#14B8A6', '#F97316'];
const FALLBACK_SUBJECT_COLOR = '#94A3B8';

export default function MasterTimetablePage() {
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [academicClasses, setAcademicClasses] = useState<ClassItem[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [gridData, setGridData] = useState<TimetableGridResponse | null>(null);
  const [slots, setSlots] = useState<TimetableSlotEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'class' | 'teacher' | 'substitutions'>('class');

  // Cell Editor Modal State
  const [editingCell, setEditingCell] = useState<{
    day: number;
    period: number;
  } | null>(null);

  // Multi-slot editor for selected period
  const [cellSlots, setCellSlots] = useState<TimetableSlotEntry[]>([]);

  // Interaction-only state: hovered/focused period and the subject being highlighted.
  const [hoverCell, setHoverCell] = useState<{ day: number; period: number } | null>(null);
  const [focusSubject, setFocusSubject] = useState<string | null>(null);

  // Current weekday (0 = Sunday). Server render uses -1 so the static HTML never
  // shows a stale "Today" marker.
  const todayDow = useSyncExternalStore(
    () => () => {},
    () => new Date().getDay(),
    () => -1
  );

  // 1. Initial Load: Fetch sections, classes, subjects, and staff
  useEffect(() => {
    const init = async () => {
      try {
        const [dash, classesRes, subs, teachersRes, allStaffRes] = await Promise.all([
          api.admin.getDashboardSummary().catch(() => ({ sections: [] })),
          api.academics.getClasses().catch(() => []),
          api.academics.getSubjects().catch(() => []),
          api.admin.getTeachers().catch(() => []),
          api.admin.getAllStaff().catch(() => []),
        ]);

        if (dash.sections && dash.sections.length > 0) {
          setSections(dash.sections);
        }
        setAcademicClasses(classesRes || []);
        setSubjects(subs || []);

        // Combine staff & teachers into a unique staff list
        const staffMap = new Map<string, StaffOption>();

        (allStaffRes || []).forEach((st: any) => {
          const name = st.staff_name || `${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Staff Member';
          staffMap.set(st.id, {
            id: st.id,
            name,
            employee_code: st.employee_code,
            role: st.designation || st.department || 'Staff',
          });
        });

        (teachersRes || []).forEach((t: any) => {
          if (!staffMap.has(t.id)) {
            staffMap.set(t.id, {
              id: t.id,
              name: t.name || 'Teacher',
              employee_code: t.employee_code,
              role: t.qualification || 'Teacher',
            });
          }
        });

        setStaffList(Array.from(staffMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err: any) {
        console.error('Failed to initialize timetable controls:', err);
      }
    };
    init();
  }, []);

  // Derive unique classes and sections for single-select dropdowns
  const classOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sections: Map<string, { id: string; name: string }> }>();

    // From academic classes
    academicClasses.forEach((c) => {
      const cId = c.class_id || c.id;
      const cName = c.class_name || c.name || 'Class';
      if (!map.has(cId)) {
        map.set(cId, { id: cId, name: cName, sections: new Map() });
      }
      const entry = map.get(cId)!;
      if (Array.isArray(c.sections)) {
        c.sections.forEach((sec) => {
          if (sec.id && !entry.sections.has(sec.id)) {
            entry.sections.set(sec.id, { id: sec.id, name: sec.name });
          }
        });
      }
    });

    // From dashboard sections
    sections.forEach((s) => {
      if (s.class_id) {
        if (!map.has(s.class_id)) {
          map.set(s.class_id, { id: s.class_id, name: s.class_name, sections: new Map() });
        }
        const entry = map.get(s.class_id)!;
        if (s.section_id && !entry.sections.has(s.section_id)) {
          entry.sections.set(s.section_id, { id: s.section_id, name: s.section_name });
        }
      }
    });

    return Array.from(map.values())
      .map((c) => ({
        id: c.id,
        name: c.name,
        sections: Array.from(c.sections.values()),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [academicClasses, sections]);

  // Sections for currently selected class
  const currentClassSections = useMemo(() => {
    const cls = classOptions.find((c) => c.id === selectedClassId);
    return cls ? cls.sections : [];
  }, [classOptions, selectedClassId]);

  // Automatically select first class and section when options load
  useEffect(() => {
    if (classOptions.length > 0) {
      if (!selectedClassId || !classOptions.some((c) => c.id === selectedClassId)) {
        const first = classOptions[0];
        setSelectedClassId(first.id);
        if (first.sections.length > 0) {
          setSelectedSectionId(first.sections[0].id);
        }
      } else if (!selectedSectionId || !currentClassSections.some((s) => s.id === selectedSectionId)) {
        if (currentClassSections.length > 0) {
          setSelectedSectionId(currentClassSections[0].id);
        }
      }
    }
  }, [classOptions, selectedClassId, currentClassSections, selectedSectionId]);

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

  // Legend data: one entry per subject present in the grid, with its colour and period count.
  const subjectLegend = useMemo(() => {
    const counts = new Map<string, { id: string; label: string; count: number }>();
    for (const slot of slots) {
      if (!slot.subject_id) continue;
      const existing = counts.get(slot.subject_id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(slot.subject_id, {
          id: slot.subject_id,
          label: slot.subject_code || slot.subject_name || 'Subject',
          count: 1,
        });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((item, i) => ({ ...item, color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }));
  }, [slots]);

  const colorBySubject = useMemo(
    () => Object.fromEntries(subjectLegend.map((s) => [s.id, s.color])) as Record<string, string>,
    [subjectLegend]
  );

  const assignedPeriods = useMemo(
    () => new Set(slots.map((s) => `${s.day_of_week}-${s.period_number}`)).size,
    [slots]
  );

  const hoveredDay = hoverCell ? DAYS.find((d) => d.id === hoverCell.day) : undefined;
  const hoveredPeriod = hoverCell ? PERIOD_DEFAULTS.find((p) => p.p === hoverCell.period) : undefined;
  const hoveredItems = hoverCell ? matrixMap[hoverCell.day]?.[hoverCell.period] || [] : [];

  // Open Cell Editor
  const handleOpenEditor = (day: number, period: number) => {
    const existing = matrixMap[day]?.[period] || [];
    setEditingCell({ day, period });
    if (existing.length > 0) {
      setCellSlots(JSON.parse(JSON.stringify(existing)));
    } else {
      const def = PERIOD_DEFAULTS.find((p) => p.p === period)!;
      const defaultStaff = staffList[0];
      setCellSlots([
        {
          day_of_week: day,
          period_number: period,
          start_time: def.start,
          end_time: def.end,
          subject_id: subjects[0]?.id || '',
          teacher_id: defaultStaff?.id || '',
          teacher_name: defaultStaff?.name || '',
          room_number: '',
        },
      ]);
    }
  };

  // Add a split/co-teacher slot in modal
  const handleAddCoTeacherSlot = () => {
    if (!editingCell) return;
    const def = PERIOD_DEFAULTS.find((p) => p.p === editingCell.period)!;
    const defaultStaff = staffList[0];
    setCellSlots([
      ...cellSlots,
      {
        day_of_week: editingCell.day,
        period_number: editingCell.period,
        start_time: def.start,
        end_time: def.end,
        subject_id: subjects[0]?.id || '',
        teacher_id: defaultStaff?.id || '',
        teacher_name: defaultStaff?.name || '',
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
      {/* Top Level Nav Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('class')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[2px] ${
            activeTab === 'class'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Class Master Timetable
        </button>
        <button
          onClick={() => setActiveTab('teacher')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[2px] ${
            activeTab === 'teacher'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Teacher-wise Timetable
        </button>
        <button
          onClick={() => setActiveTab('substitutions')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[2px] flex items-center gap-1.5 ${
            activeTab === 'substitutions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Daily Substitutions</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {activeTab === 'teacher' ? (
        <TeacherWiseTimetable />
      ) : activeTab === 'substitutions' ? (
        <SubstitutionsManager sections={sections} />
      ) : (
        <>
          {/* Header & Controls */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
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
            {/* Separate Class & Section Selectors (Single Select) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    const newClassId = e.target.value;
                    setSelectedClassId(newClassId);
                    const cls = classOptions.find((c) => c.id === newClassId);
                    if (cls && cls.sections.length > 0) {
                      setSelectedSectionId(cls.sections[0].id);
                    } else {
                      setSelectedSectionId('');
                    }
                  }}
                  className="py-1 px-2.5 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-900 focus:border-indigo-600 outline-none cursor-pointer"
                >
                  {classOptions.length === 0 ? (
                    <option value="">No Classes Found</option>
                  ) : (
                    classOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Section Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Section:</span>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={!selectedClassId || currentClassSections.length === 0}
                  className="py-1 px-2.5 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-900 focus:border-indigo-600 outline-none cursor-pointer disabled:opacity-50"
                >
                  {currentClassSections.length === 0 ? (
                    <option value="">No Sections</option>
                  ) : (
                    currentClassSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
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

        {/* Subject legend (click to highlight one subject), assignment progress */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {subjectLegend.length === 0 && (
              <span className="text-[11px] text-slate-400">No subjects assigned to this section yet</span>
            )}
            {subjectLegend.map((s) => {
              const active = focusSubject === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFocusSubject(active ? null : s.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span>{s.label}</span>
                  <span className={active ? 'text-slate-300' : 'text-slate-400'}>{s.count}</span>
                </button>
              );
            })}
            {focusSubject !== null && (
              <button
                type="button"
                onClick={() => setFocusSubject(null)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear focus</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-[11px] text-slate-500 whitespace-nowrap">
              <span className="font-semibold text-slate-900 tabular-nums">{assignedPeriods}</span> of {TOTAL_PERIODS} periods assigned
            </div>
            <div className="w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${(assignedPeriods / TOTAL_PERIODS) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hover details: the period under the pointer or keyboard focus */}
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 min-h-[44px] flex items-center text-xs text-slate-600">
          {hoverCell && hoveredDay && hoveredPeriod ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold text-slate-900">
                {hoveredDay.name} · Period {hoveredPeriod.p}
              </span>
              <span className="font-mono text-[11px] text-slate-500">{hoveredPeriod.label}</span>
              {hoveredItems.length === 0 ? (
                <span className="text-slate-400">Free period. Click to assign.</span>
              ) : (
                hoveredItems.map((slot, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: colorBySubject[slot.subject_id] ?? FALLBACK_SUBJECT_COLOR }}
                    />
                    <span className="font-semibold text-slate-900">
                      {slot.subject_name || slot.subject_code || 'Subject'}
                    </span>
                    <span className="text-slate-500">
                      · {slot.teacher_name || 'Assigned Faculty'}
                      {slot.room_number ? ` · ${slot.room_number}` : ''}
                    </span>
                  </span>
                ))
              )}
            </div>
          ) : (
            <span>Hover a period to see its details. Click or press Enter to edit it.</span>
          )}
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Header: Periods 1 to 8 */}
            <thead>
              <tr className="bg-slate-900 text-white divide-x divide-slate-800">
                <th className="sticky left-0 z-20 bg-slate-900 px-4 py-3 text-center w-28 uppercase text-[11px] font-bold tracking-wider">
                  Day / Period
                </th>
                {PERIOD_DEFAULTS.map((p) => (
                  <th
                    key={p.p}
                    className={`px-3 py-2.5 text-center min-w-[130px] transition-colors ${
                      hoverCell?.period === p.p ? 'bg-indigo-700' : ''
                    }`}
                  >
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
                  <td
                    className={`sticky left-0 z-10 px-4 py-3 font-bold text-center uppercase tracking-wider text-[11px] border-r border-slate-200 transition-colors ${
                      hoverCell?.day === day.id ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div>{day.short}</div>
                    <div className="text-[9px] text-slate-400 font-normal">Day {day.id}</div>
                    {todayDow === day.id && (
                      <span className="inline-block mt-1 text-[9px] font-bold text-white bg-indigo-600 rounded px-1.5 py-0.5">
                        Today
                      </span>
                    )}
                  </td>

                  {/* Period Cells */}
                  {PERIOD_DEFAULTS.map((p) => {
                    const cellList = matrixMap[day.id]?.[p.p] || [];
                    const hasSlots = cellList.length > 0;
                    const isHovered = hoverCell?.day === day.id && hoverCell?.period === p.p;
                    const inHoverColumn = hoverCell?.period === p.p;
                    const dayName = DAYS.find((d) => d.id === day.id)?.name;

                    return (
                      <td
                        key={p.p}
                        role="button"
                        tabIndex={0}
                        aria-label={`${dayName}, period ${p.p}${
                          hasSlots ? `, ${cellList.length} assignment${cellList.length > 1 ? 's' : ''}` : ', empty'
                        }`}
                        onClick={() => handleOpenEditor(day.id, p.p)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenEditor(day.id, p.p);
                          }
                        }}
                        onMouseEnter={() => setHoverCell({ day: day.id, period: p.p })}
                        onMouseLeave={() => setHoverCell(null)}
                        onFocus={() => setHoverCell({ day: day.id, period: p.p })}
                        onBlur={() => setHoverCell(null)}
                        className={`p-2 align-top h-24 transition-colors cursor-pointer group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                          isHovered ? 'ring-1 ring-inset ring-indigo-400' : ''
                        } ${
                          hasSlots
                            ? inHoverColumn
                              ? 'bg-indigo-50/40'
                              : 'bg-white hover:bg-indigo-50/40'
                            : inHoverColumn
                            ? 'bg-slate-100/70'
                            : 'bg-slate-50/30 hover:bg-slate-100/60'
                        }`}
                      >
                        {hasSlots ? (
                          <div className="space-y-1.5 h-full flex flex-col justify-between">
                            {cellList.map((slot, idx) => {
                              const color = colorBySubject[slot.subject_id] ?? FALLBACK_SUBJECT_COLOR;
                              const dimmed = focusSubject !== null && slot.subject_id !== focusSubject;
                              return (
                                <div
                                  key={idx}
                                  className={`p-1.5 rounded border border-slate-200 border-l-4 text-[11px] transition-opacity duration-150 ${
                                    dimmed ? 'opacity-25' : 'opacity-100'
                                  }`}
                                  style={{ borderLeftColor: color, backgroundColor: `${color}14` }}
                                >
                                  <div className="font-bold text-slate-900 truncate flex items-center justify-between">
                                    <span>{slot.subject_code || slot.subject_name || 'Subject'}</span>
                                    {slot.room_number && (
                                      <span className="text-[9px] font-mono text-slate-600 bg-white px-1 rounded border border-slate-200">
                                        {slot.room_number}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-600 truncate mt-0.5 flex items-center gap-1">
                                    <User className="w-2.5 h-2.5 text-slate-400" />
                                    <span>{slot.teacher_name || 'Assigned Faculty'}</span>
                                  </div>
                                </div>
                              );
                            })}

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

                  {/* Faculty / Staff Selection (Searchable) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Faculty / Staff Member *
                    </label>
                    <StaffSearchSelect
                      staffList={staffList}
                      selectedTeacherId={slot.teacher_id}
                      selectedTeacherName={slot.teacher_name}
                      onSelect={(staff) => {
                        const updated = [...cellSlots];
                        updated[index] = {
                          ...updated[index],
                          teacher_id: staff.id,
                          teacher_name: staff.name,
                        };
                        setCellSlots(updated);
                      }}
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
        </>
      )}
    </div>
  );
}
