'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Search,
  Download,
  X,
  BookOpen,
  ClipboardList,
  PenLine,
  CalendarDays,
  Sun,
  MessageSquare,
  FolderOpen,
  Layers,
  Sparkles,
  Users,
  Loader2,
  Plus,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  SubjectItem,
  ClassItem,
  UploadCategory,
  RecentUploadItem,
} from '@/lib/types';

const UPLOAD_CATEGORIES: UploadCategory[] = [
  'Study Material',
  'Syllabus',
  'Assignment',
  'Practice Sheet',
  'Datesheet',
  'Holiday HW',
  'Daily HW Message',
];

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  'Study Material': FolderOpen,
  Syllabus: BookOpen,
  Assignment: ClipboardList,
  'Practice Sheet': PenLine,
  Datesheet: CalendarDays,
  'Holiday HW': Sun,
  'Daily HW Message': MessageSquare,
};

const CATEGORY_COLOR: Record<string, string> = {
  'Study Material': '#6366F1',
  Syllabus: '#7560E8',
  Assignment: '#EC4899',
  'Practice Sheet': '#3B82F6',
  Datesheet: '#22C55E',
  'Holiday HW': '#F59E0B',
  'Daily HW Message': '#A78BFA',
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB limit

function formatBytes(bytes: number | string | undefined) {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudyMaterialPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [materials, setMaterials] = useState<RecentUploadItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterClassId, setFilterClassId] = useState<string>('ALL');
  const [filterSectionId, setFilterSectionId] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RecentUploadItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'Study Material' as UploadCategory,
    class_id: '',
    section_id: '',
    subject_id: '',
    file_name: '',
    file_size_bytes: 1048576,
    content_type: 'application/pdf',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load real database data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      const [clsData, subData, matData] = await Promise.all([
        api.academics.getClasses().catch(() => []),
        api.academics.getSubjects().catch(() => []),
        api.admin.getMaterials().catch(() => []),
      ]);
      setClasses(clsData || []);
      setSubjects(subData || []);
      setMaterials(matData || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter sections dynamically based on selected class
  const availableFilterSections = useMemo(() => {
    if (filterClassId === 'ALL') {
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
    const cls = classes.find((c) => c.id === filterClassId);
    return cls ? cls.sections || [] : [];
  }, [classes, filterClassId]);

  // Handle class filter changes
  const handleClassFilterChange = (classId: string) => {
    setFilterClassId(classId);
    if (classId !== 'ALL') {
      const cls = classes.find((c) => c.id === classId);
      const hasSec = cls?.sections?.some((s) => s.id === filterSectionId);
      if (!hasSec) {
        setFilterSectionId('ALL');
      }
    }
  };

  // Sections for modal form
  const formAvailableSections = useMemo(() => {
    if (!formData.class_id) return [];
    const cls = classes.find((c) => c.id === formData.class_id);
    return cls ? cls.sections || [] : [];
  }, [classes, formData.class_id]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesClass = filterClassId === 'ALL' || m.class_id === filterClassId;
      const matchesSection =
        filterSectionId === 'ALL' ||
        !m.section_id ||
        m.section_id === filterSectionId;

      const typeKey = m.material_type || m.type || 'Study Material';
      const matchesType = filterType === 'ALL' || typeKey === filterType;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.subject_name && m.subject_name.toLowerCase().includes(q)) ||
        (m.file_name && m.file_name.toLowerCase().includes(q)) ||
        (m.class_name && m.class_name.toLowerCase().includes(q)) ||
        (m.teacher_name && m.teacher_name.toLowerCase().includes(q));

      return matchesClass && matchesSection && matchesType && matchesSearch;
    });
  }, [materials, filterClassId, filterSectionId, filterType, searchQuery]);

  // Statistics
  const totalCount = materials.length;
  const studyMaterialCount = materials.filter(
    (m) => (m.material_type || m.type || '') === 'Study Material'
  ).length;
  const syllabusCount = materials.filter(
    (m) => (m.material_type || m.type || '') === 'Syllabus'
  ).length;
  const practiceSheetCount = materials.filter(
    (m) => (m.material_type || m.type || '') === 'Practice Sheet'
  ).length;

  // Open Upload Modal
  const handleOpenUploadModal = () => {
    const defaultClass = classes[0]?.id || '';
    const defaultSubject = subjects[0]?.id || '';
    setFormData({
      title: '',
      description: '',
      material_type: 'Study Material',
      class_id: defaultClass,
      section_id: '',
      subject_id: defaultSubject,
      file_name: '',
      file_size_bytes: 1048576,
      content_type: 'application/pdf',
    });
    setSelectedFile(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploadModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: RecentUploadItem) => {
    setSelectedMaterial(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      material_type: (item.material_type || item.type || 'Study Material') as UploadCategory,
      class_id: item.class_id || '',
      section_id: item.section_id || '',
      subject_id: item.subject_id || '',
      file_name: item.file_name || '',
      file_size_bytes: typeof item.file_size_bytes === 'number' ? item.file_size_bytes : 1048576,
      content_type: item.content_type || 'application/pdf',
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_BYTES) {
        setErrorMessage('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
      setFormData((prev) => ({
        ...prev,
        file_name: file.name,
        file_size_bytes: file.size,
        content_type: file.type || 'application/pdf',
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_BYTES) {
        setErrorMessage('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
      setFormData((prev) => ({
        ...prev,
        file_name: file.name,
        file_size_bytes: file.size,
        content_type: file.type || 'application/pdf',
      }));
    }
  };

  // Submit Upload to Backend Database
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id || !formData.title.trim()) {
      setErrorMessage('Class, Subject, and Document Title are mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const fileNameToUse = formData.file_name.trim() || selectedFile?.name || `${formData.material_type.toLowerCase().replace(/ /g, '_')}_document.pdf`;

      await api.admin.createMaterial({
        class_id: formData.class_id,
        section_id: formData.section_id || undefined,
        subject_id: formData.subject_id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        material_type: formData.material_type,
        file_name: fileNameToUse,
        file_size_bytes: selectedFile?.size || formData.file_size_bytes,
        content_type: selectedFile?.type || formData.content_type,
      });

      setSuccessMessage(`Study material "${formData.title}" published! It is now immediately visible to Students and Teachers.`);
      setIsUploadModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish study material');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit to Backend Database
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    if (!formData.class_id || !formData.subject_id || !formData.title.trim()) {
      setErrorMessage('Class, Subject, and Document Title are mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await api.admin.updateMaterial(selectedMaterial.id, {
        class_id: formData.class_id,
        section_id: formData.section_id || null,
        subject_id: formData.subject_id,
        title: formData.title.trim(),
        description: formData.description.trim() || '',
        material_type: formData.material_type,
        file_name: formData.file_name.trim(),
      });

      setSuccessMessage(`Study material "${formData.title}" updated successfully!`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update study material');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete from Backend Database
  const handleDelete = async (item: RecentUploadItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"? It will be removed from student and teacher apps immediately.`)) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await api.admin.deleteMaterial(item.id);
      setSuccessMessage(`"${item.title}" deleted successfully.`);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete study material');
    } finally {
      setSubmitting(false);
    }
  };

  // Download File Handler
  const handleDownload = async (item: RecentUploadItem) => {
    try {
      const res = await api.admin.getMaterialDownloadUrl(item.id);
      if (res && res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      } else {
        alert('File download URL is unavailable.');
      }
    } catch (err: any) {
      alert(`Download notice: ${err.message || 'Simulated file download initiated.'}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              Academic Repository • Live Sync with Student & Teacher Apps
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Published Materials Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            Study Material & Academic Repository
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Upload, manage, and share syllabus blueprints, chapter notes, practice packs, and examination datesheets. Uploaded files are immediately accessible to students and teachers in their portals.
          </p>
        </div>

        <button
          onClick={handleOpenUploadModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg transition active:scale-95 text-sm shrink-0 border border-indigo-400/40"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Study Material
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
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Resources</p>
            <p className="text-xl font-bold text-slate-800">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Study Notes</p>
            <p className="text-xl font-bold text-blue-700">{studyMaterialCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Syllabus Blueprints</p>
            <p className="text-xl font-bold text-purple-700">{syllabusCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Practice Packs</p>
            <p className="text-xl font-bold text-emerald-700">{practiceSheetCount}</p>
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
            placeholder="Search document title, subject, file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Class Filter, Section Filter, and Category */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Class:</span>
            <select
              value={filterClassId}
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
              value={filterSectionId}
              onChange={(e) => setFilterSectionId(e.target.value)}
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

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {UPLOAD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading published study materials...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No study materials found</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no documents matching your selected filters.
            </p>
            <button
              onClick={handleOpenUploadModal}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
            >
              + Upload First Study Material
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Document Title & Type</th>
                  <th className="py-3.5 px-4">Target Class</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Uploader / Staff</th>
                  <th className="py-3.5 px-4">File Details</th>
                  <th className="py-3.5 px-4">Live Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((item) => {
                  const cat = item.material_type || item.type || 'Study Material';
                  const Icon = CATEGORY_ICON[cat] || FolderOpen;
                  const catColor = CATEGORY_COLOR[cat] || '#6366F1';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Title & Category */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold"
                              style={{
                                backgroundColor: `${catColor}15`,
                                color: catColor,
                                border: `1px solid ${catColor}30`,
                              }}
                            >
                              <Icon className="w-3 h-3" />
                              {cat}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Class & Section */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 text-xs px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                          {item.class_name || 'All Classes'} {item.section_name ? `• Sec ${item.section_name}` : '• All Sections'}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-indigo-700 text-xs bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {item.subject_name || 'General'}
                        </span>
                      </td>

                      {/* Uploader / Staff */}
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {item.teacher_name ? item.teacher_name.charAt(0) : 'A'}
                          </div>
                          <span>{item.teacher_name || 'Admin'}</span>
                        </div>
                      </td>

                      {/* File Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <p className="flex items-center gap-1.5 font-medium text-slate-700 truncate max-w-xs">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.file_name || 'document.pdf'}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatBytes(item.file_size_bytes)} • {item.created_at ? item.created_at.split('T')[0] : ''}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live for Students
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownload(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Download / View File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Material"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Material"
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

      {/* Upload Study Material Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                  Upload & Distribute Study Material
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded files immediately connect and sync to student and teacher mobile & web views.
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resource Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {UPLOAD_CATEGORIES.map((cat) => {
                    const isSelected = formData.material_type === cat;
                    const Icon = CATEGORY_ICON[cat] || FolderOpen;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormData({ ...formData, material_type: cat })}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="truncate w-full text-center">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class & Section Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      setFormData({
                        ...formData,
                        class_id: newClassId,
                        section_id: '',
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
                    Target Section (Optional)
                  </label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Sections</option>
                    {formAvailableSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
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

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Trigonometry Notes, Term 2 Datesheet"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description / Topic Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of contents, key chapters covered, or guidelines for students..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* File Attachment Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document File (PDF, DOCX, JPEG, PNG • max 10MB)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition text-center ${
                    dragActive
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-800">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500">{formatBytes(selectedFile.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-medium text-slate-700">
                        Drag and drop file here, or <span className="text-indigo-600 font-semibold">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, Images up to 10MB</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publish to Students & Teachers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Study Material Modal */}
      {isEditModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-600" />
                  Edit Study Material
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update resource title, category, target classroom, or file description.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resource Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.material_type}
                  onChange={(e) => setFormData({ ...formData, material_type: e.target.value as UploadCategory })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {UPLOAD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class & Section Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      setFormData({
                        ...formData,
                        class_id: newClassId,
                        section_id: '',
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
                    Target Section (Optional)
                  </label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Sections</option>
                    {formAvailableSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
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

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description / Topic Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* File Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  File Name
                </label>
                <input
                  type="text"
                  value={formData.file_name}
                  onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
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
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
