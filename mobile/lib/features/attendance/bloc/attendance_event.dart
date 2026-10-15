abstract class AttendanceEvent {
  const AttendanceEvent();
}

class LoadStudentOwnAttendanceEvent extends AttendanceEvent {
  const LoadStudentOwnAttendanceEvent();
}

class LoadClassAttendanceEvent extends AttendanceEvent {
  final String classId;
  final String sectionId;
  final String? date;

  const LoadClassAttendanceEvent({
    required this.classId,
    required this.sectionId,
    this.date,
  });
}

class SubmitClassAttendanceEvent extends AttendanceEvent {
  final String classId;
  final String sectionId;
  final String attendanceDate;
  final List<Map<String, dynamic>> records;

  const SubmitClassAttendanceEvent({
    required this.classId,
    required this.sectionId,
    required this.attendanceDate,
    required this.records,
  });
}

class LoadStaffOwnAttendanceEvent extends AttendanceEvent {
  const LoadStaffOwnAttendanceEvent();
}

class LoadWingStaffAttendanceEvent extends AttendanceEvent {
  final String wingId;
  final String? date;

  const LoadWingStaffAttendanceEvent({
    required this.wingId,
    this.date,
  });
}
