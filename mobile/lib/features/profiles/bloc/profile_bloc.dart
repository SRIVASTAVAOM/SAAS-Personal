import 'package:flutter_bloc/flutter_bloc.dart';
import '../repository/profile_repository.dart';
import 'profile_event.dart';
import 'profile_state.dart';

class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final ProfileRepository repository;

  ProfileBloc({required this.repository}) : super(ProfileInitial()) {
    on<LoadStudentProfileEvent>(_onLoadStudentProfile);
    on<UpdateStudentProfileEvent>(_onUpdateStudentProfile);
    on<LoadStaffProfileEvent>(_onLoadStaffProfile);
    on<UpdateStaffProfileEvent>(_onUpdateStaffProfile);
  }

  Future<void> _onLoadStudentProfile(
    LoadStudentProfileEvent event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileLoading());
    try {
      final profile = await repository.getStudentProfile();
      emit(StudentProfileLoaded(profile));
    } catch (e) {
      emit(ProfileError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onUpdateStudentProfile(
    UpdateStudentProfileEvent event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileUpdating());
    try {
      final updated = await repository.updateStudentProfile(
        emergencyPhone: event.emergencyPhone,
        bloodGroup: event.bloodGroup,
        medicalNotes: event.medicalNotes,
      );
      emit(ProfileUpdateSuccess('Profile updated successfully', updated));
      emit(StudentProfileLoaded(updated));
    } catch (e) {
      emit(ProfileError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadStaffProfile(
    LoadStaffProfileEvent event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileLoading());
    try {
      final profile = await repository.getStaffProfile();
      emit(StaffProfileLoaded(profile));
    } catch (e) {
      emit(ProfileError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onUpdateStaffProfile(
    UpdateStaffProfileEvent event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileUpdating());
    try {
      final updated = await repository.updateStaffProfile(
        phone: event.phone,
        emergencyPhone: event.emergencyPhone,
        qualification: event.qualification,
        bloodGroup: event.bloodGroup,
      );
      emit(ProfileUpdateSuccess('Profile updated successfully', updated));
      emit(StaffProfileLoaded(updated));
    } catch (e) {
      emit(ProfileError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
