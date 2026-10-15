import 'package:equatable/equatable.dart';
import '../models/student_roster_item.dart';
import '../models/subject_model.dart';
import '../models/subject_teacher_item.dart';
import '../models/classmate_birthday_model.dart';
import '../models/teacher_allocation_model.dart';

abstract class AcademicsState extends Equatable {
  const AcademicsState();

  @override
  List<Object?> get props => [];
}

class AcademicsInitial extends AcademicsState {}

class AcademicsLoading extends AcademicsState {}

class SubjectsLoaded extends AcademicsState {
  final List<SubjectModel> subjects;

  const SubjectsLoaded(this.subjects);

  @override
  List<Object?> get props => [subjects];
}

class RosterLoaded extends AcademicsState {
  final List<StudentRosterItem> students;

  const RosterLoaded(this.students);

  @override
  List<Object?> get props => [students];
}

class SubjectTeachersLoaded extends AcademicsState {
  final List<SubjectTeacherItem> teachers;

  const SubjectTeachersLoaded(this.teachers);

  @override
  List<Object?> get props => [teachers];
}

class ClassmatesBirthdaysLoaded extends AcademicsState {
  final List<ClassmateBirthdayModel> birthdays;

  const ClassmatesBirthdaysLoaded(this.birthdays);

  @override
  List<Object?> get props => [birthdays];
}

class AcademicsError extends AcademicsState {
  final String message;

  const AcademicsError(this.message);

  @override
  List<Object?> get props => [message];
}

class TeacherAllocationsLoaded extends AcademicsState {
  final TeacherAllocationsResponse allocationsResponse;

  const TeacherAllocationsLoaded(this.allocationsResponse);

  @override
  List<Object?> get props => [allocationsResponse];
}

