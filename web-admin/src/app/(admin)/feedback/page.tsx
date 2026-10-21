'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  User,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';

interface FeedbackItem {
  id: string;
  category: string;
  rating: number;
  feedback_text: string;
  created_at: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  roll_number: string | null;
  class_name: string | null;
  section_name: string | null;
}

interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED';
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  roll_number: string | null;
  class_name: string | null;
  section_name: string | null;
}

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<'FEEDBACK' | 'COMPLAINTS'>('FEEDBACK');
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [complaintsList, setComplaintsList] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Resolution modal state
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'PENDING' | 'IN_REVIEW' | 'RESOLVED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch feedback and complaints
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getFeedback();
      setFeedbackList(data?.feedback || []);
      setComplaintsList(data?.complaints || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load feedbacks & complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update complaint resolution
  const handleResolveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setResolving(true);
      setErrorMessage(null);
      await api.admin.updateComplaintStatus(selectedComplaint.id, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes.trim() || undefined,
      });

      setSuccessMessage(`Grievance "${selectedComplaint.title}" status updated to ${resolutionStatus}!`);
      setSelectedComplaint(null);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update grievance status');
    } finally {
      setResolving(false);
    }
  };

  // KPIs
  const totalFeedback = feedbackList.length;
  const avgRating =
    totalFeedback > 0
      ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / totalFeedback).toFixed(1)
      : '5.0';
  const pendingComplaints = complaintsList.filter((c) => c.status === 'PENDING').length;
  const resolvedComplaints = complaintsList.filter((c) => c.status === 'RESOLVED').length;

  // Filtered feedback
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((f) => {
      const matchesCat = categoryFilter === 'ALL' || f.category === categoryFilter;
      const matchesRating = ratingFilter === 'ALL' || f.rating.toString() === ratingFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        f.feedback_text.toLowerCase().includes(q) ||
        f.student_name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q);

      return matchesCat && matchesRating && matchesSearch;
    });
  }, [feedbackList, categoryFilter, ratingFilter, searchQuery]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaintsList.filter((c) => {
      const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.student_name.toLowerCase().includes(q);

      return matchesCat && matchesStatus && matchesSearch;
    });
  }, [complaintsList, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Menu 7 • Student Voice
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Parent & Student Connected
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-indigo-400" />
            Feedback & Grievances Portal
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Review student feedback, experience ratings, and resolve raised tickets or complaints submitted via the Student Mobile App.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-white/10 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'FEEDBACK'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Ratings & Feedback ({feedbackList.length})
          </button>
          <button
            onClick={() => setActiveTab('COMPLAINTS')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'COMPLAINTS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Grievances ({complaintsList.length})
            {pendingComplaints > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {pendingComplaints}
              </span>
            )}
          </button>
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

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Average Rating</p>
            <p className="text-xl font-bold text-slate-800">{avgRating} / 5.0</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Feedbacks</p>
            <p className="text-xl font-bold text-indigo-700">{totalFeedback}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Tickets</p>
            <p className="text-xl font-bold text-rose-700">{pendingComplaints}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Resolved Tickets</p>
            <p className="text-xl font-bold text-emerald-700">{resolvedComplaints}</p>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'FEEDBACK' ? 'Search feedback text or student...' : 'Search complaint title or student...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {activeTab === 'FEEDBACK' ? (
            <>
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                <option value="CURRICULUM">Curriculum</option>
                <option value="TEACHING">Teaching Quality</option>
                <option value="FACILITIES">Facilities</option>
                <option value="ACTIVITIES">Activities</option>
                <option value="GENERAL">General</option>
              </select>

              {/* Star Rating Filter */}
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </>
          ) : (
            <>
              {/* Grievance Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Action</option>
                <option value="IN_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading records...</p>
        </div>
      ) : activeTab === 'FEEDBACK' ? (
        /* Feedback Grid */
        filteredFeedback.length === 0 ? (
          <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No student feedback found</p>
            <p className="text-xs text-slate-400 mt-1">
              Feedback submitted from the Student Mobile app will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeedback.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= item.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed italic mb-4">
                    "{item.feedback_text}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {item.student_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">
                        {item.student_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.class_name ? `Class ${item.class_name}` : ''} ({item.admission_number})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Complaints Table */
        filteredComplaints.length === 0 ? (
          <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No student grievances</p>
            <p className="text-xs text-slate-400 mt-1">
              There are currently no tickets matching your filter.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Ticket Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Filed On</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((cmp) => {
                    const isPending = cmp.status === 'PENDING';
                    const isInReview = cmp.status === 'IN_REVIEW';
                    const isResolved = cmp.status === 'RESOLVED';

                    return (
                      <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 max-w-sm">
                          <p className="font-semibold text-slate-800 text-sm line-clamp-1">
                            {cmp.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {cmp.description}
                          </p>
                          {cmp.resolution_notes && (
                            <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 line-clamp-1">
                              Response: {cmp.resolution_notes}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {cmp.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 text-xs">
                            {cmp.student_name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {cmp.class_name ? `Class ${cmp.class_name}` : ''} • {cmp.admission_number}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(cmp.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isInReview
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {cmp.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedComplaint(cmp);
                              setResolutionStatus(cmp.status);
                              setResolutionNotes(cmp.resolution_notes || '');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                          >
                            Review & Respond
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Resolution Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                  Ticket Resolution • {selectedComplaint.category}
                </span>
                <h3 className="font-bold text-lg text-white mt-0.5">{selectedComplaint.title}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveComplaint} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="text-slate-500 font-semibold uppercase tracking-wider">
                  Student's Concern
                </p>
                <p className="text-slate-800 text-sm leading-relaxed">
                  {selectedComplaint.description}
                </p>
                <p className="text-slate-400 text-[11px] pt-1">
                  Submitted by {selectedComplaint.student_name} ({selectedComplaint.admission_number})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Update Ticket Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e: any) => setResolutionStatus(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PENDING">PENDING (Awaiting Review)</option>
                  <option value="IN_REVIEW">IN_REVIEW (Investigation in progress)</option>
                  <option value="RESOLVED">RESOLVED (Action taken & Closed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Response / Resolution Notes (Visible to Student App)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the resolution or action taken to resolve this student grievance..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/30 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {resolving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
