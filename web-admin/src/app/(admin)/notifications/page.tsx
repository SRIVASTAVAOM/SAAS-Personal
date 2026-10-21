'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Trash2,
  Loader2,
  Search,
  Filter,
  Check,
  Volume2,
  MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ClassItem, AdminNoticeItem } from '@/lib/types';

interface StudentLookupItem {
  id: string;
  first_name: string;
  last_name: string;
  student_name: string;
  admission_number: string;
  roll_number: string | null;
  class_name: string | null;
  section_name: string | null;
}

export default function NotificationsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allStudents, setAllStudents] = useState<StudentLookupItem[]>([]);
  const [notices, setNotices] = useState<AdminNoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Notification form state
  const [targetScope, setTargetScope] = useState<'ALL' | 'CLASS' | 'SINGLE'>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'INFO' | 'NORMAL' | 'URGENT'>('NORMAL');
  const [channel, setChannel] = useState<'IN_APP' | 'PUSH' | 'SMS'>('PUSH');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [clsData, stData, noticesData] = await Promise.all([
        api.academics.getClasses().catch(() => []),
        api.admin.getStudents().catch(() => []),
        api.notices.list().catch(() => []),
      ]);
      setClasses(clsData || []);
      setAllStudents(stData || []);
      setNotices(noticesData || []);

      if (clsData && clsData.length > 0) {
        setSelectedClassId(clsData[0].id);
        if (clsData[0].sections && clsData[0].sections.length > 0) {
          setSelectedSectionId(clsData[0].sections[0].id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize notification center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Filter student candidates when targeting single student
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return allStudents.slice(0, 10);
    const q = studentSearch.toLowerCase();
    return allStudents.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        s.admission_number.toLowerCase().includes(q) ||
        (s.roll_number && s.roll_number.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [allStudents, studentSearch]);

  const selectedStudent = useMemo(
    () => allStudents.find((s) => s.id === selectedStudentId),
    [allStudents, selectedStudentId]
  );

  // Quick preset templates
  const applyPreset = (template: {
    title: string;
    content: string;
    priority: 'INFO' | 'NORMAL' | 'URGENT';
    channel: 'IN_APP' | 'PUSH' | 'SMS';
  }) => {
    setTitle(template.title);
    setContent(template.content);
    setPriority(template.priority);
    setChannel(template.channel);
  };

  // Submit Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage('Please enter both a title and notification message.');
      return;
    }

    if (targetScope === 'SINGLE' && !selectedStudentId) {
      setErrorMessage('Please select a specific student from the list.');
      return;
    }

    try {
      setSending(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      let targetClass: string | null = null;
      let targetSection: string | null = null;
      let targetStudent: string | null = null;

      if (targetScope === 'CLASS') {
        targetClass = selectedClassId || null;
        targetSection = selectedSectionId || null;
      } else if (targetScope === 'SINGLE') {
        targetStudent = selectedStudentId;
      }

      await api.notices.create({
        title: title.trim(),
        content: content.trim(),
        target_role: 'STUDENT',
        target_class_id: targetClass,
        target_section_id: targetSection,
        target_student_id: targetStudent,
        priority,
        channel,
      });

      setSuccessMessage(
        targetScope === 'SINGLE'
          ? `Notification successfully dispatched to student "${selectedStudent?.student_name}"!`
          : targetScope === 'CLASS'
          ? `Notification broadcasted to Class ${currentClass?.name}!`
          : 'Notification dispatched to All Students mobile apps!'
      );

      // Reset form
      setTitle('');
      setContent('');
      setSelectedStudentId('');
      setStudentSearch('');

      // Refresh list
      const updated = await api.notices.list();
      setNotices(updated || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch notification');
    } finally {
      setSending(false);
    }
  };

  // Delete notice / recall notification
  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to recall this notification from student feeds?')) {
      return;
    }
    try {
      await api.notices.delete(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      setSuccessMessage('Notification recalled successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to recall notification');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Menu 10 • Send Notifications
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Flutter App Push
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-400" />
            Push & In-App Notification Center
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Dispatch instant notifications to all students, a specific class, or any single student in one click. Sent messages appear directly on the student dashboard and mobile device notifications.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Composer on Left, Mobile Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Notification Composer (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              Compose New Notification
            </h2>
            <span className="text-xs text-slate-400">Step 1 of 2</span>
          </div>

          {/* Quick Presets Strip */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Quick 1-Click Templates
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    title: 'Urgent: Fee Payment Balance Due',
                    content:
                      'Dear Student/Parent, your pending school fee installment is due this week. Please clear it online or at the accounts counter to avoid late charges.',
                    priority: 'URGENT',
                    channel: 'PUSH',
                  })
                }
                className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-medium transition"
              >
                🔴 Fee Dues Alert
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    title: 'Attendance Shortage Warning (<75%)',
                    content:
                      'Attention: Your cumulative attendance has fallen below the 75% minimum academic requirement. Please meet the class coordinator immediately.',
                    priority: 'URGENT',
                    channel: 'PUSH',
                  })
                }
                className="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-medium transition"
              >
                ⚠️ Attendance Shortage
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    title: 'Parent-Teacher Meeting (PTM) Scheduled',
                    content:
                      'School PTM is scheduled this Saturday from 09:00 AM to 01:00 PM. Parents are warmly invited to discuss student progress with faculty.',
                    priority: 'NORMAL',
                    channel: 'PUSH',
                  })
                }
                className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-medium transition"
              >
                📅 PTM Notice
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    title: 'Special Extra Class Announcement',
                    content:
                      'There will be a special revision session tomorrow morning at 07:30 AM before regular periods. Attendance is compulsory.',
                    priority: 'INFO',
                    channel: 'IN_APP',
                  })
                }
                className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-medium transition"
              >
                📘 Extra Class
              </button>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            {/* Target Scope Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Target Audience *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetScope('ALL')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    targetScope === 'ALL'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  All Students (Broadcast)
                </button>

                <button
                  type="button"
                  onClick={() => setTargetScope('CLASS')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    targetScope === 'CLASS'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Specific Class
                </button>

                <button
                  type="button"
                  onClick={() => setTargetScope('SINGLE')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    targetScope === 'SINGLE'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Single Student (1-to-1)
                </button>
              </div>
            </div>

            {/* Target Scope Options: Class / Section */}
            {targetScope === 'CLASS' && (
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Select Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Select Section
                  </label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">All Sections</option>
                    {currentClass?.sections?.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Target Scope Options: Single Student Selector */}
            {targetScope === 'SINGLE' && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Search & Select Student *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by student name or admission number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Candidate Selection List */}
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg">
                  {filteredStudents.length === 0 ? (
                    <p className="p-3 text-center text-xs text-slate-400">No students found.</p>
                  ) : (
                    filteredStudents.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition ${
                          selectedStudentId === st.id
                            ? 'bg-indigo-50 text-indigo-800 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{st.student_name}</p>
                          <p className="text-[10px] text-slate-400">
                            Adm: {st.admission_number} • Class {st.class_name || '—'} ({st.section_name || '—'})
                          </p>
                        </div>
                        {selectedStudentId === st.id && (
                          <Check className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {selectedStudent && (
                  <p className="text-xs text-emerald-700 font-medium">
                    ✓ Selected: {selectedStudent.student_name} ({selectedStudent.admission_number})
                  </p>
                )}
              </div>
            )}

            {/* Channels & Priority Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Channel
                </label>
                <select
                  value={channel}
                  onChange={(e: any) => setChannel(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="PUSH">App Push Notification (Sound & Popup)</option>
                  <option value="IN_APP">In-App Notice Board Only</option>
                  <option value="SMS">SMS Gateway Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alert Priority
                </label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="NORMAL">NORMAL (Default Notice)</option>
                  <option value="URGENT">URGENT (Red Badge & Urgent Sound)</option>
                  <option value="INFO">INFO (General Announcement)</option>
                </select>
              </div>
            </div>

            {/* Notification Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notification Headline / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Urgent Reminder: Terminal Exam Hall Ticket"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Notification Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notification Message Body *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Write the exact text that will appear in the push alert and student feed..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Broadcasting Notification...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Dispatch Notification to Student App
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Mobile Preview & Sent History (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Smartphone Mockup */}
          <div className="bg-slate-900 p-5 rounded-3xl shadow-xl text-white border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="w-4 h-4" />
                Live Student App Preview
              </span>
              <span className="text-[10px] text-slate-400">iOS / Android Flutter</span>
            </div>

            {/* Phone Screen Frame */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              {/* Push notification banner */}
              <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/80 shadow-lg space-y-1 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-indigo-400" />
                    School ERP Alert
                  </span>
                  <span>Just now</span>
                </div>
                <p className="font-bold text-xs text-white line-clamp-1">
                  {title || 'Urgent Academic Notice'}
                </p>
                <p className="text-[11px] text-slate-300 line-clamp-2">
                  {content ||
                    'Notification message preview will appear here in real time as you type...'}
                </p>
              </div>

              {/* In-App Notice Card Preview */}
              <div className="p-3 bg-white text-slate-800 rounded-xl shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-700'
                        : priority === 'INFO'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {priority}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {targetScope === 'SINGLE'
                      ? `To: ${selectedStudent?.student_name || 'Rahul'}`
                      : targetScope === 'CLASS'
                      ? `To: Class ${currentClass?.name || '10'}`
                      : 'To: All Students'}
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-900">{title || 'Notice Headline'}</p>
                <p className="text-[11px] text-slate-600 line-clamp-3">
                  {content || 'Detailed announcement content displayed on mobile dashboard.'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Sent Broadcasts */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Recently Dispatched ({notices.length})
            </h3>

            <div className="space-y-2.5 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notices.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">No recent notifications.</p>
              ) : (
                notices.slice(0, 8).map((n) => (
                  <div key={n.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            n.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {n.priority}
                        </span>
                        <p className="font-semibold text-xs text-slate-800 line-clamp-1">
                          {n.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {n.content}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(n.published_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      title="Recall notification"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
