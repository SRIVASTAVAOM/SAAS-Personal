import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/staff_attendance_record_model.dart';
import '../models/student_attendance_record_model.dart';

class AttendanceRepository {
  final DioClient dioClient;

  AttendanceRepository({required this.dioClient});

  /// Fetch own attendance history for Student
  Future<List<StudentAttendanceRecordModel>> getStudentAttendanceHistory() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentAttendanceHistory);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              StudentAttendanceRecordModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load student attendance history';
      throw Exception(message);
    }
  }

  /// Fetch class attendance for authorized Class Teacher
  Future<List<StudentAttendanceRecordModel>> getClassAttendance(
    String classId,
    String sectionId, {
    String? date,
  }) async {
    try {
      final endpoint = ApiEndpoints.classAttendance(classId, sectionId, date: date);
      final response = await dioClient.dio.get(endpoint);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              StudentAttendanceRecordModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load class attendance';
      throw Exception(message);
    }
  }

  /// Mark student attendance batch for a class/section and date
  Future<void> markStudentAttendance({
    required String classId,
    required String sectionId,
    required String attendanceDate,
    required List<Map<String, dynamic>> records,
  }) async {
    try {
      final mappedRecords = records.map((r) => {
        'studentId': r['studentId'] ?? r['student_id'],
        'student_id': r['studentId'] ?? r['student_id'],
        'status': r['status'],
        'remarks': r['remarks'],
      }).toList();

      await dioClient.dio.post(
        ApiEndpoints.markStudentAttendance,
        data: {
          'classId': classId,
          'class_id': classId,
          'sectionId': sectionId,
          'section_id': sectionId,
          'date': attendanceDate,
          'attendance_date': attendanceDate,
          'records': mappedRecords,
        },
      );
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to submit attendance';
      throw Exception(message);
    }
  }

  /// Fetch own attendance history for Teacher / Staff
  Future<List<StaffAttendanceRecordModel>> getStaffAttendanceHistory() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.staffAttendanceHistory);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              StaffAttendanceRecordModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load staff attendance history';
      throw Exception(message);
    }
  }

  /// Fetch wing staff attendance for authorized Wing Coordinator
  Future<List<StaffAttendanceRecordModel>> getWingStaffAttendance(
    String wingId, {
    String? date,
  }) async {
    try {
      final endpoint = ApiEndpoints.wingStaffAttendance(wingId, date: date);
      final response = await dioClient.dio.get(endpoint);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              StaffAttendanceRecordModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load wing staff attendance';
      throw Exception(message);
    }
  }

  /// Fetch all staff attendance overview for Management
  Future<List<StaffAttendanceRecordModel>> getManagementStaffAttendanceOverview({
    String? date,
    String? wingId,
  }) async {
    try {
      final endpoint = ApiEndpoints.managementStaffAttendanceOverview(
        date: date,
        wingId: wingId,
      );
      final response = await dioClient.dio.get(endpoint);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              StaffAttendanceRecordModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load staff attendance overview';
      throw Exception(message);
    }
  }

  /// Mark or update staff attendance (Management)
  Future<void> markStaffAttendance({
    required String date,
    required List<Map<String, dynamic>> records,
  }) async {
    try {
      await dioClient.dio.post(
        ApiEndpoints.markStaffAttendance,
        data: {
          'date': date,
          'records': records,
        },
      );
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to mark staff attendance';
      throw Exception(message);
    }
  }
}
