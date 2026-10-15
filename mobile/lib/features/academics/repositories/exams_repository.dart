import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/exam_model.dart';

class MarksRosterResult {
  final ExamDatesheetModel datesheet;
  final List<StudentMarkRosterModel> roster;

  const MarksRosterResult({
    required this.datesheet,
    required this.roster,
  });
}

class ExamsRepository {
  final DioClient client;

  ExamsRepository({required this.client});

  /// 1. List Examinations
  Future<List<ExamModel>> getExams({String? wingId, String? academicYearId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (wingId != null) queryParams['wingId'] = wingId;
      if (academicYearId != null) queryParams['academicYearId'] = academicYearId;

      final response = await client.dio.get(
        ApiEndpoints.exams,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final data = response.data['data'] as List<dynamic>;
      return data.map((e) => ExamModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to load examinations.';
      throw Exception(msg);
    }
  }

  /// 2. Get Exam Datesheets
  Future<List<ExamDatesheetModel>> getDatesheets(String examId, {String? classId}) async {
    try {
      final response = await client.dio.get(
        ApiEndpoints.examDatesheets(examId, classId: classId),
      );

      final data = response.data['data'] as List<dynamic>;
      return data.map((e) => ExamDatesheetModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to load exam datesheet.';
      throw Exception(msg);
    }
  }

  /// 3. Get Marks Roster for a Datesheet
  Future<MarksRosterResult> getMarksRoster(
    String examId,
    String datesheetId, {
    String? sectionId,
  }) async {
    try {
      final response = await client.dio.get(
        ApiEndpoints.examMarksRoster(examId, datesheetId, sectionId: sectionId),
      );

      final data = response.data['data'] as Map<String, dynamic>;
      final datesheet = ExamDatesheetModel.fromJson(data['datesheet'] as Map<String, dynamic>);
      final rosterList = (data['roster'] as List<dynamic>)
          .map((e) => StudentMarkRosterModel.fromJson(e as Map<String, dynamic>))
          .toList();

      return MarksRosterResult(datesheet: datesheet, roster: rosterList);
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to load marks roster.';
      throw Exception(msg);
    }
  }

  /// 4. Save Marks (Teacher / Coordinator)
  Future<void> saveMarks(
    String examId,
    String datesheetId,
    List<Map<String, dynamic>> entries, {
    bool submitForVerification = false,
  }) async {
    try {
      await client.dio.post(
        ApiEndpoints.examSaveMarks(examId, datesheetId),
        data: {
          'submitForVerification': submitForVerification,
          'entries': entries,
        },
      );
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to save marks.';
      throw Exception(msg);
    }
  }

  /// 5. Get Datesheet Summary & Analysis
  Future<DatesheetSummaryModel> getDatesheetSummary(String examId, String datesheetId) async {
    try {
      final response = await client.dio.get(
        ApiEndpoints.examDatesheetSummary(examId, datesheetId),
      );
      final data = response.data['data'] as Map<String, dynamic>;
      return DatesheetSummaryModel.fromJson(data);
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to load datesheet summary.';
      throw Exception(msg);
    }
  }

  /// 6. Coordinator Verify Marks
  Future<int> verifyMarks(String examId, String datesheetId) async {
    try {
      final response = await client.dio.patch(
        ApiEndpoints.examVerifyMarks(examId, datesheetId),
      );
      return response.data['data']?['verifiedCount'] as int? ?? 1;
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to verify marks.';
      throw Exception(msg);
    }
  }

  /// 7. Generate Class Report Cards
  Future<List<ReportCardModel>> generateReportCards(
    String examId,
    String classId,
    String sectionId, {
    String? remarks,
  }) async {
    try {
      final response = await client.dio.post(
        ApiEndpoints.examGenerateReportCards(examId, classId, sectionId),
        data: remarks != null ? {'remarks': remarks} : {},
      );

      final data = response.data['data'] as List<dynamic>;
      return data.map((e) => ReportCardModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to generate report cards.';
      throw Exception(msg);
    }
  }

  /// 8. Get Class Report Cards
  Future<List<ReportCardModel>> getClassReportCards(
    String examId,
    String classId,
    String sectionId,
  ) async {
    try {
      final response = await client.dio.get(
        ApiEndpoints.examClassReportCards(examId, classId, sectionId),
      );

      final data = response.data['data'] as List<dynamic>;
      return data.map((e) => ReportCardModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to load report cards.';
      throw Exception(msg);
    }
  }

  /// 9. Approve Class Report Cards
  Future<int> approveReportCards(String examId, String classId, String sectionId) async {
    try {
      final response = await client.dio.patch(
        ApiEndpoints.examApproveReportCards(examId, classId, sectionId),
      );
      return response.data['data']?['approvedCount'] as int? ?? 1;
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to approve report cards.';
      throw Exception(msg);
    }
  }

  /// 10. Student View Result
  Future<StudentExamResultModel> getStudentResult(String examId) async {
    try {
      final response = await client.dio.get(
        ApiEndpoints.examStudentResult(examId),
      );
      final data = response.data['data'] as Map<String, dynamic>;
      return StudentExamResultModel.fromJson(data);
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to fetch exam result.';
      throw Exception(msg);
    }
  }

  /// 11. Coordinator Publish Exam
  Future<void> publishExam(String examId, bool isPublished) async {
    try {
      await client.dio.patch(
        ApiEndpoints.examPublish(examId),
        data: {'isPublished': isPublished},
      );
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ?? 'Failed to update publication status.';
      throw Exception(msg);
    }
  }
}
