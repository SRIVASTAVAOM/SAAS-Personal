import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/academic_material_model.dart';

class MaterialsRepository {
  final DioClient _client;
  final Dio _s3Dio;

  MaterialsRepository(this._client, {Dio? s3Dio}) : _s3Dio = s3Dio ?? Dio();

  Future<List<AcademicMaterialModel>> getClassMaterials(
    String classId,
    String subjectId, {
    String? sectionId,
  }) async {
    final response = await _client.get(
      ApiEndpoints.classMaterials(classId, subjectId, sectionId: sectionId),
    );
    final data = response.data['data'] as List<dynamic>;
    return data.map((json) => AcademicMaterialModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<PresignedUploadResponse> initiatePresignedUpload({
    required String classId,
    String? sectionId,
    required String subjectId,
    required String title,
    String? description,
    required String fileName,
    required int fileSizeBytes,
    required String contentType,
  }) async {
    final payload = <String, dynamic>{
      'classId': classId,
      'subjectId': subjectId,
      'title': title,
      'fileName': fileName,
      'fileSizeBytes': fileSizeBytes,
      'contentType': contentType,
    };
    if (sectionId != null) payload['sectionId'] = sectionId;
    if (description != null) payload['description'] = description;

    final response = await _client.post(
      ApiEndpoints.presignedUploadUrl,
      data: payload,
    );
    return PresignedUploadResponse.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> uploadFileDirectlyToS3(
    String uploadUrl,
    List<int> fileBytes,
    String contentType, {
    void Function(int sent, int total)? onProgress,
  }) async {
    await _s3Dio.put(
      uploadUrl,
      data: fileBytes,
      options: Options(
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBytes.length,
        },
      ),
      onSendProgress: onProgress,
    );
  }

  Future<AcademicMaterialModel> verifyUpload(String materialId) async {
    final response = await _client.post(ApiEndpoints.verifyUpload(materialId));
    return AcademicMaterialModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<PresignedDownloadResponse> getDownloadUrl(String materialId) async {
    final response = await _client.get(ApiEndpoints.materialDownloadUrl(materialId));
    return PresignedDownloadResponse.fromJson(response.data['data'] as Map<String, dynamic>);
  }
}
