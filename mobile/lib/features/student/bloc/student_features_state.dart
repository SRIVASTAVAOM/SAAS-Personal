import 'package:equatable/equatable.dart';
import '../models/student_features_model.dart';

abstract class StudentFeaturesState extends Equatable {
  const StudentFeaturesState();

  @override
  List<Object?> get props => [];
}

class StudentFeaturesInitial extends StudentFeaturesState {}

class StudentFeaturesLoading extends StudentFeaturesState {}

// Notices
class StudentNoticesLoaded extends StudentFeaturesState {
  final List<NoticeModel> notices;

  const StudentNoticesLoaded(this.notices);

  @override
  List<Object?> get props => [notices];
}

// Fees
class StudentFeesLoaded extends StudentFeaturesState {
  final FeeOverviewModel overview;

  const StudentFeesLoaded(this.overview);

  @override
  List<Object?> get props => [overview];
}

// Receipts
class StudentReceiptsLoaded extends StudentFeaturesState {
  final List<FeeReceiptModel> receipts;

  const StudentReceiptsLoaded(this.receipts);

  @override
  List<Object?> get props => [receipts];
}

// Complaints
class StudentComplaintsLoaded extends StudentFeaturesState {
  final List<ComplaintModel> complaints;

  const StudentComplaintsLoaded(this.complaints);

  @override
  List<Object?> get props => [complaints];
}

class ComplaintSubmittedSuccess extends StudentFeaturesState {
  final String message;
  final ComplaintModel complaint;

  const ComplaintSubmittedSuccess({required this.message, required this.complaint});

  @override
  List<Object?> get props => [message, complaint];
}

// Feedback
class StudentFeedbackLoaded extends StudentFeaturesState {
  final List<FeedbackModel> feedbackList;

  const StudentFeedbackLoaded(this.feedbackList);

  @override
  List<Object?> get props => [feedbackList];
}

class FeedbackSubmittedSuccess extends StudentFeaturesState {
  final String message;
  final FeedbackModel feedback;

  const FeedbackSubmittedSuccess({required this.message, required this.feedback});

  @override
  List<Object?> get props => [message, feedback];
}

// Error
class StudentFeaturesError extends StudentFeaturesState {
  final String message;

  const StudentFeaturesError(this.message);

  @override
  List<Object?> get props => [message];
}
