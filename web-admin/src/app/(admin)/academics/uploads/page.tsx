'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
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
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  SubjectItem,
  SectionSummary,
  UploadCategory,
  RecentUploadItem,
} from '@/lib/types';

const UPLOAD_CATEGORIES: UploadCategory[] = [
  'Syllabus',
  'Assignment',
  'Practice Sheet',
  'Datesheet',
  'Holiday HW',
  'Daily HW Message',
];

const CATEGORY_ICON: Record<UploadCategory, React.ComponentType<{ className?: string }>> = {
  Syllabus: BookOpen,
  Assignment: ClipboardList,
  'Practice Sheet': PenLine,
  Datesheet: CalendarDays,
  'Holiday HW': Sun,
  'Daily HW Message': MessageSquare,
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INITIAL_RECENT_UPLOADS: RecentUploadItem[] = [
  {
    id: 'up-1',
    title: 'Grade 10 Mid-Term Examination Datesheet',
    type: 'Datesheet',
    class_name: 'Grade 10',
    section_name: 'A',
    subject_name: 'All Subjects',
    file_name: 'datesheet_term1_2026.pdf',
    created_at: '2026-10-14',
    status: 'Active',
  },
  {
    id: 'up-2',
    title: 'Trigonometry & Quadratic Equations Practice Pack',
    type: 'Practice Sheet',
    class_name: 'Grade 10',
    section_name: 'A',
    subject_name: 'Mathematics',
    file_name: 'math10_quadratics_worksheet.pdf',
    created_at: '2026-10-13',
    status: 'Active',
  },
  {
    id: 'up-3',
    title: 'Science Term 2 Complete Curriculum Blueprint',
    type: 'Syllabus',
    class_name: 'Grade 10',
    section_name: 'A',
    subject_name: 'Science',
    file_name: 'sci10_term2_syllabus.pdf',
    created_at: '2026-10-10',
    status: 'Active',
  },
  {
    id: 'up-4',
    title: 'Autumn Vacation English Creative Essay Project',
    type: 'Holiday HW',
    class_name: 'Grade 10',
    section_name: 'A',
    subject_name: 'English',
    file_name: 'holiday_hw_essay_guide.pdf',
    created_at: '2026-10-08',
    status: 'Active',
  },
];

export default function UnifiedUploadsPage() {
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [uploads, setUploads] = useState<RecentUploadItem[]>(INITIAL_RECENT_UPLOADS);

  // Form State
  const [uploadType, setUploadType] = useState<UploadCategory>('Assignment');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load classes & subjects
  useEffect(() => {
    const loadLookups = async () => {
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
        if (subs.length > 0) {
          setSelectedSubjectId(subs[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching lookups:', err);
      }
    };
    loadLookups();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Drag and drop feeds the same selectedFile state as the file picker.
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setSelectedFile(dropped);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Document Title is required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      // Find class and section names
      const curSec = sections.find(
        (s) => s.class_id === selectedClassId && s.section_id === selectedSectionId
      );
      const curSub = subjects.find((s) => s.id === selectedSubjectId);

      // Create new upload item in recent list
      const newItem: RecentUploadItem = {
        id: `up-${Date.now()}`,
        title: title.trim(),
        type: uploadType,
        class_name: curSec?.class_name || 'Grade 10',
        section_name: curSec?.section_name || 'A',
        subject_name: curSub?.name || 'General',
        file_name: selectedFile?.name || `${uploadType.toLowerCase().replace(/ /g, '_')}_document.pdf`,
        created_at: new Date().toISOString().split('T')[0],
        status: 'Active',
      };

      // Emulate or post to backend (homework endpoint or simulated materials)
      await new Promise((r) => setTimeout(r, 400));

      setUploads([newItem, ...uploads]);
      setFeedback({
        type: 'success',
        message: `"${title}" successfully published to the ${curSec?.class_name || ''} academic repository.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      handleRemoveFile();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish upload' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setUploads(uploads.filter((u) => u.id !== id));
    setFeedback({ type: 'success', message: 'Upload successfully removed.' });
  };

  const filteredUploads = uploads.filter((u) => {
    const matchesQuery =
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.class_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;
    if (filterType !== 'ALL' && u.type !== filterType) return false;
    return true;
  });

  // Live summary of what the publish button will send
  const curSecLabel = (() => {
    const s = sections.find((x) => x.class_id === selectedClassId && x.section_id === selectedSectionId);
    return s ? `${s.class_name} · Sec ${s.section_name}` : 'No section selected';
  })();
  const curSubLabel = subjects.find((s) => s.id === selectedSubjectId)?.name || 'General / All Subjects';
  const fileTooLarge = !!selectedFile && selectedFile.size > MAX_FILE_BYTES;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-9rem)] min-h-0">
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:flex-1 lg:min-h-0">
        {/* Left: publish form */}
        <form
          onSubmit={handleFormSubmit}
          className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-3.5 lg:min-h-0 lg:overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Publish Academic Resource</span>
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              New Upload
            </span>
          </div>

          {/* Upload Type Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Upload Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {UPLOAD_CATEGORIES.map((cat) => {
                const selected = uploadType === cat;
                const Icon = CATEGORY_ICON[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setUploadType(cat)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Class & Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class & Section</label>
              <select
                value={`${selectedClassId}_${selectedSectionId}`}
                onChange={(e) => {
                  const [c, s] = e.target.value.split('_');
                  setSelectedClassId(c);
                  setSelectedSectionId(s);
                }}
                className="w-full py-1.5 px-2 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 outline-none"
              >
                {sections.map((s) => (
                  <option key={`${s.class_id}_${s.section_id}`} value={`${s.class_id}_${s.section_id}`}>
                    {s.class_name} · Sec {s.section_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full py-1.5 px-2 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 outline-none"
              >
                <option value="">General / All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document / Assignment Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Chapter 6 Triangles & Coordinate Geometry"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions / Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Submission instructions, questions, or exam guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {/* Attachment: click or drag a file in */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment (PDF, DOCX, Images)</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex items-center gap-3 rounded-lg border-2 border-dashed px-3.5 py-3 transition-colors ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-300 bg-slate-50/60 hover:border-indigo-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="fileUpload"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg"
              />
              <label htmlFor="fileUpload" className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Paperclip className="w-4 h-4 text-indigo-600" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-indigo-700 truncate">
                    {selectedFile ? selectedFile.name : 'Choose a file or drop it here'}
                  </span>
                  <span className={`block text-[10px] ${fileTooLarge ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                    {selectedFile
                      ? `${formatBytes(selectedFile.size)}${fileTooLarge ? ' · larger than the 10MB limit' : ''}`
                      : 'Max size 10MB'}
                  </span>
                </span>
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Live summary + publish */}
          <div className="mt-auto pt-1 space-y-2.5">
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-600 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-slate-400">Will publish</span>
              <span className="font-semibold text-slate-900">{uploadType}</span>
              <span>·</span>
              <span>{curSecLabel}</span>
              <span>·</span>
              <span>{curSubLabel}</span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{submitting ? 'Broadcasting Resource...' : 'Publish to Students & Faculty'}</span>
            </button>
          </div>
        </form>

        {/* Right: recent uploads repository */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Recent Academic Uploads ({filteredUploads.length})
              </h3>
              <p className="text-xs text-slate-500">Live school repository records</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:border-indigo-500 outline-none w-36 sm:w-44 text-slate-800"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="py-1.5 px-2 text-xs rounded-md border border-slate-200 text-slate-700 bg-white focus:border-indigo-500 outline-none"
              >
                <option value="ALL">All Types</option>
                {UPLOAD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Resource & Class</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">File</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUploads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No matching academic resources found.
                    </td>
                  </tr>
                ) : (
                  filteredUploads.map((item) => {
                    const Icon = CATEGORY_ICON[item.type];
                    return (
                      <tr key={item.id} className="group hover:bg-indigo-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 leading-snug">{item.title}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {item.class_name} · Sec {item.section_name} · {item.created_at}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setFilterType(item.type)}
                            title={`Show only ${item.type}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            {Icon && <Icon className="w-3 h-3" />}
                            <span>{item.type}</span>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-slate-700 font-medium text-[11px]">
                          {item.subject_name || 'All Subjects'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] max-w-[140px]">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.file_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => alert(`Previewing resource: ${item.title}`)}
                            title="View / Download"
                            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors mr-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
