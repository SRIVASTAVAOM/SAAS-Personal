import 'package:flutter_bloc/flutter_bloc.dart';
import '../repository/schedule_repository.dart';
import 'schedule_event.dart';
import 'schedule_state.dart';

export 'schedule_event.dart';
export 'schedule_state.dart';

class ScheduleBloc extends Bloc<ScheduleEvent, ScheduleState> {
  final ScheduleRepository repository;

  ScheduleBloc({required this.repository}) : super(ScheduleInitialState()) {
    on<LoadTeacherTimetableEvent>(_onLoadTeacherTimetable);
    on<LoadTeacherSubstitutionsEvent>(_onLoadTeacherSubstitutions);
    on<LoadOnlineClassesEvent>(_onLoadOnlineClasses);
    on<CreateOnlineClassEvent>(_onCreateOnlineClass);
    on<DeleteOnlineClassEvent>(_onDeleteOnlineClass);
  }

  Future<void> _onLoadTeacherTimetable(
    LoadTeacherTimetableEvent event,
    Emitter<ScheduleState> emit,
  ) async {
    final current = state is ScheduleLoadedState
        ? (state as ScheduleLoadedState)
        : const ScheduleLoadedState();
    emit(ScheduleLoadingState());
    try {
      final timetable = await repository.getTeacherTimetable();
      emit(current.copyWith(timetable: timetable));
    } catch (e) {
      emit(ScheduleErrorState(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadTeacherSubstitutions(
    LoadTeacherSubstitutionsEvent event,
    Emitter<ScheduleState> emit,
  ) async {
    final current = state is ScheduleLoadedState
        ? (state as ScheduleLoadedState)
        : const ScheduleLoadedState();
    emit(ScheduleLoadingState());
    try {
      final subs = await repository.getTeacherSubstitutions();
      emit(current.copyWith(
        assignedToMeSubstitutions: subs.assignedToMe,
        coveringForMeSubstitutions: subs.coveringForMe,
      ));
    } catch (e) {
      emit(ScheduleErrorState(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadOnlineClasses(
    LoadOnlineClassesEvent event,
    Emitter<ScheduleState> emit,
  ) async {
    final current = state is ScheduleLoadedState
        ? (state as ScheduleLoadedState)
        : const ScheduleLoadedState();
    emit(ScheduleLoadingState());
    try {
      final sessions = await repository.getOnlineClasses();
      emit(current.copyWith(onlineClasses: sessions));
    } catch (e) {
      emit(ScheduleErrorState(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onCreateOnlineClass(
    CreateOnlineClassEvent event,
    Emitter<ScheduleState> emit,
  ) async {
    emit(ScheduleLoadingState());
    try {
      await repository.createOnlineClass(
        classId: event.classId,
        sectionId: event.sectionId,
        subjectId: event.subjectId,
        title: event.title,
        scheduledDate: event.scheduledDate,
        startTime: event.startTime,
        durationMinutes: event.durationMinutes,
        meetingUrl: event.meetingUrl,
      );
      emit(const ScheduleActionSuccessState('Online class scheduled successfully'));
      final sessions = await repository.getOnlineClasses();
      emit(ScheduleLoadedState(onlineClasses: sessions));
    } catch (e) {
      emit(ScheduleErrorState(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onDeleteOnlineClass(
    DeleteOnlineClassEvent event,
    Emitter<ScheduleState> emit,
  ) async {
    emit(ScheduleLoadingState());
    try {
      await repository.deleteOnlineClass(event.sessionId);
      emit(const ScheduleActionSuccessState('Online class cancelled and removed'));
      final sessions = await repository.getOnlineClasses();
      emit(ScheduleLoadedState(onlineClasses: sessions));
    } catch (e) {
      emit(ScheduleErrorState(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
