class StaffLeaveModel {
  final String id;
  final String staffId;
  final String? employeeCode;
  final String? staffName;
  final String startDate;
  final String endDate;
  final String leaveType;
  final String reason;
  final String status; // 'PENDING' | 'RECOMMENDED' | 'APPROVED' | 'REJECTED'
  final String? recommendationNote;
  final String? recommendedByName;
  final String? recommendedAt;
  final String? rejectionReason;
  final String? decisionNote;
  final String? decidedByName;
  final String? decidedAt;
  final String? documentUrl;
  final String? attachmentName;
  final String? createdAt;

  const StaffLeaveModel({
    required this.id,
    required this.staffId,
    this.employeeCode,
    this.staffName,
    required this.startDate,
    required this.endDate,
    required this.leaveType,
    required this.reason,
    required this.status,
    this.recommendationNote,
    this.recommendedByName,
    this.recommendedAt,
    this.rejectionReason,
    this.decisionNote,
    this.decidedByName,
    this.decidedAt,
    this.documentUrl,
    this.attachmentName,
    this.createdAt,
  });

  factory StaffLeaveModel.fromJson(Map<String, dynamic> json) {
    return StaffLeaveModel(
      id: json['id'] as String,
      staffId: json['staff_id'] as String,
      employeeCode: json['employee_code'] as String?,
      staffName: json['staff_name'] as String?,
      startDate: json['start_date'] as String,
      endDate: json['end_date'] as String,
      leaveType: json['leave_type'] as String,
      reason: json['reason'] as String,
      status: (json['status'] as String).toUpperCase(),
      recommendationNote: json['recommendation_note'] as String?,
      recommendedByName: json['recommended_by_name'] as String?,
      recommendedAt: json['recommended_at'] as String?,
      rejectionReason: json['rejection_reason'] as String?,
      decisionNote: json['decision_note'] as String?,
      decidedByName: json['decided_by_name'] as String?,
      decidedAt: json['decided_at'] as String?,
      documentUrl: json['document_url'] as String?,
      attachmentName: json['attachment_name'] as String? ?? json['attachmentName'] as String?,
      createdAt: json['created_at'] as String?,
    );
  }
}
