'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  Edit3,
  ChevronDown,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Upload,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ClassItem } from '@/lib/types';

/**
 * Robust date parser for client-side CSV processing.
 * Converts DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, Excel numeric serials, etc.
 * to PostgreSQL-compatible YYYY-MM-DD string, or null if invalid.
 */
function parseSafeDate(val: any): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().replace(/^["']|["']$/g, '');
  if (!str || str === '-' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') {
    return null;
  }

  // 1. Check Excel serial date numbers (e.g. 40677 -> 2011-05-14)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    if (serial > 20000 && serial < 60000) {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + serial * 86400000);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
  }

  // 2. Check DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    let day = p1;
    let month = p2;

    // If month > 12 and day <= 12, user might have used MM-DD-YYYY
    if (month > 12 && day <= 12) {
      day = p2;
      month = p1;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 3. Check YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 4. Fallback to JS Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    if (y >= 1900 && y <= 2100) {
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Multi-select Class and Section states
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

  // Dropdown open states
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const [classFilterSearch, setClassFilterSearch] = useState('');

  const classDropdownRef = useRef<HTMLDivElement>(null);
  const sectionDropdownRef = useRef<HTMLDivElement>(null);

  const [quickFilter, setQuickFilter] = useState<'ALL' | 'LOW_ATTENDANCE' | 'FEE_DUES'>('ALL');

  // Drawer / Modal for Student Details (View)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal for Edit Student
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    roll_number: '',
    current_class_id: '',
    current_section_id: '',
    phone: '',
    emergency_phone: '',
    father_name: '',
    mother_name: '',
    gender: '',
    date_of_birth: '',
    blood_group: '',
    medical_notes: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Upload State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<any | null>(null);

  const downloadSampleTemplate = () => {
    const csvContent =
      'admission_no,roll_no,first_name,last_name,class_name,section_name,gender,dob,phone,emergency_phone,father_name,mother_name,blood_group\n' +
      'STU202601,1,Aarav,Sharma,Grade 10,Section A,MALE,2011-05-14,9876543201,9876543201,Rajesh Sharma,Sunita Sharma,O+\n' +
      'STU202602,2,Diya,Verma,Grade 10,Section A,FEMALE,2011-08-22,9876543202,9876543202,Amit Verma,Pooja Verma,B+\n' +
      'STU202603,1,Rohan,Kumar,Grade 9,Section B,MALE,2012-01-10,9876543203,9876543203,Suresh Kumar,Meena Kumar,A+\n' +
      'STU202604,2,Ananya,Patel,Grade 9,Section B,FEMALE,2012-03-18,9876543204,9876543204,Vikram Patel,Rekha Patel,AB+';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_bulk_upload_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setBulkError(null);
    setBulkSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error('File is empty');
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least 1 data row.');
        }

        const headers = lines[0].split(',').map((h) =>
          h.trim().toLowerCase().replace(/['"]/g, '').replace(/[\s\.\-_]+/g, '_').replace(/^_+|_+$/g, '')
        );
        const parsed: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const rowValues = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
          if (rowValues.length < 2 || rowValues.every((v) => !v)) continue;

          const rowObj: any = {};
          headers.forEach((hdr, idx) => {
            rowObj[hdr] = rowValues[idx] || '';
          });

          // Normalize fields with wide alias support
          parsed.push({
            admission_no:
              rowObj.admission_no ||
              rowObj.admission_number ||
              rowObj.admissionno ||
              rowObj.adm_no ||
              rowObj.admno ||
              rowObj.reg_no ||
              rowObj.registration_no ||
              rowObj.student_id ||
              rowObj.id ||
              '',
            roll_no: rowObj.roll_no || rowObj.roll_number || rowObj.rollno || '',
            first_name: rowObj.first_name || rowObj.firstname || rowObj.name || rowObj.student_name || 'Student',
            last_name: rowObj.last_name || rowObj.lastname || '',
            class_name: rowObj.class_name || rowObj.class || rowObj.classname || rowObj.grade || 'Grade 10',
            section_name: rowObj.section_name || rowObj.section || rowObj.sec || 'Section A',
            gender: (rowObj.gender || 'MALE').toUpperCase(),
            dob: parseSafeDate(rowObj.dob || rowObj.date_of_birth || rowObj.birth_date || rowObj.birthdate) || '',
            admission_date: parseSafeDate(rowObj.admission_date || rowObj.adm_date || rowObj.joining_date) || '',
            phone: rowObj.phone || rowObj.mobile || rowObj.contact || '',
            emergency_phone: rowObj.emergency_phone || rowObj.phone || rowObj.mobile || '',
            father_name: rowObj.father_name || rowObj.father || rowObj.fathername || '',
            mother_name: rowObj.mother_name || rowObj.mother || rowObj.mothername || '',
            blood_group: rowObj.blood_group || rowObj.bloodgroup || '',
          });
        }

        if (parsed.length === 0) {
          throw new Error('No valid student rows found in the CSV file.');
        }

        setCsvPreview(parsed);
      } catch (err: any) {
        setBulkError(err?.message || 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkUpload = async () => {
    if (csvPreview.length === 0) return;
    try {
      setBulkUploading(true);
      setBulkError(null);
      const res = await api.admin.bulkUploadStudents(csvPreview);
      setBulkSuccess(res.data || res);
      showToast(`Successfully processed ${csvPreview.length} students!`);
      await loadData();
    } catch (err: any) {
      setBulkError(err?.message || 'Failed to upload students data');
    } finally {
      setBulkUploading(false);
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        api.admin.getStudents(),
        api.academics.getClasses().catch(() => []),
      ]);
      setStudents(studentsData || []);
      setClasses(classesData || []);
    } catch (err) {
      console.error('Failed to load students directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute unified classes dynamically from BOTH classes API and student records
  // This guarantees Class & Section filters are NEVER empty if any students exist
  const allClasses = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sections: Map<string, { id: string; name: string }> }>();

    // 1. Ingest classes from academics API
    classes.forEach((c) => {
      const classId = c.class_id || c.id;
      const className = c.class_name || c.name || 'Unknown Class';
      if (!map.has(classId)) {
        map.set(classId, { id: classId, name: className, sections: new Map() });
      }
      const entry = map.get(classId)!;
      if (Array.isArray(c.sections)) {
        c.sections.forEach((sec) => {
          if (sec.id && !entry.sections.has(sec.id)) {
            entry.sections.set(sec.id, { id: sec.id, name: sec.name });
          }
        });
      }
    });

    // 2. Supplement from student records
    students.forEach((s) => {
      if (s.class_id) {
        if (!map.has(s.class_id)) {
          map.set(s.class_id, {
            id: s.class_id,
            name: s.class_name ? `Grade ${s.class_name}` : 'Unassigned Class',
            sections: new Map(),
          });
        }
        const entry = map.get(s.class_id)!;
        if (s.section_id) {
          if (!entry.sections.has(s.section_id)) {
            entry.sections.set(s.section_id, {
              id: s.section_id,
              name: s.section_name || 'Section',
            });
          }
        }
      }
    });

    return Array.from(map.values())
      .map((c) => ({
        id: c.id,
        name: c.name,
        sections: Array.from(c.sections.values()),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [classes, students]);

  // Compute available sections based on selected classes (or across all classes if none selected)
  const availableSections = useMemo(() => {
    const secMap = new Map<string, { id: string; name: string; className: string }>();

    const targetClasses = selectedClassIds.length > 0
      ? allClasses.filter((c) => selectedClassIds.includes(c.id))
      : allClasses;

    targetClasses.forEach((c) => {
      c.sections.forEach((sec) => {
        if (!secMap.has(sec.id)) {
          secMap.set(sec.id, {
            id: sec.id,
            name: sec.name,
            className: c.name,
          });
        }
      });
    });

    return Array.from(secMap.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [allClasses, selectedClassIds]);

  // Multi-select toggle helper for classes
  const toggleClassSelect = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const selectAllClasses = () => {
    if (selectedClassIds.length === allClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(allClasses.map((c) => c.id));
    }
  };

  // Multi-select toggle helper for sections
  const toggleSectionSelect = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const selectAllSections = () => {
    if (selectedSectionIds.length === availableSections.length) {
      setSelectedSectionIds([]);
    } else {
      setSelectedSectionIds(availableSections.map((s) => s.id));
    }
  };

  // Open Details Modal (View)
  const handleOpenDetails = async (studentId: string) => {
    try {
      setDetailLoading(true);
      const details = await api.admin.getStudentDetails(studentId);
      setSelectedStudent(details);
    } catch (err) {
      console.error('Failed to load student details:', err);
      // Fallback to local student object if available
      const local = students.find((s) => s.id === studentId);
      if (local) setSelectedStudent(local);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      roll_number: student.roll_number || '',
      current_class_id: student.class_id || student.current_class_id || '',
      current_section_id: student.section_id || student.current_section_id || '',
      phone: student.phone || '',
      emergency_phone: student.emergency_phone || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      gender: student.gender || 'Other',
      date_of_birth: student.date_of_birth ? String(student.date_of_birth).split('T')[0] : '',
      blood_group: student.blood_group || '',
      medical_notes: student.medical_notes || '',
    });
  };

  // Submit Edit Student
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setEditSaving(true);
      const updated = await api.admin.updateStudent(editingStudent.id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        roll_number: editForm.roll_number.trim() || null,
        current_class_id: editForm.current_class_id || null,
        current_section_id: editForm.current_section_id || null,
        phone: editForm.phone.trim() || null,
        emergency_phone: editForm.emergency_phone.trim() || null,
        father_name: editForm.father_name.trim() || null,
        mother_name: editForm.mother_name.trim() || null,
        gender: editForm.gender || null,
        date_of_birth: editForm.date_of_birth || null,
        blood_group: editForm.blood_group || null,
        medical_notes: editForm.medical_notes.trim() || null,
      });

      // Update state locally
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === editingStudent.id) {
            const classObj = allClasses.find((c) => c.id === editForm.current_class_id);
            const secObj = classObj?.sections.find((sec) => sec.id === editForm.current_section_id);
            return {
              ...s,
              ...updated,
              first_name: editForm.first_name,
              last_name: editForm.last_name,
              full_name: `${editForm.first_name} ${editForm.last_name}`,
              roll_number: editForm.roll_number,
              class_id: editForm.current_class_id,
              class_name: classObj ? classObj.name : s.class_name,
              section_id: editForm.current_section_id,
              section_name: secObj ? secObj.name : s.section_name,
              father_name: editForm.father_name,
              mother_name: editForm.mother_name,
              phone: editForm.phone,
              emergency_phone: editForm.emergency_phone,
              blood_group: editForm.blood_group,
              medical_notes: editForm.medical_notes,
            };
          }
          return s;
        })
      );

      if (selectedStudent && selectedStudent.id === editingStudent.id) {
        setSelectedStudent({
          ...selectedStudent,
          ...updated,
        });
      }

      setEditingStudent(null);
      showToast('Student details updated successfully!');
    } catch (err: any) {
      console.error('Failed to update student:', err);
      alert(err.message || 'Failed to update student details');
    } finally {
      setEditSaving(false);
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Multi-select Class Filter
      if (selectedClassIds.length > 0) {
        if (!s.class_id || !selectedClassIds.includes(s.class_id)) {
          return false;
        }
      }

      // 2. Multi-select Section Filter
      if (selectedSectionIds.length > 0) {
        if (!s.section_id || !selectedSectionIds.includes(s.section_id)) {
          return false;
        }
      }

      // 3. Quick Filter
      if (quickFilter === 'LOW_ATTENDANCE') {
        if (Number(s.attendance_percentage || 0) >= 75) return false;
      }
      if (quickFilter === 'FEE_DUES') {
        const dues = Number(s.total_fee_dues || 0) - Number(s.total_fee_paid || 0);
        if (dues <= 0) return false;
      }

      // 4. Search Filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const fullName = (s.full_name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
        const adm = (s.admission_number || '').toLowerCase();
        const roll = (s.roll_number || '').toLowerCase();
        const ident = (s.identifier || '').toLowerCase();
        const father = (s.father_name || '').toLowerCase();
        if (
          !fullName.includes(q) &&
          !adm.includes(q) &&
          !roll.includes(q) &&
          !ident.includes(q) &&
          !father.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [students, selectedClassIds, selectedSectionIds, quickFilter, search]);

  // Metrics
  const totalStudents = students.length;
  const avgAttendance =
    totalStudents > 0
      ? Math.round(
          students.reduce((acc, s) => acc + Number(s.attendance_percentage || 0), 0) /
            totalStudents
        )
      : 100;
  const totalDuesPending = students.reduce((acc, s) => {
    const due = Number(s.total_fee_dues || 0) - Number(s.total_fee_paid || 0);
    return due > 0 ? acc + due : acc;
  }, 0);

  // Available sections for the edit modal form
  const editFormSections = useMemo(() => {
    if (!editForm.current_class_id) return [];
    const targetClass = allClasses.find((c) => c.id === editForm.current_class_id);
    return targetClass ? targetClass.sections : [];
  }, [allClasses, editForm.current_class_id]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <Users className="w-4 h-4" />
            Student Master Database
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Student Directory &amp; 360° Profiles
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete student records with multi-select class/section filters, instant profile inspection, and full editing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBulkError(null);
              setBulkSuccess(null);
              setCsvPreview([]);
              setCsvFileName('');
              setIsBulkModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-900/20 transition cursor-pointer flex items-center gap-2 text-xs font-bold"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload Students (CSV)</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh Directory"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Enrolled Students</span>
            <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
            <span className="text-[11px] text-slate-400">
              Showing {filteredStudents.length} after filters
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Average Attendance</span>
            <div className="text-2xl font-bold text-slate-900">{avgAttendance}%</div>
            <span className="text-[11px] text-emerald-600 font-medium">Daily Attendance Metric</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Pending Fee Balance</span>
            <div className="text-2xl font-bold text-slate-900">
              ₹{totalDuesPending.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">Outstanding Dues</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Multi-select Filters & Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Multi-Select Dropdown */}
          <div className="relative" ref={classDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsClassDropdownOpen(!isClassDropdownOpen);
                setIsSectionDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                selectedClassIds.length > 0
                  ? 'border-indigo-300 bg-indigo-50/60 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {selectedClassIds.length === 0
                  ? 'All Classes'
                  : selectedClassIds.length === 1
                  ? allClasses.find((c) => c.id === selectedClassIds[0])?.name || '1 Class'
                  : `${selectedClassIds.length} Classes Selected`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>

            {isClassDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Filter by Class
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllClasses}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      {selectedClassIds.length === allClasses.length ? 'Clear All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {allClasses.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">No classes found</div>
                  ) : (
                    allClasses.map((c) => {
                      const isSelected = selectedClassIds.includes(c.id);
                      const studentCount = students.filter((s) => s.class_id === c.id).length;

                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleClassSelect(c.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-900 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{c.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({studentCount})
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedClassIds.length > 0 && (
                  <div className="pt-1 border-t border-slate-100 flex justify-between items-center px-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {selectedClassIds.length} active
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedClassIds([])}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Reset Class Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Multi-Select Dropdown */}
          <div className="relative" ref={sectionDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsSectionDropdownOpen(!isSectionDropdownOpen);
                setIsClassDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                selectedSectionIds.length > 0
                  ? 'border-indigo-300 bg-indigo-50/60 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {selectedSectionIds.length === 0
                  ? 'All Sections'
                  : selectedSectionIds.length === 1
                  ? availableSections.find((s) => s.id === selectedSectionIds[0])?.name || '1 Section'
                  : `${selectedSectionIds.length} Sections Selected`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>

            {isSectionDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Filter by Section
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllSections}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      {selectedSectionIds.length === availableSections.length ? 'Clear All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {availableSections.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">No sections available</div>
                  ) : (
                    availableSections.map((s) => {
                      const isSelected = selectedSectionIds.includes(s.id);
                      const studentCount = students.filter(
                        (std) =>
                          std.section_id === s.id &&
                          (selectedClassIds.length === 0 || selectedClassIds.includes(std.class_id))
                      ).length;

                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleSectionSelect(s.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-900 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>Section {s.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({studentCount})
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedSectionIds.length > 0 && (
                  <div className="pt-1 border-t border-slate-100 flex justify-between items-center px-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {selectedSectionIds.length} active
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSectionIds([])}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Reset Section Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setQuickFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                quickFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setQuickFilter('LOW_ATTENDANCE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                quickFilter === 'LOW_ATTENDANCE'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              &lt;75% Attendance
            </button>
            <button
              onClick={() => setQuickFilter('FEE_DUES')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                quickFilter === 'FEE_DUES'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fee Dues
            </button>
          </div>

          {/* Clear all active filters button */}
          {(selectedClassIds.length > 0 || selectedSectionIds.length > 0 || quickFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setSelectedClassIds([]);
                setSelectedSectionIds([]);
                setQuickFilter('ALL');
                setSearch('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Search Input Box */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll, admission no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 md:w-64 bg-white"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading student directory and live metrics...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No students match your selected criteria.</p>
            <p className="text-xs text-slate-400">
              Try adjusting the Class or Section filters, or clear search queries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[880px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3.5 pl-6">Student</th>
                  <th className="p-3.5">Admission No</th>
                  <th className="p-3.5">Class &amp; Section</th>
                  <th className="p-3.5">Father / Guardian</th>
                  <th className="p-3.5">Emergency Contact</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Fee Status</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const att = Number(s.attendance_percentage || 0);
                  const feeDues = Number(s.total_fee_dues || 0) - Number(s.total_fee_paid || 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {s.first_name?.[0] || 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {s.full_name || `${s.first_name || ''} ${s.last_name || ''}`}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              User: {s.identifier}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-700 font-medium">
                        {s.admission_number}
                        {s.roll_number && (
                          <span className="text-[10px] text-slate-400 block font-sans">
                            Roll: {s.roll_number}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800">
                        {s.class_name ? `${s.class_name} (${s.section_name || 'A'})` : 'Unassigned'}
                      </td>

                      <td className="p-3.5 text-slate-600">{s.father_name || '—'}</td>

                      <td className="p-3.5 text-slate-600 font-mono">
                        {s.emergency_phone || s.phone || '—'}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            att >= 75
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : att >= 60
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {att}%
                        </span>
                      </td>

                      <td className="p-3.5">
                        {feeDues <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Paid Up
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                            Due ₹{feeDues.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* View & Edit Buttons in front of every student */}
                      <td className="p-3.5 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(s.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                            title="View Student Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                            title="Edit Student Information"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
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

      {/* 360-degree Student Details Slide-over / Modal (VIEW) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg uppercase shadow-xs">
                  {selectedStudent.first_name?.[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Admission No: <span className="font-mono font-semibold text-slate-800">{selectedStudent.admission_number}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Academic Class &amp; Section</span>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedStudent.class_name ? `Class ${selectedStudent.class_name}` : 'Unassigned'}{' '}
                  {selectedStudent.section_name && `(${selectedStudent.section_name})`}
                </div>
                <div className="text-slate-500">Roll No: {selectedStudent.roll_number || 'N/A'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">App Login Username</span>
                <div className="font-mono font-bold text-indigo-700 text-sm">
                  {selectedStudent.identifier}
                </div>
                <div className="text-slate-500">
                  Account: {selectedStudent.is_active ? 'Active' : 'Deactivated'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Father / Guardian</span>
                <div className="font-semibold text-slate-900">{selectedStudent.father_name || '—'}</div>
                <div className="text-slate-500">Mother: {selectedStudent.mother_name || '—'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Emergency Contact</span>
                <div className="font-mono font-semibold text-slate-900">
                  {selectedStudent.emergency_phone || selectedStudent.phone || '—'}
                </div>
                <div className="text-slate-500">Primary Phone: {selectedStudent.phone || '—'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Date of Birth &amp; Gender</span>
                <div className="font-semibold text-slate-900">
                  {selectedStudent.date_of_birth ? String(selectedStudent.date_of_birth).split('T')[0] : '—'}
                </div>
                <div className="text-slate-500">Gender: {selectedStudent.gender || '—'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Blood Group &amp; Medical</span>
                <div className="font-semibold text-slate-900">
                  Blood Group: {selectedStudent.blood_group || 'Not recorded'}
                </div>
                <div className="text-slate-500 truncate" title={selectedStudent.medical_notes || ''}>
                  Notes: {selectedStudent.medical_notes || 'None'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                <span className="text-slate-400 font-medium">Admission &amp; Enrollment</span>
                <div className="font-semibold text-slate-900">
                  Enrolled on: {selectedStudent.admission_date ? String(selectedStudent.admission_date).split('T')[0] : 'Standard Admission'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const studentToEdit = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenEdit(studentToEdit);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit This Student</span>
              </button>

              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Student Details</h3>
                  <div className="text-xs text-slate-500">
                    Admission No: <span className="font-mono font-semibold">{editingStudent.admission_number}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* First Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Roll Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Roll Number</label>
                  <input
                    type="text"
                    value={editForm.roll_number}
                    onChange={(e) => setEditForm({ ...editForm, roll_number: e.target.value })}
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Class */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assigned Class</label>
                  <select
                    value={editForm.current_class_id}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      const targetClass = allClasses.find((c) => c.id === newClassId);
                      const firstSection = targetClass?.sections[0]?.id || '';
                      setEditForm({
                        ...editForm,
                        current_class_id: newClassId,
                        current_section_id: firstSection,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="">Select Class</option>
                    {allClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assigned Section</label>
                  <select
                    value={editForm.current_section_id}
                    onChange={(e) => setEditForm({ ...editForm, current_section_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="">Select Section</option>
                    {editFormSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Emergency Phone */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Emergency Contact</label>
                  <input
                    type="tel"
                    value={editForm.emergency_phone}
                    onChange={(e) => setEditForm({ ...editForm, emergency_phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Primary Phone */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Student Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Father Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Father / Guardian Name</label>
                  <input
                    type="text"
                    value={editForm.father_name}
                    onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Mother Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Mother Name</label>
                  <input
                    type="text"
                    value={editForm.mother_name}
                    onChange={(e) => setEditForm({ ...editForm, mother_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  />
                </div>

                {/* Blood Group */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Blood Group</label>
                  <select
                    value={editForm.blood_group}
                    onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Medical Notes */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Medical Notes / Allergies</label>
                  <textarea
                    rows={2}
                    value={editForm.medical_notes}
                    onChange={(e) => setEditForm({ ...editForm, medical_notes: e.target.value })}
                    placeholder="Any medical conditions or allergy notes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  {editSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* BULK UPLOAD STUDENTS MODAL                                                */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Bulk Upload Students</h3>
                  <p className="text-xs text-slate-500">
                    Import full student roster. Automatically splits by Class &amp; Section and creates student logins.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
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
                    Pre-formatted template with all columns (Admission No, Class, Section, Roll No, Phone, Parent details).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
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
                    id="studentCsvFile"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="studentCsvFile"
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
                        Accepts standard CSV files exported from Excel or Google Sheets
                      </p>
                    </div>
                    {csvFileName && (
                      <span className="mt-1 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800">
                        Selected: {csvFileName}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Error Banner */}
              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Success Result Summary */}
              {bulkSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Upload Completed Successfully!</span>
                  </div>
                  <div className="text-[11px] space-y-1 text-emerald-800">
                    <p>Total Records Processed: <strong>{bulkSuccess.total || csvPreview.length}</strong></p>
                    <p>New Students Created: <strong>{bulkSuccess.created}</strong> | Updated: <strong>{bulkSuccess.updated}</strong></p>
                    {bulkSuccess.breakdown && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 flex flex-wrap gap-2">
                        {Object.entries(bulkSuccess.breakdown).map(([cls, count]) => (
                          <span key={cls} className="px-2 py-0.5 bg-white rounded border border-emerald-300 font-mono text-[10px]">
                            {cls}: {String(count)} student{count === 1 ? '' : 's'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Detected Records Preview ({csvPreview.length} students found)</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Showing first {Math.min(5, csvPreview.length)} rows
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <tr>
                          <th className="px-3 py-2">Admission No</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Class &amp; Sec</th>
                          <th className="px-3 py-2">Roll No</th>
                          <th className="px-3 py-2">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-mono font-semibold text-slate-800">{row.admission_no || 'AUTO'}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">{row.first_name} {row.last_name}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                                {row.class_name} - {row.section_name}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono">{row.roll_no || '—'}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{row.phone || row.emergency_phone || '—'}</td>
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
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkUpload}
                disabled={bulkUploading || csvPreview.length === 0}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                {bulkUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing &amp; Splitting...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import {csvPreview.length > 0 ? `(${csvPreview.length}) Students` : ''}</span>
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
