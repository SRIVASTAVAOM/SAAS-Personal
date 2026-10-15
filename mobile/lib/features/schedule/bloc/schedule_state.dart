import 'package:equatable/equatable.dart';
import '../models/timetable_slot_model.dart';
import '../models/teacher_substitution_model.dart';
import '../models/online_class_model.dart';

abstract class ScheduleState extends Equatable {
  const ScheduleState();

  @override
  List<Object?> get props => [];
}

class ScheduleInitialState extends ScheduleState {}

class ScheduleLoadingState extends ScheduleState {}

class ScheduleLoadedState extends ScheduleState {
  final List<TimetableSlotModel> timetable;
  final List<TeacherSubstitutionModel> assignedToMeSubstitutions;
  final List<TeacherSubstitutionModel> coveringForMeSubstitutions;
  final List<OnlineClassModel> onlineClasses;

  const ScheduleLoadedState({
    this.timetable = const [],
    this.assignedToMeSubstitutions = const [],
    this.coveringForMeSubstitutions = const [],
    this.onlineClasses = const [],
  });

  ScheduleLoadedState copyWith({
    List<TimetableSlotModel>? timetable,
    List<TeacherSubstitutionModel>? assignedToMeSubstitutions,
    List<TeacherSubstitutionModel>? coveringForMeSubstitutions,
    List<OnlineClassModel>? onlineClasses,
  }) {
    return ScheduleLoadedState(
      timetable: timetable ?? this.timetable,
      assignedToMeSubstitutions:
          assignedToMeSubstitutions ?? this.assignedToMeSubstitutions,
      coveringForMeSubstitutions:
          coveringForMeSubstitutions ?? this.coveringForMeSubstitutions,
      onlineClasses: onlineClasses ?? this.onlineClasses,
    );
  }

  @override
  List<Object?> get props => [
        timetable,
        assignedToMeSubstitutions,
        coveringForMeSubstitutions,
        onlineClasses,
      ];
}

class ScheduleActionSuccessState extends ScheduleState {
  final String message;

  const ScheduleActionSuccessState(this.message);

  @override
  List<Object?> get props => [message];
}

class ScheduleErrorState extends ScheduleState {
  final String message;

  const ScheduleErrorState(this.message);

  @override
  List<Object?> get props => [message];
}
