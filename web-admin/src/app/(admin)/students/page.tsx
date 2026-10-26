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
  Copy,
  EyeOff,
  RotateCcw,
  KeyRound,
  UserPlus,
  MapPin,
  HeartPulse,
  BookOpen,
  Briefcase,
  Award,
  FileText,
  Layers,
  Plus,
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student Credentials State
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Active View Tab on Students Page ('directory' | 'admission' | 'bulk')
  const [activeTab, setActiveTab] = useState<'directory' | 'admission' | 'bulk'>('directory');

  // Admission Form State
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [admissionSubmitting, setAdmissionSubmitting] = useState(false);
  const [admissionError, setAdmissionError] = useState<string | null>(null);
  const [admissionSuccessData, setAdmissionSuccessData] = useState<any | null>(null);

  const initialAdmissionForm = {
    // 1. Academic & Enrollment Details (18 fields)
    current_class_id: '',
    custom_class_name: '',
    current_section_id: '',
    custom_section_name: '',
    admission_number: '',
    roll_number: '',
    admission_date: new Date().toISOString().split('T')[0],
    session: '2026-2027',
    type: 'Regular',
    new_old: 'New',
    adm_class: '',
    adm_category: 'General',
    stream: 'General',
    house: '',
    reg_no: '',
    enq_no: '',
    adm_no_old: '',
    adm_no_sch: '',
    fee_cat: 'Standard',
    fee_type: 'Quarterly',
    allow_discount: 'No',
    is_shown: 'Yes',

    // 2. Student Identity & Personal Information (13 fields)
    first_name: '',
    last_name: '',
    stu_name_hindi: '',
    date_of_birth: '',
    gender: 'MALE',
    blood_group: '',
    student_aadhar: '',
    sssn: '',
    lang: 'Hindi',
    phone: '',
    emergency_phone: '',
    mobile2: '',
    email: '',
    password: 'Student@123',
    height: '',
    height2: '',
    weight: '',
    weight2: '',
    medical_notes: '',

    // 3. Father Details (10 fields)
    father_name: '',
    fat_mobile: '',
    fat_mobile2: '',
    fat_occu: '',
    fat_income: '',
    fat_qual: '',
    aadhar_father: '',
    father_pan: '',
    fat_email: '',
    father_nationality: 'Indian',

    // 4. Mother Details (10 fields)
    mother_name: '',
    mot_mobile: '',
    mot_mobile2: '',
    mot_occ: '',
    mot_income: '',
    mot_qual: '',
    aadhar_mother: '',
    pan_mother: '',
    mot_email: '',
    mother_nationality: 'Indian',

    // 5. Guardian Details (8 fields)
    guard_name: '',
    guard_relation: '',
    guard_no: '',
    guard_no2: '',
    guard_occ: '',
    guard_income: '',
    guard_qual: '',
    guard_email: '',

    // 6. Address & Demographics (8 fields)
    address: '',
    address_co: '',
    mobile_co: '',
    mobile2_co: '',
    caste: 'General',
    cast_cert_no: '',
    religion: 'Hindu',
    nationality: 'Indian',

    // 7. Previous School History & Transfer Certificate (17 fields)
    school1_name: '',
    school1_class: '',
    school1_session: '',
    school1_curri: 'CBSE',
    school1_sub: 'All',
    school2_name: '',
    school2_class: '',
    school2_session: '',
    school2_curri: '',
    school2_sub: '',
    school3_name: '',
    school3_class: '',
    school3_session: '',
    school3_curri: '',
    school3_sub: '',
    tc_issue: 'No',
    photo_stu: '',
    photo_fat: '',
    photo_mot: '',
    photo_guard: '',
  };
  const [admissionForm, setAdmissionForm] = useState(initialAdmissionForm);

  const generateRandomAdmissionNo = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setAdmissionForm((prev) => ({
      ...prev,
      admission_number: `STU${year}${rand}`,
    }));
  };

  // Bulk Upload State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<any | null>(null);

  const BULK_STUDENT_COLUMNS = [
    'id', 'enq_no', 'adm_no', 'adm_no_old', 'adm_no_sch', 'reg_no', 'type',
    'stu_name', 'stu_name_hindi', 'username', 'password', 'fat_name', 'fat_occu',
    'fat_income', 'mot_name', 'mot_occ', 'guard_occ', 'mot_income', 'guard_income',
    'height', 'weight', 'lang', 'cast_cert_no', 'father_pan', 'fat_qual', 'mot_qual',
    'guard_qual', 'guard_name', 'guard_relation', 'guard_no', 'guard_no2', 'house',
    'stream', 'adm_class', 'adm_category', 'class', 'sec', 'gender', 'religion',
    'nationality', 'category', 'address', 'address_co', 'mobile', 'mobile2',
    'mobile_co', 'mobile2_co', 'roll_no', 'sssn', 'dob', 'do_adm', 'new_old',
    'school1_name', 'school1_class', 'school1_session', 'school1_curri', 'school1_sub',
    'school2_name', 'school2_class', 'school2_session', 'school2_curri', 'school2_sub',
    'school3_name', 'school3_class', 'school3_session', 'school3_curri', 'school3_sub',
    'photo_stu', 'photo_fat', 'photo_mot', 'photo_guard', 'allow_discount', 'is_shown',
    'tc_issue', 'fee_cat', 'session', 'student_aadhar', 'aadhar_mother', 'pan_mother',
    'caste', 'fee_type', 'stu_email', 'weight2', 'height2', 'fat_email', 'mot_email',
    'guard_email', 'father_nationality', 'mother_nationality', 'aadhar_father',
    'fat_mobile', 'fat_mobile2', 'mot_mobile', 'mot_mobile2'
  ];

  const downloadSampleTemplate = () => {
    const headers = BULK_STUDENT_COLUMNS.join(',');
    const sampleRow1 = [
      '1', 'ENQ202601', 'STU202601', '', 'SCH-101', 'REG-001', 'Regular',
      'Aarav Sharma', 'आरव शर्मा', 'STU202601', 'Student@123', 'Rajesh Sharma', 'Business',
      '750000', 'Sunita Sharma', 'Teacher', 'Business', '450000', '0',
      '152', '48', 'Hindi', 'CC-2024-998', 'ABCDE1234F', 'Post Graduate', 'Graduate',
      'Graduate', 'Rajesh Sharma', 'Father', '9876543201', '9876543205', 'Red House',
      'Science', 'Grade 10', 'General', 'Grade 10', 'Section A', 'MALE', 'Hindu',
      'Indian', 'General', '123 Civil Lines Delhi', '123 Civil Lines Delhi', '9876543201', '9876543205',
      '9876543201', '9876543205', '1', 'SSSN-99881', '2011-05-14', '2024-04-01', 'New',
      'St. Xavier School', 'Grade 9', '2023-2024', 'CBSE', 'All',
      'DPS Mathura', 'Grade 8', '2022-2023', 'CBSE', 'All',
      '', '', '', '', '',
      '', '', '', '', 'Yes', 'Yes',
      'No', 'Standard', '2026-2027', '998877665544', '112233445566', 'XYZPM1234K',
      'General', 'Quarterly', 'aarav.student@school.edu', '48', '152', 'rajesh.sharma@gmail.com', 'sunita.sharma@gmail.com',
      'rajesh.sharma@gmail.com', 'Indian', 'Indian', '554433221100',
      '9876543201', '9876543205', '9876543202', '9876543206'
    ].map((v) => (v.includes(',') ? `"${v}"` : v)).join(',');

    const sampleRow2 = [
      '2', 'ENQ202602', 'STU202602', '', 'SCH-102', 'REG-002', 'Regular',
      'Diya Verma', 'दिया वर्मा', 'STU202602', 'Student@123', 'Amit Verma', 'Engineer',
      '950000', 'Pooja Verma', 'Doctor', 'Doctor', '850000', '0',
      '148', '42', 'Hindi', 'CC-2024-999', 'FGHIJ5678K', 'Post Graduate', 'Doctorate',
      'Graduate', 'Amit Verma', 'Father', '9876543202', '9876543207', 'Blue House',
      'Commerce', 'Grade 10', 'OBC', 'Grade 10', 'Section A', 'FEMALE', 'Hindu',
      'Indian', 'OBC', '45 Park Street Delhi', '45 Park Street Delhi', '9876543202', '9876543207',
      '9876543202', '9876543207', '2', 'SSSN-99882', '2011-08-22', '2024-04-01', 'New',
      'Modern Academy', 'Grade 9', '2023-2024', 'CBSE', 'All',
      '', '', '', '', '',
      '', '', '', '', '',
      '', '', '', '', 'Yes', 'Yes',
      'No', 'Standard', '2026-2027', '887766554433', '223344556677', 'PQRPM5678L',
      'OBC', 'Quarterly', 'diya.verma@school.edu', '42', '148', 'amit.verma@gmail.com', 'pooja.verma@gmail.com',
      'amit.verma@gmail.com', 'Indian', 'Indian', '665544332211',
      '9876543202', '9876543207', '9876543203', '9876543208'
    ].map((v) => (v.includes(',') ? `"${v}"` : v)).join(',');

    const csvContent = `${headers}\n${sampleRow1}\n${sampleRow2}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_bulk_upload_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export visible/filtered students credentials to CSV
  const exportCredentialsCSV = () => {
    const listToExport = filteredStudents.length > 0 ? filteredStudents : students;
    if (!listToExport || listToExport.length === 0) {
      alert('No students available to export.');
      return;
    }
    const headers = [
      'Admission No (Login ID)',
      'Student Name',
      'Class',
      'Section',
      'Roll No',
      'Registered Parent Phone',
      'Initial Password',
      'App Login Instructions',
    ];
    const rows = listToExport.map((st) => [
      `"${st.admission_number || st.identifier || ''}"`,
      `"${st.first_name || ''} ${st.last_name || ''}"`.trim(),
      `"${st.class_name || ''}"`,
      `"${st.section_name || ''}"`,
      `"${st.roll_number || ''}"`,
      `"${st.emergency_phone || st.phone || ''}"`,
      `"${st.password || 'Student@123'}"`,
      `"Download School App -> Enter Admission No as Identifier and Password -> Login"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_login_credentials_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Student Password (Admin Reset Desk)
  const handleResetStudentPassword = async (studentId: string) => {
    if (!confirm('Are you sure you want to reset this student password to default (Student@123)?')) {
      return;
    }
    setResettingPassword(true);
    try {
      const res = await api.admin.resetStudentPassword(studentId, 'Student@123');
      if (res?.success) {
        showToast('Student password has been reset to Student@123 successfully!');
        if (selectedStudent && selectedStudent.id === studentId) {
          setSelectedStudent((prev: any) => ({
            ...prev,
            password: 'Student@123',
            login_password: 'Student@123',
          }));
        }
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, password: 'Student@123', login_password: 'Student@123' } : s))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
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

        // Auto-detect delimiter: comma vs tab vs semicolon
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
          delimiter = '\t';
        } else if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
          delimiter = ';';
        }

        const parseRow = (line: string): string[] => {
          if (delimiter === '\t') {
            return line.split('\t').map((v) => v.trim().replace(/^["']|["']$/g, ''));
          }
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              values.push(current.trim().replace(/^["']|["']$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          return values;
        };

        const headers = parseRow(lines[0]).map((h) =>
          h.trim().toLowerCase().replace(/['"]/g, '').replace(/[\s\.\-_]+/g, '_').replace(/^_+|_+$/g, '')
        );
        const parsed: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const rowValues = parseRow(lines[i]);
          if (rowValues.length < 2 || rowValues.every((v) => !v)) continue;

          const rowObj: any = {};
          headers.forEach((hdr, idx) => {
            rowObj[hdr] = rowValues[idx] || '';
          });

          // Resolve full name / first & last name
          let firstName = rowObj.first_name || rowObj.firstname || '';
          let lastName = rowObj.last_name || rowObj.lastname || '';
          if (!firstName && (rowObj.stu_name || rowObj.stuname || rowObj.name || rowObj.student_name)) {
            const rawName = (rowObj.stu_name || rowObj.stuname || rowObj.name || rowObj.student_name).trim();
            const parts = rawName.split(/\s+/);
            firstName = parts[0] || 'Student';
            lastName = parts.slice(1).join(' ');
          }
          if (!firstName) firstName = 'Student';

          const admNo =
            rowObj.adm_no ||
            rowObj.admno ||
            rowObj.adm_no_sch ||
            rowObj.reg_no ||
            rowObj.admission_no ||
            rowObj.admission_number ||
            rowObj.admissionno ||
            rowObj.id ||
            '';

          const className =
            rowObj.class ||
            rowObj.adm_class ||
            rowObj.class_name ||
            rowObj.classname ||
            rowObj.grade ||
            'Grade 10';

          const secName =
            rowObj.sec ||
            rowObj.section ||
            rowObj.section_name ||
            rowObj.sec_name ||
            'Section A';

          const phone =
            rowObj.mobile ||
            rowObj.fat_mobile ||
            rowObj.phone ||
            rowObj.contact ||
            '';

          const emergencyPhone =
            rowObj.emergency_phone ||
            rowObj.fat_mobile ||
            rowObj.mobile2 ||
            rowObj.mot_mobile ||
            phone;

          parsed.push({
            ...rowObj, // preserves all 94 original fields!
            admission_no: admNo,
            adm_no: admNo,
            roll_no: rowObj.roll_no || rowObj.roll_number || rowObj.rollno || '',
            first_name: firstName,
            last_name: lastName,
            stu_name: rowObj.stu_name || `${firstName} ${lastName}`.trim(),
            class_name: className,
            class: className,
            section_name: secName,
            sec: secName,
            gender: (rowObj.gender || 'MALE').toUpperCase(),
            dob: parseSafeDate(rowObj.dob || rowObj.date_of_birth || rowObj.birth_date || rowObj.birthdate) || '',
            do_adm: parseSafeDate(rowObj.do_adm || rowObj.admission_date || rowObj.adm_date) || '',
            admission_date: parseSafeDate(rowObj.do_adm || rowObj.admission_date || rowObj.adm_date) || '',
            phone: phone,
            mobile: phone,
            emergency_phone: emergencyPhone,
            father_name: rowObj.fat_name || rowObj.father_name || rowObj.father || '',
            fat_name: rowObj.fat_name || rowObj.father_name || rowObj.father || '',
            mother_name: rowObj.mot_name || rowObj.mother_name || rowObj.mother || '',
            mot_name: rowObj.mot_name || rowObj.mother_name || rowObj.mother || '',
            blood_group: rowObj.blood_group || rowObj.bloodgroup || '',
            password: rowObj.password || 'Student@123',
            address: rowObj.address || rowObj.address_co || '',
            caste: rowObj.caste || rowObj.category || '',
            religion: rowObj.religion || '',
            nationality: rowObj.nationality || rowObj.father_nationality || 'Indian',
            student_aadhar: rowObj.student_aadhar || '',
            aadhar_father: rowObj.aadhar_father || '',
            aadhar_mother: rowObj.aadhar_mother || '',
            father_pan: rowObj.father_pan || '',
            pan_mother: rowObj.pan_mother || '',
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

  // Submit New Student Admission
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentName = (admissionForm.first_name || '').trim();
    if (!studentName) {
      setAdmissionError('Please enter Student First Name.');
      return;
    }
    const admissionNumber = (admissionForm.admission_number || '').trim();
    if (!admissionNumber) {
      setAdmissionError('Please enter or generate an Admission Number.');
      return;
    }

    // Resolve Class
    let finalClass = '';
    let finalClassId: string | null = null;
    if (admissionForm.current_class_id === '__custom__') {
      if (!admissionForm.custom_class_name.trim()) {
        setAdmissionError('Please enter the custom class name (e.g. Class 7).');
        return;
      }
      finalClass = admissionForm.custom_class_name.trim();
    } else if (admissionForm.current_class_id) {
      finalClassId = admissionForm.current_class_id;
      const cls = allClasses.find((c) => c.id === admissionForm.current_class_id);
      finalClass = cls ? cls.name : '';
    } else {
      setAdmissionError('Please select or enter a Class for the student.');
      return;
    }

    // Resolve Section
    let finalSection = '';
    let finalSectionId: string | null = null;
    if (admissionForm.current_section_id === '__custom__') {
      finalSection = admissionForm.custom_section_name.trim();
    } else if (admissionForm.current_section_id) {
      finalSectionId = admissionForm.current_section_id;
      const sec = admissionClassSections.find((s: any) => s.id === admissionForm.current_section_id);
      finalSection = sec ? sec.name : '';
    }

    try {
      setAdmissionSubmitting(true);
      setAdmissionError(null);
      const res = await api.admin.createStudent({
        ...admissionForm,
        first_name: studentName,
        last_name: admissionForm.last_name.trim(),
        admission_number: admissionNumber,
        adm_no: admissionNumber,
        class_id: finalClassId,
        current_class_id: finalClassId,
        class: finalClass,
        adm_class: finalClass,
        section_id: finalSectionId,
        current_section_id: finalSectionId,
        sec: finalSection,
        section: finalSection,
        roll_number: admissionForm.roll_number.trim() || null,
        roll_no: admissionForm.roll_number.trim() || null,
        phone: admissionForm.phone.trim() || admissionForm.fat_mobile.trim() || null,
        mobile: admissionForm.phone.trim() || admissionForm.fat_mobile.trim() || null,
        emergency_phone: admissionForm.fat_mobile.trim() || admissionForm.phone.trim() || null,
        father_name: admissionForm.father_name.trim() || null,
        fat_name: admissionForm.father_name.trim() || null,
        mother_name: admissionForm.mother_name.trim() || null,
        mot_name: admissionForm.mother_name.trim() || null,
        email: admissionForm.email.trim() || null,
        stu_email: admissionForm.email.trim() || null,
        address: admissionForm.address.trim() || null,
        caste: admissionForm.caste.trim() || null,
        student_aadhar: admissionForm.student_aadhar.trim() || null,
        password: admissionForm.password.trim() || 'Student@123',
      });

      const created = res.data || res;
      setAdmissionSuccessData(created);
      setIsAdmissionModalOpen(false);
      setAdmissionForm(initialAdmissionForm);
      showToast(`Admission confirmed for ${created.full_name || created.first_name}!`);

      // Refresh live server state
      await loadData();

      // Automatically focus on this student's class (e.g. Class 7) so they show right there with classmates!
      if (created.class_id) {
        setSelectedClassIds([created.class_id]);
      }
      setActiveTab('directory');
    } catch (err: any) {
      setAdmissionError(err?.message || 'Failed to complete student admission');
    } finally {
      setAdmissionSubmitting(false);
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

  // Admission Form Available Sections
  const admissionClassSections = useMemo(() => {
    if (!admissionForm.current_class_id || admissionForm.current_class_id === '__custom__') return [];
    const cls = allClasses.find((c) => c.id === admissionForm.current_class_id);
    return cls ? cls.sections : [];
  }, [allClasses, admissionForm.current_class_id]);

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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setAdmissionError(null);
              setActiveTab('admission');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'admission'
                ? 'bg-indigo-700 text-white ring-2 ring-indigo-400 shadow-md'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-900/20'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ New Student Admission</span>
          </button>
          <button
            onClick={() => {
              setBulkError(null);
              setBulkSuccess(null);
              setActiveTab('bulk');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-3.5 py-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'bulk'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-2xs'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Bulk Upload (CSV)</span>
          </button>
          <button
            onClick={exportCredentialsCSV}
            title="Download Login ID and Passwords for all visible students"
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-2xs transition cursor-pointer flex items-center gap-2 text-xs font-bold"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Credentials</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh Directory"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync</span>
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

      {/* Page Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Enrolled Students Directory</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'directory' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {totalStudents}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdmissionError(null);
            setActiveTab('admission');
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'admission'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>New Student Admission Form</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              activeTab === 'admission' ? 'bg-indigo-700 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            All 94 ERP Fields
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setBulkError(null);
            setBulkSuccess(null);
            setActiveTab('bulk');
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'bulk'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Bulk Upload (CSV / Excel)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              activeTab === 'bulk' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Batch Import
          </span>
        </button>
      </div>

      {/* VIEW TAB 1: DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
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
    </div>
  )}

      {/* ========================================================================= */}
      {/* VIEW TAB 2: IN-PAGE COMPLETE 94-FIELD ADMISSION FORM                      */}
      {/* ========================================================================= */}
      {activeTab === 'admission' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-indigo-100 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>School ERP Student Admission • Live Synchronization</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                New Student Admission Form
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
                Fill student academic enrollment, class assignment, parent details, demographics, and all 94 legacy ERP fields. Upon confirmation, the student will be instantly enrolled in the live database and login credentials will be generated automatically.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
              <div className="text-xs text-indigo-200">
                Enrolling in Session: <strong className="text-white">{admissionForm.session || '2026-2027'}</strong> | Initial Password: <code className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">Student@123</code>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View Directory</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bulk')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bulk Upload (CSV)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {admissionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-semibold">{admissionError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdmissionSubmit} className="space-y-6">
            {/* 1. ACADEMIC & ENROLLMENT (18 Fields) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase tracking-wide">
                  <GraduationCap className="w-5 h-5" />
                  <span>1. Academic Enrollment &amp; Class Allocation</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  18 ERP Fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Admission Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Admission No / ID *</label>
                    <button
                      type="button"
                      onClick={generateRandomAdmissionNo}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STU202601"
                    value={admissionForm.admission_number}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, admission_number: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Grade *</label>
                  <select
                    required
                    value={admissionForm.current_class_id}
                    onChange={(e) =>
                      setAdmissionForm((prev) => ({
                        ...prev,
                        current_class_id: e.target.value,
                        current_section_id: '',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="">-- Select Class --</option>
                    {allClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter Custom Class (e.g. Class 7)</option>
                  </select>
                  {admissionForm.current_class_id === '__custom__' && (
                    <input
                      type="text"
                      placeholder="Type Class Name (e.g. Class 7)"
                      value={admissionForm.custom_class_name}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, custom_class_name: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-1.5 rounded-xl border border-indigo-300 text-xs font-semibold bg-indigo-50/50 text-indigo-900"
                    />
                  )}
                </div>

                {/* Section */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={admissionForm.current_section_id}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, current_section_id: e.target.value }))}
                    disabled={!admissionForm.current_class_id || admissionForm.current_class_id === '__custom__'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">-- Select Section --</option>
                    {admissionClassSections.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter Custom Section (e.g. Section B)</option>
                  </select>
                  {(admissionForm.current_section_id === '__custom__' || admissionForm.current_class_id === '__custom__') && (
                    <input
                      type="text"
                      placeholder="Type Section (e.g. Section A)"
                      value={admissionForm.custom_section_name}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, custom_section_name: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-1.5 rounded-xl border border-indigo-300 text-xs font-semibold bg-indigo-50/50 text-indigo-900"
                    />
                  )}
                </div>

                {/* Roll Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={admissionForm.roll_number}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, roll_number: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Admission Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Admission (do_adm)</label>
                  <input
                    type="date"
                    value={admissionForm.admission_date}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, admission_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Session */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Session</label>
                  <input
                    type="text"
                    placeholder="2026-2027"
                    value={admissionForm.session}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, session: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Enrollment Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Type</label>
                  <select
                    value={admissionForm.type}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Private">Private</option>
                    <option value="Distance">Distance</option>
                  </select>
                </div>

                {/* Admission Status (new_old) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status (new_old)</label>
                  <select
                    value={admissionForm.new_old}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, new_old: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="New">New Admission</option>
                    <option value="Old">Existing / Promoted</option>
                  </select>
                </div>

                {/* Stream */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stream</label>
                  <select
                    value={admissionForm.stream}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, stream: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>

                {/* House */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">House</label>
                  <input
                    type="text"
                    placeholder="e.g. Red House"
                    value={admissionForm.house}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, house: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Registration No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registration No (reg_no)</label>
                  <input
                    type="text"
                    placeholder="e.g. REG-001"
                    value={admissionForm.reg_no}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, reg_no: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Enquiry No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enquiry No (enq_no)</label>
                  <input
                    type="text"
                    placeholder="e.g. ENQ202601"
                    value={admissionForm.enq_no}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, enq_no: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Old Admission No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Old Adm No (adm_no_old)</label>
                  <input
                    type="text"
                    placeholder="Previous Adm No"
                    value={admissionForm.adm_no_old}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, adm_no_old: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* School Adm No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">School Adm No (adm_no_sch)</label>
                  <input
                    type="text"
                    placeholder="e.g. SCH-101"
                    value={admissionForm.adm_no_sch}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, adm_no_sch: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Fee Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Category (fee_cat)</label>
                  <select
                    value={admissionForm.fee_cat}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fee_cat: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Concession">Concession</option>
                    <option value="RTE">RTE / Free</option>
                    <option value="Staff Ward">Staff Ward</option>
                  </select>
                </div>

                {/* Fee Type / Frequency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Frequency (fee_type)</label>
                  <select
                    value={admissionForm.fee_type}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fee_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                {/* Allow Discount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allow Discount</label>
                  <select
                    value={admissionForm.allow_discount}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, allow_discount: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Public Portal Visibility */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Portal Visibility (is_shown)</label>
                  <select
                    value={admissionForm.is_shown}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, is_shown: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="Yes">Yes (Visible)</option>
                    <option value="No">No (Hidden)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. STUDENT PERSONAL & IDENTIFICATION (13 Fields) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase tracking-wide">
                  <User className="w-5 h-5" />
                  <span>2. Student Identity &amp; Personal Profile</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  13 ERP Fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav"
                    value={admissionForm.first_name}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma"
                    value={admissionForm.last_name}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Name in Hindi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Name in Hindi (देवनागरी)</label>
                  <input
                    type="text"
                    placeholder="e.g. आरव शर्मा"
                    value={admissionForm.stu_name_hindi}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, stu_name_hindi: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth (dob)</label>
                  <input
                    type="date"
                    value={admissionForm.date_of_birth}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={admissionForm.gender}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={admissionForm.blood_group}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, blood_group: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="">-- Blood Group --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                {/* Student Aadhar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Aadhar (12 Digits)</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="e.g. 998877665544"
                    value={admissionForm.student_aadhar}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, student_aadhar: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* SSSN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SSSN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SSSN-99881"
                    value={admissionForm.sssn}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, sssn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mother Tongue / Language</label>
                  <input
                    type="text"
                    placeholder="e.g. Hindi"
                    value={admissionForm.lang}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, lang: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Primary Student Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Mobile (mobile)</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={admissionForm.phone}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Student Alternate Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alt Mobile (mobile2)</label>
                  <input
                    type="tel"
                    placeholder="Alternate number"
                    value={admissionForm.mobile2}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, mobile2: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Student Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Email (stu_email)</label>
                  <input
                    type="email"
                    placeholder="student@school.edu"
                    value={admissionForm.email}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Initial App Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={admissionForm.password}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. FATHER'S COMPLETE PROFILE (10 Fields) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase tracking-wide">
                  <Briefcase className="w-5 h-5" />
                  <span>3. Father's Details</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  10 ERP Fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Father Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Name (fat_name)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={admissionForm.father_name}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, father_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Father Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Mobile (fat_mobile)</label>
                  <input
                    type="tel"
                    placeholder="WhatsApp mobile"
                    value={admissionForm.fat_mobile}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fat_mobile: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Father Alt Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Alt Mobile (fat_mobile2)</label>
                  <input
                    type="tel"
                    placeholder="Alternate contact"
                    value={admissionForm.fat_mobile2}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fat_mobile2: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Father Occupation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation (fat_occu)</label>
                  <input
                    type="text"
                    placeholder="e.g. Business, Engineer"
                    value={admissionForm.fat_occu}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fat_occu: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Father Income */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Income (fat_income)</label>
                  <input
                    type="text"
                    placeholder="e.g. 750000"
                    value={admissionForm.fat_income}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fat_income: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Father Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification (fat_qual)</label>
                  <input
                    type="text"
                    placeholder="e.g. Post Graduate"
                    value={admissionForm.fat_qual}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fat_qual: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Father Aadhar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father Aadhar (aadhar_father)</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="12-digit Aadhar"
                    value={admissionForm.aadhar_father}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, aadhar_father: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Father PAN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father PAN (father_pan)</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={admissionForm.father_pan}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, father_pan: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Father Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father Email (fat_email)</label>
                  <input
                    type="email"
                    placeholder="father@gmail.com"
                    value={admissionForm.fat_email}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, fat_email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 4. MOTHER'S COMPLETE PROFILE (10 Fields) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase tracking-wide">
                  <User className="w-5 h-5" />
                  <span>4. Mother's Details</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  10 ERP Fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mother Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mother's Name (mot_name)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunita Sharma"
                    value={admissionForm.mother_name}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, mother_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Mother Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mother's Mobile (mot_mobile)</label>
                  <input
                    type="tel"
                    placeholder="WhatsApp mobile"
                    value={admissionForm.mot_mobile}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, mot_mobile: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Mother Alt Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mother's Alt Mobile (mot_mobile2)</label>
                  <input
                    type="tel"
                    placeholder="Alternate number"
                    value={admissionForm.mot_mobile2}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, mot_mobile2: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Mother Occupation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation (mot_occ)</label>
                  <input
                    type="text"
                    placeholder="e.g. Teacher, Homemaker"
                    value={admissionForm.mot_occ}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, mot_occ: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Mother Income */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Income (mot_income)</label>
                  <input
                    type="text"
                    placeholder="e.g. 450000"
                    value={admissionForm.mot_income}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, mot_income: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Mother Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification (mot_qual)</label>
                  <input
                    type="text"
                    placeholder="e.g. Graduate"
                    value={admissionForm.mot_qual}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, mot_qual: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Mother Aadhar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mother Aadhar (aadhar_mother)</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="12-digit Aadhar"
                    value={admissionForm.aadhar_mother}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, aadhar_mother: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Mother PAN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mother PAN (pan_mother)</label>
                  <input
                    type="text"
                    placeholder="e.g. XYZPM1234K"
                    value={admissionForm.pan_mother}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, pan_mother: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Mother Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mother Email (mot_email)</label>
                  <input
                    type="email"
                    placeholder="mother@gmail.com"
                    value={admissionForm.mot_email}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, mot_email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 5. GUARDIAN DETAILS (8 Fields) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase tracking-wide">
                  <ShieldCheck className="w-5 h-5" />
                  <span>5. Local Guardian Details (If Applicable)</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  8 ERP Fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Guardian Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name (guard_name)</label>
                  <input
                    type="text"
                    placeholder="Local guardian"
                    value={admissionForm.guard_name}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, guard_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Relation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relation (guard_relation)</label>
                  <input
                    type="text"
                    placeholder="e.g. Uncle, Grandparent"
                    value={admissionForm.guard_relation}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, guard_relation: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Guardian Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Contact (guard_no)</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={admissionForm.guard_no}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, guard_no: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Guardian Alt Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alt Contact (guard_no2)</label>
                  <input
                    type="tel"
                    placeholder="Alternate number"
                    value={admissionForm.guard_no2}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, guard_no2: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Guardian Occupation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation (guard_occ)</label>
                  <input
                    type="text"
                    placeholder="e.g. Advocate"
                    value={admissionForm.guard_occ}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, guard_occ: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Guardian Income */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Income (guard_income)</label>
                  <input
                    type="text"
                    placeholder="e.g. 500000"
                    value={admissionForm.guard_income}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, guard_income: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Guardian Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification (guard_qual)</label>
                  <input
                    type="text"
                    placeholder="e.g. Graduate"
                    value={admissionForm.guard_qual}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, guard_qual: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Guardian Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Email (guard_email)</label>
                  <input
                    type="email"
                    placeholder="guardian@gmail.com"
                    value={admissionForm.guard_email}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, guard_email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 6. ADDRESS, DEMOGRAPHICS & HEALTH (8 Fields) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase tracking-wide">
                  <MapPin className="w-5 h-5" />
                  <span>6. Residential Address, Demographics &amp; Health</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  10 ERP Fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Permanent Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Address (address)</label>
                  <input
                    type="text"
                    placeholder="Full residential address"
                    value={admissionForm.address}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Correspondence Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correspondence Address (address_co)</label>
                  <input
                    type="text"
                    placeholder="Correspondence / Mailing address"
                    value={admissionForm.address_co}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, address_co: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Caste Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Caste / Category (category)</label>
                  <select
                    value={admissionForm.caste}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, caste: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="Minority">Minority</option>
                  </select>
                </div>

                {/* Caste Certificate No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Caste Cert No (cast_cert_no)</label>
                  <input
                    type="text"
                    placeholder="e.g. CC-2024-998"
                    value={admissionForm.cast_cert_no}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, cast_cert_no: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Religion</label>
                  <select
                    value={admissionForm.religion}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, religion: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="Hindu">Hindu</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Sikh">Sikh</option>
                    <option value="Christian">Christian</option>
                    <option value="Jain">Jain</option>
                    <option value="Buddhist">Buddhist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Nationality */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    placeholder="Indian"
                    value={admissionForm.nationality}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, nationality: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm) (height)</label>
                  <input
                    type="text"
                    placeholder="e.g. 152"
                    value={admissionForm.height}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, height: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg) (weight)</label>
                  <input
                    type="text"
                    placeholder="e.g. 48"
                    value={admissionForm.weight}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Medical Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Notes &amp; Allergies</label>
                  <input
                    type="text"
                    placeholder="Any health condition or special care required"
                    value={admissionForm.medical_notes}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, medical_notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 7. PREVIOUS SCHOOL HISTORY & TRANSFER CERTIFICATE (17 Fields) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase tracking-wide">
                  <Building2 className="w-5 h-5" />
                  <span>7. Previous School History &amp; Transfer Documents</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  17 ERP Fields
                </span>
              </div>

              {/* School 1 */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Previous School 1 (Latest)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">School Name (school1_name)</label>
                    <input
                      type="text"
                      placeholder="e.g. St. Xavier School"
                      value={admissionForm.school1_name}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school1_name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class Passed (school1_class)</label>
                    <input
                      type="text"
                      placeholder="e.g. Grade 9"
                      value={admissionForm.school1_class}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school1_class: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Session (school1_session)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2023-2024"
                      value={admissionForm.school1_session}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school1_session: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Board (school1_curri)</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE / ICSE"
                      value={admissionForm.school1_curri}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school1_curri: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subjects (school1_sub)</label>
                    <input
                      type="text"
                      placeholder="All / Core"
                      value={admissionForm.school1_sub}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school1_sub: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* School 2 */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Previous School 2</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">School Name (school2_name)</label>
                    <input
                      type="text"
                      placeholder="DPS Mathura"
                      value={admissionForm.school2_name}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school2_name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class Passed (school2_class)</label>
                    <input
                      type="text"
                      placeholder="e.g. Grade 8"
                      value={admissionForm.school2_class}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school2_class: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Session (school2_session)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2022-2023"
                      value={admissionForm.school2_session}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school2_session: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Board (school2_curri)</label>
                    <input
                      type="text"
                      placeholder="CBSE"
                      value={admissionForm.school2_curri}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school2_curri: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subjects (school2_sub)</label>
                    <input
                      type="text"
                      placeholder="All"
                      value={admissionForm.school2_sub}
                      onChange={(e) => setAdmissionForm((prev) => ({ ...prev, school2_sub: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* TC and Transfer options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Certificate (tc_issue)</label>
                  <select
                    value={admissionForm.tc_issue}
                    onChange={(e) => setAdmissionForm((prev) => ({ ...prev, tc_issue: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="No">No / Pending</option>
                    <option value="Yes">Yes (Submitted)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sticky Submission Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All 94 fields will be safely stored and linked to student profile in PostgreSQL.</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setAdmissionForm(initialAdmissionForm)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={admissionSubmitting}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {admissionSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirming Admission...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Confirm Admission &amp; Issue Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW TAB 3: IN-PAGE BULK UPLOAD WORKSPACE                                 */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Bulk Hero Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/15">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bulk Import Engine • 94 Standard Columns</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Bulk Upload Students via CSV / Excel
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Import your entire school roster in seconds. Classes &amp; Sections are automatically detected and created, student accounts are provisioned, and login credentials are generated instantly.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
              <span className="text-xs text-slate-400">
                Supports standard headers: <code>id, adm_no, stu_name, class, sec, mobile, dob, fat_name...</code>
              </span>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Download 94-Column Sample CSV</span>
              </button>
            </div>
          </div>

          {/* Bulk Workspace Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 text-center transition bg-slate-50/50 hover:bg-indigo-50/20">
              <input
                type="file"
                accept=".csv"
                id="in-page-bulk-file"
                onChange={handleCsvFileChange}
                className="hidden"
              />
              <label htmlFor="in-page-bulk-file" className="cursor-pointer block space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {csvFileName ? `Loaded: ${csvFileName}` : 'Click or Drag & Drop your CSV file here'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {csvPreview.length > 0
                      ? `${csvPreview.length} students parsed and ready for enrollment`
                      : 'File must contain headers matching school ERP specifications'}
                  </p>
                </div>
              </label>
            </div>

            {bulkError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{bulkError}</span>
              </div>
            )}

            {bulkSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Bulk Upload Completed Successfully!</span>
                </div>
                <p>
                  Total Processed: <strong>{bulkSuccess.total || csvPreview.length}</strong> | Created: <strong>{bulkSuccess.created}</strong> | Updated: <strong>{bulkSuccess.updated}</strong>
                </p>
                {bulkSuccess.breakdown && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(bulkSuccess.breakdown).map(([cls, count]) => (
                      <span key={cls} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-semibold">
                        {cls}: {count as any}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CSV Preview Table */}
            {csvPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Preview Data ({csvPreview.length} rows detected)
                  </span>
                  <span className="text-xs text-slate-500">Showing first 5 preview rows</span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Adm No</th>
                        <th className="p-2.5">Class</th>
                        <th className="p-2.5">Section</th>
                        <th className="p-2.5">Father</th>
                        <th className="p-2.5">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {csvPreview.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{row.stu_name || row.name || row.first_name}</td>
                          <td className="p-2.5 font-mono text-slate-700">{row.adm_no || row.admission_number || row.id}</td>
                          <td className="p-2.5">{row.class || row.adm_class || 'Class 7'}</td>
                          <td className="p-2.5">{row.sec || row.section || 'A'}</td>
                          <td className="p-2.5">{row.fat_name || row.father_name || '—'}</td>
                          <td className="p-2.5 font-mono">{row.mobile || row.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvPreview([]);
                      setCsvFileName('');
                      setBulkSuccess(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                  >
                    Clear File
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBulkUpload}
                    disabled={bulkUploading || csvPreview.length === 0}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
                  >
                    {bulkUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enrolling Students...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload &amp; Enroll All {csvPreview.length} Students</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


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

              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-900 font-bold flex items-center gap-1.5 text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    App Login Credentials
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    selectedStudent.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedStudent.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">User ID / Username</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">{selectedStudent.identifier}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedStudent.identifier);
                      setCopiedField('id');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    title="Copy Username"
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                  >
                    {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Password</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {showStudentPassword ? (selectedStudent.password || selectedStudent.login_password || 'Student@123') : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      title={showStudentPassword ? 'Hide Password' : 'Show Password'}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                    >
                      {showStudentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedStudent.password || selectedStudent.login_password || 'Student@123');
                        setCopiedField('pw');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      title="Copy Password"
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                    >
                      {copiedField === 'pw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={resettingPassword}
                  onClick={() => handleResetStudentPassword(selectedStudent.id)}
                  className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <RotateCcw className={`w-3 h-3 ${resettingPassword ? 'animate-spin' : ''}`} />
                  <span>{resettingPassword ? 'Resetting Password…' : 'Reset to Default (Student@123)'}</span>
                </button>
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

      {/* ============================================================ */}
      {/* NEW STUDENT ADMISSION FORM MODAL                            */}
      {/* ============================================================ */}
      {isAdmissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-white to-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Student Admission Form
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      New Enrollment
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enroll a new student into the school database and generate mobile app credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdmissionModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleAdmissionSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Error Alert */}
              {admissionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{admissionError}</span>
                </div>
              )}

              {/* SECTION 1: Academic Enrollment */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                    <GraduationCap className="w-4 h-4" />
                    <span>1. Academic Enrollment</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Class, Section &amp; Identification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Admission Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Admission No *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomAdmissionNo}
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-ID</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STU202601"
                      value={admissionForm.admission_number}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, admission_number: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    />
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Class / Grade *
                    </label>
                    <select
                      required
                      value={admissionForm.current_class_id}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({
                          ...prev,
                          current_class_id: e.target.value,
                          current_section_id: '',
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    >
                      <option value="">-- Select Class --</option>
                      {allClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Section
                    </label>
                    <select
                      value={admissionForm.current_section_id}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, current_section_id: e.target.value }))
                      }
                      disabled={!admissionForm.current_class_id}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">-- Select Section --</option>
                      {admissionClassSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1"
                      value={admissionForm.roll_number}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, roll_number: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    />
                  </div>

                  {/* Admission Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Admission
                    </label>
                    <input
                      type="date"
                      value={admissionForm.admission_date}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, admission_date: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    />
                  </div>

                  {/* Initial App Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default App Password
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={admissionForm.password}
                        onChange={(e) =>
                          setAdmissionForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Student Personal Info */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>2. Student Personal Information</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Bio Data &amp; Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav"
                      value={admissionForm.first_name}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, first_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                      value={admissionForm.last_name}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, last_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                      {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setAdmissionForm((prev) => ({ ...prev, gender: g }))}
                          className={`py-1 text-center rounded-lg text-xs font-bold transition cursor-pointer ${
                            admissionForm.gender === g
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={admissionForm.date_of_birth}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, date_of_birth: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={admissionForm.blood_group}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, blood_group: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    >
                      <option value="">-- Select Blood Group --</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Aadhaar */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Student Aadhaar Number
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="12 digit Aadhaar"
                      value={admissionForm.student_aadhar}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, student_aadhar: e.target.value.replace(/\D/g, '') }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Parent & Contact Details */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>3. Parent &amp; Contact Details</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Communication &amp; Guardian Info</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Father's Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Father&apos;s Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={admissionForm.father_name}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, father_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Father Occupation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Father Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Business / Service"
                      value={admissionForm.fat_occu}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, fat_occu: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Mother's Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mother&apos;s Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunita Sharma"
                      value={admissionForm.mother_name}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, mother_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Registered Parent Mobile */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Parent Mobile (App Login) *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10 digit phone"
                      value={admissionForm.phone}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({
                          ...prev,
                          phone: e.target.value.replace(/\D/g, ''),
                          emergency_phone: prev.emergency_phone || e.target.value.replace(/\D/g, ''),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Alternate Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alternate / Emergency Phone
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Alternate phone"
                      value={admissionForm.emergency_phone}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, emergency_phone: e.target.value.replace(/\D/g, '') }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="parent@example.com"
                      value={admissionForm.email}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Address & Other Details */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>4. Residential Address &amp; Background</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Demographics &amp; Health</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      placeholder="House No, Street, Colony, City, Pincode"
                      value={admissionForm.address}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Category / Caste */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category / Caste
                    </label>
                    <select
                      value={admissionForm.caste}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, caste: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    >
                      <option value="">-- Select Category --</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  {/* Religion */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Religion
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hindu / Muslim / Sikh / Christian"
                      value={admissionForm.religion}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, religion: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Medical Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Medical Notes / Allergies (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Asthma, Peanuts allergy, or Nil"
                      value={admissionForm.medical_notes}
                      onChange={(e) =>
                        setAdmissionForm((prev) => ({ ...prev, medical_notes: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={admissionSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  {admissionSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Admission &amp; Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Admission &amp; Issue Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADMISSION CONFIRMED / CREDENTIALS DIALOG                     */}
      {/* ============================================================ */}
      {admissionSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 p-6 space-y-5">
            {/* Success Icon & Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Admission Confirmed Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                The student has been enrolled into the school database and is immediately ready for mobile app login.
              </p>
            </div>

            {/* Student Card Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900">{admissionSuccessData.full_name || admissionSuccessData.first_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Class &amp; Section:</span>
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {admissionSuccessData.class_name || 'Class Assigned'} {admissionSuccessData.section_name ? `- ${admissionSuccessData.section_name}` : ''}
                </span>
              </div>
              {admissionSuccessData.phone && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Parent Mobile:</span>
                  <span className="font-mono text-slate-700">{admissionSuccessData.phone}</span>
                </div>
              )}
            </div>

            {/* App Login Credentials Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Mobile App Login Credentials</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Username */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                    Username / Login ID
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {admissionSuccessData.admission_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(admissionSuccessData.admission_number);
                        showToast('Username copied to clipboard!');
                      }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Copy Username"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                    Initial Password
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {admissionSuccessData.password || 'Student@123'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(admissionSuccessData.password || 'Student@123');
                        showToast('Password copied to clipboard!');
                      }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                Parents can download the School App, type this Admission No &amp; Password, and login immediately.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const slipText = `SCHOOL ADMISSION SLIP\nName: ${admissionSuccessData.full_name}\nAdmission No: ${admissionSuccessData.admission_number}\nClass: ${admissionSuccessData.class_name || ''} - ${admissionSuccessData.section_name || ''}\nApp Login ID: ${admissionSuccessData.admission_number}\nDefault Password: ${admissionSuccessData.password || 'Student@123'}\nDownload App & Login.`;
                  navigator.clipboard.writeText(slipText);
                  showToast('Admission slip copied to clipboard!');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setAdmissionSuccessData(null)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer text-center"
              >
                Done &amp; View Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
