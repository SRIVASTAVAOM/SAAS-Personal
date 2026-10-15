import 'package:equatable/equatable.dart';

class StudentProfileModel extends Equatable {
  final String id;
  final String admissionNumber;
  final String? rollNumber;
  final String firstName;
  final String lastName;
  final String gender;
  final String dateOfBirth;
  final String admissionDate;
  final String? currentClassId;
  final String? currentSectionId;
  final String? fatherName;
  final String? motherName;
  final String? guardianName;
  final String? emergencyPhone;
  final String? bloodGroup;
  final String? medicalNotes;
  final String? className;
  final String? sectionName;
  final String? schoolName;
  final String? schoolPhone;
  final String? schoolEmail;
  final String? schoolAddress;

  const StudentProfileModel({
    required this.id,
    required this.admissionNumber,
    this.rollNumber,
    required this.firstName,
    required this.lastName,
    required this.gender,
    required this.dateOfBirth,
    required this.admissionDate,
    this.currentClassId,
    this.currentSectionId,
    this.fatherName,
    this.motherName,
    this.guardianName,
    this.emergencyPhone,
    this.bloodGroup,
    this.medicalNotes,
    this.className,
    this.sectionName,
    this.schoolName,
    this.schoolPhone,
    this.schoolEmail,
    this.schoolAddress,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory StudentProfileModel.fromJson(Map<String, dynamic> json) {
    return StudentProfileModel(
      id: json['id'] as String? ?? '',
      admissionNumber: json['admission_number'] as String? ?? '',
      rollNumber: json['roll_number'] as String?,
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      gender: json['gender'] as String? ?? '',
      dateOfBirth: json['date_of_birth'] as String? ?? '',
      admissionDate: json['admission_date'] as String? ?? '',
      currentClassId: (json['current_class_id'] ?? json['class_id']) as String?,
      currentSectionId: (json['current_section_id'] ?? json['section_id']) as String?,
      fatherName: json['father_name'] as String?,
      motherName: json['mother_name'] as String?,
      guardianName: json['guardian_name'] as String?,
      emergencyPhone: json['emergency_phone'] as String?,
      bloodGroup: json['blood_group'] as String?,
      medicalNotes: json['medical_notes'] as String?,
      className: json['class_name'] as String?,
      sectionName: json['section_name'] as String?,
      schoolName: json['school_name'] as String?,
      schoolPhone: json['school_phone'] as String?,
      schoolEmail: json['school_email'] as String?,
      schoolAddress: json['school_address'] as String?,
    );
  }

  @override
  List<Object?> get props => [
        id,
        admissionNumber,
        rollNumber,
        firstName,
        lastName,
        gender,
        dateOfBirth,
        admissionDate,
        currentClassId,
        currentSectionId,
        fatherName,
        motherName,
        guardianName,
        emergencyPhone,
        bloodGroup,
        medicalNotes,
        className,
        sectionName,
        schoolName,
        schoolPhone,
        schoolEmail,
        schoolAddress,
      ];
}

