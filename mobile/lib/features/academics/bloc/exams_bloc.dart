import 'package:flutter_bloc/flutter_bloc.dart';
import '../models/exam_model.dart';
import '../repositories/exams_repository.dart';

// ============================================================================
// EVENTS
// ============================================================================
abstract class ExamsEvent {
  const ExamsEvent();
}

class LoadExamsEvent extends ExamsEvent {
  final String? wingId;
  final String? academicYearId;
  const LoadExamsEvent({this.wingId, this.academicYearId});
}

class LoadExamDatesheetsEvent extends ExamsEvent {
  final String examId;
  final String? classId;
  const LoadExamDatesheetsEvent(this.examId, {this.classId});
}

class LoadMarksRosterEvent extends ExamsEvent {
  final String examId;
  final String datesheetId;
  final String? sectionId;
  const LoadMarksRosterEvent(this.examId, this.datesheetId, {this.sectionId});
}

class SaveMarksEvent extends ExamsEvent {
  final String examId;
  final String datesheetId;
  final List<Map<String, dynamic>> entries;
  final bool submitForVerification;
  const SaveMarksEvent(
    this.examId,
    this.datesheetId,
    this.entries, {
    this.submitForVerification = false,
  });
}

class LoadDatesheetSummaryEvent extends ExamsEvent {
  final String examId;
  final String datesheetId;
  const LoadDatesheetSummaryEvent(this.examId, this.datesheetId);
}

class VerifyMarksEvent extends ExamsEvent {
  final String examId;
  final String datesheetId;
  const VerifyMarksEvent(this.examId, this.datesheetId);
}

class GenerateReportCardsEvent extends ExamsEvent {
  final String examId;
  final String classId;
  final String sectionId;
  final String? remarks;
  const GenerateReportCardsEvent(this.examId, this.classId, this.sectionId, {this.remarks});
}

class LoadClassReportCardsEvent extends ExamsEvent {
  final String examId;
  final String classId;
  final String sectionId;
  const LoadClassReportCardsEvent(this.examId, this.classId, this.sectionId);
}

class ApproveReportCardsEvent extends ExamsEvent {
  final String examId;
  final String classId;
  final String sectionId;
  const ApproveReportCardsEvent(this.examId, this.classId, this.sectionId);
}

class LoadStudentResultEvent extends ExamsEvent {
  final String examId;
  const LoadStudentResultEvent(this.examId);
}

class PublishExamEvent extends ExamsEvent {
  final String examId;
  final bool isPublished;
  const PublishExamEvent(this.examId, this.isPublished);
}

// ============================================================================
// STATES
// ============================================================================
abstract class ExamsState {
  const ExamsState();
}

class ExamsInitial extends ExamsState {}

class ExamsLoading extends ExamsState {}

class ExamsLoaded extends ExamsState {
  final List<ExamModel> exams;
  const ExamsLoaded(this.exams);
}

class ExamDatesheetsLoaded extends ExamsState {
  final List<ExamDatesheetModel> datesheets;
  const ExamDatesheetsLoaded(this.datesheets);
}

class MarksRosterLoaded extends ExamsState {
  final ExamDatesheetModel datesheet;
  final List<StudentMarkRosterModel> roster;
  const MarksRosterLoaded(this.datesheet, this.roster);
}

class DatesheetSummaryLoaded extends ExamsState {
  final DatesheetSummaryModel summary;
  const DatesheetSummaryLoaded(this.summary);
}

class ClassReportCardsLoaded extends ExamsState {
  final List<ReportCardModel> reportCards;
  const ClassReportCardsLoaded(this.reportCards);
}

class StudentResultLoaded extends ExamsState {
  final StudentExamResultModel result;
  const StudentResultLoaded(this.result);
}

class ExamOperationSuccess extends ExamsState {
  final String message;
  const ExamOperationSuccess(this.message);
}

class ExamsError extends ExamsState {
  final String message;
  const ExamsError(this.message);
}

// ============================================================================
// BLOC
// ============================================================================
class ExamsBloc extends Bloc<ExamsEvent, ExamsState> {
  final ExamsRepository repository;

  ExamsBloc({required this.repository})
      : super(ExamsInitial()) {
    on<LoadExamsEvent>(_onLoadExams);
    on<LoadExamDatesheetsEvent>(_onLoadDatesheets);
    on<LoadMarksRosterEvent>(_onLoadMarksRoster);
    on<SaveMarksEvent>(_onSaveMarks);
    on<LoadDatesheetSummaryEvent>(_onLoadDatesheetSummary);
    on<VerifyMarksEvent>(_onVerifyMarks);
    on<GenerateReportCardsEvent>(_onGenerateReportCards);
    on<LoadClassReportCardsEvent>(_onLoadClassReportCards);
    on<ApproveReportCardsEvent>(_onApproveReportCards);
    on<LoadStudentResultEvent>(_onLoadStudentResult);
    on<PublishExamEvent>(_onPublishExam);
  }

  Future<void> _onLoadExams(LoadExamsEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      final exams = await repository.getExams(
        wingId: event.wingId,
        academicYearId: event.academicYearId,
      );
      emit(ExamsLoaded(exams));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadDatesheets(LoadExamDatesheetsEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      final datesheets = await repository.getDatesheets(event.examId, classId: event.classId);
      emit(ExamDatesheetsLoaded(datesheets));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadMarksRoster(LoadMarksRosterEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      final res = await repository.getMarksRoster(
        event.examId,
        event.datesheetId,
        sectionId: event.sectionId,
      );
      emit(MarksRosterLoaded(res.datesheet, res.roster));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onSaveMarks(SaveMarksEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      await repository.saveMarks(
        event.examId,
        event.datesheetId,
        event.entries,
        submitForVerification: event.submitForVerification,
      );
      emit(ExamOperationSuccess(
        event.submitForVerification
            ? 'Marks submitted for coordinator verification.'
            : 'Marks saved as draft successfully.',
      ));
      // Reload updated roster
      final res = await repository.getMarksRoster(event.examId, event.datesheetId);
      emit(MarksRosterLoaded(res.datesheet, res.roster));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadDatesheetSummary(LoadDatesheetSummaryEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      final summary = await repository.getDatesheetSummary(event.examId, event.datesheetId);
      emit(DatesheetSummaryLoaded(summary));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onVerifyMarks(VerifyMarksEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      await repository.verifyMarks(event.examId, event.datesheetId);
      emit(const ExamOperationSuccess('Marks successfully verified by coordinator.'));
      final summary = await repository.getDatesheetSummary(event.examId, event.datesheetId);
      emit(DatesheetSummaryLoaded(summary));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onGenerateReportCards(GenerateReportCardsEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      final cards = await repository.generateReportCards(
        event.examId,
        event.classId,
        event.sectionId,
        remarks: event.remarks,
      );
      emit(ExamOperationSuccess('Generated report cards for ${cards.length} students.'));
      emit(ClassReportCardsLoaded(cards));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadClassReportCards(LoadClassReportCardsEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      final cards = await repository.getClassReportCards(
        event.examId,
        event.classId,
        event.sectionId,
      );
      emit(ClassReportCardsLoaded(cards));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onApproveReportCards(ApproveReportCardsEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      final count = await repository.approveReportCards(
        event.examId,
        event.classId,
        event.sectionId,
      );
      emit(ExamOperationSuccess('Approved report cards for $count students.'));
      final cards = await repository.getClassReportCards(
        event.examId,
        event.classId,
        event.sectionId,
      );
      emit(ClassReportCardsLoaded(cards));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadStudentResult(LoadStudentResultEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      final result = await repository.getStudentResult(event.examId);
      emit(StudentResultLoaded(result));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onPublishExam(PublishExamEvent event, Emitter<ExamsState> emit) async {
    emit(ExamsLoading());
    try {
      await repository.publishExam(event.examId, event.isPublished);
      emit(ExamOperationSuccess(
        event.isPublished ? 'Examination published successfully.' : 'Examination unpublished.',
      ));
      final exams = await repository.getExams();
      emit(ExamsLoaded(exams));
    } catch (e) {
      emit(ExamsError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
