import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/features/auth/bloc/auth_bloc.dart';
import 'package:mobile/features/auth/repositories/auth_repository.dart';
import 'package:mobile/features/curriculum/bloc/curriculum_bloc.dart';
import 'package:mobile/features/curriculum/presentation/curriculum_view.dart';
import 'package:mobile/features/homework/bloc/homework_bloc.dart';
import 'package:mobile/features/homework/presentation/student_homework_view.dart';
import 'package:mobile/features/materials/bloc/materials_bloc.dart';
import 'package:mobile/features/materials/presentation/academic_materials_view.dart';

import 'curriculum_bloc_test.dart';
import 'homework_bloc_test.dart';
import 'materials_bloc_test.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockAuthRepo;
  late AuthBloc authBloc;

  setUp(() {
    mockAuthRepo = MockAuthRepository();
    authBloc = AuthBloc(authRepository: mockAuthRepo);
  });

  tearDown(() {
    authBloc.close();
  });

  group('Milestone 5 Views Widget Tests', () {
    testWidgets('StudentHomeworkView renders homework cards and completion status',
        (tester) async {
      final mockHomeworkRepo = MockHomeworkRepository();
      final homeworkBloc = HomeworkBloc(mockHomeworkRepo);

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<HomeworkBloc>.value(
            value: homeworkBloc,
            child: const StudentHomeworkView(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('My Homework & Assignments'), findsOneWidget);
      expect(find.text('Algebra Exercise 4.2'), findsOneWidget);
      expect(find.text('Solve problems 1 through 10'), findsOneWidget);
      expect(find.text('Due: 2026-10-15'), findsOneWidget);
      expect(find.text('Pending'), findsOneWidget);
      expect(find.text('Mark Completed'), findsOneWidget);

      homeworkBloc.close();
    });

    testWidgets('CurriculumView renders unit numbers, titles, and topics',
        (tester) async {
      final mockCurriculumRepo = MockCurriculumRepository();
      final curriculumBloc = CurriculumBloc(mockCurriculumRepo);

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<CurriculumBloc>.value(
            value: curriculumBloc,
            child: const CurriculumView(
              classId: 'cls-1',
              subjectId: 'sub-1',
              subjectName: 'Mathematics',
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Mathematics Syllabus & Curriculum'), findsOneWidget);
      expect(find.text('Unit 1: Real Numbers'), findsOneWidget);
      expect(find.text('Fundamental theorem of arithmetic'), findsOneWidget);
      expect(find.text('Euclid Division Lemma'), findsOneWidget);

      curriculumBloc.close();
    });

    testWidgets('AcademicMaterialsView renders material title, uploader, and download action',
        (tester) async {
      final mockMaterialsRepo = MockMaterialsRepository();
      final materialsBloc = MaterialsBloc(mockMaterialsRepo);

      await tester.pumpWidget(
        MaterialApp(
          home: MultiBlocProvider(
            providers: [
              BlocProvider<AuthBloc>.value(value: authBloc),
              BlocProvider<MaterialsBloc>.value(value: materialsBloc),
            ],
            child: const AcademicMaterialsView(
              classId: 'cls-1',
              subjectId: 'sub-1',
              subjectName: 'Mathematics',
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Mathematics Study Materials'), findsOneWidget);
      expect(find.text('Formula Sheet - Trigonometry'), findsOneWidget);
      expect(find.text('trig.pdf'), findsOneWidget);
      expect(find.text('200.0 KB'), findsOneWidget);
      expect(find.byIcon(Icons.download_outlined), findsOneWidget);

      materialsBloc.close();
    });
  });
}
