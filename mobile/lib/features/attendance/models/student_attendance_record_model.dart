class StudentAttendanceRecordModel {
  final String? id;
  final String studentId;
  final String? admissionNumber;
  final String? studentName;
  final int? rollNumber;
  final String? classId;
  final String? sectionId;
  final String attendanceDate;
  final String status; // 'PRESENT' | 'ABSENT'
  final String? remarks;
  final String? markedByName;

  const StudentAttendanceRecordModel({
    this.id,
    required this.studentId,
    this.admissionNumber,
    this.studentName,
    this.rollNumber,
    this.classId,
    this.sectionId,
    required this.attendanceDate,
    required this.status,
    this.remarks,
    this.markedByName,
  });

  factory StudentAttendanceRecordModel.fromJson(Map<String, dynamic> json) {
    return StudentAttendanceRecordModel(
      id: json['id'] as String?,
      studentId: json['student_id'] as String,
      admissionNumber: json['admission_number'] as String?,
      studentName: json['student_name'] as String?,
      rollNumber: json['roll_number'] is int
          ? json['roll_number'] as int
          : (json['roll_number'] != null
              ? int.tryParse(json['roll_number'].toString())
              : null),
      classId: json['class_id'] as String?,
      sectionId: json['section_id'] as String?,
      attendanceDate: json['attendance_date'] as String,
      status: (json['status'] as String).toUpperCase(),
      remarks: json['remarks'] as String?,
      markedByName: json['marked_by_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'student_id': studentId,
      'attendance_date': attendanceDate,
      'status': status,
      'remarks': ?remarks,
    };
  }

  StudentAttendanceRecordModel copyWith({
    String? status,
    String? remarks,
  }) {
    return StudentAttendanceRecordModel(
      id: id,
      studentId: studentId,
      admissionNumber: admissionNumber,
      studentName: studentName,
      rollNumber: rollNumber,
      classId: classId,
      sectionId: sectionId,
      attendanceDate: attendanceDate,
      status: status ?? this.status,
      remarks: remarks ?? this.remarks,
      markedByName: markedByName,
    );
  }
}
