import '../models/staff_attendance_record_model.dart';
import '../models/student_attendance_record_model.dart';

abstract class AttendanceState {
  const AttendanceState();
}

class AttendanceInitial extends AttendanceState {}

class AttendanceLoading extends AttendanceState {}

class StudentAttendanceHistoryLoaded extends AttendanceState {
  final List<StudentAttendanceRecordModel> records;

  const StudentAttendanceHistoryLoaded(this.records);
}

class ClassAttendanceLoaded extends AttendanceState {
  final String classId;
  final String sectionId;
  final String date;
  final List<StudentAttendanceRecordModel> records;

  const ClassAttendanceLoaded({
    required this.classId,
    required this.sectionId,
    required this.date,
    required this.records,
  });
}

class AttendanceSubmittedSuccess extends AttendanceState {
  final String message;

  const AttendanceSubmittedSuccess(this.message);
}

class StaffAttendanceHistoryLoaded extends AttendanceState {
  final List<StaffAttendanceRecordModel> records;

  const StaffAttendanceHistoryLoaded(this.records);
}

class WingStaffAttendanceLoaded extends AttendanceState {
  final List<StaffAttendanceRecordModel> records;

  const WingStaffAttendanceLoaded(this.records);
}

class AttendanceError extends AttendanceState {
  final String message;

  const AttendanceError(this.message);
}
