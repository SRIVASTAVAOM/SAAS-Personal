import 'package:flutter_bloc/flutter_bloc.dart';
import '../models/academic_material_model.dart';
import '../repository/materials_repository.dart';

// --- Events ---
abstract class MaterialsEvent {
  const MaterialsEvent();
}

class LoadClassMaterialsEvent extends MaterialsEvent {
  final String classId;
  final String subjectId;
  final String? sectionId;
  const LoadClassMaterialsEvent(this.classId, this.subjectId, {this.sectionId});
}

class UploadMaterialEvent extends MaterialsEvent {
  final String classId;
  final String? sectionId;
  final String subjectId;
  final String title;
  final String? description;
  final String fileName;
  final List<int> fileBytes;
  final String contentType;

  const UploadMaterialEvent({
    required this.classId,
    this.sectionId,
    required this.subjectId,
    required this.title,
    this.description,
    required this.fileName,
    required this.fileBytes,
    required this.contentType,
  });
}

class DownloadMaterialEvent extends MaterialsEvent {
  final String materialId;
  const DownloadMaterialEvent(this.materialId);
}

// --- States ---
abstract class MaterialsState {
  const MaterialsState();
}

class MaterialsInitial extends MaterialsState {
  const MaterialsInitial();
}

class MaterialsLoading extends MaterialsState {
  const MaterialsLoading();
}

class MaterialUploading extends MaterialsState {
  final double progress;
  final String statusText;
  const MaterialUploading(this.progress, this.statusText);
}

class MaterialsLoaded extends MaterialsState {
  final List<AcademicMaterialModel> materials;
  const MaterialsLoaded(this.materials);
}

class MaterialOperationSuccess extends MaterialsState {
  final String message;
  final String? downloadUrl;
  final String? fileName;
  const MaterialOperationSuccess(this.message, {this.downloadUrl, this.fileName});
}

class MaterialsError extends MaterialsState {
  final String message;
  const MaterialsError(this.message);
}

// --- BLoC ---
class MaterialsBloc extends Bloc<MaterialsEvent, MaterialsState> {
  final MaterialsRepository _repository;

  MaterialsBloc(this._repository) : super(const MaterialsInitial()) {
    on<LoadClassMaterialsEvent>(_onLoadMaterials);
    on<UploadMaterialEvent>(_onUploadMaterial);
    on<DownloadMaterialEvent>(_onDownloadMaterial);
  }

  Future<void> _onLoadMaterials(
    LoadClassMaterialsEvent event,
    Emitter<MaterialsState> emit,
  ) async {
    emit(const MaterialsLoading());
    try {
      final list = await _repository.getClassMaterials(
        event.classId,
        event.subjectId,
        sectionId: event.sectionId,
      );
      emit(MaterialsLoaded(list));
    } catch (e) {
      emit(MaterialsError(e.toString()));
    }
  }

  Future<void> _onUploadMaterial(
    UploadMaterialEvent event,
    Emitter<MaterialsState> emit,
  ) async {
    emit(const MaterialUploading(0.1, 'Requesting upload URL...'));
    try {
      // Step 1: Request pre-signed upload URL
      final presigned = await _repository.initiatePresignedUpload(
        classId: event.classId,
        sectionId: event.sectionId,
        subjectId: event.subjectId,
        title: event.title,
        description: event.description,
        fileName: event.fileName,
        fileSizeBytes: event.fileBytes.length,
        contentType: event.contentType,
      );

      // Step 2: Direct upload to S3 / Mock S3
      emit(const MaterialUploading(0.5, 'Uploading document directly...'));
      await _repository.uploadFileDirectlyToS3(
        presigned.uploadUrl,
        event.fileBytes,
        event.contentType,
      );

      // Step 3: Verify upload with backend
      emit(const MaterialUploading(0.9, 'Verifying file metadata...'));
      await _repository.verifyUpload(presigned.materialId);

      emit(const MaterialOperationSuccess('Material uploaded and verified successfully!'));

      // Reload materials list
      final list = await _repository.getClassMaterials(
        event.classId,
        event.subjectId,
        sectionId: event.sectionId,
      );
      emit(MaterialsLoaded(list));
    } catch (e) {
      emit(MaterialsError(e.toString()));
    }
  }

  Future<void> _onDownloadMaterial(
    DownloadMaterialEvent event,
    Emitter<MaterialsState> emit,
  ) async {
    try {
      final res = await _repository.getDownloadUrl(event.materialId);
      emit(MaterialOperationSuccess(
        'Document ready for download',
        downloadUrl: res.downloadUrl,
        fileName: res.fileName,
      ));
    } catch (e) {
      emit(MaterialsError(e.toString()));
    }
  }
}
