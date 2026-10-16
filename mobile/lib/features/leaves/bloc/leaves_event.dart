abstract class LeavesEvent {
  const LeavesEvent();
}

class LoadStaffMyLeavesEvent extends LeavesEvent {
  const LoadStaffMyLeavesEvent();
}

class ApplyStaffLeaveEvent extends LeavesEvent {
  final String startDate;
  final String endDate;
  final String leaveType;
  final String reason;
  final String? documentUrl;
  final String? attachmentName;

  const ApplyStaffLeaveEvent({
    required this.startDate,
    required this.endDate,
    required this.leaveType,
    required this.reason,
    this.documentUrl,
    this.attachmentName,
  });
}

class LoadCoordinatorWingLeavesEvent extends LeavesEvent {
  const LoadCoordinatorWingLeavesEvent();
}

class RecommendStaffLeaveEvent extends LeavesEvent {
  final String leaveId;
  final String? note;

  const RecommendStaffLeaveEvent({
    required this.leaveId,
    this.note,
  });
}

class LoadManagementLeaveQueueEvent extends LeavesEvent {
  const LoadManagementLeaveQueueEvent();
}

class DecideStaffLeaveEvent extends LeavesEvent {
  final String leaveId;
  final String decision; // 'APPROVED' | 'REJECTED'
  final String? note;
  final String? rejectionReason;

  const DecideStaffLeaveEvent({
    required this.leaveId,
    required this.decision,
    this.note,
    this.rejectionReason,
  });
}

class LoadStudentMyLeavesEvent extends LeavesEvent {
  const LoadStudentMyLeavesEvent();
}

class ApplyStudentLeaveEvent extends LeavesEvent {
  final String startDate;
  final String endDate;
  final String reason;
  final String? documentUrl;
  final String? attachmentName;

  const ApplyStudentLeaveEvent({
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.documentUrl,
    this.attachmentName,
  });
}

class LoadClassStudentLeavesEvent extends LeavesEvent {
  const LoadClassStudentLeavesEvent();
}

class UpdateStudentLeaveStatusEvent extends LeavesEvent {
  final String leaveId;
  final String status; // 'APPROVED' | 'REJECTED'
  final String? remarks;

  const UpdateStudentLeaveStatusEvent({
    required this.leaveId,
    required this.status,
    this.remarks,
  });
}

