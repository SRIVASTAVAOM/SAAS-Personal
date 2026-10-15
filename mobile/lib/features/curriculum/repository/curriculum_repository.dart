import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/curriculum_model.dart';

class CurriculumRepository {
  final DioClient _client;

  CurriculumRepository(this._client);

  Future<List<CurriculumUnitModel>> getCurriculumUnits(
    String classId,
    String subjectId, {
    String? academicYearId,
  }) async {
    final response = await _client.get(
      ApiEndpoints.curriculumUnits(classId, subjectId, academicYearId: academicYearId),
    );
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => CurriculumUnitModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<CurriculumUnitModel> createUnit({
    required String classId,
    required String subjectId,
    String? academicYearId,
    required int unitNumber,
    required String title,
    String? description,
  }) async {
    final payload = <String, dynamic>{
      'classId': classId,
      'subjectId': subjectId,
      'unitNumber': unitNumber,
      'title': title,
    };
    if (academicYearId != null) payload['academicYearId'] = academicYearId;
    if (description != null) payload['description'] = description;

    final response = await _client.post(
      ApiEndpoints.createCurriculumUnit,
      data: payload,
    );
    return CurriculumUnitModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<CurriculumTopicModel> createTopic({
    required String unitId,
    required int topicNumber,
    required String title,
    String? description,
    String? learningObjectives,
  }) async {
    final payload = <String, dynamic>{
      'unitId': unitId,
      'topicNumber': topicNumber,
      'title': title,
    };
    if (description != null) payload['description'] = description;
    if (learningObjectives != null) payload['learningObjectives'] = learningObjectives;

    final response = await _client.post(
      ApiEndpoints.createCurriculumTopic,
      data: payload,
    );
    return CurriculumTopicModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }
}
