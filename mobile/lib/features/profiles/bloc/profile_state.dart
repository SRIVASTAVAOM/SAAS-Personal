import 'package:equatable/equatable.dart';
import '../models/staff_profile_model.dart';
import '../models/student_profile_model.dart';

abstract class ProfileState extends Equatable {
  const ProfileState();

  @override
  List<Object?> get props => [];
}

class ProfileInitial extends ProfileState {}

class ProfileLoading extends ProfileState {}

class StudentProfileLoaded extends ProfileState {
  final StudentProfileModel profile;

  const StudentProfileLoaded(this.profile);

  @override
  List<Object?> get props => [profile];
}

class StaffProfileLoaded extends ProfileState {
  final StaffProfileModel profile;

  const StaffProfileLoaded(this.profile);

  @override
  List<Object?> get props => [profile];
}

class ProfileUpdating extends ProfileState {}

class ProfileUpdateSuccess extends ProfileState {
  final String message;
  final dynamic updatedProfile;

  const ProfileUpdateSuccess(this.message, [this.updatedProfile]);

  @override
  List<Object?> get props => [message, updatedProfile];
}

class ProfileError extends ProfileState {
  final String message;

  const ProfileError(this.message);

  @override
  List<Object?> get props => [message];
}
