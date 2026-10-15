import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/academics/bloc/exams_bloc.dart';
import 'package:mobile/features/academics/repositories/exams_repository.dart';
import 'package:mobile/features/academics/views/class_report_cards_view.dart';
import 'package:mobile/features/academics/views/coordinator_marks_review_view.dart';
import 'package:mobile/features/academics/views/exam_datesheet_view.dart';
import 'package:mobile/features/academics/views/exams_list_view.dart';
import 'package:mobile/features/academics/views/student_result_view.dart';
import 'package:mobile/features/academics/views/teacher_marks_entry_view.dart';

import 'exams_bloc_test.dart';

void main() {
  late MockExamsRepository mockRepo;

  setUp(() {
    mockRepo = MockExamsRepository();
  });

  Widget buildTestableWidget({
    required Widget child,
    required ExamsBloc bloc,
  }) {
    return RepositoryProvider<ExamsRepository>.value(
      value: mockRepo,
      child: BlocProvider<ExamsBloc>.value(
        value: bloc,
        child: MaterialApp(
          home: Scaffold(body: child),
        ),
      ),
    );
  }

  group('Milestone 6 Views Widget Tests', () {
    testWidgets('ExamDatesheetView renders subject datesheets and details', (tester) async {
      final bloc = ExamsBloc(repository: mockRepo);

      await tester.pumpWidget(
        buildTestableWidget(
          child: const ExamDatesheetView(
            examId: 'exam-1',
            examName: 'Mid-Term Examinations 2026',
            classId: 'class-1',
          ),
          bloc: bloc,
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Mid-Term Examinations 2026 Schedule'), findsOneWidget);
      expect(find.text('Mathematics'), findsOneWidget);
      expect(find.text('2026-10-16'), findsOneWidget);
      expect(find.text('Max: 100 marks'), findsOneWidget);
      expect(find.text('Passing: 33 marks'), findsOneWidget);

      bloc.close();
    });

    testWidgets('TeacherMarksEntryView renders student roster and marks input fields', (tester) async {
      final bloc = ExamsBloc(repository: mockRepo);

      await tester.pumpWidget(
        buildTestableWidget(
          child: const TeacherMarksEntryView(
            examId: 'exam-1',
            datesheetId: 'ds-1',
            sectionId: 'sec-1',
          ),
          bloc: bloc,
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Marks Entry'), findsOneWidget);
      expect(find.text('Aarav Sharma'), findsOneWidget);
      expect(find.text('Adm: ADM101'), findsOneWidget);
      expect(find.text('Save Draft'), findsOneWidget);
      expect(find.text('Submit for Verification'), findsOneWidget);

      bloc.close();
    });

    testWidgets('CoordinatorMarksReviewView renders datesheet summary statistics and verify action', (tester) async {
      final bloc = ExamsBloc(repository: mockRepo);

      await tester.pumpWidget(
        buildTestableWidget(
          child: const CoordinatorMarksReviewView(
            examId: 'exam-1',
            datesheetId: 'ds-1',
          ),
          bloc: bloc,
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Marks Verification & Review'), findsOneWidget);
      expect(find.text('Mathematics'), findsOneWidget);
      expect(find.text('30'), findsOneWidget); // total students
      expect(find.text('28'), findsOneWidget); // entered count
      expect(find.text('Verify Marks as Coordinator'), findsOneWidget);

      bloc.close();
    });

    testWidgets('ClassReportCardsView renders report cards and approval button for coordinator', (tester) async {
      final bloc = ExamsBloc(repository: mockRepo);

      await tester.pumpWidget(
        buildTestableWidget(
          child: const ClassReportCardsView(
            examId: 'exam-1',
            examName: 'Mid-Term Examinations 2026',
            classId: 'class-1',
            sectionId: 'sec-1',
            isCoordinator: true,
          ),
          bloc: bloc,
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Mid-Term Examinations 2026 - Report Cards'), findsOneWidget);
      expect(find.text('Aarav Sharma'), findsOneWidget);
      expect(find.text('87.5%'), findsOneWidget);
      expect(find.text('Approve All'), findsOneWidget);

      bloc.close();
    });

    testWidgets('StudentResultView renders overall percentage and subject marks breakdown', (tester) async {
      final bloc = ExamsBloc(repository: mockRepo);

      await tester.pumpWidget(
        buildTestableWidget(
          child: const StudentResultView(
            examId: 'exam-1',
            examName: 'Mid-Term Examinations 2026',
          ),
          bloc: bloc,
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Mid-Term Examinations 2026 Result'), findsOneWidget);
      expect(find.text('87.5%'), findsOneWidget);
      expect(find.text('175.0 / 200'), findsOneWidget);
      expect(find.text('Mathematics'), findsOneWidget);
      expect(find.text('88.0 / 100'), findsOneWidget);

      bloc.close();
    });

    testWidgets('ExamsListView renders exam cards with role-based navigation actions', (tester) async {
      final bloc = ExamsBloc(repository: mockRepo);

      await tester.pumpWidget(
        buildTestableWidget(
          child: const ExamsListView(
            userRole: 'TEACHER',
            classId: 'class-1',
            sectionId: 'sec-1',
          ),
          bloc: bloc,
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Mid-Term Examinations 2026'), findsOneWidget);
      expect(find.text('Marks Entry'), findsOneWidget);
      expect(find.text('Report Cards'), findsOneWidget);

      bloc.close();
    });
  });
}
