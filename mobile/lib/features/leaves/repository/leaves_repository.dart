import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/staff_leave_model.dart';
import '../models/student_leave_model.dart';

class LeavesRepository {
  final DioClient dioClient;

  LeavesRepository({required this.dioClient});

  /// Submit a staff leave application (for Teacher)
  Future<StaffLeaveModel> applyStaffLeave({
    required String startDate,
    required String endDate,
    required String leaveType,
    required String reason,
  }) async {
    try {
      final response = await dioClient.dio.post(
        ApiEndpoints.staffLeaves,
        data: {
          'startDate': startDate,
          'start_date': startDate,
          'endDate': endDate,
          'end_date': endDate,
          'leaveType': leaveType,
          'leave_type': leaveType,
          'reason': reason,
        },
      );
      return StaffLeaveModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to apply staff leave';
      throw Exception(message);
    }
  }

  /// Get teacher's own leave applications
  Future<List<StaffLeaveModel>> getStaffMyLeaves() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.staffMyLeaves);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) => StaffLeaveModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load staff leave applications';
      throw Exception(message);
    }
  }

  /// Get wing staff leaves for Coordinator review
  Future<List<StaffLeaveModel>> getStaffWingLeaves() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.staffWingLeaves);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) => StaffLeaveModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load wing staff leaves';
      throw Exception(message);
    }
  }

  /// Make a coordinator recommendation for staff leave
  Future<void> recommendStaffLeave(String leaveId, {String? note}) async {
    try {
      await dioClient.dio.patch(
        ApiEndpoints.recommendStaffLeave(leaveId),
        data: {
          'recommendation': ?note,
          'note': ?note,
        },
      );
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to recommend leave';
      throw Exception(message);
    }
  }

  /// Get management queue of staff leaves
  Future<List<StaffLeaveModel>> getManagementLeaveQueue() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.staffManagementQueue);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) => StaffLeaveModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load management leave queue';
      throw Exception(message);
    }
  }

  /// Approve or reject staff leave (Management only)
  Future<void> decideStaffLeave(
    String leaveId, {
    required String decision, // 'APPROVED' | 'REJECTED'
    String? note,
    String? rejectionReason,
  }) async {
    try {
      await dioClient.dio.patch(
        ApiEndpoints.decideStaffLeave(leaveId),
        data: {
          'decision': decision,
          'comment': ?(note ?? rejectionReason),
          'note': ?note,
          'rejection_reason': ?rejectionReason,
        },
      );
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to decide leave application';
      throw Exception(message);
    }
  }

  /// Submit a student leave application
  Future<StudentLeaveModel> applyStudentLeave({
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    try {
      final response = await dioClient.dio.post(
        ApiEndpoints.studentLeaves,
        data: {
          'startDate': startDate,
          'start_date': startDate,
          'endDate': endDate,
          'end_date': endDate,
          'reason': reason,
        },
      );
      return StudentLeaveModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to submit student leave';
      throw Exception(message);
    }
  }

  /// Get student's own leave applications
  Future<List<StudentLeaveModel>> getStudentMyLeaves() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentMyLeaves);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) => StudentLeaveModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load student leave history';
      throw Exception(message);
    }
  }

  /// Get student leave applications for class teacher's homeroom
  Future<List<StudentLeaveModel>> getClassStudentLeaves() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentClassLeaves);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) => StudentLeaveModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load class student leave requests';
      throw Exception(message);
    }
  }

  /// Approve or reject student leave application (Class Teacher only)
  Future<void> updateStudentLeaveStatus(
    String leaveId, {
    required String status,
    String? remarks,
  }) async {
    try {
      await dioClient.patch(
        ApiEndpoints.updateStudentLeaveStatus(leaveId),
        data: {
          'status': status,
          'remarks': remarks,
        },
      );
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to update student leave status';
      throw Exception(message);
    }
  }
}

