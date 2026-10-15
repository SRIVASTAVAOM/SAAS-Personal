import 'package:equatable/equatable.dart';

class OnlineClassModel extends Equatable {
  final String id;
  final String schoolId;
  final String academicYearId;
  final String classId;
  final String sectionId;
  final String subjectId;
  final String teacherId;
  final String title;
  final String scheduledDate;
  final String startTime;
  final int durationMinutes;
  final String meetingUrl;
  final String status;
  final String? className;
  final String? sectionName;
  final String? subjectName;
  final String? teacherName;
  final String? originalTeacherName;

  const OnlineClassModel({
    required this.id,
    required this.schoolId,
    required this.academicYearId,
    required this.classId,
    required this.sectionId,
    required this.subjectId,
    required this.teacherId,
    required this.title,
    required this.scheduledDate,
    required this.startTime,
    required this.durationMinutes,
    required this.meetingUrl,
    required this.status,
    this.className,
    this.sectionName,
    this.subjectName,
    this.teacherName,
    this.originalTeacherName,
  });

  factory OnlineClassModel.fromJson(Map<String, dynamic> json) {
    return OnlineClassModel(
      id: json['id'] as String? ?? '',
      schoolId: json['school_id'] as String? ?? '',
      academicYearId: json['academic_year_id'] as String? ?? '',
      classId: json['class_id'] as String? ?? '',
      sectionId: json['section_id'] as String? ?? '',
      subjectId: json['subject_id'] as String? ?? '',
      teacherId: json['teacher_id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      scheduledDate: json['scheduled_date'] is String
          ? (json['scheduled_date'] as String).split('T').first
          : '',
      startTime: json['start_time'] as String? ?? '',
      durationMinutes: (json['duration_minutes'] as num?)?.toInt() ?? 40,
      meetingUrl: json['meeting_url'] as String? ?? '',
      status: json['status'] as String? ?? 'SCHEDULED',
      className: json['class_name'] as String?,
      sectionName: json['section_name'] as String?,
      subjectName: json['subject_name'] as String?,
      teacherName: json['teacher_name'] as String?,
      originalTeacherName: json['original_teacher_name'] as String?,
    );
  }

  @override
  List<Object?> get props => [
        id,
        schoolId,
        academicYearId,
        classId,
        sectionId,
        subjectId,
        teacherId,
        title,
        scheduledDate,
        startTime,
        durationMinutes,
        meetingUrl,
        status,
        className,
        sectionName,
        subjectName,
        teacherName,
        originalTeacherName,
      ];
}
