import 'package:equatable/equatable.dart';

class SubjectTeacherItem extends Equatable {
  final String subjectId;
  final String subjectName;
  final String subjectCode;
  final String? subjectType;
  final String? teacherName;
  final String? teacherPhone;
  final String? employeeCode;
  final bool isClassTeacher;

  const SubjectTeacherItem({
    required this.subjectId,
    required this.subjectName,
    required this.subjectCode,
    this.subjectType,
    this.teacherName,
    this.teacherPhone,
    this.employeeCode,
    this.isClassTeacher = false,
  });

  factory SubjectTeacherItem.fromJson(Map<String, dynamic> json) {
    return SubjectTeacherItem(
      subjectId: json['subject_id'] as String? ?? '',
      subjectName: json['subject_name'] as String? ?? '',
      subjectCode: json['subject_code'] as String? ?? '',
      subjectType: json['subject_type'] as String?,
      teacherName: json['teacher_name'] as String?,
      teacherPhone: (json['teacher_phone'] ?? json['emergency_phone']) as String?,
      employeeCode: json['employee_code'] as String?,
      isClassTeacher: json['is_class_teacher'] as bool? ?? false,
    );
  }

  @override
  List<Object?> get props => [
        subjectId,
        subjectName,
        subjectCode,
        subjectType,
        teacherName,
        teacherPhone,
        employeeCode,
        isClassTeacher,
      ];
}

