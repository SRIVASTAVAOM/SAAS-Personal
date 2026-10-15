import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../materials/models/academic_material_model.dart';
import '../models/homework_model.dart';

class HomeworkRepository {
  final DioClient _client;

  HomeworkRepository(this._client);

  Future<List<HomeworkModel>> getStudentMyClassHomework() async {
    final response = await _client.get(ApiEndpoints.studentMyClassHomework);
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => HomeworkModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<HomeworkModel>> getTeacherMyAssignedHomework() async {
    final response = await _client.get(ApiEndpoints.teacherMyAssignedHomework);
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => HomeworkModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<HomeworkModel>> getClassHomework(String classId, String sectionId) async {
    final response = await _client.get(ApiEndpoints.classHomework(classId, sectionId));
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => HomeworkModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<HomeworkModel> createHomework({
    required String classId,
    required String sectionId,
    required String subjectId,
    required String title,
    required String description,
    String? assignedDate,
    required String dueDate,
    String? s3AttachmentKey,
    String? attachmentName,
  }) async {
    final payload = <String, dynamic>{
      'classId': classId,
      'sectionId': sectionId,
      'subjectId': subjectId,
      'title': title,
      'description': description,
      'dueDate': dueDate,
    };
    if (assignedDate != null) payload['assignedDate'] = assignedDate;
    if (s3AttachmentKey != null) payload['s3AttachmentKey'] = s3AttachmentKey;
    if (attachmentName != null) payload['attachmentName'] = attachmentName;

    final response = await _client.post(
      ApiEndpoints.homework,
      data: payload,
    );
    return HomeworkModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<HomeworkModel> updateHomework({
    required String id,
    String? title,
    String? description,
    String? dueDate,
    String? s3AttachmentKey,
    String? attachmentName,
  }) async {
    final payload = <String, dynamic>{};
    if (title != null) payload['title'] = title;
    if (description != null) payload['description'] = description;
    if (dueDate != null) payload['dueDate'] = dueDate;
    if (s3AttachmentKey != null) payload['s3AttachmentKey'] = s3AttachmentKey;
    if (attachmentName != null) payload['attachmentName'] = attachmentName;

    final response = await _client.patch(
      ApiEndpoints.homeworkUpdate(id),
      data: payload,
    );
    return HomeworkModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> setCompletionStatus(String homeworkId, String status) async {
    await _client.post(
      ApiEndpoints.homeworkCompletion(homeworkId),
      data: {'status': status},
    );
  }

  Future<PresignedDownloadResponse> getAttachmentDownloadUrl(String homeworkId) async {
    final response = await _client.get(ApiEndpoints.homeworkAttachmentDownload(homeworkId));
    return PresignedDownloadResponse.fromJson(response.data['data'] as Map<String, dynamic>);
  }
}
