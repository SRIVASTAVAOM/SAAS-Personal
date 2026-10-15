class CurriculumTopicModel {
  final String id;
  final String unitId;
  final int topicNumber;
  final String title;
  final String? description;
  final String? learningObjectives;
  final String createdAt;

  const CurriculumTopicModel({
    required this.id,
    required this.unitId,
    required this.topicNumber,
    required this.title,
    this.description,
    this.learningObjectives,
    required this.createdAt,
  });

  factory CurriculumTopicModel.fromJson(Map<String, dynamic> json) {
    return CurriculumTopicModel(
      id: json['id'] as String,
      unitId: json['unit_id'] as String? ?? '',
      topicNumber: (json['topic_number'] as num?)?.toInt() ?? 0,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      learningObjectives: json['learning_objectives'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'unit_id': unitId,
      'topic_number': topicNumber,
      'title': title,
      'description': description,
      'learning_objectives': learningObjectives,
      'created_at': createdAt,
    };
  }
}

class CurriculumUnitModel {
  final String id;
  final String schoolId;
  final String academicYearId;
  final String classId;
  final String subjectId;
  final int unitNumber;
  final String title;
  final String? description;
  final String createdAt;
  final List<CurriculumTopicModel> topics;

  const CurriculumUnitModel({
    required this.id,
    required this.schoolId,
    required this.academicYearId,
    required this.classId,
    required this.subjectId,
    required this.unitNumber,
    required this.title,
    this.description,
    required this.createdAt,
    this.topics = const [],
  });

  factory CurriculumUnitModel.fromJson(Map<String, dynamic> json) {
    return CurriculumUnitModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String? ?? '',
      academicYearId: json['academic_year_id'] as String? ?? '',
      classId: json['class_id'] as String? ?? '',
      subjectId: json['subject_id'] as String? ?? '',
      unitNumber: (json['unit_number'] as num?)?.toInt() ?? 0,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      topics: (json['topics'] as List<dynamic>?)
              ?.map((t) => CurriculumTopicModel.fromJson(t as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'academic_year_id': academicYearId,
      'class_id': classId,
      'subject_id': subjectId,
      'unit_number': unitNumber,
      'title': title,
      'description': description,
      'created_at': createdAt,
      'topics': topics.map((t) => t.toJson()).toList(),
    };
  }
}
