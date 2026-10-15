import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/student_features_model.dart';

class StudentFeaturesRepository {
  final DioClient dioClient;

  StudentFeaturesRepository({required this.dioClient});

  // 1. Notices
  Future<List<NoticeModel>> getNotices() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentNotices);
      final list = (response.data['data'] as List<dynamic>?) ?? [];
      return list
          .map((e) => NoticeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to load notices';
      throw Exception(message);
    }
  }

  // 2. Fees
  Future<FeeOverviewModel> getFeesOverview() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentFees);
      return FeeOverviewModel.fromJson(
          response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to load fee information';
      throw Exception(message);
    }
  }

  // 3. Receipts
  Future<List<FeeReceiptModel>> getReceipts() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentReceipts);
      final list = (response.data['data'] as List<dynamic>?) ?? [];
      return list
          .map((e) => FeeReceiptModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to load receipts';
      throw Exception(message);
    }
  }

  // 4. Complaints
  Future<List<ComplaintModel>> getComplaints() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentComplaints);
      final list = (response.data['data'] as List<dynamic>?) ?? [];
      return list
          .map((e) => ComplaintModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to load complaints';
      throw Exception(message);
    }
  }

  Future<ComplaintModel> submitComplaint({
    required String title,
    required String category,
    required String description,
  }) async {
    try {
      final response = await dioClient.dio.post(
        ApiEndpoints.studentComplaints,
        data: {
          'title': title,
          'category': category,
          'description': description,
        },
      );
      return ComplaintModel.fromJson(
          response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['error']?.toString() ??
          'Failed to submit complaint';
      throw Exception(message);
    }
  }

  // 5. Feedback
  Future<List<FeedbackModel>> getFeedback() async {
    try {
      final response = await dioClient.dio.get(ApiEndpoints.studentFeedback);
      final list = (response.data['data'] as List<dynamic>?) ?? [];
      return list
          .map((e) => FeedbackModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to load feedback';
      throw Exception(message);
    }
  }

  Future<FeedbackModel> submitFeedback({
    required String category,
    required int rating,
    required String feedbackText,
  }) async {
    try {
      final response = await dioClient.dio.post(
        ApiEndpoints.studentFeedback,
        data: {
          'category': category,
          'rating': rating,
          'feedback_text': feedbackText,
        },
      );
      return FeedbackModel.fromJson(
          response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      final message =
          e.response?.data?['error']?.toString() ?? 'Failed to submit feedback';
      throw Exception(message);
    }
  }
}
