import 'package:equatable/equatable.dart';

class StudentRosterItem extends Equatable {
  final String id;
  final String admissionNumber;
  final String? rollNumber;
  final String firstName;
  final String lastName;
  final String gender;
  final String? emergencyPhone;
  final String? bloodGroup;
  final String? medicalNotes;
  final String? classId;
  final String? sectionId;

  const StudentRosterItem({
    required this.id,
    required this.admissionNumber,
    this.rollNumber,
    required this.firstName,
    required this.lastName,
    required this.gender,
    this.emergencyPhone,
    this.bloodGroup,
    this.medicalNotes,
    this.classId,
    this.sectionId,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory StudentRosterItem.fromJson(Map<String, dynamic> json) {
    return StudentRosterItem(
      id: json['id'] as String? ?? '',
      admissionNumber: json['admission_number'] as String? ?? '',
      rollNumber: json['roll_number'] as String?,
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      gender: json['gender'] as String? ?? '',
      emergencyPhone: json['emergency_phone'] as String?,
      bloodGroup: json['blood_group'] as String?,
      medicalNotes: json['medical_notes'] as String?,
      classId: json['class_id'] as String?,
      sectionId: json['section_id'] as String?,
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
        emergencyPhone,
        bloodGroup,
        medicalNotes,
        classId,
        sectionId,
      ];

}
