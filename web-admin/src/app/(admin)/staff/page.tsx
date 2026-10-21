'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCog,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  X,
  Lock,
  Calendar,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';

interface StaffItem {
  id: string;
  user_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  staff_name: string;
  gender: string | null;
  phone: string | null;
  emergency_phone: string | null;
  qualification: string | null;
  blood_group: string | null;
  department: string | null;
  designation: string | null;
  joining_date: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  email: string | null;
  identifier: string;
  role: string;
  wing_name: string | null;
  assignment_type: string | null;
}

export default function StaffListPage() {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    employee_code: '',
    identifier: '',
    email: '',
    phone: '',
    password: '',
    role: 'TEACHER',
    gender: 'MALE',
    qualification: '',
    department: '',
    designation: '',
    blood_group: '',
    joining_date: new Date().toISOString().split('T')[0],
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load all staff
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllStaff();
      setStaffList(data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        s.staff_name.toLowerCase().includes(q) ||
        s.employee_code.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        s.identifier.toLowerCase().includes(q) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.designation && s.designation.toLowerCase().includes(q));

      return matchesRole && matchesSearch;
    });
  }, [staffList, roleFilter, searchQuery]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      first_name: '',
      last_name: '',
      employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      identifier: '',
      email: '',
      phone: '',
      password: 'Staff@123',
      role: 'TEACHER',
      gender: 'MALE',
      qualification: '',
      department: 'Academic',
      designation: 'Subject Teacher',
      blood_group: '',
      joining_date: new Date().toISOString().split('T')[0],
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: StaffItem) => {
    setSelectedStaff(staff);
    setFormData({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      employee_code: staff.employee_code || '',
      identifier: staff.identifier || '',
      email: staff.email || '',
      phone: staff.phone || '',
      password: '',
      role: staff.role || 'TEACHER',
      gender: staff.gender || 'MALE',
      qualification: staff.qualification || '',
      department: staff.department || '',
      designation: staff.designation || '',
      blood_group: staff.blood_group || '',
      joining_date: staff.joining_date || new Date().toISOString().split('T')[0],
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditModalOpen(true);
  };

  // Submit Add Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.employee_code || !formData.identifier) {
      setErrorMessage('Please fill in First Name, Employee Code, and Username (identifier).');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.admin.createStaff(formData);
      setSuccessMessage(`Staff member "${formData.first_name}" created successfully! Login active immediately.`);
      setIsAddModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create staff member');
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit Staff
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.admin.updateStaff(selectedStaff.id, formData);
      setSuccessMessage(`Staff details for "${formData.first_name}" updated successfully!`);
      setIsEditModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update staff details');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active / deactivate staff
  const handleToggleDeactivate = async (staff: StaffItem) => {
    const action = staff.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${staff.staff_name}?`)) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      if (staff.is_active) {
        await api.admin.deleteStaff(staff.id);
      } else {
        await api.admin.updateStaff(staff.id, { is_active: true });
      }
      setSuccessMessage(`Staff member "${staff.staff_name}" status updated to ${action}d.`);
      fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to ${action} staff`);
    } finally {
      setSaving(false);
    }
  };

  // KPIs
  const totalStaff = staffList.length;
  const teachersCount = staffList.filter((s) => s.role === 'TEACHER').length;
  const coordinatorsCount = staffList.filter((s) => s.role === 'COORDINATOR').length;
  const activeCount = staffList.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Menu 8 • Staff Management
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Multi-Role Auth Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UserCog className="w-7 h-7 text-indigo-400" />
            Staff & Faculty Directory
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Add, update, or remove school faculty, teachers, and coordinators. Newly added staff can immediately log into the Teacher Mobile App and Web Portal.
          </p>
        </div>

        {/* Add Staff Button */}
        <div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Staff
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
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Staff</p>
            <p className="text-xl font-bold text-slate-800">{totalStaff}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Staff</p>
            <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Teachers</p>
            <p className="text-xl font-bold text-blue-700">{teachersCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Coordinators / Mgmt</p>
            <p className="text-xl font-bold text-purple-700">{coordinatorsCount}</p>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee code, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'TEACHER', 'COORDINATOR', 'ACCOUNTANT', 'MANAGEMENT'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                roleFilter === role
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading staff directory...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No staff members found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or role filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Employee Code</th>
                  <th className="py-3.5 px-4">Role & Designation</th>
                  <th className="py-3.5 px-4">Contact & Login</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !staff.is_active ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {staff.staff_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{staff.staff_name}</p>
                          <p className="text-xs text-slate-400">
                            {staff.qualification || staff.department || 'Faculty'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Emp Code */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 font-semibold">
                      {staff.employee_code}
                    </td>

                    {/* Role & Designation */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 w-fit">
                          {staff.role}
                        </span>
                        <span className="text-xs text-slate-500">{staff.designation || 'Staff'}</span>
                      </div>
                    </td>

                    {/* Contact & Username */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-800 font-medium flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-slate-600">@{staff.identifier}</span>
                        </p>
                        {staff.email && (
                          <p className="text-slate-500 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {staff.email}
                          </p>
                        )}
                        {staff.phone && (
                          <p className="text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {staff.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Joining Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {staff.joining_date || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          staff.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          title="Edit details"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleDeactivate(staff)}
                          title={staff.is_active ? 'Deactivate staff' : 'Reactivate staff'}
                          className={`p-1.5 rounded-lg transition ${
                            staff.is_active
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
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

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-indigo-400" />
                  Add New Staff Member
                </h3>
                <p className="text-xs text-slate-300">
                  Fill in staff details to create their profile and mobile app login.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Employee Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-101"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TEACHER">TEACHER (Mobile App Access)</option>
                    <option value="COORDINATOR">COORDINATOR (Wing Lead)</option>
                    <option value="ACCOUNTANT">ACCOUNTANT (Fees Lead)</option>
                    <option value="MANAGEMENT">MANAGEMENT (Full Access)</option>
                  </select>
                </div>

                {/* Username / Identifier */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username (App Login ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh.teacher"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Initial Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Staff@123"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full text-sm pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="ramesh@school.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Science / Mathematics"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior PGT Teacher"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. M.Sc, B.Ed"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/30 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Save Staff Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-400" />
                  Edit Staff Details: {selectedStaff.staff_name}
                </h3>
                <p className="text-xs text-slate-300">
                  Update personal details, roles, or reset login password.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Employee Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TEACHER">TEACHER</option>
                    <option value="COORDINATOR">COORDINATOR</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                  </select>
                </div>

                {/* Reset Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Change Password (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to keep current"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/30 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    'Save Changes'
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
