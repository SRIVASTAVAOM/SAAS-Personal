import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/timetable_slot_model.dart';
import '../models/teacher_substitution_model.dart';
import '../models/online_class_model.dart';

class ScheduleRepository {
  final DioClient dioClient;

  ScheduleRepository({required this.dioClient});

  // 1. Teacher Timetable Day-Wise
  Future<List<TimetableSlotModel>> getTeacherTimetable() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.teacherTimetable);
      final list = (response.data['data'] as List<dynamic>?) ?? [];
      return list
          .map((e) => TimetableSlotModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load teacher timetable';
      throw Exception(message);
    }
  }

  // 2. Teacher Substitutions
  Future<({List<TeacherSubstitutionModel> assignedToMe, List<TeacherSubstitutionModel> coveringForMe})>
      getTeacherSubstitutions() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.teacherSubstitutions);
      final data = (response.data['data'] as Map<String, dynamic>?) ?? {};

      final assignedList = (data['assigned_to_me'] as List<dynamic>?) ?? [];
      final coveringList = (data['covering_for_me'] as List<dynamic>?) ?? [];

      final assignedToMe = assignedList
          .map((e) => TeacherSubstitutionModel.fromJson(
                e as Map<String, dynamic>,
                defaultType: 'ASSIGNED_TO_ME',
              ))
          .toList();

      final coveringForMe = coveringList
          .map((e) => TeacherSubstitutionModel.fromJson(
                e as Map<String, dynamic>,
                defaultType: 'COVERING_FOR_ME',
              ))
          .toList();

      return (assignedToMe: assignedToMe, coveringForMe: coveringForMe);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load teacher substitutions';
      throw Exception(message);
    }
  }

  // 3. Online Classes (Teacher or Student)
  Future<List<OnlineClassModel>> getOnlineClasses() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.onlineClasses);
      final list = (response.data['data'] as List<dynamic>?) ?? [];
      return list
          .map((e) => OnlineClassModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load online classes';
      throw Exception(message);
    }
  }

  // 4. Create Online Class Session
  Future<OnlineClassModel> createOnlineClass({
    required String classId,
    required String sectionId,
    required String subjectId,
    required String title,
    required String scheduledDate,
    required String startTime,
    required int durationMinutes,
    required String meetingUrl,
  }) async {
    try {
      final response = await dioClient.dio.post(
        ApiEndpoints.onlineClasses,
        data: {
          'class_id': classId,
          'section_id': sectionId,
          'subject_id': subjectId,
          'title': title,
          'scheduled_date': scheduledDate,
          'start_time': startTime,
          'duration_minutes': durationMinutes,
          'meeting_url': meetingUrl,
        },
      );
      return OnlineClassModel.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          (e.response?.data?['details'] is List
              ? (e.response?.data?['details'] as List).join(', ')
              : 'Failed to schedule online class');
      throw Exception(message);
    }
  }

  // 5. Delete Online Class Session
  Future<void> deleteOnlineClass(String id) async {
    try {
      await dioClient.dio.delete(ApiEndpoints.deleteOnlineClass(id));
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to cancel online class session';
      throw Exception(message);
    }
  }
}
