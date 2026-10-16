import 'package:equatable/equatable.dart';

class StaffAllocationItem extends Equatable {
  final String subjectName;
  final String subjectCode;
  final String className;
  final String sectionName;

  const StaffAllocationItem({
    required this.subjectName,
    required this.subjectCode,
    required this.className,
    required this.sectionName,
  });

  factory StaffAllocationItem.fromJson(Map<String, dynamic> json) {
    return StaffAllocationItem(
      subjectName: json['subject_name'] as String? ?? '',
      subjectCode: json['subject_code'] as String? ?? '',
      className: json['class_name'] as String? ?? '',
      sectionName: json['section_name'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [subjectName, subjectCode, className, sectionName];
}

class StaffProfileModel extends Equatable {
  final String id;
  final String employeeCode;
  final String firstName;
  final String lastName;
  final String gender;
  final String dateOfBirth;
  final String? qualification;
  final String joiningDate;
  final String? phone;
  final String? emergencyPhone;
  final String? bloodGroup;
  final List<StaffAllocationItem> allocations;
  final String? schoolName;
  final String? designation;
  final Map<String, dynamic>? menuConfig;
  final Map<String, dynamic>? brandingConfig;
  final List<dynamic>? assignments;

  const StaffProfileModel({
    required this.id,
    required this.employeeCode,
    required this.firstName,
    required this.lastName,
    required this.gender,
    required this.dateOfBirth,
    this.qualification,
    required this.joiningDate,
    this.phone,
    this.emergencyPhone,
    this.bloodGroup,
    required this.allocations,
    this.schoolName,
    this.designation,
    this.menuConfig,
    this.brandingConfig,
    this.assignments,
  });

  String get fullName => '$firstName $lastName'.trim();

  bool get isClassTeacher {
    if (assignments != null) {
      final hasClassTeacher = assignments!.any((a) =>
          a is Map && (a['assignment_type'] == 'CLASS_TEACHER' || a['assignmentType'] == 'CLASS_TEACHER'));
      if (hasClassTeacher) return true;
    }
    return false;
  }

  factory StaffProfileModel.fromJson(Map<String, dynamic> json) {
    return StaffProfileModel(
      id: json['id'] as String? ?? '',
      employeeCode: json['employee_code'] as String? ?? '',
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      gender: json['gender'] as String? ?? '',
      dateOfBirth: json['date_of_birth'] as String? ?? '',
      qualification: json['qualification'] as String?,
      joiningDate: json['joining_date'] as String? ?? '',
      phone: json['phone'] as String?,
      emergencyPhone: json['emergency_phone'] as String?,
      bloodGroup: json['blood_group'] as String?,
      allocations: (json['allocations'] as List<dynamic>?)
              ?.map((e) => StaffAllocationItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      schoolName: json['school_name'] as String?,
      designation: json['designation'] as String? ?? json['qualification'] as String?,
      menuConfig: json['menu_config'] as Map<String, dynamic>?,
      brandingConfig: json['branding_config'] as Map<String, dynamic>?,
      assignments: json['assignments'] as List<dynamic>?,
    );
  }

  @override
  List<Object?> get props => [
        id,
        employeeCode,
        firstName,
        lastName,
        gender,
        dateOfBirth,
        qualification,
        joiningDate,
        phone,
        emergencyPhone,
        bloodGroup,
        allocations,
        schoolName,
        designation,
        menuConfig,
        brandingConfig,
        assignments,
      ];
}
