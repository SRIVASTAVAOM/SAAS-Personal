'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Library,
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  GraduationCap,
  FlaskConical,
  Sparkles,
  Users,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SubjectMasterItem, ClassItem } from '@/lib/types';

const SUBJECT_TYPES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'THEORY', label: 'Theory' },
  { value: 'PRACTICAL', label: 'Practical / Lab' },
  { value: 'CORE', label: 'Core' },
  { value: 'ELECTIVE', label: 'Elective' },
  { value: 'CO_SCHOLASTIC', label: 'Co-Scholastic' },
];

export default function SubjectMasterPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectMasterItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectMasterItem | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    type: string;
    is_active: boolean;
    class_ids: string[];
  }>({
    name: '',
    code: '',
    type: 'THEORY',
    is_active: true,
    class_ids: [],
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load subjects and classes
  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectsData, classesData] = await Promise.all([
        api.academics.getSubjectsMaster(),
        api.academics.getClasses(),
      ]);
      setSubjects(subjectsData || []);
      setClasses(classesData || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load Subject Master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered subjects list
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q);

      const matchesType =
        typeFilter === 'ALL' ||
        (s.type || 'THEORY').toUpperCase() === typeFilter.toUpperCase();

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && s.is_active !== false) ||
        (statusFilter === 'INACTIVE' && s.is_active === false);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [subjects, searchQuery, typeFilter, statusFilter]);

  // Statistics
  const totalCount = subjects.length;
  const theoryCount = subjects.filter((s) => (s.type || 'THEORY') === 'THEORY').length;
  const practicalCount = subjects.filter((s) => s.type === 'PRACTICAL').length;
  const activeCount = subjects.filter((s) => s.is_active !== false).length;

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      code: '',
      type: 'THEORY',
      is_active: true,
      class_ids: [],
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (subject: SubjectMasterItem) => {
    setSelectedSubject(subject);
    const existingClassIds = (subject.classes || []).map((c) => c.id);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      type: subject.type || 'THEORY',
      is_active: subject.is_active !== false,
      class_ids: existingClassIds,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditModalOpen(true);
  };

  // Toggle class selection in form
  const handleToggleClass = (classId: string) => {
    setFormData((prev) => {
      const exists = prev.class_ids.includes(classId);
      return {
        ...prev,
        class_ids: exists
          ? prev.class_ids.filter((id) => id !== classId)
          : [...prev.class_ids, classId],
      };
    });
  };

  const handleSelectAllClasses = () => {
    setFormData((prev) => ({
      ...prev,
      class_ids: classes.map((c) => c.id),
    }));
  };

  const handleDeselectAllClasses = () => {
    setFormData((prev) => ({
      ...prev,
      class_ids: [],
    }));
  };

  // Submit Add Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMessage('Subject Name and Code are mandatory fields.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.academics.createSubject({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        class_ids: formData.class_ids,
      });
      setSuccessMessage(`Subject "${formData.name}" created successfully!`);
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit Subject
  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMessage('Subject Name and Code are mandatory fields.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.academics.updateSubject(selectedSubject.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        is_active: formData.is_active,
        class_ids: formData.class_ids,
      });
      setSuccessMessage(`Subject "${formData.name}" updated successfully!`);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update subject');
    } finally {
      setSaving(false);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (subject: SubjectMasterItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete subject "${subject.name}" (${subject.code})? This will unmap it from classes and allocations.`
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.academics.deleteSubject(subject.id);
      setSuccessMessage(`Subject "${subject.name}" deleted successfully.`);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete subject');
    } finally {
      setSaving(false);
    }
  };

  // Helper for type badges
  const getTypeBadge = (type?: string) => {
    const t = (type || 'THEORY').toUpperCase();
    switch (t) {
      case 'THEORY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5" /> Theory
          </span>
        );
      case 'PRACTICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FlaskConical className="w-3.5 h-3.5" /> Practical / Lab
          </span>
        );
      case 'CORE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-3.5 h-3.5" /> Core
          </span>
        );
      case 'ELECTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5" /> Elective
          </span>
        );
      case 'CO_SCHOLASTIC':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <GraduationCap className="w-3.5 h-3.5" /> Co-Scholastic
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Tab Strip */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Library className="w-4 h-4" />
          Subject Master
        </button>
        <button
          onClick={() => router.push('/academics/allocations')}
          className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Library className="w-7 h-7 text-indigo-600" />
            Subject Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your school curriculum subjects, class affiliations, and faculty assignments.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Subjects</p>
            <p className="text-xl font-bold text-slate-800">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Theory Subjects</p>
            <p className="text-xl font-bold text-blue-700">{theoryCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Practicals & Labs</p>
            <p className="text-xl font-bold text-emerald-700">{practicalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Curriculum</p>
            <p className="text-xl font-bold text-purple-700">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subject name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Type Filter Pills & Status Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 overflow-x-auto">
            {SUBJECT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setTypeFilter(type.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  typeFilter === type.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="border-l border-slate-200 pl-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subjects Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm">Loading Subject Master catalog...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
            <Library className="w-12 h-12 text-slate-300 stroke-[1.5]" />
            <p className="font-semibold text-slate-700">No subjects found</p>
            <p className="text-xs text-slate-400">
              {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or category filter.'
                : 'Get started by creating your first subject.'}
            </p>
            {subjects.length === 0 && (
              <button
                onClick={handleOpenAddModal}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                + Add First Subject
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Subject Name</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Applicable Classes</th>
                  <th className="py-3.5 px-4">Assigned Faculty</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                            {s.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {s.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getTypeBadge(s.type)}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {s.classes && s.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.classes.slice(0, 3).map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200 font-medium"
                            >
                              {c.name}
                            </span>
                          ))}
                          {s.classes.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-xs rounded border border-slate-200">
                              +{s.classes.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None assigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">
                          {s.teachers_count || 0} {s.teachers_count === 1 ? 'Teacher' : 'Teachers'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Subject"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(s)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Add New Subject
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Physics Practical"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MATH-10, PHY-PRAC"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical / Lab</option>
                    <option value="CORE">Core</option>
                    <option value="ELECTIVE">Elective</option>
                    <option value="CO_SCHOLASTIC">Co-Scholastic</option>
                  </select>
                </div>
              </div>

              {/* Class Affiliations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Applicable Classes
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllClasses}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllClasses}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                  {classes.map((c) => {
                    const checked = formData.class_ids.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        onClick={() => handleToggleClass(c.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition select-none ${
                          checked
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                  {classes.length === 0 && (
                    <p className="text-xs text-slate-400 col-span-3 py-2 text-center">
                      No classes configured yet
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {isEditModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Subject: {selectedSubject.name}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical / Lab</option>
                    <option value="CORE">Core</option>
                    <option value="ELECTIVE">Elective</option>
                    <option value="CO_SCHOLASTIC">Co-Scholastic</option>
                  </select>
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="edit_is_active" className="text-sm font-medium text-slate-800 cursor-pointer">
                  Active Subject in Curriculum
                </label>
              </div>

              {/* Class Affiliations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Applicable Classes
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllClasses}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllClasses}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                  {classes.map((c) => {
                    const checked = formData.class_ids.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        onClick={() => handleToggleClass(c.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition select-none ${
                          checked
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
