import 'package:equatable/equatable.dart';

abstract class AcademicsEvent extends Equatable {
  const AcademicsEvent();

  @override
  List<Object?> get props => [];
}

class LoadSubjectsEvent extends AcademicsEvent {}

class LoadClassRosterEvent extends AcademicsEvent {
  final String classId;
  final String sectionId;

  const LoadClassRosterEvent({required this.classId, required this.sectionId});

  @override
  List<Object?> get props => [classId, sectionId];
}

class LoadTeacherRosterEvent extends AcademicsEvent {}

class LoadSubjectTeachersEvent extends AcademicsEvent {}

class LoadClassmatesBirthdaysEvent extends AcademicsEvent {}

class LoadTeacherAllocationsEvent extends AcademicsEvent {}

