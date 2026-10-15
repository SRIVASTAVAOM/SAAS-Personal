class AcademicMaterialModel {
  final String id;
  final String schoolId;
  final String classId;
  final String? className;
  final String? sectionId;
  final String? sectionName;
  final String subjectId;
  final String? subjectName;
  final String? subjectCode;
  final String uploadedByStaffId;
  final String? teacherName;
  final String title;
  final String? description;
  final String s3FileKey;
  final String fileName;
  final int fileSizeBytes;
  final String contentType;
  final bool isVerified;
  final String createdAt;

  const AcademicMaterialModel({
    required this.id,
    required this.schoolId,
    required this.classId,
    this.className,
    this.sectionId,
    this.sectionName,
    required this.subjectId,
    this.subjectName,
    this.subjectCode,
    required this.uploadedByStaffId,
    this.teacherName,
    required this.title,
    this.description,
    required this.s3FileKey,
    required this.fileName,
    required this.fileSizeBytes,
    required this.contentType,
    required this.isVerified,
    required this.createdAt,
  });

  String get formattedSize {
    if (fileSizeBytes < 1024) return '$fileSizeBytes B';
    if (fileSizeBytes < 1024 * 1024) {
      return '${(fileSizeBytes / 1024).toStringAsFixed(1)} KB';
    }
    return '${(fileSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  factory AcademicMaterialModel.fromJson(Map<String, dynamic> json) {
    return AcademicMaterialModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String? ?? '',
      classId: json['class_id'] as String? ?? '',
      className: json['class_name'] as String?,
      sectionId: json['section_id'] as String?,
      sectionName: json['section_name'] as String?,
      subjectId: json['subject_id'] as String? ?? '',
      subjectName: json['subject_name'] as String?,
      subjectCode: json['subject_code'] as String?,
      uploadedByStaffId: json['uploaded_by_staff_id'] as String? ?? '',
      teacherName: json['teacher_name'] as String?,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      s3FileKey: json['s3_file_key'] as String? ?? '',
      fileName: json['file_name'] as String? ?? '',
      fileSizeBytes: (json['file_size_bytes'] as num?)?.toInt() ?? 0,
      contentType: json['content_type'] as String? ?? 'application/pdf',
      isVerified: json['is_verified'] as bool? ?? false,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'class_id': classId,
      'class_name': className,
      'section_id': sectionId,
      'section_name': sectionName,
      'subject_id': subjectId,
      'subject_name': subjectName,
      'subject_code': subjectCode,
      'uploaded_by_staff_id': uploadedByStaffId,
      'teacher_name': teacherName,
      'title': title,
      'description': description,
      's3_file_key': s3FileKey,
      'file_name': fileName,
      'file_size_bytes': fileSizeBytes,
      'content_type': contentType,
      'is_verified': isVerified,
      'created_at': createdAt,
    };
  }
}

class PresignedUploadResponse {
  final String uploadUrl;
  final String fileKey;
  final String materialId;
  final int expiresInSeconds;
  final bool isMock;

  const PresignedUploadResponse({
    required this.uploadUrl,
    required this.fileKey,
    required this.materialId,
    required this.expiresInSeconds,
    this.isMock = false,
  });

  factory PresignedUploadResponse.fromJson(Map<String, dynamic> json) {
    return PresignedUploadResponse(
      uploadUrl: json['uploadUrl'] as String,
      fileKey: json['fileKey'] as String,
      materialId: json['materialId'] as String,
      expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt() ?? 300,
      isMock: json['isMock'] as bool? ?? false,
    );
  }
}

class PresignedDownloadResponse {
  final String downloadUrl;
  final String fileName;
  final String contentType;
  final int expiresInSeconds;
  final bool isMock;

  const PresignedDownloadResponse({
    required this.downloadUrl,
    required this.fileName,
    required this.contentType,
    required this.expiresInSeconds,
    this.isMock = false,
  });

  factory PresignedDownloadResponse.fromJson(Map<String, dynamic> json) {
    return PresignedDownloadResponse(
      downloadUrl: json['downloadUrl'] as String,
      fileName: json['fileName'] as String? ?? 'document',
      contentType: json['contentType'] as String? ?? 'application/pdf',
      expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt() ?? 900,
      isMock: json['isMock'] as bool? ?? false,
    );
  }
}
