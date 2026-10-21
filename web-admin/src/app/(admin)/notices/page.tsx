'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Send,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  Bell,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminNoticeItem, ClassItem } from '@/lib/types';

const NOTICE_TEMPLATES = [
  {
    title: 'School Holiday Announcement',
    content: 'Please be informed that the school will remain closed tomorrow in observance of the upcoming public holiday. Regular classes will resume on the next working day.',
    priority: 'NORMAL' as const,
    target: 'ALL',
  },
  {
    title: 'Periodic Examination Schedule Released',
    content: 'The date sheet and syllabus for the upcoming Periodic Assessment have been published. All students are advised to download and prepare accordingly.',
    priority: 'INFO' as const,
    target: 'STUDENT',
  },
  {
    title: 'Urgent: Weather Advisory & Early Dispersal',
    content: 'Due to severe weather warnings issued by local authorities, school operations will end 1 hour early today. School transport will depart accordingly.',
    priority: 'URGENT' as const,
    target: 'ALL',
  },
  {
    title: 'Parent-Teacher Meeting (PTM) Scheduled',
    content: 'The upcoming Parent-Teacher Meeting is scheduled for this Saturday from 9:00 AM to 1:00 PM. Parents are requested to attend and review academic progress.',
    priority: 'NORMAL' as const,
    target: 'STUDENT',
  },
];

export default function NoticeManagementPage() {
  const [notices, setNotices] = useState<AdminNoticeItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [priority, setPriority] = useState<'INFO' | 'NORMAL' | 'URGENT'>('NORMAL');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Fetch notices & classes on mount
  const loadData = async () => {
    try {
      setLoading(true);
      const [noticesData, classesData] = await Promise.all([
        api.notices.list().catch(() => []),
        api.academics.getClasses().catch(() => []),
      ]);
      setNotices(noticesData || []);
      setClasses(classesData || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to load notices: ' + (err.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyTemplate = (tpl: typeof NOTICE_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    setPriority(tpl.priority);
    setTargetRole(tpl.target);
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter both Title and Content' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);
      await api.notices.create({
        title,
        content,
        target_role: targetRole,
        priority,
        target_class_id: selectedClassId || null,
        target_section_id: selectedSectionId || null,
      });

      setStatusMessage({ type: 'success', text: 'Notice published successfully! Live in student & teacher apps.' });
      setTitle('');
      setContent('');
      setSelectedClassId('');
      setSelectedSectionId('');
      setPriority('NORMAL');
      setTargetRole('ALL');
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to publish notice' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.notices.delete(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      setStatusMessage({ type: 'success', text: 'Notice deleted successfully' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete notice' });
    }
  };

  const selectedClass = classes.find((c) => c.class_id === selectedClassId);
  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <Megaphone className="w-4 h-4" />
            Communication Hub
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Publish & Manage Notices
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            1-Click broadcast notices to all students, specific classes, or faculty. Instantly synced with mobile dashboards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live App Sync Active
          </span>
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
          <div className="flex items-center gap-2 text-sm font-medium">
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

      {/* Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-slate-900 text-base">New Notice Composer</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Step-by-step broadcast</span>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Preset Templates:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {NOTICE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.title}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition cursor-pointer"
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePublishNotice} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Notice Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Annual Sports Meet 2026 Registration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
              />
            </div>

            {/* Target Audience & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Audience
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All School (Students + Teachers)</option>
                  <option value="STUDENT">Students & Parents Only</option>
                  <option value="TEACHER">Faculty & Staff Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority Badge
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="NORMAL">Normal Announcement</option>
                  <option value="INFO">Important / Exam Info</option>
                  <option value="URGENT">Urgent / Emergency Alert</option>
                </select>
              </div>
            </div>

            {/* Optional Class & Section Filter */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Target Specific Class (Optional):</span>
                <span className="text-[11px] text-slate-400">Leave blank for all classes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedSectionId('');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      Class {cls.class_name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={!selectedClassId}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">All Sections</option>
                  {selectedClass?.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Notice Content / Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Write the complete announcement details here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Broadcasting...' : 'Publish Notice Live'}
            </button>
          </form>
        </div>

        {/* Live App Sync Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
                  Student Mobile App Preview
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Live Rendering
              </span>
            </div>

            <p className="text-xs text-slate-400">
              This card illustrates exactly how the notice appears inside the Student Dashboard after publishing:
            </p>

            {/* Mock Mobile Notice Card */}
            <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    priority === 'URGENT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : priority === 'INFO'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {priority}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Just now
                </span>
              </div>

              <h4 className="font-bold text-white text-sm">
                {title.trim() || 'Notice Title Will Appear Here'}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {content.trim() || 'Notice description and announcement text will be displayed to the student.'}
              </p>

              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
                <span>Audience: {targetRole}</span>
                {selectedClass && <span>Class: {selectedClass.class_name}</span>}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-slate-500">Active Notices</div>
              <div className="text-2xl font-bold text-slate-900">{notices.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Published Notices Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Published Notices Feed</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredNotices.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Only</option>
              <option value="INFO">Info Only</option>
              <option value="NORMAL">Normal Only</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 md:w-56"
              />
            </div>
          </div>
        </div>

        {/* Notices Table / List */}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading notices feed...</div>
        ) : filteredNotices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Megaphone className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm">No notices published yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotices.map((n) => (
              <div key={n.id} className="p-5 hover:bg-slate-50 transition flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        n.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-700'
                          : n.priority === 'INFO'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {n.priority}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      Target: {n.target_role}
                    </span>
                    {n.class_name && (
                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Class {n.class_name} {n.section_name ? `(${n.section_name})` : ''}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(n.published_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-900 text-sm">{n.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                </div>

                <button
                  onClick={() => handleDeleteNotice(n.id)}
                  title="Delete notice"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
