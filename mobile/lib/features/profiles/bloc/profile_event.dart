import 'package:equatable/equatable.dart';

abstract class ProfileEvent extends Equatable {
  const ProfileEvent();

  @override
  List<Object?> get props => [];
}

class LoadStudentProfileEvent extends ProfileEvent {}

class UpdateStudentProfileEvent extends ProfileEvent {
  final String? emergencyPhone;
  final String? bloodGroup;
  final String? medicalNotes;
  final String? documentUrl;

  const UpdateStudentProfileEvent({
    this.emergencyPhone,
    this.bloodGroup,
    this.medicalNotes,
    this.documentUrl,
  });

  @override
  List<Object?> get props => [emergencyPhone, bloodGroup, medicalNotes, documentUrl];
}

class LoadStaffProfileEvent extends ProfileEvent {}

class UpdateStaffProfileEvent extends ProfileEvent {
  final String? phone;
  final String? emergencyPhone;
  final String? qualification;
  final String? bloodGroup;

  const UpdateStaffProfileEvent({
    this.phone,
    this.emergencyPhone,
    this.qualification,
    this.bloodGroup,
  });

  @override
  List<Object?> get props => [phone, emergencyPhone, qualification, bloodGroup];
}
