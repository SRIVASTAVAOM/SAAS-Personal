import 'package:equatable/equatable.dart';

class SubjectModel extends Equatable {
  final String id;
  final String code;
  final String name;
  final String? type;
  final int creditHours;
  final bool isActive;

  const SubjectModel({
    required this.id,
    required this.code,
    required this.name,
    this.type,
    required this.creditHours,
    required this.isActive,
  });

  factory SubjectModel.fromJson(Map<String, dynamic> json) {
    return SubjectModel(
      id: json['id'] as String? ?? '',
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      type: json['type'] as String?,
      creditHours: json['credit_hours'] as int? ?? 1,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  @override
  List<Object?> get props => [id, code, name, type, creditHours, isActive];
}
