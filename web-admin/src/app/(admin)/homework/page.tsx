'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Calendar,
  Users,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ClassItem, SubjectItem } from '@/lib/types';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  s3_attachment_key: string | null;
  attachment_name: string | null;
  created_at: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  teacher_id: string;
  teacher_name: string;
  teacher_emp_code: string;
  completed_submissions_count: number;
  total_students_count: number;
}

interface StaffOption {
  id: string;
  staff_name: string;
  employee_code?: string;
}

export default function HomeworkPage() {
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAST_DUE'>('ALL');

  // Modal states
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkItem | null>(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    class_id: '',
    section_id: '',
    subject_id: '',
    staff_id: '',
    title: '',
    description: '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    attachment_name: '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [clsData, hwData, subData, staffData] = await Promise.all([
        api.academics.getClasses().catch(() => []),
        api.admin.getHomework().catch(() => []),
        api.academics.getSubjects().catch(() => []),
        api.admin.getAllStaff().catch(() => []),
      ]);
      setClasses(clsData || []);
      setHomeworkList(hwData || []);
      setSubjects(subData || []);
      setStaffList(staffData || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load homework data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Available sections for the filter bar
  const availableFilterSections = useMemo(() => {
    if (selectedClassId === 'ALL') {
      const allSecs: { id: string; name: string }[] = [];
      const seen = new Set<string>();
      classes.forEach((c) => {
        (c.sections || []).forEach((sec) => {
          if (!seen.has(sec.id)) {
            seen.add(sec.id);
            allSecs.push(sec);
          }
        });
      });
      return allSecs;
    }
    const cls = classes.find((c) => c.id === selectedClassId);
    return cls ? cls.sections || [] : [];
  }, [classes, selectedClassId]);

  // When class filter changes, reset section filter if it is not in the new class
  const handleClassFilterChange = (classId: string) => {
    setSelectedClassId(classId);
    if (classId !== 'ALL') {
      const cls = classes.find((c) => c.id === classId);
      const hasSec = cls?.sections?.some((s) => s.id === selectedSectionId);
      if (!hasSec) {
        setSelectedSectionId('ALL');
      }
    }
  };

  // Sections available inside the Add/Edit form based on chosen class_id
  const formAvailableSections = useMemo(() => {
    if (!formData.class_id) return [];
    const cls = classes.find((c) => c.id === formData.class_id);
    return cls ? cls.sections || [] : [];
  }, [classes, formData.class_id]);

  // Filter homework list
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredHomework = useMemo(() => {
    return homeworkList.filter((hw) => {
      const matchesClass = selectedClassId === 'ALL' || hw.class_id === selectedClassId;
      const matchesSection = selectedSectionId === 'ALL' || hw.section_id === selectedSectionId;

      const isPastDue = hw.due_date < todayStr;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !isPastDue) ||
        (statusFilter === 'PAST_DUE' && isPastDue);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        hw.title.toLowerCase().includes(q) ||
        hw.description.toLowerCase().includes(q) ||
        hw.teacher_name.toLowerCase().includes(q) ||
        hw.subject_name.toLowerCase().includes(q) ||
        hw.class_name.toLowerCase().includes(q) ||
        hw.section_name.toLowerCase().includes(q);

      return matchesClass && matchesSection && matchesStatus && matchesSearch;
    });
  }, [homeworkList, selectedClassId, selectedSectionId, statusFilter, searchQuery, todayStr]);

  // KPIs
  const totalAssignments = homeworkList.length;
  const activeAssignments = homeworkList.filter((h) => h.due_date >= todayStr).length;
  const totalSubmissions = homeworkList.reduce(
    (acc, h) => acc + (h.completed_submissions_count || 0),
    0
  );
  const uniqueTeachers = new Set(homeworkList.map((h) => h.teacher_id)).size;

  // Open Add Homework Modal
  const handleOpenAddModal = () => {
    const defaultClassId = classes[0]?.id || '';
    const defaultSectionId = classes[0]?.sections?.[0]?.id || '';
    const defaultSubjectId = subjects[0]?.id || '';

    setFormData({
      class_id: defaultClassId,
      section_id: defaultSectionId,
      subject_id: defaultSubjectId,
      staff_id: '',
      title: '',
      description: '',
      assigned_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      attachment_name: '',
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Homework Modal
  const handleOpenEditModal = (hw: HomeworkItem) => {
    setEditingHomework(hw);
    setFormData({
      class_id: hw.class_id || '',
      section_id: hw.section_id || '',
      subject_id: hw.subject_id || '',
      staff_id: hw.teacher_id || '',
      title: hw.title || '',
      description: hw.description || '',
      assigned_date: hw.assigned_date || new Date().toISOString().split('T')[0],
      due_date: hw.due_date || new Date().toISOString().split('T')[0],
      attachment_name: hw.attachment_name || '',
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditModalOpen(true);
  };

  // Submit Create Homework
  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.section_id || !formData.subject_id || !formData.title.trim() || !formData.due_date) {
      setErrorMessage('Please fill in Class, Section, Subject, Title, and Submission Due Date.');
      return;
    }
    if (formData.due_date < formData.assigned_date) {
      setErrorMessage('Submission due date cannot be earlier than the assigned date.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.admin.createHomework({
        class_id: formData.class_id,
        section_id: formData.section_id,
        subject_id: formData.subject_id,
        staff_id: formData.staff_id || undefined,
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_date: formData.assigned_date,
        due_date: formData.due_date,
        attachment_name: formData.attachment_name.trim() || undefined,
      });
      setSuccessMessage(`Homework "${formData.title}" assigned successfully!`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign homework');
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit Homework
  const handleUpdateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHomework) return;
    if (!formData.class_id || !formData.section_id || !formData.subject_id || !formData.title.trim() || !formData.due_date) {
      setErrorMessage('Please fill in Class, Section, Subject, Title, and Submission Due Date.');
      return;
    }
    if (formData.due_date < formData.assigned_date) {
      setErrorMessage('Submission due date cannot be earlier than the assigned date.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.admin.updateHomework(editingHomework.id, {
        class_id: formData.class_id,
        section_id: formData.section_id,
        subject_id: formData.subject_id,
        staff_id: formData.staff_id || undefined,
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_date: formData.assigned_date,
        due_date: formData.due_date,
        attachment_name: formData.attachment_name.trim() || undefined,
      });
      setSuccessMessage(`Homework "${formData.title}" updated successfully!`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update homework');
    } finally {
      setSaving(false);
    }
  };

  // Delete Homework
  const handleDeleteHomework = async (hw: HomeworkItem) => {
    if (!window.confirm(`Are you sure you want to delete homework "${hw.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.admin.deleteHomework(hw.id);
      setSuccessMessage(`Homework "${hw.title}" deleted successfully.`);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete homework');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Menu 11 • View/Assign Homework
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Assignment & Edit Enabled
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            View/Assign Homework
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Inspect, upload, and assign homework for any class and section. Edit existing tasks, review teacher attributions, and monitor student completion progress in real-time.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg transition active:scale-95 text-sm shrink-0 border border-indigo-400/40"
        >
          <Plus className="w-4 h-4" />
          Assign / Upload Homework
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
            <p className="text-xs text-slate-500 font-medium">Total Assignments</p>
            <p className="text-xl font-bold text-slate-800">{totalAssignments}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active (Due Soon)</p>
            <p className="text-xl font-bold text-emerald-700">{activeAssignments}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Completed Submissions</p>
            <p className="text-xl font-bold text-blue-700">{totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Teachers Assigning</p>
            <p className="text-xl font-bold text-purple-700">{uniqueTeachers}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, teacher, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Class Filter, Section Filter, and Status */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Section:</span>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Sections</option>
              {availableFilterSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  Section {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('PAST_DUE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'PAST_DUE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past Due
            </button>
          </div>
        </div>
      </div>

      {/* Homework Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading assigned homework...</p>
          </div>
        ) : filteredHomework.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No homework records found</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no assignments matching your selected filters.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
            >
              + Assign Homework Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Homework Title & Subject</th>
                  <th className="py-3.5 px-4">Class & Section</th>
                  <th className="py-3.5 px-4">Assigned By</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4">Completion Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHomework.map((hw) => {
                  const isPastDue = hw.due_date < todayStr;
                  const total = hw.total_students_count || 1;
                  const completed = hw.completed_submissions_count || 0;
                  const percent = Math.min(100, Math.round((completed / total) * 100));

                  return (
                    <tr key={hw.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Title & Subject */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition">
                            {hw.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              {hw.subject_name}
                            </span>
                            {hw.attachment_name && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Paperclip className="w-3 h-3 text-slate-400" />
                                {hw.attachment_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class & Section */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 text-xs px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                          {hw.class_name} • Sec {hw.section_name}
                        </span>
                      </td>

                      {/* Assigned Teacher / Staff */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {hw.teacher_name ? hw.teacher_name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">
                              {hw.teacher_name || 'Admin'}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {hw.teacher_emp_code || 'ADMIN'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 text-xs space-y-0.5">
                        <p className="text-slate-500">
                          Assigned: <span className="font-medium text-slate-700">{hw.assigned_date}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          Due:{' '}
                          <span
                            className={`font-semibold ${
                              isPastDue ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {hw.due_date}
                          </span>
                          {isPastDue ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-700 font-bold">
                              Closed
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                              Open
                            </span>
                          )}
                        </p>
                      </td>

                      {/* Completion Progress Bar */}
                      <td className="py-3.5 px-4 w-44">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700">
                              {completed} / {total}
                            </span>
                            <span className="text-indigo-600">{percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percent === 100
                                  ? 'bg-emerald-500'
                                  : percent > 50
                                  ? 'bg-indigo-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions: View, Edit, Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedHomework(hw)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(hw)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Homework"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHomework(hw)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Homework"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Homework Detail Modal */}
      {selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                  {selectedHomework.subject_name} • {selectedHomework.class_name} ({selectedHomework.section_name})
                </span>
                <h3 className="font-bold text-lg text-white mt-0.5">{selectedHomework.title}</h3>
              </div>
              <button
                onClick={() => setSelectedHomework(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Teacher Attribution Box */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedHomework.teacher_name ? selectedHomework.teacher_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Assigned by</p>
                    <p className="font-bold text-slate-800 text-sm">{selectedHomework.teacher_name}</p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-md text-slate-600 border border-slate-200">
                  {selectedHomework.teacher_emp_code}
                </span>
              </div>

              {/* Dates Strip */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-500">Assigned Date</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedHomework.assigned_date}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-500">Submission Due Date</p>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">{selectedHomework.due_date}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assignment Instructions & Description
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-200/80 whitespace-pre-wrap">
                  {selectedHomework.description}
                </div>
              </div>

              {/* Attachment if present */}
              {selectedHomework.attachment_name && (
                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    {selectedHomework.attachment_name}
                  </span>
                  <span className="text-slate-500">Attached Reference</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const hw = selectedHomework;
                  setSelectedHomework(null);
                  handleOpenEditModal(hw);
                }}
                className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => setSelectedHomework(null)}
                className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Upload Homework Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Assign & Upload Homework
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribute new homework or tasks to any class and section.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Class & Section Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      const cls = classes.find((c) => c.id === newClassId);
                      const firstSec = cls?.sections?.[0]?.id || '';
                      setFormData({
                        ...formData,
                        class_id: newClassId,
                        section_id: firstSec,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Choose Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Choose Section</option>
                    {formAvailableSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject & Assigning Staff */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>Choose Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assigned By (Staff/Teacher)
                  </label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Default (Admin / Self)</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.staff_name} {st.employee_code ? `(${st.employee_code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Homework Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Homework Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Practice Problems, Science Lab Report"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Assigned Date & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assigned Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.assigned_date}
                    onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Submission Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Instructions & Detailed Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed homework instructions, page numbers, or submission guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Attachment Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attachment Name / Reference File (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Worksheet_Chapter4.pdf, Quadratic_Formula_Guide.pdf"
                  value={formData.attachment_name}
                  onChange={(e) => setFormData({ ...formData, attachment_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  Assign Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Homework Modal */}
      {isEditModalOpen && editingHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-600" />
                  Edit Homework Assignment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modify homework title, instructions, deadlines, or target classroom.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateHomework} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Class & Section Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      const cls = classes.find((c) => c.id === newClassId);
                      const firstSec = cls?.sections?.[0]?.id || '';
                      setFormData({
                        ...formData,
                        class_id: newClassId,
                        section_id: firstSec,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {formAvailableSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject & Assigning Staff */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assigned By (Staff/Teacher)
                  </label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Default (Admin / Self)</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.staff_name} {st.employee_code ? `(${st.employee_code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Homework Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Homework Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Assigned Date & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assigned Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.assigned_date}
                    onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Submission Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Instructions & Detailed Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Attachment Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attachment Name / Reference File (Optional)
                </label>
                <input
                  type="text"
                  value={formData.attachment_name}
                  onChange={(e) => setFormData({ ...formData, attachment_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
