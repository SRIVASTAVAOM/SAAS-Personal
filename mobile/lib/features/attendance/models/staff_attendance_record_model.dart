class StaffAttendanceRecordModel {
  final String? id;
  final String staffId;
  final String? employeeCode;
  final String? staffName;
  final String? designation;
  final String? wingId;
  final String? wingName;
  final String attendanceDate;
  final String status; // 'PRESENT' | 'ABSENT' | 'PENDING'
  final String? inTime;
  final String? outTime;
  final String? remarks;

  const StaffAttendanceRecordModel({
    this.id,
    required this.staffId,
    this.employeeCode,
    this.staffName,
    this.designation,
    this.wingId,
    this.wingName,
    required this.attendanceDate,
    required this.status,
    this.inTime,
    this.outTime,
    this.remarks,
  });

  factory StaffAttendanceRecordModel.fromJson(Map<String, dynamic> json) {
    return StaffAttendanceRecordModel(
      id: json['id'] as String?,
      staffId: json['staff_id'] as String,
      employeeCode: json['employee_code'] as String?,
      staffName: json['staff_name'] as String?,
      designation: json['designation'] as String? ?? json['assignment_type'] as String?,
      wingId: json['wing_id'] as String?,
      wingName: json['wing_name'] as String?,
      attendanceDate: json['attendance_date'] as String? ?? '',
      status: (json['status'] as String?)?.toUpperCase() ?? 'PENDING',
      inTime: json['in_time'] as String?,
      outTime: json['out_time'] as String?,
      remarks: json['remarks'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'staff_id': staffId,
      'attendance_date': attendanceDate,
      'status': status,
      'in_time': inTime,
      'out_time': outTime,
      'remarks': remarks,
    };
  }

  StaffAttendanceRecordModel copyWith({
    String? status,
    String? inTime,
    String? outTime,
    String? remarks,
  }) {
    return StaffAttendanceRecordModel(
      id: id,
      staffId: staffId,
      employeeCode: employeeCode,
      staffName: staffName,
      designation: designation,
      wingId: wingId,
      wingName: wingName,
      attendanceDate: attendanceDate,
      status: status ?? this.status,
      inTime: inTime ?? this.inTime,
      outTime: outTime ?? this.outTime,
      remarks: remarks ?? this.remarks,
    );
  }
}
