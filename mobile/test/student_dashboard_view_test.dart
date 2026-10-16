import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/attendance/bloc/attendance_bloc.dart';
import 'package:mobile/features/attendance/bloc/attendance_state.dart';
import 'package:mobile/features/attendance/models/student_attendance_record_model.dart';
import 'package:mobile/features/attendance/repository/attendance_repository.dart';
import 'package:mobile/features/auth/models/user_model.dart';
import 'package:mobile/features/homework/bloc/homework_bloc.dart';
import 'package:mobile/features/homework/models/homework_model.dart';
import 'package:mobile/features/homework/repository/homework_repository.dart';
import 'package:mobile/features/profiles/bloc/profile_bloc.dart';
import 'package:mobile/features/profiles/bloc/profile_state.dart';
import 'package:mobile/features/profiles/models/student_profile_model.dart';
import 'package:mobile/features/profiles/repository/profile_repository.dart';
import 'package:mobile/features/student/bloc/student_features_bloc.dart';
import 'package:mobile/features/student/bloc/student_features_state.dart';
import 'package:mobile/features/student/models/student_features_model.dart';
import 'package:mobile/features/student/presentation/views/student_dashboard_view.dart';
import 'package:mobile/features/student/repository/student_features_repository.dart';

class StubProfileRepo implements ProfileRepository {
  @override
  DioClient get dioClient => DioClient(storageService: SecureStorageService());

  @override
  Future<StudentProfileModel> getStudentProfile() async => const StudentProfileModel(
        id: 'std-101',
        admissionNumber: 'ADM-2026',
        rollNumber: '14',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'Male',
        dateOfBirth: '2010-04-12',
        admissionDate: '2020-04-01',
        className: 'Grade 10',
        sectionName: 'Section B',
        schoolName: 'Delhi Public International School',
      );

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class StubAttendanceRepo implements AttendanceRepository {
  @override
  DioClient get dioClient => DioClient(storageService: SecureStorageService());

  @override
  Future<List<StudentAttendanceRecordModel>> getStudentAttendanceHistory() async => [
        const StudentAttendanceRecordModel(
          id: 'att-1',
          studentId: 'std-101',
          classId: 'cls-1',
          sectionId: 'sec-1',
          attendanceDate: '2026-10-15',
          status: 'PRESENT',
        ),
        const StudentAttendanceRecordModel(
          id: 'att-2',
          studentId: 'std-101',
          classId: 'cls-1',
          sectionId: 'sec-1',
          attendanceDate: '2026-10-14',
          status: 'PRESENT',
        ),
      ];

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class StubHomeworkRepo implements HomeworkRepository {
  @override
  Future<List<HomeworkModel>> getStudentMyClassHomework() async => [
        const HomeworkModel(
          id: 'hw-1',
          schoolId: 'sch-1',
          classId: 'cls-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          assignedByStaffId: 'stf-1',
          title: 'Math Calculus Exercise 4',
          description: 'Solve problems 1-10',
          assignedDate: '2026-10-14',
          dueDate: '2026-10-20',
          studentStatus: 'PENDING',
        ),
        const HomeworkModel(
          id: 'hw-2',
          schoolId: 'sch-1',
          classId: 'cls-1',
          sectionId: 'sec-1',
          subjectId: 'sub-2',
          assignedByStaffId: 'stf-1',
          title: 'Physics Wave Optics',
          description: 'Read Chapter 5',
          assignedDate: '2026-10-14',
          dueDate: '2026-10-22',
          studentStatus: 'COMPLETED',
        ),
      ];

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class StubStudentFeaturesRepo implements StudentFeaturesRepository {
  List<NoticeModel> testNotices = [
    const NoticeModel(
      id: 'not-1',
      title: 'Annual Sports Meet 2026',
      content: 'Track and field events begin next Monday at 8 AM.',
      targetRole: 'ALL',
      priority: 'URGENT',
      publishedAt: '2026-10-15',
    ),
    const NoticeModel(
      id: 'not-2',
      title: 'Science Exhibition Entry Dates',
      content: 'Submit models to lab in-charge by Friday.',
      targetRole: 'STUDENT',
      priority: 'INFO',
      publishedAt: '2026-10-14',
    ),
  ];

  FeeOverviewModel testFeeOverview = const FeeOverviewModel(
    totalDues: 20000,
    totalPaid: 15000,
    totalOutstanding: 5000,
    fees: [],
  );

  @override
  DioClient get dioClient => DioClient(storageService: SecureStorageService());

  @override
  Future<List<NoticeModel>> getNotices() async => testNotices;

  @override
  Future<FeeOverviewModel> getFeesOverview() async => testFeeOverview;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('StudentDashboardView Widget Tests', () {
    const user = UserModel(
      id: 'usr-1',
      schoolId: 'sch-1',
      identifier: 'STD001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      roles: ['STUDENT'],
      classId: 'cls-1',
      sectionId: 'sec-1',
    );

    late StubProfileRepo profileRepo;
    late StubAttendanceRepo attendanceRepo;
    late StubHomeworkRepo homeworkRepo;
    late StubStudentFeaturesRepo featuresRepo;

    late ProfileBloc profileBloc;
    late AttendanceBloc attendanceBloc;
    late HomeworkBloc homeworkBloc;
    late StudentFeaturesBloc featuresBloc;

    setUp(() {
      profileRepo = StubProfileRepo();
      attendanceRepo = StubAttendanceRepo();
      homeworkRepo = StubHomeworkRepo();
      featuresRepo = StubStudentFeaturesRepo();

      profileBloc = ProfileBloc(repository: profileRepo);
      attendanceBloc = AttendanceBloc(repository: attendanceRepo);
      homeworkBloc = HomeworkBloc(homeworkRepo);
      featuresBloc = StudentFeaturesBloc(repository: featuresRepo);
    });

    tearDown(() {
      profileBloc.close();
      attendanceBloc.close();
      homeworkBloc.close();
      featuresBloc.close();
    });

    Widget createTestWidget({
      void Function(int, {int? academicSubTab, int? servicesSubTab})? onNavigateToTab,
    }) {
      return MaterialApp(
        home: MultiRepositoryProvider(
          providers: [
            RepositoryProvider<StudentFeaturesRepository>.value(value: featuresRepo),
          ],
          child: MultiBlocProvider(
            providers: [
              BlocProvider<ProfileBloc>.value(value: profileBloc),
              BlocProvider<AttendanceBloc>.value(value: attendanceBloc),
              BlocProvider<HomeworkBloc>.value(value: homeworkBloc),
              BlocProvider<StudentFeaturesBloc>.value(value: featuresBloc),
            ],
            child: Scaffold(
              body: StudentDashboardView(
                user: user,
                onNavigateToTab: onNavigateToTab,
              ),
            ),
          ),
        ),
      );
    }

    testWidgets('Renders all 5 layout sections in strictly correct order', (tester) async {
      profileBloc.emit(const StudentProfileLoaded(
        StudentProfileModel(
          id: 'std-101',
          admissionNumber: 'ADM-2026',
          rollNumber: '14',
          firstName: 'Aarav',
          lastName: 'Sharma',
          gender: 'Male',
          dateOfBirth: '2010-04-12',
          admissionDate: '2020-04-01',
          className: 'Grade 10',
          sectionName: 'Section B',
          schoolName: 'Delhi Public International School',
        ),
      ));

      attendanceBloc.emit(const StudentAttendanceHistoryLoaded([
        StudentAttendanceRecordModel(
          id: 'att-1',
          studentId: 'std-101',
          classId: 'cls-1',
          sectionId: 'sec-1',
          attendanceDate: '2026-10-15',
          status: 'PRESENT',
        ),
      ]));

      homeworkBloc.emit(const StudentHomeworkLoaded([
        HomeworkModel(
          id: 'hw-1',
          schoolId: 'sch-1',
          classId: 'cls-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          assignedByStaffId: 'stf-1',
          title: 'Math Calculus Exercise 4',
          description: 'Solve problems 1-10',
          assignedDate: '2026-10-14',
          dueDate: '2026-10-20',
          studentStatus: 'PENDING',
        ),
      ]));

      featuresBloc.emit(StudentNoticesLoaded(featuresRepo.testNotices));

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // 1. Top Header Card
      expect(find.text('DELHI PUBLIC INTERNATIONAL SCHOOL'), findsOneWidget);
      expect(find.text('Aarav Sharma'), findsOneWidget);
      expect(find.text('Grade 10 • Section B • Roll #14'), findsOneWidget);

      // 2. Overview Section
      expect(find.text('Attendance'), findsOneWidget);
      expect(find.text('100.0%'), findsOneWidget);
      expect(find.text('Good'), findsOneWidget); // Green trend badge
      expect(find.text('Tasks & Dues'), findsOneWidget);
      expect(find.text('1 Pending'), findsOneWidget);

      // 3. Notices & Circulars Section
      expect(find.text('Notices & Circulars'), findsOneWidget);
      expect(find.text('View All'), findsOneWidget);
      expect(find.text('Annual Sports Meet 2026'), findsOneWidget);
      expect(find.text('Science Exhibition Entry Dates'), findsOneWidget);

      // 4. Quick Links Grid
      expect(find.text('Quick Links'), findsOneWidget);
      expect(find.text('Fee'), findsOneWidget);
      expect(find.text('Exams/Results'), findsOneWidget);
      expect(find.text('Timetable'), findsOneWidget);
      expect(find.text('Study Materials'), findsOneWidget);
      expect(find.text('Leaves'), findsOneWidget);

      // 5. Footer
      expect(find.text('Powered by School ERP SaaS'), findsOneWidget);

      // Verify strict vertical ordering top-to-bottom
      final headerTop = tester.getTopLeft(find.text('DELHI PUBLIC INTERNATIONAL SCHOOL')).dy;
      final overviewTop = tester.getTopLeft(find.text('Attendance')).dy;
      final noticesTop = tester.getTopLeft(find.text('Notices & Circulars')).dy;
      final quickLinksTop = tester.getTopLeft(find.text('Quick Links')).dy;
      final footerTop = tester.getTopLeft(find.text('Powered by School ERP SaaS')).dy;

      expect(headerTop < overviewTop, isTrue, reason: 'Header must be above Overview');
      expect(overviewTop < noticesTop, isTrue, reason: 'Overview must be above Notices');
      expect(noticesTop < quickLinksTop, isTrue, reason: 'Notices must be above Quick Links');
      expect(quickLinksTop < footerTop, isTrue, reason: 'Quick Links must be above Footer');
    });

    testWidgets('Quick Links safely trigger callbacks without errors', (tester) async {
      int? tappedTab;
      int? tappedAcademicSub;
      int? tappedServicesSub;

      await tester.pumpWidget(createTestWidget(
        onNavigateToTab: (tab, {academicSubTab, servicesSubTab}) {
          tappedTab = tab;
          tappedAcademicSub = academicSubTab;
          tappedServicesSub = servicesSubTab;
        },
      ));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Tap 'Fee'
      await tester.ensureVisible(find.text('Fee'));
      await tester.tap(find.text('Fee'));
      await tester.pump();
      expect(tappedTab, equals(3));

      // Tap 'Exams/Results'
      await tester.ensureVisible(find.text('Exams/Results'));
      await tester.tap(find.text('Exams/Results'));
      await tester.pump();
      expect(tappedTab, equals(2));
      expect(tappedAcademicSub, equals(6));

      // Tap 'Timetable'
      await tester.ensureVisible(find.text('Timetable'));
      await tester.tap(find.text('Timetable'));
      await tester.pump();
      expect(tappedTab, equals(2));
      expect(tappedAcademicSub, equals(7));

      // Tap 'Study Materials'
      await tester.ensureVisible(find.text('Study Materials'));
      await tester.tap(find.text('Study Materials'));
      await tester.pump();
      expect(tappedTab, equals(2));
      expect(tappedAcademicSub, equals(1));

      // Tap 'Leaves'
      await tester.ensureVisible(find.text('Leaves'));
      await tester.tap(find.text('Leaves'));
      await tester.pump();
      expect(tappedTab, equals(4));
      expect(tappedServicesSub, equals(1));

      // Tap 'View All' on notices
      await tester.ensureVisible(find.text('View All'));
      await tester.tap(find.text('View All'));
      await tester.pump();
      expect(tappedTab, equals(4));
      expect(tappedServicesSub, equals(2));
    });

    testWidgets('Tapping a notice opens detail dialog modal', (tester) async {
      featuresBloc.emit(StudentNoticesLoaded(featuresRepo.testNotices));

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Annual Sports Meet 2026'), findsOneWidget);
      await tester.ensureVisible(find.text('Annual Sports Meet 2026'));
      await tester.tap(find.text('Annual Sports Meet 2026'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsOneWidget);
      expect(find.descendant(
        of: find.byType(AlertDialog),
        matching: find.text('Track and field events begin next Monday at 8 AM.'),
      ), findsOneWidget);
      expect(find.text('Close'), findsOneWidget);

      await tester.tap(find.text('Close'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsNothing);
    });

    testWidgets('Fallback navigation without onNavigateToTab does not throw error', (tester) async {
      await tester.pumpWidget(createTestWidget(onNavigateToTab: null));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Tapping Fee should push route safely without throwing any null or click error
      await tester.ensureVisible(find.text('Fee'));
      await tester.tap(find.text('Fee'));
      await tester.pump();
      expect(tester.takeException(), isNull);
    });
  });
}
