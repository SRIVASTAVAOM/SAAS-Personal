import 'package:equatable/equatable.dart';

class HomeroomInfo extends Equatable {
  final String id;
  final String classId;
  final String className;
  final String sectionId;
  final String sectionName;

  const HomeroomInfo({
    required this.id,
    required this.classId,
    required this.className,
    required this.sectionId,
    required this.sectionName,
  });

  factory HomeroomInfo.fromJson(Map<String, dynamic> json) {
    return HomeroomInfo(
      id: json['id'] as String? ?? '',
      classId: json['class_id'] as String? ?? '',
      className: json['class_name'] as String? ?? '',
      sectionId: json['section_id'] as String? ?? '',
      sectionName: json['section_name'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [id, classId, className, sectionId, sectionName];
}

class TeacherAllocationItem extends Equatable {
  final String id;
  final String classId;
  final String className;
  final String sectionId;
  final String sectionName;
  final String subjectId;
  final String subjectName;
  final String subjectCode;

  const TeacherAllocationItem({
    required this.id,
    required this.classId,
    required this.className,
    required this.sectionId,
    required this.sectionName,
    required this.subjectId,
    required this.subjectName,
    required this.subjectCode,
  });

  factory TeacherAllocationItem.fromJson(Map<String, dynamic> json) {
    return TeacherAllocationItem(
      id: json['id'] as String? ?? '',
      classId: json['class_id'] as String? ?? '',
      className: json['class_name'] as String? ?? '',
      sectionId: json['section_id'] as String? ?? '',
      sectionName: json['section_name'] as String? ?? '',
      subjectId: json['subject_id'] as String? ?? '',
      subjectName: json['subject_name'] as String? ?? '',
      subjectCode: json['subject_code'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [
        id,
        classId,
        className,
        sectionId,
        sectionName,
        subjectId,
        subjectName,
        subjectCode,
      ];
}

class TeacherAllocationsResponse extends Equatable {
  final HomeroomInfo? homeroom;
  final List<TeacherAllocationItem> allocations;

  const TeacherAllocationsResponse({
    this.homeroom,
    required this.allocations,
  });

  factory TeacherAllocationsResponse.fromJson(Map<String, dynamic> json) {
    return TeacherAllocationsResponse(
      homeroom: json['homeroom'] != null
          ? HomeroomInfo.fromJson(json['homeroom'] as Map<String, dynamic>)
          : null,
      allocations: (json['allocations'] as List<dynamic>? ?? [])
          .map((e) => TeacherAllocationItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  @override
  List<Object?> get props => [homeroom, allocations];
}
