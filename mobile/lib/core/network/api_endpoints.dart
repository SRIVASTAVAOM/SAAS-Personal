import 'package:flutter/foundation.dart';

class ApiEndpoints {
  ApiEndpoints._();

  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _defaultProdUrl =
      'https://school-erp-backend-du5v.onrender.com/api/v1';

  /// Resolves API base URL based on target platform and compile-time environment.
  /// - Web (production / Vercel): https://school-erp-backend-du5v.onrender.com/api/v1
  /// - Web (debug localhost): http://localhost:5001/api/v1
  /// - Android Emulator: http://10.0.2.2:5001/api/v1
  /// - Release builds: https://school-erp-backend-du5v.onrender.com/api/v1
  /// - Configurable via --dart-define=API_BASE_URL=...
  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl;
    }

    if (kIsWeb) {
      if (kDebugMode) {
        return 'http://localhost:5001/api/v1';
      }
      return _defaultProdUrl;
    }

    if (kReleaseMode) {
      return _defaultProdUrl;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:5001/api/v1';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.linux:
      case TargetPlatform.windows:
      default:
        return 'http://localhost:5001/api/v1';
    }
  }

  // Auth Endpoints
  static String get login => '$baseUrl/auth/login';
  static String get me => '$baseUrl/auth/me';
  static String get forgotPasswordRequirements =>
      '$baseUrl/auth/forgot-password/requirements';
  static String get forgotPasswordVerify =>
      '$baseUrl/auth/forgot-password/verify';
  static String get forgotPasswordReset =>
      '$baseUrl/auth/forgot-password/reset';
  static String get changePassword => '$baseUrl/auth/change-password';

  // Academics Endpoints
  static String get subjects => '$baseUrl/academics/subjects';
  static String classRoster(String classId, String sectionId) =>
      '$baseUrl/academics/class-roster/$classId/$sectionId';
  static String get myRoster => '$baseUrl/academics/my-roster';
  static String get myAllocations => '$baseUrl/academics/my-allocations';
  static String get subjectTeachers => '$baseUrl/academics/subject-teachers';
  static String get classmatesBirthdays => '$baseUrl/academics/classmates-birthdays';

  // Notices Endpoints
  static String get studentNotices => '$baseUrl/notices/student';

  // Fees Endpoints
  static String get studentFees => '$baseUrl/fees/my-fees';
  static String get studentReceipts => '$baseUrl/fees/my-receipts';

  // Support Endpoints (Complaints & Feedback)
  static String get studentComplaints => '$baseUrl/support/complaints';
  static String get studentFeedback => '$baseUrl/support/feedback';


  // Profiles Endpoints
  static String get studentProfile => '$baseUrl/profiles/student';
  static String get staffProfile => '$baseUrl/profiles/staff';

  // Attendance Endpoints
  static String get markStudentAttendance => '$baseUrl/attendance/student';
  static String classAttendance(String classId, String sectionId, {String? date}) =>
      date != null
          ? '$baseUrl/attendance/student/class/$classId/$sectionId?date=$date'
          : '$baseUrl/attendance/student/class/$classId/$sectionId';
  static String get studentAttendanceHistory =>
      '$baseUrl/attendance/student/my-history';
  static String get staffAttendanceHistory =>
      '$baseUrl/attendance/staff/my-history';
  static String wingStaffAttendance(String wingId, {String? date}) =>
      date != null
          ? '$baseUrl/attendance/staff/wing/$wingId?date=$date'
          : '$baseUrl/attendance/staff/wing/$wingId';
  static String managementStaffAttendanceOverview({String? date, String? wingId}) {
    final params = <String>[];
    if (date != null) params.add('date=$date');
    if (wingId != null) params.add('wingId=$wingId');
    return params.isEmpty
        ? '$baseUrl/attendance/staff/management-overview'
        : '$baseUrl/attendance/staff/management-overview?${params.join('&')}';
  }
  static String get markStaffAttendance => '$baseUrl/attendance/staff';

  // Leave Endpoints
  static String get staffLeaves => '$baseUrl/leaves/staff';
  static String get staffMyLeaves => '$baseUrl/leaves/staff/my-leaves';
  static String get staffWingLeaves => '$baseUrl/leaves/staff/wing-leaves';
  static String get staffManagementQueue =>
      '$baseUrl/leaves/staff/management-queue';
  static String recommendStaffLeave(String id) =>
      '$baseUrl/leaves/staff/$id/recommend';
  static String decideStaffLeave(String id) =>
      '$baseUrl/leaves/staff/$id/decide';
  static String get studentLeaves => '$baseUrl/leaves/student';
  static String get studentMyLeaves => '$baseUrl/leaves/student/my-leaves';
  static String get studentClassLeaves => '$baseUrl/leaves/student/class-requests';
  static String get studentPendingApprovals => '$baseUrl/leaves/student/pending-approvals';
  static String updateStudentLeaveStatus(String id) =>
      '$baseUrl/leaves/student/$id/status';
  static String updateStudentByTeacher(String studentId) =>
      '$baseUrl/profiles/student/$studentId/by-teacher';

  // Homework Endpoints

  static String get homework => '$baseUrl/homework';
  static String get studentMyClassHomework => '$baseUrl/homework/student/my-class';
  static String get teacherMyAssignedHomework => '$baseUrl/homework/teacher/my-assigned';
  static String classHomework(String classId, String sectionId) =>
      '$baseUrl/homework/class/$classId/$sectionId';
  static String homeworkDetail(String id) => '$baseUrl/homework/$id';
  static String homeworkUpdate(String id) => '$baseUrl/homework/$id';
  static String homeworkCompletion(String id) => '$baseUrl/homework/$id/completion';
  static String homeworkAttachmentDownload(String id) =>
      '$baseUrl/homework/$id/attachment-download';

  // Curriculum Endpoints
  static String curriculumUnits(String classId, String subjectId, {String? academicYearId}) =>
      academicYearId != null
          ? '$baseUrl/curriculum/units?classId=$classId&subjectId=$subjectId&academicYearId=$academicYearId'
          : '$baseUrl/curriculum/units?classId=$classId&subjectId=$subjectId';
  static String get createCurriculumUnit => '$baseUrl/curriculum/units';
  static String get createCurriculumTopic => '$baseUrl/curriculum/topics';

  // Materials Endpoints
  static String get presignedUploadUrl => '$baseUrl/materials/presigned-upload-url';
  static String verifyUpload(String id) => '$baseUrl/materials/$id/verify-upload';
  static String classMaterials(String classId, String subjectId, {String? sectionId}) =>
      sectionId != null
          ? '$baseUrl/materials/class/$classId/$subjectId?sectionId=$sectionId'
          : '$baseUrl/materials/class/$classId/$subjectId';
  static String materialDownloadUrl(String id) => '$baseUrl/materials/$id/download-url';

  // Examination Endpoints
  static String get exams => '$baseUrl/exams';
  static String examDetails(String id) => '$baseUrl/exams/$id';
  static String examPublish(String id) => '$baseUrl/exams/$id/publish';
  static String examDatesheets(String examId, {String? classId}) =>
      classId != null
          ? '$baseUrl/exams/$examId/datesheets?classId=$classId'
          : '$baseUrl/exams/$examId/datesheets';
  static String examMarksRoster(String examId, String datesheetId, {String? sectionId}) =>
      sectionId != null
          ? '$baseUrl/exams/$examId/datesheets/$datesheetId/marks-roster?sectionId=$sectionId'
          : '$baseUrl/exams/$examId/datesheets/$datesheetId/marks-roster';
  static String examSaveMarks(String examId, String datesheetId) =>
      '$baseUrl/exams/$examId/datesheets/$datesheetId/marks';
  static String examDatesheetSummary(String examId, String datesheetId) =>
      '$baseUrl/exams/$examId/datesheets/$datesheetId/summary';
  static String examVerifyMarks(String examId, String datesheetId) =>
      '$baseUrl/exams/$examId/datesheets/$datesheetId/verify-marks';
  static String examGenerateReportCards(String examId, String classId, String sectionId) =>
      '$baseUrl/exams/$examId/classes/$classId/sections/$sectionId/generate-report-cards';
  static String examClassReportCards(String examId, String classId, String sectionId) =>
      '$baseUrl/exams/$examId/classes/$classId/sections/$sectionId/report-cards';
  static String examApproveReportCards(String examId, String classId, String sectionId) =>
      '$baseUrl/exams/$examId/classes/$classId/sections/$sectionId/approve-report-cards';
  static String examStudentResult(String examId) => '$baseUrl/exams/$examId/results/me';

  // Schedule Endpoints
  static String get teacherTimetable => '$baseUrl/schedule/timetable/my-teacher';
  static String get teacherSubstitutions => '$baseUrl/schedule/substitutions/my-teacher';
  static String get onlineClasses => '$baseUrl/schedule/online-classes';
  static String deleteOnlineClass(String id) => '$baseUrl/schedule/online-classes/$id';
}

