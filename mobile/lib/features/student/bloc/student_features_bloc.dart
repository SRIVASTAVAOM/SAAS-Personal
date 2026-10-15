import 'package:flutter_bloc/flutter_bloc.dart';
import '../repository/student_features_repository.dart';
import 'student_features_event.dart';
import 'student_features_state.dart';

class StudentFeaturesBloc
    extends Bloc<StudentFeaturesEvent, StudentFeaturesState> {
  final StudentFeaturesRepository repository;

  StudentFeaturesBloc({required this.repository})
      : super(StudentFeaturesInitial()) {
    on<LoadStudentNoticesEvent>(_onLoadNotices);
    on<LoadStudentFeesEvent>(_onLoadFees);
    on<LoadStudentReceiptsEvent>(_onLoadReceipts);
    on<LoadStudentComplaintsEvent>(_onLoadComplaints);
    on<SubmitStudentComplaintEvent>(_onSubmitComplaint);
    on<LoadStudentFeedbackEvent>(_onLoadFeedback);
    on<SubmitStudentFeedbackEvent>(_onSubmitFeedback);
  }

  Future<void> _onLoadNotices(
    LoadStudentNoticesEvent event,
    Emitter<StudentFeaturesState> emit,
  ) async {
    emit(StudentFeaturesLoading());
    try {
      final notices = await repository.getNotices();
      emit(StudentNoticesLoaded(notices));
    } catch (e) {
      emit(StudentFeaturesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadFees(
    LoadStudentFeesEvent event,
    Emitter<StudentFeaturesState> emit,
  ) async {
    emit(StudentFeaturesLoading());
    try {
      final overview = await repository.getFeesOverview();
      emit(StudentFeesLoaded(overview));
    } catch (e) {
      emit(StudentFeaturesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadReceipts(
    LoadStudentReceiptsEvent event,
    Emitter<StudentFeaturesState> emit,
  ) async {
    emit(StudentFeaturesLoading());
    try {
      final receipts = await repository.getReceipts();
      emit(StudentReceiptsLoaded(receipts));
    } catch (e) {
      emit(StudentFeaturesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadComplaints(
    LoadStudentComplaintsEvent event,
    Emitter<StudentFeaturesState> emit,
  ) async {
    emit(StudentFeaturesLoading());
    try {
      final complaints = await repository.getComplaints();
      emit(StudentComplaintsLoaded(complaints));
    } catch (e) {
      emit(StudentFeaturesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onSubmitComplaint(
    SubmitStudentComplaintEvent event,
    Emitter<StudentFeaturesState> emit,
  ) async {
    emit(StudentFeaturesLoading());
    try {
      final complaint = await repository.submitComplaint(
        title: event.title,
        category: event.category,
        description: event.description,
      );
      emit(ComplaintSubmittedSuccess(
        message: 'Complaint submitted successfully.',
        complaint: complaint,
      ));
      // Re-fetch list
      final complaints = await repository.getComplaints();
      emit(StudentComplaintsLoaded(complaints));
    } catch (e) {
      emit(StudentFeaturesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadFeedback(
    LoadStudentFeedbackEvent event,
    Emitter<StudentFeaturesState> emit,
  ) async {
    emit(StudentFeaturesLoading());
    try {
      final list = await repository.getFeedback();
      emit(StudentFeedbackLoaded(list));
    } catch (e) {
      emit(StudentFeaturesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onSubmitFeedback(
    SubmitStudentFeedbackEvent event,
    Emitter<StudentFeaturesState> emit,
  ) async {
    emit(StudentFeaturesLoading());
    try {
      final feedback = await repository.submitFeedback(
        category: event.category,
        rating: event.rating,
        feedbackText: event.feedbackText,
      );
      emit(FeedbackSubmittedSuccess(
        message: 'Thank you for your valuable feedback!',
        feedback: feedback,
      ));
      // Re-fetch list
      final list = await repository.getFeedback();
      emit(StudentFeedbackLoaded(list));
    } catch (e) {
      emit(StudentFeaturesError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
