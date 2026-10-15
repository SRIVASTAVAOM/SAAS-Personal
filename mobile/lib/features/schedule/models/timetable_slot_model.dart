import 'package:equatable/equatable.dart';

class TimetableSlotModel extends Equatable {
  final String id;
  final String schoolId;
  final String academicYearId;
  final String classId;
  final String sectionId;
  final int dayOfWeek; // 1 = Mon ... 6 = Sat
  final int periodNumber;
  final String startTime;
  final String endTime;
  final String subjectId;
  final String teacherId;
  final String? roomNumber;
  final String? className;
  final String? sectionName;
  final String? subjectName;
  final String? teacherName;

  const TimetableSlotModel({
    required this.id,
    required this.schoolId,
    required this.academicYearId,
    required this.classId,
    required this.sectionId,
    required this.dayOfWeek,
    required this.periodNumber,
    required this.startTime,
    required this.endTime,
    required this.subjectId,
    required this.teacherId,
    this.roomNumber,
    this.className,
    this.sectionName,
    this.subjectName,
    this.teacherName,
  });

  factory TimetableSlotModel.fromJson(Map<String, dynamic> json) {
    return TimetableSlotModel(
      id: json['id'] as String? ?? '',
      schoolId: json['school_id'] as String? ?? '',
      academicYearId: json['academic_year_id'] as String? ?? '',
      classId: json['class_id'] as String? ?? '',
      sectionId: json['section_id'] as String? ?? '',
      dayOfWeek: (json['day_of_week'] as num?)?.toInt() ?? 1,
      periodNumber: (json['period_number'] as num?)?.toInt() ?? 1,
      startTime: json['start_time'] as String? ?? '',
      endTime: json['end_time'] as String? ?? '',
      subjectId: json['subject_id'] as String? ?? '',
      teacherId: json['teacher_id'] as String? ?? '',
      roomNumber: json['room_number'] as String?,
      className: json['class_name'] as String?,
      sectionName: json['section_name'] as String?,
      subjectName: json['subject_name'] as String?,
      teacherName: json['teacher_name'] as String?,
    );
  }

  String get dayName {
    switch (dayOfWeek) {
      case 1:
        return 'Monday';
      case 2:
        return 'Tuesday';
      case 3:
        return 'Wednesday';
      case 4:
        return 'Thursday';
      case 5:
        return 'Friday';
      case 6:
        return 'Saturday';
      default:
        return 'Sunday';
    }
  }

  String get dayShort {
    switch (dayOfWeek) {
      case 1:
        return 'Mon';
      case 2:
        return 'Tue';
      case 3:
        return 'Wed';
      case 4:
        return 'Thu';
      case 5:
        return 'Fri';
      case 6:
        return 'Sat';
      default:
        return 'Sun';
    }
  }

  @override
  List<Object?> get props => [
        id,
        schoolId,
        academicYearId,
        classId,
        sectionId,
        dayOfWeek,
        periodNumber,
        startTime,
        endTime,
        subjectId,
        teacherId,
        roomNumber,
        className,
        sectionName,
        subjectName,
        teacherName,
      ];
}
