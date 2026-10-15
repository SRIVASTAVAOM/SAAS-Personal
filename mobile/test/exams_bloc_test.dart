import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/academics/bloc/exams_bloc.dart';
import 'package:mobile/features/academics/models/exam_model.dart';
import 'package:mobile/features/academics/repositories/exams_repository.dart';
import 'package:mocktail/mocktail.dart';

class MockDioClient extends Mock implements DioClient {}

class MockExamsRepository implements ExamsRepository {
  bool shouldThrow = false;

  final sampleExam = const ExamModel(
    id: 'exam-1',
    name: 'Mid-Term Examinations 2026',
    startDate: '2026-10-15',
    endDate: '2026-10-25',
    isPublished: true,
  );

  final sampleDatesheet = const ExamDatesheetModel(
    id: 'ds-1',
    examId: 'exam-1',
    classId: 'class-1',
    subjectId: 'sub-1',
    examDate: '2026-10-16',
    startTime: '09:00:00',
    endTime: '12:00:00',
    maxMarks: 100.0,
    passingMarks: 33.0,
    className: 'Grade 10',
    subjectName: 'Mathematics',
    subjectCode: 'MTH101',
  );

  final sampleRosterItem = const StudentMarkRosterModel(
    studentId: 'stud-1',
    admissionNumber: 'ADM101',
    rollNumber: '1',
    firstName: 'Aarav',
    lastName: 'Sharma',
    marksObtained: 88.0,
    isAbsent: false,
    remarks: 'Well done',
    status: 'DRAFT',
  );

  final sampleSummary = const DatesheetSummaryModel(
    datesheetId: 'ds-1',
    subjectName: 'Mathematics',
    maxMarks: 100.0,
    totalStudents: 30,
    enteredCount: 28,
    absentCount: 1,
    missingCount: 1,
    status: 'DRAFT',
  );

  final sampleReportCard = const ReportCardModel(
    id: 'rc-1',
    examId: 'exam-1',
    studentId: 'stud-1',
    totalMarksObtained: 175.0,
    totalMaxMarks: 200.0,
    percentage: 87.5,
    subjectsEvaluatedCount: 2,
    subjectsAbsentCount: 0,
    status: 'DRAFT',
    studentName: 'Aarav Sharma',
    admissionNumber: 'ADM101',
    rollNumber: '1',
  );

  late final sampleStudentResult = StudentExamResultModel(
    exam: sampleExam,
    reportCard: const ReportCardModel(
      id: 'rc-1',
      examId: 'exam-1',
      studentId: 'stud-1',
      totalMarksObtained: 175.0,
      totalMaxMarks: 200.0,
      percentage: 87.5,
      subjectsEvaluatedCount: 2,
      subjectsAbsentCount: 0,
      status: 'APPROVED',
      studentName: 'Aarav Sharma',
      admissionNumber: 'ADM101',
      rollNumber: '1',
    ),
    subjectMarks: const [
      SubjectMarkItemModel(
        subjectName: 'Mathematics',
        subjectCode: 'MTH101',
        maxMarks: 100.0,
        passingMarks: 33.0,
        marksObtained: 88.0,
        isAbsent: false,
        remarks: 'Well done',
        status: 'VERIFIED',
      ),
    ],
  );

  @override
  DioClient get client => MockDioClient();

  @override
  Future<List<ExamModel>> getExams({String? wingId, String? academicYearId}) async {
    if (shouldThrow) throw Exception('Network error');
    return [sampleExam];
  }

  @override
  Future<List<ExamDatesheetModel>> getDatesheets(String examId, {String? classId}) async {
    if (shouldThrow) throw Exception('Network error');
    return [sampleDatesheet];
  }

  @override
  Future<MarksRosterResult> getMarksRoster(String examId, String datesheetId, {String? sectionId}) async {
    if (shouldThrow) throw Exception('Network error');
    return MarksRosterResult(datesheet: sampleDatesheet, roster: [sampleRosterItem]);
  }

  @override
  Future<void> saveMarks(String examId, String datesheetId, List<Map<String, dynamic>> marks, {bool submitForVerification = false}) async {
    if (shouldThrow) throw Exception('Network error');
  }

  @override
  Future<DatesheetSummaryModel> getDatesheetSummary(String examId, String datesheetId) async {
    if (shouldThrow) throw Exception('Network error');
    return sampleSummary;
  }

  @override
  Future<int> verifyMarks(String examId, String datesheetId) async {
    if (shouldThrow) throw Exception('Network error');
    return 1;
  }

  @override
  Future<List<ReportCardModel>> generateReportCards(String examId, String classId, String sectionId, {String? remarks}) async {
    if (shouldThrow) throw Exception('Network error');
    return [sampleReportCard];
  }

  @override
  Future<List<ReportCardModel>> getClassReportCards(String examId, String classId, String sectionId) async {
    if (shouldThrow) throw Exception('Network error');
    return [sampleReportCard];
  }

  @override
  Future<int> approveReportCards(String examId, String classId, String sectionId) async {
    if (shouldThrow) throw Exception('Network error');
    return 1;
  }

  @override
  Future<StudentExamResultModel> getStudentResult(String examId) async {
    if (shouldThrow) throw Exception('Network error');
    return sampleStudentResult;
  }

  @override
  Future<void> publishExam(String examId, bool isPublished) async {
    if (shouldThrow) throw Exception('Network error');
  }
}

void main() {
  late MockExamsRepository mockRepo;
  late ExamsBloc bloc;

  setUp(() {
    mockRepo = MockExamsRepository();
    bloc = ExamsBloc(repository: mockRepo);
  });

  tearDown(() {
    bloc.close();
  });

  group('ExamsBloc Unit Tests', () {
    test('initial state is ExamsInitial', () {
      expect(bloc.state, isA<ExamsInitial>());
    });

    test('LoadExamsEvent emits [ExamsLoading, ExamsLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ExamsLoaded>().having((s) => s.exams.length, 'length', 1),
        ]),
      );
      bloc.add(const LoadExamsEvent());
    });

    test('LoadExamDatesheetsEvent emits [ExamsLoading, ExamDatesheetsLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ExamDatesheetsLoaded>().having((s) => s.datesheets.first.subjectName, 'subject', 'Mathematics'),
        ]),
      );
      bloc.add(const LoadExamDatesheetsEvent('exam-1'));
    });

    test('LoadMarksRosterEvent emits [ExamsLoading, MarksRosterLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<MarksRosterLoaded>().having((s) => s.roster.first.firstName, 'name', 'Aarav'),
        ]),
      );
      bloc.add(const LoadMarksRosterEvent('exam-1', 'ds-1'));
    });

    test('SaveMarksEvent emits [ExamsLoading, ExamOperationSuccess, MarksRosterLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ExamOperationSuccess>(),
          isA<MarksRosterLoaded>(),
        ]),
      );
      bloc.add(const SaveMarksEvent(
        'exam-1',
        'ds-1',
        [
          {'studentId': 'stud-1', 'marksObtained': 90.0, 'isAbsent': false},
        ],
      ));
    });

    test('LoadDatesheetSummaryEvent emits [ExamsLoading, DatesheetSummaryLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<DatesheetSummaryLoaded>().having((s) => s.summary.totalStudents, 'total', 30),
        ]),
      );
      bloc.add(const LoadDatesheetSummaryEvent('exam-1', 'ds-1'));
    });

    test('VerifyMarksEvent emits [ExamsLoading, ExamOperationSuccess, DatesheetSummaryLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ExamOperationSuccess>(),
          isA<DatesheetSummaryLoaded>(),
        ]),
      );
      bloc.add(const VerifyMarksEvent('exam-1', 'ds-1'));
    });

    test('GenerateReportCardsEvent emits [ExamsLoading, ExamOperationSuccess, ClassReportCardsLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ExamOperationSuccess>(),
          isA<ClassReportCardsLoaded>().having((s) => s.reportCards.length, 'length', 1),
        ]),
      );
      bloc.add(const GenerateReportCardsEvent(
        'exam-1',
        'class-1',
        'sec-1',
      ));
    });

    test('LoadClassReportCardsEvent emits [ExamsLoading, ClassReportCardsLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ClassReportCardsLoaded>().having((s) => s.reportCards.first.percentage, 'percentage', 87.5),
        ]),
      );
      bloc.add(const LoadClassReportCardsEvent(
        'exam-1',
        'class-1',
        'sec-1',
      ));
    });

    test('ApproveReportCardsEvent emits [ExamsLoading, ExamOperationSuccess, ClassReportCardsLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ExamOperationSuccess>(),
          isA<ClassReportCardsLoaded>(),
        ]),
      );
      bloc.add(const ApproveReportCardsEvent(
        'exam-1',
        'class-1',
        'sec-1',
      ));
    });

    test('LoadStudentResultEvent emits [ExamsLoading, StudentResultLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<StudentResultLoaded>().having((s) => s.result.reportCard.percentage, 'percentage', 87.5),
        ]),
      );
      bloc.add(const LoadStudentResultEvent('exam-1'));
    });

    test('PublishExamEvent emits [ExamsLoading, ExamOperationSuccess, ExamsLoaded]', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ExamOperationSuccess>(),
          isA<ExamsLoaded>(),
        ]),
      );
      bloc.add(const PublishExamEvent('exam-1', true));
    });

    test('Emits ExamsError when repository throws', () async {
      mockRepo.shouldThrow = true;
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ExamsLoading>(),
          isA<ExamsError>().having((s) => s.message, 'message', contains('Network error')),
        ]),
      );
      bloc.add(const LoadExamsEvent());
    });
  });
}
