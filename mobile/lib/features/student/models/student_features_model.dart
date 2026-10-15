import 'package:equatable/equatable.dart';

// 1. Notice Model
class NoticeModel extends Equatable {
  final String id;
  final String title;
  final String content;
  final String targetRole;
  final String priority;
  final String publishedAt;

  const NoticeModel({
    required this.id,
    required this.title,
    required this.content,
    required this.targetRole,
    required this.priority,
    required this.publishedAt,
  });

  factory NoticeModel.fromJson(Map<String, dynamic> json) {
    return NoticeModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      targetRole: json['target_role'] as String? ?? 'ALL',
      priority: json['priority'] as String? ?? 'NORMAL',
      publishedAt: json['published_at'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [id, title, content, targetRole, priority, publishedAt];
}

// 2. Fee Item Model
class FeeItemModel extends Equatable {
  final String id;
  final String feeTitle;
  final String dueDate;
  final double amount;
  final double amountPaid;
  final String status;

  const FeeItemModel({
    required this.id,
    required this.feeTitle,
    required this.dueDate,
    required this.amount,
    required this.amountPaid,
    required this.status,
  });

  double get balance => (amount - amountPaid) > 0 ? (amount - amountPaid) : 0;

  factory FeeItemModel.fromJson(Map<String, dynamic> json) {
    return FeeItemModel(
      id: json['id'] as String? ?? '',
      feeTitle: json['fee_title'] as String? ?? '',
      dueDate: json['due_date'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      amountPaid: (json['amount_paid'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'PENDING',
    );
  }

  @override
  List<Object?> get props => [id, feeTitle, dueDate, amount, amountPaid, status];
}

// 3. Fee Receipt Model
class FeeReceiptModel extends Equatable {
  final String id;
  final String receiptNumber;
  final String paymentDate;
  final double amountPaid;
  final String paymentMode;
  final String? transactionReference;
  final String? remarks;
  final String? feeTitle;

  const FeeReceiptModel({
    required this.id,
    required this.receiptNumber,
    required this.paymentDate,
    required this.amountPaid,
    required this.paymentMode,
    this.transactionReference,
    this.remarks,
    this.feeTitle,
  });

  factory FeeReceiptModel.fromJson(Map<String, dynamic> json) {
    return FeeReceiptModel(
      id: json['id'] as String? ?? '',
      receiptNumber: json['receipt_number'] as String? ?? '',
      paymentDate: json['payment_date'] as String? ?? '',
      amountPaid: (json['amount_paid'] as num?)?.toDouble() ?? 0.0,
      paymentMode: json['payment_mode'] as String? ?? 'CASH',
      transactionReference: json['transaction_reference'] as String?,
      remarks: json['remarks'] as String?,
      feeTitle: json['fee_title'] as String?,
    );
  }

  @override
  List<Object?> get props => [
        id,
        receiptNumber,
        paymentDate,
        amountPaid,
        paymentMode,
        transactionReference,
        remarks,
        feeTitle,
      ];
}

// 4. Fee Overview Model
class FeeOverviewModel extends Equatable {
  final List<FeeItemModel> fees;
  final double totalDues;
  final double totalPaid;
  final double totalOutstanding;

  const FeeOverviewModel({
    required this.fees,
    required this.totalDues,
    required this.totalPaid,
    required this.totalOutstanding,
  });

  factory FeeOverviewModel.fromJson(Map<String, dynamic> json) {
    final list = (json['fees'] as List<dynamic>?)
            ?.map((e) => FeeItemModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    final summary = json['summary'] as Map<String, dynamic>? ?? {};
    return FeeOverviewModel(
      fees: list,
      totalDues: (summary['total_dues'] as num?)?.toDouble() ?? 0.0,
      totalPaid: (summary['total_paid'] as num?)?.toDouble() ?? 0.0,
      totalOutstanding: (summary['total_outstanding'] as num?)?.toDouble() ?? 0.0,
    );
  }

  @override
  List<Object?> get props => [fees, totalDues, totalPaid, totalOutstanding];
}

// 5. Complaint Model
class ComplaintModel extends Equatable {
  final String id;
  final String title;
  final String category;
  final String description;
  final String status;
  final String? resolutionNotes;
  final String createdAt;

  const ComplaintModel({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.status,
    this.resolutionNotes,
    required this.createdAt,
  });

  factory ComplaintModel.fromJson(Map<String, dynamic> json) {
    return ComplaintModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      category: json['category'] as String? ?? 'OTHER',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      resolutionNotes: json['resolution_notes'] as String?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [id, title, category, description, status, resolutionNotes, createdAt];
}

// 6. Feedback Model
class FeedbackModel extends Equatable {
  final String id;
  final String category;
  final int rating;
  final String feedbackText;
  final String createdAt;

  const FeedbackModel({
    required this.id,
    required this.category,
    required this.rating,
    required this.feedbackText,
    required this.createdAt,
  });

  factory FeedbackModel.fromJson(Map<String, dynamic> json) {
    return FeedbackModel(
      id: json['id'] as String? ?? '',
      category: json['category'] as String? ?? 'GENERAL',
      rating: (json['rating'] as num?)?.toInt() ?? 5,
      feedbackText: json['feedback_text'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  @override
  List<Object?> get props => [id, category, rating, feedbackText, createdAt];
}
