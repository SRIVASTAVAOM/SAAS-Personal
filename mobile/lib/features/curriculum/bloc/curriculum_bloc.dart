import 'package:flutter_bloc/flutter_bloc.dart';
import '../models/curriculum_model.dart';
import '../repository/curriculum_repository.dart';

// --- Events ---
abstract class CurriculumEvent {
  const CurriculumEvent();
}

class LoadCurriculumUnitsEvent extends CurriculumEvent {
  final String classId;
  final String subjectId;
  final String? academicYearId;
  const LoadCurriculumUnitsEvent(this.classId, this.subjectId, {this.academicYearId});
}

class CreateCurriculumUnitEvent extends CurriculumEvent {
  final String classId;
  final String subjectId;
  final int unitNumber;
  final String title;
  final String? description;
  final String? academicYearId;

  const CreateCurriculumUnitEvent({
    required this.classId,
    required this.subjectId,
    required this.unitNumber,
    required this.title,
    this.description,
    this.academicYearId,
  });
}

class CreateCurriculumTopicEvent extends CurriculumEvent {
  final String unitId;
  final int topicNumber;
  final String title;
  final String? description;
  final String? learningObjectives;
  final String classId;
  final String subjectId;

  const CreateCurriculumTopicEvent({
    required this.unitId,
    required this.topicNumber,
    required this.title,
    this.description,
    this.learningObjectives,
    required this.classId,
    required this.subjectId,
  });
}

// --- States ---
abstract class CurriculumState {
  const CurriculumState();
}

class CurriculumInitial extends CurriculumState {
  const CurriculumInitial();
}

class CurriculumLoading extends CurriculumState {
  const CurriculumLoading();
}

class CurriculumLoaded extends CurriculumState {
  final List<CurriculumUnitModel> units;
  const CurriculumLoaded(this.units);
}

class CurriculumError extends CurriculumState {
  final String message;
  const CurriculumError(this.message);
}

// --- BLoC ---
class CurriculumBloc extends Bloc<CurriculumEvent, CurriculumState> {
  final CurriculumRepository _repository;

  CurriculumBloc(this._repository) : super(const CurriculumInitial()) {
    on<LoadCurriculumUnitsEvent>(_onLoadUnits);
    on<CreateCurriculumUnitEvent>(_onCreateUnit);
    on<CreateCurriculumTopicEvent>(_onCreateTopic);
  }

  Future<void> _onLoadUnits(
    LoadCurriculumUnitsEvent event,
    Emitter<CurriculumState> emit,
  ) async {
    emit(const CurriculumLoading());
    try {
      final units = await _repository.getCurriculumUnits(
        event.classId,
        event.subjectId,
        academicYearId: event.academicYearId,
      );
      emit(CurriculumLoaded(units));
    } catch (e) {
      emit(CurriculumError(e.toString()));
    }
  }

  Future<void> _onCreateUnit(
    CreateCurriculumUnitEvent event,
    Emitter<CurriculumState> emit,
  ) async {
    emit(const CurriculumLoading());
    try {
      await _repository.createUnit(
        classId: event.classId,
        subjectId: event.subjectId,
        unitNumber: event.unitNumber,
        title: event.title,
        description: event.description,
        academicYearId: event.academicYearId,
      );
      final units = await _repository.getCurriculumUnits(event.classId, event.subjectId);
      emit(CurriculumLoaded(units));
    } catch (e) {
      emit(CurriculumError(e.toString()));
    }
  }

  Future<void> _onCreateTopic(
    CreateCurriculumTopicEvent event,
    Emitter<CurriculumState> emit,
  ) async {
    emit(const CurriculumLoading());
    try {
      await _repository.createTopic(
        unitId: event.unitId,
        topicNumber: event.topicNumber,
        title: event.title,
        description: event.description,
        learningObjectives: event.learningObjectives,
      );
      final units = await _repository.getCurriculumUnits(event.classId, event.subjectId);
      emit(CurriculumLoaded(units));
    } catch (e) {
      emit(CurriculumError(e.toString()));
    }
  }
}
