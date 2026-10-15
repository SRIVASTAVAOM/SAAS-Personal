class ExamModel {
  final String id;
  final String name;
  final String? description;
  final String startDate;
  final String endDate;
  final bool isPublished;
  final String? academicYearLabel;
  final String? wingName;

  const ExamModel({
    required this.id,
    required this.name,
    this.description,
    required this.startDate,
    required this.endDate,
    required this.isPublished,
    this.academicYearLabel,
    this.wingName,
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    return ExamModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      startDate: json['start_date'] as String,
      endDate: json['end_date'] as String,
      isPublished: json['is_published'] as bool? ?? false,
      academicYearLabel: json['academic_year_label'] as String?,
      wingName: json['wing_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'start_date': startDate,
        'end_date': endDate,
        'is_published': isPublished,
        'academic_year_label': academicYearLabel,
        'wing_name': wingName,
      };
}

class ExamDatesheetModel {
  final String id;
  final String examId;
  final String? examName;
  final String classId;
  final String? className;
  final String? sectionId;
  final String? sectionName;
  final String subjectId;
  final String? subjectName;
  final String? subjectCode;
  final String examDate;
  final String startTime;
  final String endTime;
  final double maxMarks;
  final double passingMarks;
  final String? invigilatorName;
  final bool isPublished;
  final bool isLocked;

  const ExamDatesheetModel({
    required this.id,
    required this.examId,
    this.examName,
    required this.classId,
    this.className,
    this.sectionId,
    this.sectionName,
    required this.subjectId,
    this.subjectName,
    this.subjectCode,
    required this.examDate,
    required this.startTime,
    required this.endTime,
    required this.maxMarks,
    required this.passingMarks,
    this.invigilatorName,
    this.isPublished = false,
    this.isLocked = false,
  });

  factory ExamDatesheetModel.fromJson(Map<String, dynamic> json) {
    return ExamDatesheetModel(
      id: json['id'] as String,
      examId: json['exam_id'] as String,
      examName: json['exam_name'] as String?,
      classId: json['class_id'] as String,
      className: json['class_name'] as String?,
      sectionId: json['section_id'] as String?,
      sectionName: json['section_name'] as String?,
      subjectId: json['subject_id'] as String,
      subjectName: json['subject_name'] as String?,
      subjectCode: json['subject_code'] as String?,
      examDate: json['exam_date'] as String,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      maxMarks: (json['max_marks'] as num).toDouble(),
      passingMarks: (json['passing_marks'] as num?)?.toDouble() ?? 33.0,
      invigilatorName: json['invigilator_name'] as String?,
      isPublished: json['is_published'] as bool? ?? false,
      isLocked: json['is_locked'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'exam_id': examId,
        'exam_name': examName,
        'class_id': classId,
        'class_name': className,
        'section_id': sectionId,
        'section_name': sectionName,
        'subject_id': subjectId,
        'subject_name': subjectName,
        'subject_code': subjectCode,
        'exam_date': examDate,
        'start_time': startTime,
        'end_time': endTime,
        'max_marks': maxMarks,
        'passing_marks': passingMarks,
        'invigilator_name': invigilatorName,
        'is_published': isPublished,
        'is_locked': isLocked,
      };
}

class StudentMarkRosterModel {
  final String studentId;
  final String firstName;
  final String lastName;
  final String admissionNumber;
  final String rollNumber;
  final String? markId;
  final double? marksObtained;
  final bool isAbsent;
  final String? remarks;
  final String status;
  final String? enteredByName;

  const StudentMarkRosterModel({
    required this.studentId,
    required this.firstName,
    required this.lastName,
    required this.admissionNumber,
    required this.rollNumber,
    this.markId,
    this.marksObtained,
    required this.isAbsent,
    this.remarks,
    required this.status,
    this.enteredByName,
  });

  String get fullName => '$firstName $lastName';

  factory StudentMarkRosterModel.fromJson(Map<String, dynamic> json) {
    return StudentMarkRosterModel(
      studentId: json['student_id'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      admissionNumber: json['admission_number'] as String,
      rollNumber: json['roll_number'] as String,
      markId: json['mark_id'] as String?,
      marksObtained: (json['marks_obtained'] as num?)?.toDouble(),
      isAbsent: json['is_absent'] as bool? ?? false,
      remarks: json['remarks'] as String?,
      status: json['status'] as String? ?? 'NOT_ENTERED',
      enteredByName: json['entered_by_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'student_id': studentId,
        'first_name': firstName,
        'last_name': lastName,
        'admission_number': admissionNumber,
        'roll_number': rollNumber,
        'mark_id': markId,
        'marks_obtained': marksObtained,
        'is_absent': isAbsent,
        'remarks': remarks,
        'status': status,
        'entered_by_name': enteredByName,
      };
}

class DatesheetSummaryModel {
  final String datesheetId;
  final String subjectName;
  final double maxMarks;
  final int totalStudents;
  final int enteredCount;
  final int absentCount;
  final int missingCount;
  final double? averageMarks;
  final double? highestMarks;
  final double? lowestMarks;
  final String status;

  const DatesheetSummaryModel({
    required this.datesheetId,
    required this.subjectName,
    required this.maxMarks,
    required this.totalStudents,
    required this.enteredCount,
    required this.absentCount,
    required this.missingCount,
    this.averageMarks,
    this.highestMarks,
    this.lowestMarks,
    required this.status,
  });

  factory DatesheetSummaryModel.fromJson(Map<String, dynamic> json) {
    return DatesheetSummaryModel(
      datesheetId: json['datesheet_id'] as String,
      subjectName: json['subject_name'] as String,
      maxMarks: (json['max_marks'] as num).toDouble(),
      totalStudents: json['total_students'] as int,
      enteredCount: json['entered_count'] as int,
      absentCount: json['absent_count'] as int,
      missingCount: json['missing_count'] as int,
      averageMarks: (json['average_marks'] as num?)?.toDouble(),
      highestMarks: (json['highest_marks'] as num?)?.toDouble(),
      lowestMarks: (json['lowest_marks'] as num?)?.toDouble(),
      status: json['status'] as String,
    );
  }
}

class ReportCardModel {
  final String id;
  final String examId;
  final String studentId;
  final String? studentName;
  final String? rollNumber;
  final String? admissionNumber;
  final String? className;
  final String? sectionName;
  final double totalMarksObtained;
  final double totalMaxMarks;
  final double percentage;
  final int subjectsEvaluatedCount;
  final int subjectsAbsentCount;
  final String status;
  final String? classTeacherRemarks;

  const ReportCardModel({
    required this.id,
    required this.examId,
    required this.studentId,
    this.studentName,
    this.rollNumber,
    this.admissionNumber,
    this.className,
    this.sectionName,
    required this.totalMarksObtained,
    required this.totalMaxMarks,
    required this.percentage,
    required this.subjectsEvaluatedCount,
    required this.subjectsAbsentCount,
    required this.status,
    this.classTeacherRemarks,
  });

  factory ReportCardModel.fromJson(Map<String, dynamic> json) {
    return ReportCardModel(
      id: json['id'] as String,
      examId: json['exam_id'] as String,
      studentId: json['student_id'] as String,
      studentName: json['student_name'] as String?,
      rollNumber: json['roll_number'] as String?,
      admissionNumber: json['admission_number'] as String?,
      className: json['class_name'] as String?,
      sectionName: json['section_name'] as String?,
      totalMarksObtained: (json['total_marks_obtained'] as num).toDouble(),
      totalMaxMarks: (json['total_max_marks'] as num).toDouble(),
      percentage: (json['percentage'] as num).toDouble(),
      subjectsEvaluatedCount: json['subjects_evaluated_count'] as int? ?? 0,
      subjectsAbsentCount: json['subjects_absent_count'] as int? ?? 0,
      status: json['status'] as String,
      classTeacherRemarks: json['class_teacher_remarks'] as String?,
    );
  }
}

class StudentExamResultModel {
  final ExamModel exam;
  final ReportCardModel reportCard;
  final List<SubjectMarkItemModel> subjectMarks;

  const StudentExamResultModel({
    required this.exam,
    required this.reportCard,
    required this.subjectMarks,
  });

  factory StudentExamResultModel.fromJson(Map<String, dynamic> json) {
    return StudentExamResultModel(
      exam: ExamModel.fromJson(json['exam'] as Map<String, dynamic>),
      reportCard: ReportCardModel.fromJson(json['reportCard'] as Map<String, dynamic>),
      subjectMarks: (json['subjectMarks'] as List<dynamic>)
          .map((e) => SubjectMarkItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class SubjectMarkItemModel {
  final String subjectName;
  final String subjectCode;
  final double maxMarks;
  final double passingMarks;
  final double? marksObtained;
  final bool isAbsent;
  final String? remarks;
  final String status;

  const SubjectMarkItemModel({
    required this.subjectName,
    required this.subjectCode,
    required this.maxMarks,
    required this.passingMarks,
    this.marksObtained,
    required this.isAbsent,
    this.remarks,
    required this.status,
  });

  factory SubjectMarkItemModel.fromJson(Map<String, dynamic> json) {
    return SubjectMarkItemModel(
      subjectName: json['subject_name'] as String,
      subjectCode: json['subject_code'] as String,
      maxMarks: (json['max_marks'] as num).toDouble(),
      passingMarks: (json['passing_marks'] as num?)?.toDouble() ?? 33.0,
      marksObtained: (json['marks_obtained'] as num?)?.toDouble(),
      isAbsent: json['is_absent'] as bool? ?? false,
      remarks: json['remarks'] as String?,
      status: json['status'] as String? ?? 'NOT_ENTERED',
    );
  }
}
