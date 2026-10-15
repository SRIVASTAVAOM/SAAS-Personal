class HomeworkModel {
  final String id;
  final String schoolId;
  final String classId;
  final String? className;
  final String sectionId;
  final String? sectionName;
  final String subjectId;
  final String? subjectName;
  final String? subjectCode;
  final String assignedByStaffId;
  final String? teacherName;
  final String title;
  final String description;
  final String assignedDate;
  final String dueDate;
  final String? s3AttachmentKey;
  final String? attachmentName;
  final String studentStatus; // 'PENDING' | 'COMPLETED'
  final String? completedAt;
  final int completedCount;
  final int totalStudents;

  const HomeworkModel({
    required this.id,
    required this.schoolId,
    required this.classId,
    this.className,
    required this.sectionId,
    this.sectionName,
    required this.subjectId,
    this.subjectName,
    this.subjectCode,
    required this.assignedByStaffId,
    this.teacherName,
    required this.title,
    required this.description,
    required this.assignedDate,
    required this.dueDate,
    this.s3AttachmentKey,
    this.attachmentName,
    this.studentStatus = 'PENDING',
    this.completedAt,
    this.completedCount = 0,
    this.totalStudents = 0,
  });

  bool get isCompleted => studentStatus == 'COMPLETED';
  bool get hasAttachment => s3AttachmentKey != null && s3AttachmentKey!.isNotEmpty;

  factory HomeworkModel.fromJson(Map<String, dynamic> json) {
    return HomeworkModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String? ?? '',
      classId: json['class_id'] as String? ?? '',
      className: json['class_name'] as String?,
      sectionId: json['section_id'] as String? ?? '',
      sectionName: json['section_name'] as String?,
      subjectId: json['subject_id'] as String? ?? '',
      subjectName: json['subject_name'] as String?,
      subjectCode: json['subject_code'] as String?,
      assignedByStaffId: json['assigned_by_staff_id'] as String? ?? '',
      teacherName: json['teacher_name'] as String?,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      assignedDate: json['assigned_date'] as String? ?? '',
      dueDate: json['due_date'] as String? ?? '',
      s3AttachmentKey: json['s3_attachment_key'] as String?,
      attachmentName: json['attachment_name'] as String?,
      studentStatus: json['student_status'] as String? ?? 'PENDING',
      completedAt: json['completed_at'] as String?,
      completedCount: (json['completed_count'] as num?)?.toInt() ?? 0,
      totalStudents: (json['total_students'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'class_id': classId,
      'class_name': className,
      'section_id': sectionId,
      'section_name': sectionName,
      'subject_id': subjectId,
      'subject_name': subjectName,
      'subject_code': subjectCode,
      'assigned_by_staff_id': assignedByStaffId,
      'teacher_name': teacherName,
      'title': title,
      'description': description,
      'assigned_date': assignedDate,
      'due_date': dueDate,
      's3_attachment_key': s3AttachmentKey,
      'attachment_name': attachmentName,
      'student_status': studentStatus,
      'completed_at': completedAt,
      'completed_count': completedCount,
      'total_students': totalStudents,
    };
  }

  HomeworkModel copyWith({
    String? studentStatus,
    String? completedAt,
    int? completedCount,
  }) {
    return HomeworkModel(
      id: id,
      schoolId: schoolId,
      classId: classId,
      className: className,
      sectionId: sectionId,
      sectionName: sectionName,
      subjectId: subjectId,
      subjectName: subjectName,
      subjectCode: subjectCode,
      assignedByStaffId: assignedByStaffId,
      teacherName: teacherName,
      title: title,
      description: description,
      assignedDate: assignedDate,
      dueDate: dueDate,
      s3AttachmentKey: s3AttachmentKey,
      attachmentName: attachmentName,
      studentStatus: studentStatus ?? this.studentStatus,
      completedAt: completedAt ?? this.completedAt,
      completedCount: completedCount ?? this.completedCount,
      totalStudents: totalStudents,
    );
  }
}
