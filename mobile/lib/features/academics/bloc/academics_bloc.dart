import 'package:flutter_bloc/flutter_bloc.dart';
import '../repository/academics_repository.dart';
import 'academics_event.dart';
import 'academics_state.dart';

class AcademicsBloc extends Bloc<AcademicsEvent, AcademicsState> {
  final AcademicsRepository repository;

  AcademicsBloc({required this.repository}) : super(AcademicsInitial()) {
    on<LoadSubjectsEvent>(_onLoadSubjects);
    on<LoadClassRosterEvent>(_onLoadClassRoster);
    on<LoadTeacherRosterEvent>(_onLoadTeacherRoster);
    on<LoadSubjectTeachersEvent>(_onLoadSubjectTeachers);
    on<LoadClassmatesBirthdaysEvent>(_onLoadClassmatesBirthdays);
    on<LoadTeacherAllocationsEvent>(_onLoadTeacherAllocations);
  }

  Future<void> _onLoadSubjects(
    LoadSubjectsEvent event,
    Emitter<AcademicsState> emit,
  ) async {
    emit(AcademicsLoading());
    try {
      final subjects = await repository.getSubjects();
      emit(SubjectsLoaded(subjects));
    } catch (e) {
      emit(AcademicsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadClassRoster(
    LoadClassRosterEvent event,
    Emitter<AcademicsState> emit,
  ) async {
    emit(AcademicsLoading());
    try {
      final students =
          await repository.getClassRoster(event.classId, event.sectionId);
      emit(RosterLoaded(students));
    } catch (e) {
      emit(AcademicsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadTeacherRoster(
    LoadTeacherRosterEvent event,
    Emitter<AcademicsState> emit,
  ) async {
    emit(AcademicsLoading());
    try {
      final students = await repository.getMyTeacherRoster();
      emit(RosterLoaded(students));
    } catch (e) {
      emit(AcademicsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadSubjectTeachers(
    LoadSubjectTeachersEvent event,
    Emitter<AcademicsState> emit,
  ) async {
    emit(AcademicsLoading());
    try {
      final teachers = await repository.getSubjectTeachers();
      emit(SubjectTeachersLoaded(teachers));
    } catch (e) {
      emit(AcademicsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadClassmatesBirthdays(
    LoadClassmatesBirthdaysEvent event,
    Emitter<AcademicsState> emit,
  ) async {
    emit(AcademicsLoading());
    try {
      final birthdays = await repository.getClassmatesBirthdays();
      emit(ClassmatesBirthdaysLoaded(birthdays));
    } catch (e) {
      emit(AcademicsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadTeacherAllocations(
    LoadTeacherAllocationsEvent event,
    Emitter<AcademicsState> emit,
  ) async {
    emit(AcademicsLoading());
    try {
      final allocations = await repository.getTeacherAllocations();
      emit(TeacherAllocationsLoaded(allocations));
    } catch (e) {
      emit(AcademicsError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}

