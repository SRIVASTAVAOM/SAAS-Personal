'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Ban,
  SlidersHorizontal,
  X,
  Lock,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { api, getCurrentUser } from '@/lib/api';
import { SuperAdminMetrics, SchoolRecord, OnboardSchoolPayload } from '@/lib/types';

export default function SuperAdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'FREE' | 'PRO' | 'ENTERPRISE'>('ALL');

  // Modals
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRecord | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<{
    schoolName: string;
    identifier: string;
    email: string;
    password: string;
  } | null>(null);

  // Restore Credentials State
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccessModal, setRestoreSuccessModal] = useState<any[] | null>(null);

  const handleRestoreCredentials = async () => {
    if (!confirm('Reactivate all users and reset default demo credentials (admin, teacher, student)?')) {
      return;
    }
    setRestoring(true);
    try {
      const res = await api.superAdmin.restoreCredentials();
      setRestoreSuccessModal(res.accounts || []);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to restore credentials');
    } finally {
      setRestoring(false);
    }
  };

  // Onboard Form State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardSchoolPayload>({
    name: '',
    code: '',
    plan: 'PRO',
    maxStudents: 1000,
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: 'Password@123',
    address: '',
  });

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [metricsData, schoolsData] = await Promise.all([
        api.superAdmin.getMetrics(),
        api.superAdmin.getSchools(),
      ]);
      setMetrics(metricsData);
      setSchools(schoolsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Super Admin dashboard telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusToggle = async (school: SchoolRecord) => {
    const nextStatus = school.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg =
      nextStatus === 'SUSPENDED'
        ? `Are you sure you want to SUSPEND "${school.name}"? Faculty and students will not be able to log in.`
        : `Reactivate access for "${school.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.superAdmin.updateSchoolStatus(school.id, nextStatus);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update school status');
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await api.superAdmin.onboardSchool({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        maxStudents: Number(formData.maxStudents) || 1000,
      });

      setOnboardModalOpen(false);
      setCredentialsModal({
        schoolName: res.school.name,
        identifier: res.adminCredentials.identifier,
        email: res.adminCredentials.email,
        password: res.adminCredentials.temporaryPassword,
      });

      // Reset form
      setFormData({
        name: '',
        code: '',
        plan: 'PRO',
        maxStudents: 1000,
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        adminPassword: 'Password@123',
        address: '',
      });

      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to onboard school. Please verify fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchSearch =
        searchQuery === '' ||
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (school.admin_email && school.admin_email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || school.status === statusFilter;
      const matchPlan = planFilter === 'ALL' || school.plan === planFilter;

      return matchSearch && matchStatus && matchPlan;
    });
  }, [schools, searchQuery, statusFilter, planFilter]);

  const isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN');

  if (!loading && !isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold">Platform Authorization Required</h2>
            <p className="text-sm mt-1 text-amber-800">
              This Command Center is strictly reserved for Level 1 Global Platform Super Administrators. Your
              current role does not have authorization to view multi-school infrastructure.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Platform Owner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-center">
          <Building2 className="w-80 h-80 text-indigo-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Level 1 Master
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Multi-Tenant Mesh
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Super Admin Control Tower
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Platform-wide multi-school SaaS management, 1-click institution onboarding, and tenant licensing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={handleRestoreCredentials}
              disabled={restoring}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition cursor-pointer"
              title="Reset and reactivate default accounts: admin, teacher, student"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${restoring ? 'animate-spin' : ''}`} />
              {restoring ? 'Restoring Accounts...' : 'Restore Demo Accounts'}
            </button>
            <button
              onClick={loadData}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setOnboardModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Onboard New School
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="font-semibold underline ml-4 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Schools */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Onboarded Schools
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.schools?.total_schools ?? 0}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="font-semibold text-emerald-600">
                {metrics?.schools?.active_schools ?? 0} Active
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">
                {metrics?.schools?.suspended_schools ?? 0} Suspended
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Platform Students
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.users?.total_students ?? 0}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enrolled across all tenants</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Total Faculty */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faculty & Staff
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.users?.total_staff ?? 0}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Active teachers & admins</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Subscription Health */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tenant Health
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.schools?.total_schools
                ? `${Math.round(
                    ((metrics.schools.active_schools || 0) / (metrics.schools.total_schools || 1)) * 100
                  )}%`
                : '100%'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600">Enterprise Ready</span>
              <span>· Multi-tenant</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Directory & School Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-900 text-base">School Directory</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredSchools.length} {filteredSchools.length === 1 ? 'School' : 'Schools'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by school, code, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Schools Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">School & Code</th>
                <th className="py-3 px-4">Plan & Quota</th>
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4">Faculty</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading school directory...
                  </td>
                </tr>
              ) : filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No schools matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => {
                  const studentPercent = Math.min(
                    100,
                    Math.round(((school.student_count || 0) / (school.max_students || 1000)) * 100)
                  );

                  return (
                    <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {school.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{school.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {school.code}
                              </span>
                              <button
                                onClick={() => handleCopy(school.code, `code_${school.id}`)}
                                title="Copy School Code"
                                className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                              >
                                {copiedKey === `code_${school.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan & Quota */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                              school.plan === 'ENTERPRISE'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : school.plan === 'PRO'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {school.plan}
                          </span>
                          <div className="text-[11px] text-slate-500">
                            Quota: {school.max_students}
                          </div>
                        </div>
                      </td>

                      {/* Students count */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900">
                            {school.student_count || 0}
                          </div>
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${studentPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Faculty count */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{school.staff_count || 0}</div>
                        <div className="text-[11px] text-slate-400">Faculty & staff</div>
                      </td>

                      {/* Admin Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold">{school.admin_name || 'Admin'}</div>
                        <div className="text-[11px] text-slate-500">{school.admin_email}</div>
                        {school.admin_phone && (
                          <div className="text-[11px] text-slate-400">{school.admin_phone}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {school.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <Ban className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSchool(school)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleStatusToggle(school)}
                            title={school.status === 'ACTIVE' ? 'Suspend School' : 'Reactivate School'}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              school.status === 'ACTIVE'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                            }`}
                          >
                            {school.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1-Click Onboard School Modal */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Onboard New School</h3>
                  <p className="text-xs text-slate-500">
                    Instantly sets up school, academic year 2026-27, wings, classes 1-12, and principal account.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOnboardModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* School Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    School Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Xavier's High School"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* School Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unique Code (Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STXAVIER"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Subscription Plan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="PRO">Pro (Standard Tier)</option>
                    <option value="ENTERPRISE">Enterprise (Unlimited Features)</option>
                    <option value="FREE">Free Trial</option>
                  </select>
                </div>

                {/* Max Students */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Student Quota
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100000}
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Admin Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    School Principal / Admin Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Admin Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Admin Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. principal@stxavier.edu"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Admin Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Admin Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Initial Admin Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Campus Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Campus Address / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 14, Dwarka, New Delhi"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Onboarding & Generating...' : '1-Click Onboard School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard Success Credentials Dialogue */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-emerald-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 bg-emerald-50/60 border-b border-emerald-100 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                School Successfully Onboarded!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {credentialsModal.schoolName} has been initialized with complete academic structures.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">
                    Admin Username / Identifier:
                  </div>
                  <div className="flex items-center justify-between font-bold text-slate-900 mt-0.5">
                    <span>{credentialsModal.identifier}</span>
                    <button
                      onClick={() => handleCopy(credentialsModal.identifier, 'modal_id')}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {copiedKey === 'modal_id' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">
                    Admin Work Email:
                  </div>
                  <div className="flex items-center justify-between font-bold text-slate-900 mt-0.5">
                    <span>{credentialsModal.email}</span>
                    <button
                      onClick={() => handleCopy(credentialsModal.email, 'modal_email')}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {copiedKey === 'modal_email' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">
                    Initial Password:
                  </div>
                  <div className="flex items-center justify-between font-bold text-slate-900 mt-0.5">
                    <span>{credentialsModal.password}</span>
                    <button
                      onClick={() => handleCopy(credentialsModal.password, 'modal_pass')}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {copiedKey === 'modal_pass' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                <strong>Next Step:</strong> Share these credentials with the school management. They can
                log into the Web Admin Portal to manage classes, teachers, student admissions, and fees.
              </div>

              <button
                onClick={() => setCredentialsModal(null)}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Dossier Details Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {selectedSchool.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedSchool.name}</h3>
                  <div className="text-xs text-slate-500 font-mono">Code: {selectedSchool.code}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSchool(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Plan & Status</div>
                  <div className="font-bold text-slate-900 mt-1">{selectedSchool.plan} Plan</div>
                  <div className="text-slate-500 text-[11px]">Status: {selectedSchool.status}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Enrollment</div>
                  <div className="font-bold text-slate-900 mt-1">
                    {selectedSchool.student_count} / {selectedSchool.max_students}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Faculty: {selectedSchool.staff_count} members
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="font-bold text-slate-900">Administrator Contact</div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedSchool.admin_name || 'Designated School Admin'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedSchool.admin_email}</span>
                </div>
                {selectedSchool.admin_phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedSchool.admin_phone}</span>
                  </div>
                )}
                {selectedSchool.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedSchool.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    handleStatusToggle(selectedSchool);
                    setSelectedSchool(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedSchool.status === 'ACTIVE'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {selectedSchool.status === 'ACTIVE' ? 'Suspend School Access' : 'Reactivate School Access'}
                </button>
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Success Modal */}
      {restoreSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <Check className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Default Accounts Restored!</h3>
              </div>
              <button
                onClick={() => setRestoreSuccessModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              All user accounts have been reactivated and default passwords have been reset to{' '}
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                Password@123
              </span>
              . You can now log into any of these accounts immediately:
            </p>

            <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Login Identifier</th>
                    <th className="p-2.5">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {restoreSuccessModal.map((acc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-indigo-600">{acc.role}</td>
                      <td className="p-2.5 font-mono text-slate-800 font-semibold">{acc.identifier}</td>
                      <td className="p-2.5 font-mono text-slate-600 font-semibold">{acc.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setRestoreSuccessModal(null)}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
