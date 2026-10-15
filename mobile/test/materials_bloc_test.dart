import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/materials/bloc/materials_bloc.dart';
import 'package:mobile/features/materials/models/academic_material_model.dart';
import 'package:mobile/features/materials/repository/materials_repository.dart';

class MockMaterialsRepository implements MaterialsRepository {
  bool shouldThrow = false;

  final sampleMaterial = const AcademicMaterialModel(
    id: 'mat-123',
    schoolId: 'sch-1',
    classId: 'cls-1',
    sectionId: 'sec-1',
    subjectId: 'sub-1',
    uploadedByStaffId: 'staff-1',
    title: 'Formula Sheet - Trigonometry',
    description: 'Summary of all Grade 10 identities',
    s3FileKey: 'materials/trig.pdf',
    fileName: 'trig.pdf',
    fileSizeBytes: 204800,
    contentType: 'application/pdf',
    isVerified: true,
    createdAt: '2026-10-10T10:00:00Z',
    teacherName: 'Mr. Sharma',
    subjectName: 'Mathematics',
    className: 'Grade 10',
    sectionName: 'A',
  );

  @override
  Future<List<AcademicMaterialModel>> getClassMaterials(
    String classId,
    String subjectId, {
    String? sectionId,
  }) async {
    if (shouldThrow) throw Exception('Materials fetch error');
    return [sampleMaterial];
  }

  @override
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
    if (shouldThrow) throw Exception('Upload initiation failed');
    return const PresignedUploadResponse(
      materialId: 'mat-123',
      uploadUrl: 'https://school-erp-bucket.s3.amazonaws.com/uploads/mat-123?sig=test',
      fileKey: 'materials/cls-1/sub-1/mat-123.pdf',
      expiresInSeconds: 900,
    );
  }

  @override
  Future<void> uploadFileDirectlyToS3(
    String uploadUrl,
    List<int> fileBytes,
    String contentType, {
    void Function(int sent, int total)? onProgress,
  }) async {
    if (shouldThrow) throw Exception('S3 PUT failed');
    onProgress?.call(100, 100);
  }

  @override
  Future<AcademicMaterialModel> verifyUpload(String materialId) async {
    if (shouldThrow) throw Exception('Verification failed');
    return sampleMaterial;
  }

  @override
  Future<PresignedDownloadResponse> getDownloadUrl(String materialId) async {
    if (shouldThrow) throw Exception('Download URL generation failed');
    return const PresignedDownloadResponse(
      downloadUrl: 'https://school-erp-bucket.s3.amazonaws.com/downloads/trig.pdf?sig=test',
      fileName: 'trig.pdf',
      contentType: 'application/pdf',
      expiresInSeconds: 900,
    );
  }
}

void main() {
  group('MaterialsBloc Unit Tests', () {
    late MockMaterialsRepository mockRepository;
    late MaterialsBloc bloc;

    setUp(() {
      mockRepository = MockMaterialsRepository();
      bloc = MaterialsBloc(mockRepository);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is MaterialsInitial', () {
      expect(bloc.state, isA<MaterialsInitial>());
    });

    test('emits [MaterialsLoading, MaterialsLoaded] on LoadClassMaterialsEvent', () async {
      final expected = [
        isA<MaterialsLoading>(),
        isA<MaterialsLoaded>().having(
          (s) => s.materials.first.title,
          'title',
          'Formula Sheet - Trigonometry',
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const LoadClassMaterialsEvent('cls-1', 'sub-1'));
    });

    test('emits progress and MaterialOperationSuccess on UploadMaterialEvent', () async {
      final expected = [
        isA<MaterialUploading>(),
        isA<MaterialUploading>(),
        isA<MaterialUploading>(),
        isA<MaterialOperationSuccess>().having(
          (s) => s.message,
          'message',
          contains('uploaded and verified'),
        ),
        isA<MaterialsLoaded>(),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(
        const UploadMaterialEvent(
          classId: 'cls-1',
          subjectId: 'sub-1',
          title: 'Formula Sheet',
          fileName: 'trig.pdf',
          fileBytes: [1, 2, 3],
          contentType: 'application/pdf',
        ),
      );
    });

    test('emits MaterialOperationSuccess on DownloadMaterialEvent', () async {
      final expected = [
        isA<MaterialOperationSuccess>().having(
          (s) => s.downloadUrl,
          'downloadUrl',
          contains('s3.amazonaws.com'),
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const DownloadMaterialEvent('mat-123'));
    });

    test('emits [MaterialsLoading, MaterialsError] on error', () async {
      mockRepository.shouldThrow = true;
      final expected = [
        isA<MaterialsLoading>(),
        isA<MaterialsError>().having(
          (s) => s.message,
          'error message',
          contains('Materials fetch error'),
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const LoadClassMaterialsEvent('cls-1', 'sub-1'));
    });
  });
}
