import 'package:flutter_bloc/flutter_bloc.dart';
import '../models/homework_model.dart';
import '../repository/homework_repository.dart';

// --- Events ---
abstract class HomeworkEvent {
  const HomeworkEvent();
}

class LoadStudentHomeworkEvent extends HomeworkEvent {
  const LoadStudentHomeworkEvent();
}

class LoadTeacherHomeworkEvent extends HomeworkEvent {
  const LoadTeacherHomeworkEvent();
}

class LoadClassHomeworkEvent extends HomeworkEvent {
  final String classId;
  final String sectionId;
  const LoadClassHomeworkEvent(this.classId, this.sectionId);
}

class CreateHomeworkEvent extends HomeworkEvent {
  final String classId;
  final String sectionId;
  final String subjectId;
  final String title;
  final String description;
  final String? assignedDate;
  final String dueDate;
  final String? s3AttachmentKey;
  final String? attachmentName;

  const CreateHomeworkEvent({
    required this.classId,
    required this.sectionId,
    required this.subjectId,
    required this.title,
    required this.description,
    this.assignedDate,
    required this.dueDate,
    this.s3AttachmentKey,
    this.attachmentName,
  });
}

class UpdateHomeworkEvent extends HomeworkEvent {
  final String id;
  final String? title;
  final String? description;
  final String? dueDate;
  final String? s3AttachmentKey;
  final String? attachmentName;

  const UpdateHomeworkEvent({
    required this.id,
    this.title,
    this.description,
    this.dueDate,
    this.s3AttachmentKey,
    this.attachmentName,
  });
}

class ToggleHomeworkCompletionEvent extends HomeworkEvent {
  final String homeworkId;
  final String currentStatus;
  const ToggleHomeworkCompletionEvent(this.homeworkId, this.currentStatus);
}

class DownloadHomeworkAttachmentEvent extends HomeworkEvent {
  final String homeworkId;
  const DownloadHomeworkAttachmentEvent(this.homeworkId);
}

// --- States ---
abstract class HomeworkState {
  const HomeworkState();
}

class HomeworkInitial extends HomeworkState {
  const HomeworkInitial();
}

class HomeworkLoading extends HomeworkState {
  const HomeworkLoading();
}

class StudentHomeworkLoaded extends HomeworkState {
  final List<HomeworkModel> homeworkList;
  const StudentHomeworkLoaded(this.homeworkList);
}

class TeacherHomeworkLoaded extends HomeworkState {
  final List<HomeworkModel> homeworkList;
  const TeacherHomeworkLoaded(this.homeworkList);
}

class HomeworkOperationSuccess extends HomeworkState {
  final String message;
  final String? downloadUrl;
  final String? attachmentName;
  const HomeworkOperationSuccess(this.message, {this.downloadUrl, this.attachmentName});
}

class HomeworkError extends HomeworkState {
  final String message;
  const HomeworkError(this.message);
}

// --- BLoC ---
class HomeworkBloc extends Bloc<HomeworkEvent, HomeworkState> {
  final HomeworkRepository _repository;

  HomeworkBloc(this._repository) : super(const HomeworkInitial()) {
    on<LoadStudentHomeworkEvent>(_onLoadStudentHomework);
    on<LoadTeacherHomeworkEvent>(_onLoadTeacherHomework);
    on<LoadClassHomeworkEvent>(_onLoadClassHomework);
    on<CreateHomeworkEvent>(_onCreateHomework);
    on<UpdateHomeworkEvent>(_onUpdateHomework);
    on<ToggleHomeworkCompletionEvent>(_onToggleCompletion);
    on<DownloadHomeworkAttachmentEvent>(_onDownloadAttachment);
  }

  Future<void> _onLoadStudentHomework(
    LoadStudentHomeworkEvent event,
    Emitter<HomeworkState> emit,
  ) async {
    emit(const HomeworkLoading());
    try {
      final list = await _repository.getStudentMyClassHomework();
      emit(StudentHomeworkLoaded(list));
    } catch (e) {
      emit(HomeworkError(e.toString()));
    }
  }

  Future<void> _onLoadTeacherHomework(
    LoadTeacherHomeworkEvent event,
    Emitter<HomeworkState> emit,
  ) async {
    emit(const HomeworkLoading());
    try {
      final list = await _repository.getTeacherMyAssignedHomework();
      emit(TeacherHomeworkLoaded(list));
    } catch (e) {
      emit(HomeworkError(e.toString()));
    }
  }

  Future<void> _onLoadClassHomework(
    LoadClassHomeworkEvent event,
    Emitter<HomeworkState> emit,
  ) async {
    emit(const HomeworkLoading());
    try {
      final list = await _repository.getClassHomework(event.classId, event.sectionId);
      emit(TeacherHomeworkLoaded(list));
    } catch (e) {
      emit(HomeworkError(e.toString()));
    }
  }

  Future<void> _onCreateHomework(
    CreateHomeworkEvent event,
    Emitter<HomeworkState> emit,
  ) async {
    emit(const HomeworkLoading());
    try {
      await _repository.createHomework(
        classId: event.classId,
        sectionId: event.sectionId,
        subjectId: event.subjectId,
        title: event.title,
        description: event.description,
        assignedDate: event.assignedDate,
        dueDate: event.dueDate,
        s3AttachmentKey: event.s3AttachmentKey,
        attachmentName: event.attachmentName,
      );
      final list = await _repository.getTeacherMyAssignedHomework();
      emit(TeacherHomeworkLoaded(list));
    } catch (e) {
      emit(HomeworkError(e.toString()));
    }
  }

  Future<void> _onUpdateHomework(
    UpdateHomeworkEvent event,
    Emitter<HomeworkState> emit,
  ) async {
    emit(const HomeworkLoading());
    try {
      await _repository.updateHomework(
        id: event.id,
        title: event.title,
        description: event.description,
        dueDate: event.dueDate,
        s3AttachmentKey: event.s3AttachmentKey,
        attachmentName: event.attachmentName,
      );
      final list = await _repository.getTeacherMyAssignedHomework();
      emit(TeacherHomeworkLoaded(list));
    } catch (e) {
      emit(HomeworkError(e.toString()));
    }
  }

  Future<void> _onToggleCompletion(
    ToggleHomeworkCompletionEvent event,
    Emitter<HomeworkState> emit,
  ) async {
    final newStatus = event.currentStatus == 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await _repository.setCompletionStatus(event.homeworkId, newStatus);
      final list = await _repository.getStudentMyClassHomework();
      emit(StudentHomeworkLoaded(list));
    } catch (e) {
      emit(HomeworkError(e.toString()));
    }
  }

  Future<void> _onDownloadAttachment(
    DownloadHomeworkAttachmentEvent event,
    Emitter<HomeworkState> emit,
  ) async {
    try {
      final res = await _repository.getAttachmentDownloadUrl(event.homeworkId);
      emit(HomeworkOperationSuccess(
        'Download link generated',
        downloadUrl: res.downloadUrl,
        attachmentName: res.fileName,
      ));
    } catch (e) {
      emit(HomeworkError(e.toString()));
    }
  }
}
