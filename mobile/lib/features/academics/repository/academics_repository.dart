import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/student_roster_item.dart';
import '../models/subject_model.dart';
import '../models/subject_teacher_item.dart';
import '../models/classmate_birthday_model.dart';
import '../models/teacher_allocation_model.dart';


class AcademicsRepository {
  final DioClient dioClient;

  AcademicsRepository({required this.dioClient});

  Future<List<SubjectModel>> getSubjects() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.subjects);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) => SubjectModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to load subjects';
      throw Exception(message);
    }
  }

  Future<List<StudentRosterItem>> getClassRoster(
      String classId, String sectionId) async {
    try {
      final response = await dioClient.dio
          .get(ApiEndpoints.classRoster(classId, sectionId));
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              StudentRosterItem.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to load class roster';
      throw Exception(message);
    }
  }

  Future<List<StudentRosterItem>> getMyTeacherRoster() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.myRoster);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              StudentRosterItem.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to load student roster';
      throw Exception(message);
    }
  }

  Future<List<SubjectTeacherItem>> getSubjectTeachers() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.subjectTeachers);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              SubjectTeacherItem.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load subject teachers';
      throw Exception(message);
    }
  }

  Future<List<ClassmateBirthdayModel>> getClassmatesBirthdays() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.classmatesBirthdays);
      final data = response.data['data'] as List<dynamic>;
      return data
          .map((item) =>
              ClassmateBirthdayModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load classmates birthdays';
      throw Exception(message);
    }
  }

  Future<TeacherAllocationsResponse> getTeacherAllocations() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.myAllocations);
      final data = response.data['data'] as Map<String, dynamic>;
      return TeacherAllocationsResponse.fromJson(data);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load teacher allocations';
      throw Exception(message);
    }
  }
}

