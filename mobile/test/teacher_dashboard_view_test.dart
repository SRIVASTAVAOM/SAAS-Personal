import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/academics/models/teacher_allocation_model.dart';
import 'package:mobile/features/auth/models/user_model.dart';
import 'package:mobile/features/homework/bloc/homework_bloc.dart';
import 'package:mobile/features/homework/models/homework_model.dart';
import 'package:mobile/features/homework/repository/homework_repository.dart';
import 'package:mobile/features/leaves/bloc/leaves_bloc.dart';
import 'package:mobile/features/leaves/bloc/leaves_state.dart';
import 'package:mobile/features/leaves/models/student_leave_model.dart';
import 'package:mobile/features/leaves/repository/leaves_repository.dart';
import 'package:mobile/features/profiles/bloc/profile_bloc.dart';
import 'package:mobile/features/profiles/bloc/profile_state.dart';
import 'package:mobile/features/profiles/models/staff_profile_model.dart';
import 'package:mobile/features/profiles/repository/profile_repository.dart';
import 'package:mobile/features/teacher/presentation/views/teacher_dashboard_view.dart';

class StubProfileRepo implements ProfileRepository {
  @override
  DioClient get dioClient => DioClient(storageService: SecureStorageService());

  @override
  Future<StaffProfileModel> getStaffProfile() async => const StaffProfileModel(
        id: 'stf-101',
        employeeCode: 'EMP-001',
        firstName: 'Meenakshi',
        lastName: 'Sundaram',
        gender: 'Female',
        dateOfBirth: '1985-05-15',
        joiningDate: '2015-08-01',
        allocations: [],
        designation: 'Senior PGT Mathematics',
        schoolName: 'Delhi Public International School',
        menuConfig: {
          'teacher_menus': {
            'substitutions': {'enabled': false},
            'homework': {'label': 'Assignments & Tasks'},
          },
          'company_footer': 'Powered by School ERP SaaS',
        },
      );

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class StubHomeworkRepo implements HomeworkRepository {
  @override
  Future<List<HomeworkModel>> getTeacherMyAssignedHomework() async => [
        const HomeworkModel(
          id: 'hw-1',
          schoolId: 'sch-1',
          classId: 'cls-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          assignedByStaffId: 'stf-101',
          title: 'Math Calculus Exercise 4',
          description: 'Solve problems 1-10',
          assignedDate: '2026-10-14',
          dueDate: '2026-10-20',
        ),
      ];

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class StubLeavesRepo implements LeavesRepository {
  @override
  DioClient get dioClient => DioClient(storageService: SecureStorageService());

  @override
  Future<List<StudentLeaveModel>> getClassStudentLeaves() async => [
        const StudentLeaveModel(
          id: 'sl-1',
          studentId: 'std-1',
          studentName: 'Aarav Sharma',
          className: 'Grade 10',
          sectionName: 'Section B',
          startDate: '2026-10-18',
          endDate: '2026-10-19',
          reason: 'Viral Fever',
          status: 'PENDING',
        ),
      ];

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('TeacherDashboardView Widget Tests', () {
    const user = UserModel(
      id: 'usr-2',
      schoolId: 'sch-1',
      identifier: 'EMP001',
      firstName: 'Meenakshi',
      lastName: 'Sundaram',
      roles: ['TEACHER'],
    );

    const allocations = TeacherAllocationsResponse(
      allocations: [
        TeacherAllocationItem(
          id: 'alloc-1',
          classId: 'cls-1',
          className: 'Class 10',
          sectionId: 'sec-1',
          sectionName: 'A',
          subjectId: 'sub-1',
          subjectName: 'Mathematics',
          subjectCode: 'MTH101',
        ),
      ],
      homeroom: HomeroomInfo(
        id: 'hr-1',
        classId: 'cls-1',
        className: 'Class 10',
        sectionId: 'sec-1',
        sectionName: 'A',
      ),
    );

    late StubProfileRepo profileRepo;
    late StubHomeworkRepo homeworkRepo;
    late StubLeavesRepo leavesRepo;

    late ProfileBloc profileBloc;
    late HomeworkBloc homeworkBloc;
    late LeavesBloc leavesBloc;

    setUp(() {
      profileRepo = StubProfileRepo();
      homeworkRepo = StubHomeworkRepo();
      leavesRepo = StubLeavesRepo();

      profileBloc = ProfileBloc(repository: profileRepo);
      homeworkBloc = HomeworkBloc(homeworkRepo);
      leavesBloc = LeavesBloc(repository: leavesRepo);
    });

    Widget createTestWidget({
      void Function(int tabIndex,
              {int? attendanceSubTab, int? classesSubTab, int? leavesSubTab})?
          onNavigateToTab,
    }) {
      return MaterialApp(
        theme: ThemeData.light(),
        home: MultiBlocProvider(
          providers: [
            BlocProvider<ProfileBloc>.value(value: profileBloc),
            BlocProvider<HomeworkBloc>.value(value: homeworkBloc),
            BlocProvider<LeavesBloc>.value(value: leavesBloc),
          ],
          child: TeacherDashboardView(
            user: user,
            allocations: allocations,
            onNavigateToTab: onNavigateToTab,
          ),
        ),
      );
    }

    testWidgets('Renders all 5 layout sections in strictly correct order', (tester) async {
      profileBloc.emit(const StaffProfileLoaded(
        StaffProfileModel(
          id: 'stf-101',
          employeeCode: 'EMP-001',
          firstName: 'Meenakshi',
          lastName: 'Sundaram',
          gender: 'Female',
          dateOfBirth: '1985-05-15',
          joiningDate: '2015-08-01',
          allocations: [],
          designation: 'Senior PGT Mathematics',
          schoolName: 'Delhi Public International School',
          menuConfig: {
            'teacher_menus': {
              'substitutions': {'enabled': false},
              'homework': {'label': 'Assignments & Tasks'},
            },
            'company_footer': 'Powered by School ERP SaaS',
          },
        ),
      ));

      leavesBloc.emit(const ClassStudentLeavesLoaded([
        StudentLeaveModel(
          id: 'sl-1',
          studentId: 'std-1',
          studentName: 'Aarav Sharma',
          className: 'Grade 10',
          sectionName: 'Section B',
          startDate: '2026-10-18',
          endDate: '2026-10-19',
          reason: 'Viral Fever',
          status: 'PENDING',
        ),
      ]));

      homeworkBloc.emit(const TeacherHomeworkLoaded([
        HomeworkModel(
          id: 'hw-1',
          schoolId: 'sch-1',
          classId: 'cls-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          assignedByStaffId: 'stf-101',
          title: 'Math Calculus Exercise 4',
          description: 'Solve problems 1-10',
          assignedDate: '2026-10-14',
          dueDate: '2026-10-20',
        ),
      ]));

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // 1. Top Header Card
      expect(find.text('DELHI PUBLIC INTERNATIONAL SCHOOL'), findsOneWidget);
      expect(find.text('2026-2027'), findsOneWidget);
      expect(find.text('Meenakshi Sundaram'), findsOneWidget);
      expect(find.text('Senior PGT Mathematics'), findsOneWidget);
      expect(find.text('Class Teacher: Class 10 A'), findsOneWidget);

      // 2. Overview Section
      expect(find.text('Overview'), findsOneWidget);
      expect(find.text('My Attendance & Classes'), findsOneWidget);
      expect(find.text('Present'), findsOneWidget);
      expect(find.text('On Duty'), findsOneWidget);
      expect(find.text('1 Assigned Classes'), findsOneWidget);
      expect(find.text('Pending Actions'), findsOneWidget);
      expect(find.text('1 Pending'), findsOneWidget);
      expect(find.text('1 Active Homework'), findsOneWidget);

      // 3. Notices & Circulars Section
      expect(find.text('Notices & Circulars'), findsOneWidget);
      expect(find.text('View All'), findsOneWidget);
      expect(find.text('No active circulars'), findsOneWidget);

      // 4. Quick Links Grid
      expect(find.text('Quick Links'), findsOneWidget);
      expect(find.text('Mark Attendance'), findsOneWidget);
      expect(find.text('My Attendance'), findsOneWidget);
      expect(find.text('Student Roster'), findsOneWidget);
      expect(find.text('Assignments & Tasks'), findsOneWidget); // Overridden label from menu_config
      expect(find.text('Substitutions'), findsNothing); // Disabled in menu_config!
      expect(find.text('Student Leave Requests'), findsOneWidget);

      // 5. Footer
      expect(find.text('Powered by School ERP SaaS'), findsOneWidget);

      // Verify strict vertical ordering top-to-bottom
      final headerTop = tester.getTopLeft(find.text('DELHI PUBLIC INTERNATIONAL SCHOOL')).dy;
      final overviewTop = tester.getTopLeft(find.text('Overview')).dy;
      final noticesTop = tester.getTopLeft(find.text('Notices & Circulars')).dy;
      final quickLinksTop = tester.getTopLeft(find.text('Quick Links')).dy;
      final footerTop = tester.getTopLeft(find.text('Powered by School ERP SaaS')).dy;

      expect(headerTop < overviewTop, isTrue, reason: 'Header must be above Overview');
      expect(overviewTop < noticesTop, isTrue, reason: 'Overview must be above Notices');
      expect(noticesTop < quickLinksTop, isTrue, reason: 'Notices must be above Quick Links');
      expect(quickLinksTop < footerTop, isTrue, reason: 'Quick Links must be above Footer');
    });

    testWidgets('Quick Links safely trigger navigation callbacks with correct tab indices',
        (tester) async {
      int? tappedTab;
      int? tappedAttendanceSub;
      int? tappedClassesSub;
      int? tappedLeavesSub;

      await tester.pumpWidget(createTestWidget(
        onNavigateToTab: (tab, {attendanceSubTab, classesSubTab, leavesSubTab}) {
          tappedTab = tab;
          tappedAttendanceSub = attendanceSubTab;
          tappedClassesSub = classesSubTab;
          tappedLeavesSub = leavesSubTab;
        },
      ));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Tap Mark Attendance -> tab 1, subtab 0
      await tester.ensureVisible(find.text('Mark Attendance'));
      await tester.tap(find.text('Mark Attendance'));
      await tester.pump();
      expect(tappedTab, equals(1));
      expect(tappedAttendanceSub, equals(0));

      // Tap Student Roster -> tab 2, classesSubTab 0
      await tester.ensureVisible(find.text('Student Roster'));
      await tester.tap(find.text('Student Roster'));
      await tester.pump();
      expect(tappedTab, equals(2));
      expect(tappedClassesSub, equals(0));

      // Tap Student Leave Requests -> tab 3, leavesSubTab 1
      await tester.ensureVisible(find.text('Student Leave Requests'));
      await tester.tap(find.text('Student Leave Requests'));
      await tester.pump();
      expect(tappedTab, equals(3));
      expect(tappedLeavesSub, equals(1));
    });

    testWidgets('Tapping Add Menu opens Customize Quick Links bottom sheet for teachers',
        (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.byKey(const Key('add_menu_tile')), findsOneWidget);
      await tester.ensureVisible(find.byKey(const Key('add_menu_tile')));
      await tester.tap(find.byKey(const Key('add_menu_tile')));
      await tester.pumpAndSettle();

      expect(find.text('Customize Quick Links'), findsOneWidget);
      expect(find.text('Save Quick Links'), findsOneWidget);
      expect(find.text('Reset Default'), findsOneWidget);

      await tester.tap(find.text('Save Quick Links'));
      await tester.pumpAndSettle();

      expect(find.text('Customize Quick Links'), findsNothing);
    });
  });
}
