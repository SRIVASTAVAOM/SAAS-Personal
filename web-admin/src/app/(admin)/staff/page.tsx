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
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  Check,
  KeyRound,
  ShieldAlert,
  UserCheck,
  UserX,
  Upload,
  Download,
  FileSpreadsheet,
  RefreshCw,
  BookOpen,
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
  username?: string;
  password?: string;
  role: string;
  wing_name: string | null;
  assignment_type: string | null;
}

export default function StaffListPage() {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusTab, setStatusTab] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');

  // Password visibility tracking per staff row
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<StaffItem | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);

  // Classes & Subjects metadata for allocation
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

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
    class_id: '',
    section_id: '',
    subject_id: '',
    is_class_teacher: true,
  });

  const selectedClassSections = useMemo(() => {
    if (!formData.class_id) return [];
    const cls = classesList.find((c) => (c.id || c.class_id) === formData.class_id);
    return cls?.sections || [];
  }, [formData.class_id, classesList]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Bulk Staff Upload State
  const [isBulkStaffModalOpen, setIsBulkStaffModalOpen] = useState(false);
  const [staffCsvPreview, setStaffCsvPreview] = useState<any[]>([]);
  const [staffCsvFileName, setStaffCsvFileName] = useState('');
  const [bulkStaffUploading, setBulkStaffUploading] = useState(false);
  const [bulkStaffError, setBulkStaffError] = useState<string | null>(null);
  const [bulkStaffSuccess, setBulkStaffSuccess] = useState<any | null>(null);

  const downloadStaffSampleTemplate = () => {
    const csvContent =
      'employee_code,first_name,last_name,email,phone,qualification,department,designation,gender,role,class_name,section_name,subject_name,is_class_teacher\n' +
      'EMP001,Vikram,Sharma,vikram@school.edu,9876500001,M.Sc Mathematics,Mathematics,PGT Faculty,MALE,TEACHER,Grade 10,Section A,Mathematics,true\n' +
      'EMP002,Priya,Verma,priya@school.edu,9876500002,M.Sc Physics,Science,TGT Faculty,FEMALE,TEACHER,Grade 10,Section A,Science,false\n' +
      'EMP003,Sunita,Joshi,sunita@school.edu,9876500003,M.A English,Languages,TGT Faculty,FEMALE,TEACHER,Grade 9,Section B,English,true\n' +
      'EMP004,Rajesh,Gupta,rajesh@school.edu,9876500004,M.Com,Social Science,Senior Teacher,MALE,TEACHER,Grade 10,Section A,Social Science,false';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'teachers_staff_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStaffCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStaffCsvFileName(file.name);
    setBulkStaffError(null);
    setBulkStaffSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error('File is empty');
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least 1 data row.');
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
        const parsed: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const rowValues = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
          if (rowValues.length < 2 || rowValues.every((v) => !v)) continue;

          const rowObj: any = {};
          headers.forEach((hdr, idx) => {
            rowObj[hdr] = rowValues[idx] || '';
          });

          parsed.push({
            employee_code: rowObj.employee_code || rowObj.emp_code || '',
            first_name: rowObj.first_name || rowObj.name || 'Staff',
            last_name: rowObj.last_name || '',
            email: rowObj.email || '',
            phone: rowObj.phone || '',
            qualification: rowObj.qualification || '',
            department: rowObj.department || 'Academics',
            designation: rowObj.designation || 'Teacher',
            gender: (rowObj.gender || 'MALE').toUpperCase(),
            role: (rowObj.role || 'TEACHER').toUpperCase(),
            class_name: rowObj.class_name || rowObj.class || '',
            section_name: rowObj.section_name || rowObj.section || '',
            subject_name: rowObj.subject_name || rowObj.subject || '',
            is_class_teacher:
              rowObj.is_class_teacher === 'true' ||
              rowObj.is_class_teacher === 'TRUE' ||
              rowObj.is_class_teacher === '1',
          });
        }

        if (parsed.length === 0) {
          throw new Error('No valid faculty records found in the CSV file.');
        }

        setStaffCsvPreview(parsed);
      } catch (err: any) {
        setBulkStaffError(err?.message || 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkStaffUpload = async () => {
    if (staffCsvPreview.length === 0) return;
    try {
      setBulkStaffUploading(true);
      setBulkStaffError(null);
      const res = await api.admin.bulkUploadStaff(staffCsvPreview);
      setBulkStaffSuccess(res.data || res);
      setSuccessMessage(`Successfully imported ${staffCsvPreview.length} faculty members!`);
      await fetchStaff();
    } catch (err: any) {
      setBulkStaffError(err?.message || 'Failed to upload staff records');
    } finally {
      setBulkStaffUploading(false);
    }
  };

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

  const loadMetadata = async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        api.academics.getClasses().catch(() => []),
        api.academics.getSubjects().catch(() => []),
      ]);
      setClassesList(clsRes || []);
      setSubjectsList(subRes || []);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchStaff();
    loadMetadata();
  }, []);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // 1. Status Filter (Active vs Inactive vs All)
      if (statusTab === 'ACTIVE' && !s.is_active) return false;
      if (statusTab === 'INACTIVE' && s.is_active) return false;

      // 2. Role Filter
      const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;

      // 3. Search Filter
      const q = searchQuery.toLowerCase().trim();
      const loginUser = (s.username || s.identifier || '').toLowerCase();
      const matchesSearch =
        !q ||
        s.staff_name.toLowerCase().includes(q) ||
        s.employee_code.toLowerCase().includes(q) ||
        loginUser.includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.designation && s.designation.toLowerCase().includes(q));

      return matchesRole && matchesSearch;
    });
  }, [staffList, statusTab, roleFilter, searchQuery]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      first_name: '',
      last_name: '',
      employee_code: `EMP-${randomSuffix}`,
      identifier: `teacher_${randomSuffix}`,
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
      class_id: '',
      section_id: '',
      subject_id: '',
      is_class_teacher: true,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: StaffItem) => {
    setSelectedStaff(staff);
    setFormData({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      employee_code: staff.employee_code || '',
      identifier: staff.username || staff.identifier || '',
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
      class_id: '',
      section_id: '',
      subject_id: '',
      is_class_teacher: false,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditModalOpen(true);
  };

  // Submit Add Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.employee_code || !formData.identifier) {
      setErrorMessage('Please fill in First Name, Employee Code, and Username.');
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

  // Delete / Deactivate staff (moves to Inactive list)
  const handleDeleteStaff = async (staff: StaffItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete / deactivate "${staff.staff_name}"?\n\nThis staff member will be moved to the Inactive Staff list and their login access will be suspended.`
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.admin.deleteStaff(staff.id);
      setSuccessMessage(`Staff member "${staff.staff_name}" has been deleted and moved to the Inactive Staff list.`);
      if (viewingStaff?.id === staff.id) {
        setViewingStaff(null);
      }
      fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete staff member');
    } finally {
      setSaving(false);
    }
  };

  // Reactivate staff (restores to Active list)
  const handleReactivateStaff = async (staff: StaffItem) => {
    if (
      !window.confirm(
        `Reactivate "${staff.staff_name}"?\n\nThis will restore their profile to the Active Staff list and re-enable their login.`
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await api.admin.updateStaff(staff.id, { is_active: true });
      setSuccessMessage(`Staff member "${staff.staff_name}" has been reactivated successfully!`);
      if (viewingStaff?.id === staff.id) {
        setViewingStaff((prev) => (prev ? { ...prev, is_active: true } : null));
      }
      fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reactivate staff member');
    } finally {
      setSaving(false);
    }
  };

  // KPIs
  const totalStaff = staffList.length;
  const activeCount = staffList.filter((s) => s.is_active).length;
  const inactiveCount = staffList.filter((s) => !s.is_active).length;
  const teachersCount = staffList.filter((s) => s.role === 'TEACHER').length;
  const adminsCount = staffList.filter((s) => s.role === 'ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Staff & Faculty Management
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Credentials Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UserCog className="w-7 h-7 text-indigo-400" />
            Staff & Faculty Directory
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Manage school faculty, teachers, and coordinators. View login usernames and passwords, assign roles, and track active and inactive staff accounts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/academics/allocations"
            className="px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 hover:text-white rounded-xl font-bold text-xs flex items-center gap-2 border border-indigo-400/30 shadow-xs transition"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Class &amp; Subject Allocations Hub</span>
          </a>
          <button
            onClick={() => {
              setBulkStaffError(null);
              setBulkStaffSuccess(null);
              setStaffCsvPreview([]);
              setStaffCsvFileName('');
              setIsBulkStaffModalOpen(true);
            }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-2 border border-white/20 shadow-xs transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload Teachers (CSV)</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Staff
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 text-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <button
          onClick={() => setStatusTab('ALL')}
          className={`p-4 rounded-xl border text-left transition ${
            statusTab === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-400 font-medium">Total Staff</p>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold">{totalStaff}</p>
        </button>

        <button
          onClick={() => setStatusTab('ACTIVE')}
          className={`p-4 rounded-xl border text-left transition ${
            statusTab === 'ACTIVE'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
              : 'bg-white text-slate-800 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-medium ${statusTab === 'ACTIVE' ? 'text-emerald-100' : 'text-emerald-600'}`}>
              Active Staff
            </p>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </button>

        <button
          onClick={() => setStatusTab('INACTIVE')}
          className={`p-4 rounded-xl border text-left transition ${
            statusTab === 'INACTIVE'
              ? 'bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
              : 'bg-white text-slate-800 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-medium ${statusTab === 'INACTIVE' ? 'text-rose-100' : 'text-rose-600'}`}>
              Inactive Staff
            </p>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold">{inactiveCount}</p>
        </button>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Teachers</p>
            <p className="text-xl font-bold text-blue-700">{teachersCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Admins</p>
            <p className="text-xl font-bold text-purple-700">{adminsCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Navigation Status Tabs */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Active / Inactive Tabs */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl gap-1 w-full sm:w-auto">
            <button
              onClick={() => setStatusTab('ACTIVE')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                statusTab === 'ACTIVE'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Active Staff
              <span className="ml-1 px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setStatusTab('INACTIVE')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                statusTab === 'INACTIVE'
                  ? 'bg-white text-rose-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Inactive Staff
              <span className="ml-1 px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 text-[10px]">
                {inactiveCount}
              </span>
            </button>

            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                statusTab === 'ALL'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Staff
              <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[10px]">
                {totalStaff}
              </span>
            </button>
          </div>

          {/* Search & Role Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, username, emp code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto">
              {['ALL', 'TEACHER', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    roleFilter === role
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {role === 'ALL' ? 'All Roles' : role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inactive Tab Notice Banner */}
        {statusTab === 'INACTIVE' && (
          <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Inactive Staff List:</strong> Showing accounts that have been deleted or deactivated. Their mobile and web portal login is disabled. You can reactivate them anytime.
              </span>
            </div>
            <span className="font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
              {filteredStaff.length} Inactive Accounts
            </span>
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading staff directory...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            {statusTab === 'INACTIVE' ? (
              <>
                <UserCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">No Inactive Staff</p>
                <p className="text-xs text-slate-400 mt-1">
                  All staff members are currently active. Deleting any staff member will show them here.
                </p>
              </>
            ) : (
              <>
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">No staff members found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Emp Code</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 bg-indigo-50/50 text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      Username
                    </span>
                  </th>
                  <th className="py-3.5 px-4 bg-indigo-50/50 text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      Password
                    </span>
                  </th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => {
                  const username = staff.username || staff.identifier;
                  const password = staff.password || 'Staff@123';
                  const isPwVisible = !!visiblePasswords[staff.id];

                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !staff.is_active ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                              staff.is_active
                                ? 'bg-gradient-to-tr from-indigo-600 to-slate-800'
                                : 'bg-gradient-to-tr from-rose-500 to-slate-600'
                            }`}
                          >
                            {staff.staff_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{staff.staff_name}</p>
                            <p className="text-xs text-slate-400">
                              {staff.designation || staff.qualification || staff.department || 'Faculty'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Emp Code */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 font-semibold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {staff.employee_code}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md border ${
                            staff.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {staff.role}
                        </span>
                      </td>

                      {/* Username Column */}
                      <td className="py-3.5 px-4 bg-indigo-50/20">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-indigo-950 font-semibold bg-white px-2 py-1 rounded border border-indigo-200 shadow-2xs">
                            @{username}
                          </span>
                          <button
                            onClick={() => handleCopy(username, `user-${staff.id}`)}
                            title="Copy Username"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition"
                          >
                            {copiedKey === `user-${staff.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Password Column */}
                      <td className="py-3.5 px-4 bg-indigo-50/20">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-slate-800 bg-white px-2 py-1 rounded border border-indigo-200 shadow-2xs tracking-wider min-w-[75px]">
                            {isPwVisible ? password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(staff.id)}
                            title={isPwVisible ? 'Hide Password' : 'Show Password'}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition"
                          >
                            {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(password, `pw-${staff.id}`)}
                            title="Copy Password"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition"
                          >
                            {copiedKey === `pw-${staff.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-xs space-y-0.5">
                        {staff.email && (
                          <p className="text-slate-600 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{staff.email}</span>
                          </p>
                        )}
                        {staff.phone && (
                          <p className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {staff.phone}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            staff.is_active
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              staff.is_active ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          ></span>
                          {staff.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details Button */}
                          <button
                            onClick={() => setViewingStaff(staff)}
                            title="View Staff Details & Credentials"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            title="Edit details"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete or Reactivate */}
                          {staff.is_active ? (
                            <button
                              onClick={() => handleDeleteStaff(staff)}
                              title="Delete staff (Move to Inactive list)"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateStaff(staff)}
                              title="Reactivate staff (Restore to Active list)"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
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

      {/* View Staff Details Modal ("in details add username password column") */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {viewingStaff.staff_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">{viewingStaff.staff_name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        viewingStaff.is_active
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                          : 'bg-rose-500/30 text-rose-200 border border-rose-400/30'
                      }`}
                    >
                      {viewingStaff.is_active ? 'Active Staff' : 'Inactive / Deactivated'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    Emp Code: {viewingStaff.employee_code} • Role: {viewingStaff.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingStaff(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Login Credentials Highlight Box */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-indigo-50/40 p-4 rounded-xl border border-indigo-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                        Login Credentials & Access
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Credentials to log in via Teacher App and Web Portal
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Live Portal Auth
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Username Field */}
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                    <p className="text-[11px] text-slate-500 font-medium mb-1">Username (Login ID)</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-indigo-950">
                        @{viewingStaff.username || viewingStaff.identifier}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(
                            viewingStaff.username || viewingStaff.identifier,
                            `modal-user-${viewingStaff.id}`
                          )
                        }
                        title="Copy Username"
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-medium rounded flex items-center gap-1 transition"
                      >
                        {copiedKey === `modal-user-${viewingStaff.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                    <p className="text-[11px] text-slate-500 font-medium mb-1">Login Password</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-slate-800">
                        {visiblePasswords[`modal-${viewingStaff.id}`]
                          ? viewingStaff.password || 'Staff@123'
                          : '••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePasswordVisibility(`modal-${viewingStaff.id}`)}
                          title="Toggle visibility"
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                        >
                          {visiblePasswords[`modal-${viewingStaff.id}`] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleCopy(
                              viewingStaff.password || 'Staff@123',
                              `modal-pw-${viewingStaff.id}`
                            )
                          }
                          title="Copy Password"
                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-medium rounded flex items-center gap-1 transition"
                        >
                          {copiedKey === `modal-pw-${viewingStaff.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional & Department Info */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  Academic & Professional Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Department</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {viewingStaff.department || 'Academic'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Designation</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {viewingStaff.designation || 'Subject Teacher'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Qualification</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {viewingStaff.qualification || '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Joining Date</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {viewingStaff.joining_date || '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">System Role</p>
                    <p className="text-sm font-semibold text-indigo-700 mt-0.5">
                      {viewingStaff.role}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Wing</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {viewingStaff.wing_name || 'All Wings'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact & Personal Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Contact & Personal Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Official Email</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {viewingStaff.email || '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Mobile Phone</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 font-mono">
                      {viewingStaff.phone || '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Gender</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {viewingStaff.gender || '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500">Emergency Contact</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 font-mono">
                      {viewingStaff.emergency_phone || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                {viewingStaff.is_active ? (
                  <button
                    onClick={() => handleDeleteStaff(viewingStaff)}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Deactivate (Move to Inactive)
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivateStaff(viewingStaff)}
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reactivate Account
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditModal(viewingStaff);
                    setViewingStaff(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Details
                </button>
                <button
                  onClick={() => setViewingStaff(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    placeholder="e.g. EMP-101"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username (Login ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. teacher_ramesh"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Staff@123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                  >
                    <option value="TEACHER">TEACHER (Faculty)</option>
                    <option value="ADMIN">ADMIN (School Administration)</option>
                  </select>
                </div>

                {/* Academic Class & Subject Allocation for TEACHER */}
                {formData.role === 'TEACHER' && (
                  <div className="col-span-1 sm:col-span-2 p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Class Teacher &amp; Subject Allocation (Optional)</span>
                      </div>
                      <span className="text-[10px] text-indigo-700 bg-indigo-100 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                        Live Auto-Assign
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Assign this teacher directly to a specific Class, Section, and Primary Subject.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Class */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Assign Class
                        </label>
                        <select
                          value={formData.class_id}
                          onChange={(e) => setFormData({ ...formData, class_id: e.target.value, section_id: '' })}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        >
                          <option value="">-- No Class Selected --</option>
                          {classesList.map((cls) => (
                            <option key={cls.id || cls.class_id} value={cls.id || cls.class_id}>
                              {cls.name || cls.class_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Section */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Assign Section
                        </label>
                        <select
                          value={formData.section_id}
                          disabled={!formData.class_id}
                          onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 disabled:opacity-50"
                        >
                          <option value="">-- No Section --</option>
                          {selectedClassSections.map((sec: any) => (
                            <option key={sec.id} value={sec.id}>
                              {sec.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Teaching Subject
                        </label>
                        <select
                          value={formData.subject_id}
                          onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        >
                          <option value="">-- No Subject Assigned --</option>
                          {subjectsList.map((sub: any) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} ({sub.code || 'SUB'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.class_id && formData.section_id && (
                      <div className="flex items-center gap-2 pt-2 border-t border-indigo-100">
                        <input
                          type="checkbox"
                          id="isClassTeacherCheckbox"
                          checked={formData.is_class_teacher}
                          onChange={(e) => setFormData({ ...formData, is_class_teacher: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="isClassTeacherCheckbox" className="text-xs text-slate-800 font-medium cursor-pointer">
                          Designate as official <strong>Class Teacher</strong> for this section
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="teacher@school.com"
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
                    placeholder="9876543210"
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
                    placeholder="e.g. Senior Faculty"
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
                    <option value="ADMIN">ADMIN</option>
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

      {/* ========================================================================= */}
      {/* BULK UPLOAD TEACHERS MODAL                                                */}
      {/* ========================================================================= */}
      {isBulkStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Bulk Upload Faculty &amp; Teachers</h3>
                  <p className="text-xs text-slate-500">
                    Import teacher roster. Creates user credentials and faculty profiles in batch.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Step 1: Download Template */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Step 1: Download Official CSV Template
                  </h4>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">
                    Pre-formatted template with faculty info, role, plus optional <strong>Class, Section, Subject &amp; Class Teacher</strong> columns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadStaffSampleTemplate}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Step 2: Select CSV File */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Step 2: Choose your prepared CSV file
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition bg-slate-50/50">
                  <input
                    type="file"
                    id="staffCsvFile"
                    accept=".csv,text/csv"
                    onChange={handleStaffCsvFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="staffCsvFile"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-600 hover:underline">
                        Click to select CSV file
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Accepts standard CSV files exported from Excel or HR sheets
                      </p>
                    </div>
                    {staffCsvFileName && (
                      <span className="mt-1 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800">
                        Selected: {staffCsvFileName}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Error Banner */}
              {bulkStaffError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{bulkStaffError}</span>
                </div>
              )}

              {/* Success Result Summary */}
              {bulkStaffSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Upload Completed Successfully!</span>
                  </div>
                  <div className="text-[11px] space-y-1 text-emerald-800">
                    <p>Total Records Processed: <strong>{bulkStaffSuccess.total || staffCsvPreview.length}</strong></p>
                    <p>New Teachers Created: <strong>{bulkStaffSuccess.created}</strong> | Skipped: <strong>{bulkStaffSuccess.skipped || 0}</strong></p>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {staffCsvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Detected Records Preview ({staffCsvPreview.length} faculty members found)</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Showing first {Math.min(5, staffCsvPreview.length)} rows
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold whitespace-nowrap">
                        <tr>
                          <th className="px-3 py-2">Emp Code</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Designation</th>
                          <th className="px-3 py-2">Class / Sec</th>
                          <th className="px-3 py-2">Subject</th>
                          <th className="px-3 py-2">Class Teacher</th>
                          <th className="px-3 py-2">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                        {staffCsvPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-mono font-semibold text-slate-800">{row.employee_code || 'AUTO'}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">{row.first_name} {row.last_name}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                                {row.designation || 'Teacher'}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-700">
                              {row.class_name ? `${row.class_name} ${row.section_name ? `(${row.section_name})` : ''}` : <span className="text-slate-400 text-[11px]">—</span>}
                            </td>
                            <td className="px-3 py-2 text-slate-700 font-medium">
                              {row.subject_name ? (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                  {row.subject_name}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {row.is_class_teacher ? (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">No</span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-600">{row.phone || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsBulkStaffModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkStaffUpload}
                disabled={bulkStaffUploading || staffCsvPreview.length === 0}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                {bulkStaffUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing Faculty...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import {staffCsvPreview.length > 0 ? `(${staffCsvPreview.length}) Teachers` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
