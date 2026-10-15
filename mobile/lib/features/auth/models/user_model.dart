import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final String id;
  final String schoolId;
  final String identifier;
  final String? email;
  final String? phone;
  final String? firstName;
  final String? lastName;
  final List<String> roles;
  final String? profileId;
  final String? wingId;
  final String? classId;
  final String? sectionId;

  const UserModel({
    required this.id,
    required this.schoolId,
    required this.identifier,
    this.email,
    this.phone,
    this.firstName,
    this.lastName,
    required this.roles,
    this.profileId,
    this.wingId,
    this.classId,
    this.sectionId,
  });

  String get displayName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName'.trim();
    }
    return identifier;
  }

  String get primaryRole => roles.isNotEmpty ? roles.first : 'UNKNOWN';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String? ?? '',
      schoolId: json['schoolId'] as String? ?? '',
      identifier: json['identifier'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      roles: (json['roles'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      profileId: json['profileId'] as String?,
      wingId: json['wingId'] as String?,
      classId: json['classId'] as String?,
      sectionId: json['sectionId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'schoolId': schoolId,
      'identifier': identifier,
      'email': email,
      'phone': phone,
      'firstName': firstName,
      'lastName': lastName,
      'roles': roles,
      'profileId': profileId,
      'wingId': wingId,
      'classId': classId,
      'sectionId': sectionId,
    };
  }

  @override
  List<Object?> get props => [
        id,
        schoolId,
        identifier,
        email,
        phone,
        firstName,
        lastName,
        roles,
        profileId,
        wingId,
        classId,
        sectionId,
      ];
}
