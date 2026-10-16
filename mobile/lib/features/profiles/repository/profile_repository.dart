import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/staff_profile_model.dart';
import '../models/student_profile_model.dart';

class ProfileRepository {
  final DioClient dioClient;

  ProfileRepository({required this.dioClient});

  Future<StudentProfileModel> getStudentProfile() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentProfile);
      return StudentProfileModel.fromJson(
          response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load student profile';
      throw Exception(message);
    }
  }

  Future<StudentProfileModel> updateStudentProfile({
    String? emergencyPhone,
    String? bloodGroup,
    String? medicalNotes,
    String? documentUrl,
  }) async {
    try {
      final payload = <String, dynamic>{};
      if (emergencyPhone != null) payload['emergency_phone'] = emergencyPhone;
      if (bloodGroup != null) payload['blood_group'] = bloodGroup;
      if (medicalNotes != null) payload['medical_notes'] = medicalNotes;
      if (documentUrl != null && documentUrl.isNotEmpty) {
        payload['document_url'] = documentUrl;
        payload['documentUrl'] = documentUrl;
      }

      final response = await dioClient.dio
          .patch(ApiEndpoints.studentProfile, data: payload);
      return StudentProfileModel.fromJson(
          response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to update student profile';
      throw Exception(message);
    }
  }

  Future<void> updateStudentProfileByTeacher(
    String studentId, {
    String? rollNumber,
    String? bloodGroup,
    String? emergencyContactPhone,
    String? medicalNotes,
    String? documentUrl,
  }) async {
    try {
      final payload = <String, dynamic>{};
      if (rollNumber != null) payload['roll_number'] = rollNumber;
      if (bloodGroup != null) payload['blood_group'] = bloodGroup;
      if (emergencyContactPhone != null) {
        payload['emergency_contact_phone'] = emergencyContactPhone;
        payload['emergency_phone'] = emergencyContactPhone;
      }
      if (medicalNotes != null) payload['medical_notes'] = medicalNotes;
      if (documentUrl != null && documentUrl.isNotEmpty) {
        payload['document_url'] = documentUrl;
        payload['documentUrl'] = documentUrl;
      }

      await dioClient.patch(
        ApiEndpoints.updateStudentByTeacher(studentId),
        data: payload,
      );
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to update student details';
      throw Exception(message);
    }
  }


  Future<StaffProfileModel> getStaffProfile() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.staffProfile);
      return StaffProfileModel.fromJson(
          response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load staff profile';
      throw Exception(message);
    }
  }

  Future<StaffProfileModel> updateStaffProfile({
    String? phone,
    String? emergencyPhone,
    String? qualification,
    String? bloodGroup,
  }) async {
    try {
      final payload = <String, dynamic>{};
      if (phone != null) payload['phone'] = phone;
      if (emergencyPhone != null) payload['emergency_phone'] = emergencyPhone;
      if (qualification != null) payload['qualification'] = qualification;
      if (bloodGroup != null) payload['blood_group'] = bloodGroup;

      final response =
          await dioClient.dio.patch(ApiEndpoints.staffProfile, data: payload);
      return StaffProfileModel.fromJson(
          response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to update staff profile';
      throw Exception(message);
    }
  }
}
