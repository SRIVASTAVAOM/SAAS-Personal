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
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ClassItem } from '@/lib/types';

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

export default function HomeworkPage() {
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAST_DUE'>('ALL');
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch classes and homework
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clsData, hwData] = await Promise.all([
          api.academics.getClasses().catch(() => []),
          api.admin.getHomework().catch(() => []),
        ]);
        setClasses(clsData || []);
        setHomeworkList(hwData || []);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load homework data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter homework
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredHomework = useMemo(() => {
    return homeworkList.filter((hw) => {
      const matchesClass = selectedClassId === 'ALL' || hw.class_id === selectedClassId;

      const isPastDue = hw.due_date < todayStr;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !isPastDue) ||
        (statusFilter === 'PAST_DUE' && isPastDue);

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        hw.title.toLowerCase().includes(q) ||
        hw.description.toLowerCase().includes(q) ||
        hw.teacher_name.toLowerCase().includes(q) ||
        hw.subject_name.toLowerCase().includes(q) ||
        hw.class_name.toLowerCase().includes(q);

      return matchesClass && matchesStatus && matchesSearch;
    });
  }, [homeworkList, selectedClassId, statusFilter, searchQuery, todayStr]);

  // KPIs
  const totalAssignments = homeworkList.length;
  const activeAssignments = homeworkList.filter((h) => h.due_date >= todayStr).length;
  const totalSubmissions = homeworkList.reduce(
    (acc, h) => acc + (h.completed_submissions_count || 0),
    0
  );
  const uniqueTeachers = new Set(homeworkList.map((h) => h.teacher_id)).size;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Menu 11 • View Homework
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Teacher Attribution Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            Class Homework & Curriculum Monitor
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Inspect all homework assignments given across school classes. Identify which teacher assigned each task, track student completion rates, and verify submission deadlines.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, teacher, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Class Selection & Status Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Class {cls.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('PAST_DUE')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
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

      {/* Homework Grid / Table */}
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
              There are no assignments matching your selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Homework Title & Subject</th>
                  <th className="py-3.5 px-4">Class & Section</th>
                  <th className="py-3.5 px-4">Assigned By (Teacher)</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4">Completion Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHomework.map((hw) => {
                  const isPastDue = hw.due_date < todayStr;
                  const total = hw.total_students_count || 1;
                  const completed = hw.completed_submissions_count || 0;
                  const percent = Math.min(100, Math.round((completed / total) * 100));

                  return (
                    <tr key={hw.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title & Subject */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800 text-sm line-clamp-1">
                            {hw.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              {hw.subject_name}
                            </span>
                            {hw.attachment_name && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Paperclip className="w-3 h-3" />
                                {hw.attachment_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class & Section */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 text-xs px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                          Class {hw.class_name} • Sec {hw.section_name}
                        </span>
                      </td>

                      {/* Assigned Teacher (Key Requirement) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {hw.teacher_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">
                              {hw.teacher_name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {hw.teacher_emp_code}
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

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedHomework(hw)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Homework Detail Modal */}
      {selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                  {selectedHomework.subject_name} • Class {selectedHomework.class_name} ({selectedHomework.section_name})
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
                    {selectedHomework.teacher_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Assigned by Teacher</p>
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
                  <span className="text-slate-500">Attached File</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
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
    </div>
  );
}
