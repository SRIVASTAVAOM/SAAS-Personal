import 'package:equatable/equatable.dart';

class ClassmateBirthdayModel extends Equatable {
  final String id;
  final String admissionNumber;
  final String? rollNumber;
  final String firstName;
  final String lastName;
  final int birthMonth;
  final int birthDay;
  final String birthdayFormatted;

  const ClassmateBirthdayModel({
    required this.id,
    required this.admissionNumber,
    this.rollNumber,
    required this.firstName,
    required this.lastName,
    required this.birthMonth,
    required this.birthDay,
    required this.birthdayFormatted,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory ClassmateBirthdayModel.fromJson(Map<String, dynamic> json) {
    return ClassmateBirthdayModel(
      id: json['id'] as String? ?? '',
      admissionNumber: json['admission_number'] as String? ?? '',
      rollNumber: json['roll_number'] as String?,
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      birthMonth: (json['birth_month'] as num?)?.toInt() ?? 1,
      birthDay: (json['birth_day'] as num?)?.toInt() ?? 1,
      birthdayFormatted: json['birthday_formatted'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [
        id,
        admissionNumber,
        rollNumber,
        firstName,
        lastName,
        birthMonth,
        birthDay,
        birthdayFormatted,
      ];
}
