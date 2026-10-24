'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  GraduationCap,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Filter,
  Sparkles,
  Layers,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Library,
} from 'lucide-react';
import { api } from '@/lib/api';

interface TeacherItem {
  id: string;
  name: string;
  employee_code: string;
  department: string | null;
  designation: string | null;
}

interface SubjectAllocationItem {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  assigned_teacher: {
    staff_id: string;
    staff_name: string;
    employee_code: string;
  } | null;
}

interface SectionAllocationItem {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  class_teacher: {
    staff_id: string;
    staff_name: string;
    employee_code: string;
  } | null;
  subjects: SubjectAllocationItem[];
}

export default function AcademicAllocationsPage() {
  const router = useRouter();
  const [allocations, setAllocations] = useState<SectionAllocationItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Local draft state for allocations
  const [draftState, setDraftState] = useState<{
    [key: string]: {
      class_teacher_id: string;
      subject_teachers: { [subject_id: string]: string };
    };
  }>({});

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorToast(null);
      const res = await api.admin.getAcademicAllocations();
      const fetchedAllocations: SectionAllocationItem[] = res.allocations || [];
      const fetchedTeachers: TeacherItem[] = res.teachers || [];

      setAllocations(fetchedAllocations);
      setTeachers(fetchedTeachers);

      // Initialize draft state
      const initialDraft: typeof draftState = {};
      fetchedAllocations.forEach((sec) => {
        const key = `${sec.class_id}_${sec.section_id}`;
        const subTeachers: { [subject_id: string]: string } = {};
        sec.subjects.forEach((sub) => {
          subTeachers[sub.subject_id] = sub.assigned_teacher?.staff_id || '';
        });

        initialDraft[key] = {
          class_teacher_id: sec.class_teacher?.staff_id || '',
          subject_teachers: subTeachers,
        };
      });
      setDraftState(initialDraft);
    } catch (err: any) {
      setErrorToast(err?.message || 'Failed to load academic allocations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Distinct classes for filter
  const distinctClasses = useMemo(() => {
    const map = new Map<string, string>();
    allocations.forEach((a) => map.set(a.class_id, a.class_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allocations]);

  // Filtered sections
  const filteredAllocations = useMemo(() => {
    return allocations.filter((sec) => {
      if (selectedClassFilter !== 'ALL' && sec.class_id !== selectedClassFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClass = sec.class_name.toLowerCase().includes(q);
        const matchesSection = sec.section_name.toLowerCase().includes(q);
        const matchesCT = sec.class_teacher?.staff_name.toLowerCase().includes(q);
        const matchesSubjects = sec.subjects.some(
          (s) =>
            s.subject_name.toLowerCase().includes(q) ||
            s.assigned_teacher?.staff_name.toLowerCase().includes(q)
        );
        if (!matchesClass && !matchesSection && !matchesCT && !matchesSubjects) {
          return false;
        }
      }
      return true;
    });
  }, [allocations, selectedClassFilter, searchQuery]);

  // Handle Class Teacher change in draft
  const handleClassTeacherChange = (classId: string, sectionId: string, teacherId: string) => {
    const key = `${classId}_${sectionId}`;
    setDraftState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        class_teacher_id: teacherId,
        subject_teachers: prev[key]?.subject_teachers || {},
      },
    }));
  };

  // Handle Subject Teacher change in draft
  const handleSubjectTeacherChange = (
    classId: string,
    sectionId: string,
    subjectId: string,
    teacherId: string
  ) => {
    const key = `${classId}_${sectionId}`;
    setDraftState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        class_teacher_id: prev[key]?.class_teacher_id || '',
        subject_teachers: {
          ...(prev[key]?.subject_teachers || {}),
          [subjectId]: teacherId,
        },
      },
    }));
  };

  // Save allocations for a specific section
  const handleSaveSection = async (sec: SectionAllocationItem) => {
    const key = `${sec.class_id}_${sec.section_id}`;
    const draft = draftState[key];
    if (!draft) return;

    try {
      setSavingSectionId(sec.section_id);
      setErrorToast(null);

      const subjectAllocations = Object.entries(draft.subject_teachers).map(
        ([subject_id, teacher_id]) => ({
          subject_id,
          teacher_id: teacher_id || null,
        })
      );

      await api.admin.saveAcademicAllocations({
        class_id: sec.class_id,
        section_id: sec.section_id,
        class_teacher_id: draft.class_teacher_id || null,
        subject_allocations: subjectAllocations,
      });

      showSuccess(`Allocations saved for ${sec.class_name} - ${sec.section_name}!`);
      await loadData();
    } catch (err: any) {
      setErrorToast(err?.message || 'Failed to save allocations');
    } finally {
      setSavingSectionId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast notifications */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-600 text-white shadow-xl text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Navigation Tab Strip */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => router.push('/subjects')}
          className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
        >
          <Library className="w-4 h-4" />
          Subject Master
        </button>
        <button
          className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <GraduationCap className="w-4 h-4" />
          Class &amp; Subject Teacher Allocation Hub
        </button>
        <button
          onClick={() => router.push('/timetable')}
          className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          Master Timetable Grid
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Academic Allocation Matrix
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Teacher &amp; Student App Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-400" />
            Class Teacher &amp; Subject Teacher Allocation Hub
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Assign one <strong>Class Teacher (Homeroom)</strong> for daily attendance and student oversight, and map dedicated <strong>Subject Teachers</strong> for every subject in each class &amp; section.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Allocations
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Class Filter */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full text-xs font-semibold pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              <option value="ALL">All Classes ({distinctClasses.length})</option>
              {distinctClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            Showing {filteredAllocations.length} section{filteredAllocations.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search class, section, teacher or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Allocation Matrix Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs font-medium">Loading institutional academic allocations...</p>
        </div>
      ) : filteredAllocations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No classes or sections found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload your student roster or add classes from Subject Master to populate the allocation grid.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredAllocations.map((sec) => {
            const draftKey = `${sec.class_id}_${sec.section_id}`;
            const currentDraft = draftState[draftKey] || {
              class_teacher_id: sec.class_teacher?.staff_id || '',
              subject_teachers: {},
            };
            const isSaving = savingSectionId === sec.section_id;

            return (
              <div
                key={draftKey}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition hover:shadow-md"
              >
                {/* Section Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                      {sec.class_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                          {sec.class_name} — {sec.section_name}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {sec.subjects.length} Subjects
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Homeroom &amp; Subject-Wise Faculty Allocations
                      </p>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSaveSection(sec)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-900/20 transition cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Allocations</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-5 space-y-5">
                  {/* Class Teacher (Homeroom) Selection */}
                  <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            Class Teacher (Homeroom)
                          </span>
                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded">
                            Primary In-charge
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Takes daily attendance register and oversees parent-teacher communication for this section.
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-72">
                      <select
                        value={currentDraft.class_teacher_id}
                        onChange={(e) =>
                          handleClassTeacherChange(sec.class_id, sec.section_id, e.target.value)
                        }
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      >
                        <option value="">-- Assign Class Teacher --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.employee_code}) {t.designation ? `• ${t.designation}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject Teachers Grid */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Subject Teachers Mapping ({sec.subjects.length} Subjects)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sec.subjects.map((sub) => {
                        const assignedTeacherId =
                          currentDraft.subject_teachers[sub.subject_id] !== undefined
                            ? currentDraft.subject_teachers[sub.subject_id]
                            : sub.assigned_teacher?.staff_id || '';

                        return (
                          <div
                            key={sub.subject_id}
                            className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {sub.subject_name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                                {sub.subject_code}
                              </span>
                            </div>

                            <div>
                              <select
                                value={assignedTeacherId}
                                onChange={(e) =>
                                  handleSubjectTeacherChange(
                                    sec.class_id,
                                    sec.section_id,
                                    sub.subject_id,
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                              >
                                <option value="">-- No Teacher Assigned --</option>
                                {teachers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({t.employee_code})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
