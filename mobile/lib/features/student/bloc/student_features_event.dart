import 'package:equatable/equatable.dart';

abstract class StudentFeaturesEvent extends Equatable {
  const StudentFeaturesEvent();

  @override
  List<Object?> get props => [];
}

// Notices
class LoadStudentNoticesEvent extends StudentFeaturesEvent {
  const LoadStudentNoticesEvent();
}

// Fees
class LoadStudentFeesEvent extends StudentFeaturesEvent {
  const LoadStudentFeesEvent();
}

// Receipts
class LoadStudentReceiptsEvent extends StudentFeaturesEvent {
  const LoadStudentReceiptsEvent();
}

// Complaints
class LoadStudentComplaintsEvent extends StudentFeaturesEvent {
  const LoadStudentComplaintsEvent();
}

class SubmitStudentComplaintEvent extends StudentFeaturesEvent {
  final String title;
  final String category;
  final String description;

  const SubmitStudentComplaintEvent({
    required this.title,
    required this.category,
    required this.description,
  });

  @override
  List<Object?> get props => [title, category, description];
}

// Feedback
class LoadStudentFeedbackEvent extends StudentFeaturesEvent {
  const LoadStudentFeedbackEvent();
}

class SubmitStudentFeedbackEvent extends StudentFeaturesEvent {
  final String category;
  final int rating;
  final String feedbackText;

  const SubmitStudentFeedbackEvent({
    required this.category,
    required this.rating,
    required this.feedbackText,
  });

  @override
  List<Object?> get props => [category, rating, feedbackText];
}
