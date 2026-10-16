import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/core/widgets/document_picker_bottom_sheet.dart';
import 'package:mobile/features/academics/bloc/academics_bloc.dart';
import 'package:mobile/features/auth/bloc/auth_bloc.dart';
import 'package:mobile/features/auth/bloc/auth_state.dart';
import 'package:mobile/features/auth/models/user_model.dart';
import 'package:mobile/features/auth/repositories/auth_repository.dart';
import 'package:mobile/features/homework/bloc/homework_bloc.dart';
import 'package:mobile/features/homework/presentation/teacher_homework_manage_view.dart';
import 'package:mobile/features/leaves/bloc/leaves_bloc.dart';
import 'package:mobile/features/leaves/presentation/teacher_leave_view.dart';
import 'package:mobile/features/materials/bloc/materials_bloc.dart';
import 'package:mobile/features/materials/presentation/academic_materials_view.dart';
import 'academics_bloc_test.dart';
import 'homework_bloc_test.dart';
import 'leaves_bloc_test.dart';
import 'materials_bloc_test.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  group('Teacher & Academic Materials Camera/Gallery Upload Tests', () {
    testWidgets('TeacherLeaveView apply dialog renders document picker with Camera & Gallery options',
        (tester) async {
      tester.view.physicalSize = const Size(1200, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final mockLeavesRepo = MockLeavesRepository();
      final leavesBloc = LeavesBloc(repository: mockLeavesRepo);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BlocProvider<LeavesBloc>.value(
              value: leavesBloc,
              child: const TeacherLeaveView(),
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Open Apply Leave Dialog
      expect(find.text('Apply Leave'), findsOneWidget);
      await tester.tap(find.text('Apply Leave'));
      await tester.pumpAndSettle();

      // Verify dialog is open and has Attach Document button
      expect(find.text('Apply Staff Leave'), findsOneWidget);
      expect(find.text('Supporting Document (Optional)'), findsOneWidget);
      expect(find.text('Attach Document (Optional)'), findsOneWidget);

      // Tap Attach Document button to trigger DocumentPickerBottomSheet
      await tester.tap(find.text('Attach Document (Optional)'));
      await tester.pumpAndSettle();

      // Verify the 2 required options are displayed
      expect(find.byKey(const Key('doc_picker_device_option')), findsOneWidget);
      expect(find.byKey(const Key('doc_picker_camera_option')), findsOneWidget);
      expect(find.text('Device / Gallery se Chunein (Files & Gallery)'), findsOneWidget);
      expect(find.text('Camera se Photo Kheenche (Take Photo)'), findsOneWidget);

      // Close bottom sheet via its specific Cancel button
      final bottomSheetCancelFinder = find.descendant(
        of: find.byType(DocumentPickerBottomSheet),
        matching: find.text('Cancel'),
      );
      expect(bottomSheetCancelFinder, findsOneWidget);
      await tester.tap(bottomSheetCancelFinder);
      await tester.pumpAndSettle();

      leavesBloc.close();
    });

    testWidgets('TeacherHomeworkManageView create homework sheet renders Camera & Gallery upload options',
        (tester) async {
      tester.view.physicalSize = const Size(1200, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final mockHomeworkRepo = MockHomeworkRepository();
      final homeworkBloc = HomeworkBloc(mockHomeworkRepo);
      final academicsBloc = AcademicsBloc(repository: MockAcademicsRepository());

      await tester.pumpWidget(
        MaterialApp(
          home: MultiBlocProvider(
            providers: [
              BlocProvider<HomeworkBloc>.value(value: homeworkBloc),
              BlocProvider<AcademicsBloc>.value(value: academicsBloc),
            ],
            child: const Scaffold(
              body: TeacherHomeworkManageView(
                classId: 'cls-1',
                sectionId: 'sec-1',
                subjectId: 'sub-1',
              ),
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Tap FAB to open Assign Homework sheet
      expect(find.byKey(const Key('assign_homework_fab')), findsOneWidget);
      await tester.tap(find.byKey(const Key('assign_homework_fab')));
      await tester.pumpAndSettle();

      // Verify attachment section is present in sheet
      expect(find.text('Assign New Homework'), findsOneWidget);
      expect(find.text('Assignment Document / Photo (Optional)'), findsOneWidget);
      expect(find.byKey(const Key('create_hw_attach_btn')), findsOneWidget);

      // Tap attachment button
      await tester.tap(find.byKey(const Key('create_hw_attach_btn')));
      await tester.pumpAndSettle();

      // Verify the 2 required options are displayed
      expect(find.byKey(const Key('doc_picker_device_option')), findsOneWidget);
      expect(find.byKey(const Key('doc_picker_camera_option')), findsOneWidget);
      expect(find.text('Device / Gallery se Chunein (Files & Gallery)'), findsOneWidget);
      expect(find.text('Camera se Photo Kheenche (Take Photo)'), findsOneWidget);

      // Close bottom sheet
      final bottomSheetCancelFinder = find.descendant(
        of: find.byType(DocumentPickerBottomSheet),
        matching: find.text('Cancel'),
      );
      expect(bottomSheetCancelFinder, findsOneWidget);
      await tester.tap(bottomSheetCancelFinder);
      await tester.pumpAndSettle();

      homeworkBloc.close();
      academicsBloc.close();
    });

    testWidgets('AcademicMaterialsView upload dialog opens DocumentPickerBottomSheet with Camera & Gallery',
        (tester) async {
      tester.view.physicalSize = const Size(1200, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final mockMaterialsRepo = MockMaterialsRepository();
      final materialsBloc = MaterialsBloc(mockMaterialsRepo);

      final mockAuthRepo = MockAuthRepository();
      final authBloc = AuthBloc(authRepository: mockAuthRepo);
      authBloc.emit(
        const Authenticated(
          user: UserModel(
            id: 'teacher-1',
            schoolId: 'school-1',
            identifier: 'teacher1',
            roles: ['TEACHER'],
            firstName: 'Teacher',
            lastName: 'Sharma',
          ),
          activeRole: 'TEACHER',
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: MultiBlocProvider(
            providers: [
              BlocProvider<AuthBloc>.value(value: authBloc),
              BlocProvider<MaterialsBloc>.value(value: materialsBloc),
            ],
            child: const Scaffold(
              body: AcademicMaterialsView(
                classId: 'cls-1',
                subjectId: 'sub-1',
                subjectName: 'Physics',
              ),
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Tap FAB to open Upload Material Dialog
      expect(find.byKey(const Key('upload_material_fab')), findsOneWidget);
      await tester.tap(find.byKey(const Key('upload_material_fab')));
      await tester.pumpAndSettle();

      // Verify dialog is open and has picker button
      expect(find.text('Upload Study Material'), findsOneWidget);
      expect(find.byKey(const Key('material_pick_file_btn')), findsOneWidget);
      expect(find.text('Device / Camera se File Chunein'), findsOneWidget);

      // Tap picker button
      await tester.tap(find.byKey(const Key('material_pick_file_btn')));
      await tester.pumpAndSettle();

      // Verify both options are shown
      expect(find.byKey(const Key('doc_picker_device_option')), findsOneWidget);
      expect(find.byKey(const Key('doc_picker_camera_option')), findsOneWidget);
      expect(find.text('Device / Gallery se Chunein (Files & Gallery)'), findsOneWidget);
      expect(find.text('Camera se Photo Kheenche (Take Photo)'), findsOneWidget);

      // Close bottom sheet
      final bottomSheetCancelFinder = find.descendant(
        of: find.byType(DocumentPickerBottomSheet),
        matching: find.text('Cancel'),
      );
      expect(bottomSheetCancelFinder, findsOneWidget);
      await tester.tap(bottomSheetCancelFinder);
      await tester.pumpAndSettle();

      materialsBloc.close();
      authBloc.close();
    });
  });
}
