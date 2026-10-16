import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/attendance/bloc/attendance_bloc.dart';
import 'package:mobile/features/attendance/bloc/attendance_state.dart';
import 'package:mobile/features/attendance/models/staff_attendance_record_model.dart';
import 'package:mobile/features/attendance/models/student_attendance_record_model.dart';
import 'package:mobile/features/attendance/presentation/coordinator_staff_attendance_view.dart';
import 'package:mobile/features/attendance/presentation/student_attendance_history_view.dart';
import 'package:mobile/features/attendance/presentation/teacher_own_attendance_view.dart';
import 'package:mobile/features/attendance/presentation/management_staff_attendance_view.dart';
import 'package:mobile/features/attendance/repository/attendance_repository.dart';
import 'package:mobile/features/leaves/bloc/leaves_bloc.dart';
import 'package:mobile/features/leaves/bloc/leaves_state.dart';
import 'package:mobile/features/leaves/models/staff_leave_model.dart';
import 'package:mobile/features/leaves/models/student_leave_model.dart';
import 'package:mobile/features/leaves/presentation/coordinator_leave_review_view.dart';
import 'package:mobile/features/leaves/presentation/management_leave_approval_view.dart';
import 'package:mobile/features/leaves/repository/leaves_repository.dart';

class StubAttendanceRepository implements AttendanceRepository {
  List<StaffAttendanceRecordModel> managementStaffList;

  StubAttendanceRepository({this.managementStaffList = const []});

  @override
  DioClient get dioClient =>
      DioClient(storageService: SecureStorageService());

  @override
  Future<List<StudentAttendanceRecordModel>> getStudentAttendanceHistory() async => [];
  @override
  Future<List<StudentAttendanceRecordModel>> getClassAttendance(String c, String s, {String? date}) async => [];
  @override
  Future<void> markStudentAttendance({required String classId, required String sectionId, required String attendanceDate, required List<Map<String, dynamic>> records}) async {}
  @override
  Future<List<StaffAttendanceRecordModel>> getStaffAttendanceHistory() async => [];
  @override
  Future<List<StaffAttendanceRecordModel>> getWingStaffAttendance(String w, {String? date}) async => [];
  @override
  Future<List<StaffAttendanceRecordModel>> getManagementStaffAttendanceOverview({String? date, String? wingId}) async => managementStaffList;
  @override
  Future<void> markStaffAttendance({required String date, required List<Map<String, dynamic>> records}) async {}
}

class StubLeavesRepository implements LeavesRepository {
  @override
  DioClient get dioClient =>
      DioClient(storageService: SecureStorageService());

  @override
  Future<StaffLeaveModel> applyStaffLeave({
    required String startDate,
    required String endDate,
    required String leaveType,
    required String reason,
    String? documentUrl,
    String? attachmentName,
  }) async =>
      StaffLeaveModel(
        id: '1',
        staffId: '1',
        startDate: startDate,
        endDate: endDate,
        leaveType: leaveType,
        reason: reason,
        documentUrl: documentUrl,
        attachmentName: attachmentName,
        status: 'PENDING',
      );
  @override
  Future<List<StaffLeaveModel>> getStaffMyLeaves() async => [];
  @override
  Future<List<StaffLeaveModel>> getStaffWingLeaves() async => [];
  @override
  Future<void> recommendStaffLeave(String l, {String? note}) async {}
  @override
  Future<List<StaffLeaveModel>> getManagementLeaveQueue() async => [];
  @override
  Future<void> decideStaffLeave(String l, {required String decision, String? note, String? rejectionReason}) async {}
  @override
  Future<StudentLeaveModel> applyStudentLeave({
    required String startDate,
    required String endDate,
    required String reason,
    String? documentUrl,
    String? attachmentName,
  }) async =>
      StudentLeaveModel(id: '1', studentId: '1', startDate: startDate, endDate: endDate, reason: reason, documentUrl: documentUrl, attachmentName: attachmentName, status: 'PENDING');
  @override
  Future<List<StudentLeaveModel>> getStudentMyLeaves() async => [];
  @override
  Future<List<StudentLeaveModel>> getClassStudentLeaves() async => [];
  @override
  Future<void> updateStudentLeaveStatus(String leaveId, {required String status, String? remarks}) async {}
}


class FakeAttendanceBloc extends AttendanceBloc {
  FakeAttendanceBloc(AttendanceState initialState)
      : super(repository: StubAttendanceRepository()) {
    emit(initialState);
  }
}

class FakeLeavesBloc extends LeavesBloc {
  FakeLeavesBloc(LeavesState initialState)
      : super(repository: StubLeavesRepository()) {
    emit(initialState);
  }
}

void main() {
  group('Attendance & Leave Views Widget Tests', () {
    testWidgets('StudentAttendanceHistoryView renders summary and logs', (tester) async {
      final fakeBloc = FakeAttendanceBloc(
        const StudentAttendanceHistoryLoaded([
          StudentAttendanceRecordModel(
            studentId: 'std_1',
            attendanceDate: '2026-10-10',
            status: 'PRESENT',
            markedByName: 'Mrs. Sharma',
          ),
          StudentAttendanceRecordModel(
            studentId: 'std_1',
            attendanceDate: '2026-10-09',
            status: 'ABSENT',
            remarks: 'Medical leave',
          ),
        ]),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BlocProvider<AttendanceBloc>.value(
              value: fakeBloc,
              child: const StudentAttendanceHistoryView(),
            ),
          ),
        ),
      );

      expect(find.text('Overall Attendance'), findsOneWidget);
      expect(find.text('50.0%'), findsOneWidget);
      expect(find.text('1 / 2 Days Present'), findsOneWidget);
      expect(find.text('2026-10-10'), findsOneWidget);
      expect(find.text('PRESENT'), findsOneWidget);
      expect(find.text('2026-10-09'), findsOneWidget);
      expect(find.text('ABSENT'), findsOneWidget);
    });

    testWidgets('TeacherOwnAttendanceView renders staff log tiles', (tester) async {
      final fakeBloc = FakeAttendanceBloc(
        const StaffAttendanceHistoryLoaded([
          StaffAttendanceRecordModel(
            staffId: 'stf_1',
            attendanceDate: '2026-10-10',
            status: 'PRESENT',
          ),
        ]),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BlocProvider<AttendanceBloc>.value(
              value: fakeBloc,
              child: const TeacherOwnAttendanceView(),
            ),
          ),
        ),
      );

      expect(find.text('My Staff Attendance'), findsOneWidget);
      expect(find.text('1 / 1 Days Logged'), findsOneWidget);
      expect(find.text('2026-10-10'), findsOneWidget);
      expect(find.text('PRESENT'), findsOneWidget);
    });

    testWidgets('CoordinatorStaffAttendanceView renders wing staff attendance with stats', (tester) async {
      final fakeBloc = FakeAttendanceBloc(
        const WingStaffAttendanceLoaded([
          StaffAttendanceRecordModel(
            staffId: 'stf_1',
            staffName: 'Vikram Joshi',
            designation: 'Senior Teacher',
            employeeCode: 'EMP101',
            attendanceDate: '2026-10-10',
            status: 'PRESENT',
          ),
        ]),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BlocProvider<AttendanceBloc>.value(
              value: fakeBloc,
              child: const CoordinatorStaffAttendanceView(
                wingId: 'wing_senior',
                wingName: 'Senior Wing',
              ),
            ),
          ),
        ),
      );

      expect(find.text('Senior Wing Staff Attendance'), findsOneWidget);
      expect(find.text('Vikram Joshi'), findsOneWidget);
      expect(find.text('Senior Teacher • Code: EMP101'), findsOneWidget);
      expect(find.text('PRESENT'), findsOneWidget);
    });

    testWidgets('CoordinatorLeaveReviewView renders leave card with Recommend button', (tester) async {
      final fakeBloc = FakeLeavesBloc(
        const CoordinatorWingLeavesLoaded([
          StaffLeaveModel(
            id: 'l1',
            staffId: 'stf_1',
            staffName: 'Vikram Joshi',
            startDate: '2026-10-15',
            endDate: '2026-10-16',
            leaveType: 'CASUAL',
            reason: 'Attending family wedding',
            status: 'PENDING',
          ),
        ]),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BlocProvider<LeavesBloc>.value(
              value: fakeBloc,
              child: const CoordinatorLeaveReviewView(wingName: 'Senior Wing'),
            ),
          ),
        ),
      );

      expect(find.text('Senior Wing Teacher Leave Applications'), findsOneWidget);
      expect(find.text('Vikram Joshi'), findsOneWidget);
      expect(find.text('CASUAL Leave • 2026-10-15 to 2026-10-16'), findsOneWidget);
      expect(find.text('Reason: "Attending family wedding"'), findsOneWidget);
      expect(find.text('Recommend Leave'), findsOneWidget);
    });

    testWidgets('ManagementLeaveApprovalView renders Approve and Reject buttons', (tester) async {
      final fakeBloc = FakeLeavesBloc(
        const ManagementLeaveQueueLoaded([
          StaffLeaveModel(
            id: 'l1',
            staffId: 'stf_1',
            staffName: 'Vikram Joshi',
            startDate: '2026-10-15',
            endDate: '2026-10-16',
            leaveType: 'CASUAL',
            reason: 'Attending family wedding',
            status: 'RECOMMENDED',
            recommendationNote: 'Substitute arranged: Mr. Gupta',
            recommendedByName: 'Coordinator Senior',
          ),
        ]),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BlocProvider<LeavesBloc>.value(
              value: fakeBloc,
              child: const ManagementLeaveApprovalView(),
            ),
          ),
        ),
      );

      expect(find.text('Executive Leave Approval Queue'), findsOneWidget);
      expect(find.text('Vikram Joshi'), findsOneWidget);
      expect(find.text('Coordinator Recommendation: "Substitute arranged: Mr. Gupta" (Coordinator Senior)'), findsOneWidget);
      expect(find.text('Approve'), findsOneWidget);
      expect(find.text('Reject'), findsOneWidget);
    });

    testWidgets('ManagementStaffAttendanceView renders staff list and save button', (tester) async {
      final mockRepo = StubAttendanceRepository(
        managementStaffList: [
          const StaffAttendanceRecordModel(
            id: 'sar1',
            staffId: 'stf_teacher',
            staffName: 'Teacher One',
            employeeCode: 'EMP-TEACHER1',
            wingName: 'Senior Wing',
            attendanceDate: '2026-10-14',
            status: 'PRESENT',
          ),
        ],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RepositoryProvider<AttendanceRepository>.value(
              value: mockRepo,
              child: const ManagementStaffAttendanceView(),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Teacher & Staff Attendance'), findsOneWidget);
      expect(find.text('Teacher One'), findsOneWidget);
      expect(find.text('EMP-TEACHER1'), findsOneWidget);
      expect(find.byKey(const Key('saveStaffAttendanceBtn')), findsOneWidget);
    });
  });
}
