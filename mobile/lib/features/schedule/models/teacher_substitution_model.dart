import 'package:equatable/equatable.dart';

class TeacherSubstitutionModel extends Equatable {
  final String id;
  final String schoolId;
  final String timetableSlotId;
  final String substitutionDate;
  final String originalTeacherId;
  final String substituteTeacherId;
  final String? remarks;
  final String status;
  final int? periodNumber;
  final String? startTime;
  final String? endTime;
  final String? className;
  final String? sectionName;
  final String? subjectName;
  final String? originalTeacherName;
  final String? substituteTeacherName;
  final String arrangementType; // 'ASSIGNED_TO_ME' or 'COVERING_FOR_ME'

  const TeacherSubstitutionModel({
    required this.id,
    required this.schoolId,
    required this.timetableSlotId,
    required this.substitutionDate,
    required this.originalTeacherId,
    required this.substituteTeacherId,
    this.remarks,
    required this.status,
    this.periodNumber,
    this.startTime,
    this.endTime,
    this.className,
    this.sectionName,
    this.subjectName,
    this.originalTeacherName,
    this.substituteTeacherName,
    this.arrangementType = 'ASSIGNED_TO_ME',
  });

  factory TeacherSubstitutionModel.fromJson(
    Map<String, dynamic> json, {
    String defaultType = 'ASSIGNED_TO_ME',
  }) {
    return TeacherSubstitutionModel(
      id: json['id'] as String? ?? '',
      schoolId: json['school_id'] as String? ?? '',
      timetableSlotId: json['timetable_slot_id'] as String? ?? '',
      substitutionDate: json['substitution_date'] is String
          ? (json['substitution_date'] as String).split('T').first
          : '',
      originalTeacherId: json['original_teacher_id'] as String? ?? '',
      substituteTeacherId: json['substitute_teacher_id'] as String? ?? '',
      remarks: json['remarks'] as String?,
      status: json['status'] as String? ?? 'ASSIGNED',
      periodNumber: (json['period_number'] as num?)?.toInt(),
      startTime: json['start_time'] as String?,
      endTime: json['end_time'] as String?,
      className: json['class_name'] as String?,
      sectionName: json['section_name'] as String?,
      subjectName: json['subject_name'] as String?,
      originalTeacherName: json['original_teacher_name'] as String?,
      substituteTeacherName: json['substitute_teacher_name'] as String?,
      arrangementType: json['arrangement_type'] as String? ?? defaultType,
    );
  }

  @override
  List<Object?> get props => [
        id,
        schoolId,
        timetableSlotId,
        substitutionDate,
        originalTeacherId,
        substituteTeacherId,
        remarks,
        status,
        periodNumber,
        startTime,
        endTime,
        className,
        sectionName,
        subjectName,
        originalTeacherName,
        substituteTeacherName,
        arrangementType,
      ];
}
