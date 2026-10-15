class StudentLeaveModel {
  final String id;
  final String studentId;
  final String? studentName;
  final String? admissionNumber;
  final String? rollNumber;
  final String? className;
  final String? sectionName;
  final String startDate;
  final String endDate;
  final String reason;
  final String status; // 'PENDING' | 'APPROVED' | 'REJECTED'
  final String? rejectionReason;
  final String? remarks;
  final String? reviewedByName;
  final String? reviewedAt;
  final String? createdAt;

  const StudentLeaveModel({
    required this.id,
    required this.studentId,
    this.studentName,
    this.admissionNumber,
    this.rollNumber,
    this.className,
    this.sectionName,
    required this.startDate,
    required this.endDate,
    required this.reason,
    required this.status,
    this.rejectionReason,
    this.remarks,
    this.reviewedByName,
    this.reviewedAt,
    this.createdAt,
  });

  factory StudentLeaveModel.fromJson(Map<String, dynamic> json) {
    return StudentLeaveModel(
      id: json['id'] as String,
      studentId: json['student_id'] as String,
      studentName: json['student_name'] as String?,
      admissionNumber: json['admission_number'] as String?,
      rollNumber: json['roll_number'] as String?,
      className: json['class_name'] as String?,
      sectionName: json['section_name'] as String?,
      startDate: json['start_date'] as String,
      endDate: json['end_date'] as String,
      reason: json['reason'] as String,
      status: (json['status'] as String).toUpperCase(),
      rejectionReason: json['rejection_reason'] as String?,
      remarks: json['remarks'] as String?,
      reviewedByName: json['reviewed_by_name'] as String?,
      reviewedAt: json['reviewed_at'] as String?,
      createdAt: json['created_at'] as String?,
    );
  }
}

