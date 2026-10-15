import '../models/staff_leave_model.dart';
import '../models/student_leave_model.dart';

abstract class LeavesState {
  const LeavesState();
}

class LeavesInitial extends LeavesState {}

class LeavesLoading extends LeavesState {}

class StaffMyLeavesLoaded extends LeavesState {
  final List<StaffLeaveModel> leaves;

  const StaffMyLeavesLoaded(this.leaves);
}

class CoordinatorWingLeavesLoaded extends LeavesState {
  final List<StaffLeaveModel> leaves;

  const CoordinatorWingLeavesLoaded(this.leaves);
}

class ManagementLeaveQueueLoaded extends LeavesState {
  final List<StaffLeaveModel> leaves;

  const ManagementLeaveQueueLoaded(this.leaves);
}

class StudentMyLeavesLoaded extends LeavesState {
  final List<StudentLeaveModel> leaves;

  const StudentMyLeavesLoaded(this.leaves);
}

class ClassStudentLeavesLoaded extends LeavesState {
  final List<StudentLeaveModel> leaves;

  const ClassStudentLeavesLoaded(this.leaves);
}


class LeaveActionSuccess extends LeavesState {
  final String message;

  const LeaveActionSuccess(this.message);
}

class LeavesError extends LeavesState {
  final String message;

  const LeavesError(this.message);
}
