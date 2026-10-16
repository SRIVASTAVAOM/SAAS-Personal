import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/leaves/bloc/leaves_bloc.dart';
import 'package:mobile/features/leaves/bloc/leaves_event.dart';
import 'package:mobile/features/leaves/bloc/leaves_state.dart';
import 'package:mobile/features/leaves/models/staff_leave_model.dart';
import 'package:mobile/features/leaves/models/student_leave_model.dart';
import 'package:mobile/features/leaves/repository/leaves_repository.dart';

class MockLeavesRepository implements LeavesRepository {
  @override
  DioClient get dioClient =>
      DioClient(storageService: SecureStorageService());

  bool shouldThrow = false;
  List<StaffLeaveModel> mockStaffLeaves = [];
  List<StudentLeaveModel> mockStudentLeaves = [];

  @override
  Future<StaffLeaveModel> applyStaffLeave({
    required String startDate,
    required String endDate,
    required String leaveType,
    required String reason,
    String? documentUrl,
    String? attachmentName,
  }) async {
    if (shouldThrow) throw Exception('Leave failed');
    final leave = StaffLeaveModel(
      id: 'leave_1',
      staffId: 'stf_1',
      startDate: startDate,
      endDate: endDate,
      leaveType: leaveType,
      reason: reason,
      documentUrl: documentUrl,
      attachmentName: attachmentName,
      status: 'PENDING',
    );
    mockStaffLeaves.add(leave);
    return leave;
  }

  @override
  Future<List<StaffLeaveModel>> getStaffMyLeaves() async {
    if (shouldThrow) throw Exception('Fetch failed');
    return mockStaffLeaves;
  }

  @override
  Future<List<StaffLeaveModel>> getStaffWingLeaves() async {
    if (shouldThrow) throw Exception('Wing leaves failed');
    return mockStaffLeaves;
  }

  @override
  Future<void> recommendStaffLeave(String leaveId, {String? note}) async {
    if (shouldThrow) throw Exception('Recommendation failed');
  }

  @override
  Future<List<StaffLeaveModel>> getManagementLeaveQueue() async {
    if (shouldThrow) throw Exception('Queue failed');
    return mockStaffLeaves;
  }

  @override
  Future<void> decideStaffLeave(
    String leaveId, {
    required String decision,
    String? note,
    String? rejectionReason,
  }) async {
    if (shouldThrow) throw Exception('Decision failed');
  }

  @override
  Future<StudentLeaveModel> applyStudentLeave({
    required String startDate,
    required String endDate,
    required String reason,
    String? documentUrl,
    String? attachmentName,
  }) async {
    if (shouldThrow) throw Exception('Student apply failed');
    final leave = StudentLeaveModel(
      id: 'std_leave_1',
      studentId: 'std_1',
      startDate: startDate,
      endDate: endDate,
      reason: reason,
      documentUrl: documentUrl,
      attachmentName: attachmentName,
      status: 'PENDING',
    );
    mockStudentLeaves.add(leave);
    return leave;
  }

  @override
  Future<List<StudentLeaveModel>> getStudentMyLeaves() async {
    if (shouldThrow) throw Exception('Student leaves fetch failed');
    return mockStudentLeaves;
  }

  @override
  Future<List<StudentLeaveModel>> getClassStudentLeaves() async {
    if (shouldThrow) throw Exception('Class leaves fetch failed');
    return mockStudentLeaves;
  }

  @override
  Future<void> updateStudentLeaveStatus(
    String leaveId, {
    required String status,
    String? remarks,
  }) async {
    if (shouldThrow) throw Exception('Leave status update failed');
  }
}


void main() {
  group('LeavesBloc Unit Tests', () {
    late MockLeavesRepository repository;
    late LeavesBloc bloc;

    setUp(() {
      repository = MockLeavesRepository();
      bloc = LeavesBloc(repository: repository);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is LeavesInitial', () {
      expect(bloc.state, isA<LeavesInitial>());
    });

    test('emits [LeavesLoading, StaffMyLeavesLoaded] on LoadStaffMyLeavesEvent', () async {
      repository.mockStaffLeaves = [
        const StaffLeaveModel(
          id: 'l1',
          staffId: 'stf1',
          startDate: '2026-10-15',
          endDate: '2026-10-16',
          leaveType: 'CASUAL',
          reason: 'Family event',
          status: 'PENDING',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<StaffMyLeavesLoaded>().having((s) => s.leaves.length, 'leaves length', 1),
        ]),
      );

      bloc.add(const LoadStaffMyLeavesEvent());
    });

    test('emits [LeavesLoading, LeaveActionSuccess, StaffMyLeavesLoaded] on ApplyStaffLeaveEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<LeaveActionSuccess>(),
          isA<StaffMyLeavesLoaded>(),
        ]),
      );

      bloc.add(const ApplyStaffLeaveEvent(
        startDate: '2026-10-20',
        endDate: '2026-10-21',
        leaveType: 'CASUAL',
        reason: 'Personal work',
      ));
    });

    test('emits [LeavesLoading, CoordinatorWingLeavesLoaded] on LoadCoordinatorWingLeavesEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<CoordinatorWingLeavesLoaded>(),
        ]),
      );

      bloc.add(const LoadCoordinatorWingLeavesEvent());
    });

    test('emits [LeavesLoading, LeaveActionSuccess, CoordinatorWingLeavesLoaded] on RecommendStaffLeaveEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<LeaveActionSuccess>(),
          isA<CoordinatorWingLeavesLoaded>(),
        ]),
      );

      bloc.add(const RecommendStaffLeaveEvent(
        leaveId: 'l1',
        note: 'Substitute arranged',
      ));
    });

    test('emits [LeavesLoading, ManagementLeaveQueueLoaded] on LoadManagementLeaveQueueEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<ManagementLeaveQueueLoaded>(),
        ]),
      );

      bloc.add(const LoadManagementLeaveQueueEvent());
    });

    test('emits [LeavesLoading, LeaveActionSuccess, ManagementLeaveQueueLoaded] on DecideStaffLeaveEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<LeaveActionSuccess>(),
          isA<ManagementLeaveQueueLoaded>(),
        ]),
      );

      bloc.add(const DecideStaffLeaveEvent(
        leaveId: 'l1',
        decision: 'APPROVED',
        note: 'Approved',
      ));
    });

    test('emits [LeavesLoading, StudentMyLeavesLoaded] on LoadStudentMyLeavesEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<StudentMyLeavesLoaded>(),
        ]),
      );

      bloc.add(const LoadStudentMyLeavesEvent());
    });

    test('emits [LeavesLoading, LeaveActionSuccess, StudentMyLeavesLoaded] on ApplyStudentLeaveEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<LeaveActionSuccess>(),
          isA<StudentMyLeavesLoaded>(),
        ]),
      );

      bloc.add(const ApplyStudentLeaveEvent(
        startDate: '2026-10-25',
        endDate: '2026-10-26',
        reason: 'Fever',
      ));
    });

    test('emits [LeavesLoading, ClassStudentLeavesLoaded] on LoadClassStudentLeavesEvent', () async {
      repository.mockStudentLeaves = [
        const StudentLeaveModel(
          id: 'std_leave_1',
          studentId: 'std_1',
          studentName: 'Aarav Patel',
          startDate: '2026-10-25',
          endDate: '2026-10-26',
          reason: 'Fever',
          status: 'PENDING',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<ClassStudentLeavesLoaded>().having((s) => s.leaves.length, 'leaves length', 1),
        ]),
      );

      bloc.add(const LoadClassStudentLeavesEvent());
    });

    test('emits [LeavesLoading, LeaveActionSuccess, ClassStudentLeavesLoaded] on UpdateStudentLeaveStatusEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<LeaveActionSuccess>(),
          isA<ClassStudentLeavesLoaded>(),
        ]),
      );

      bloc.add(const UpdateStudentLeaveStatusEvent(
        leaveId: 'std_leave_1',
        status: 'APPROVED',
        remarks: 'Take care',
      ));
    });

    test('emits [LeavesLoading, LeavesError] when repository throws', () async {

      repository.shouldThrow = true;

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<LeavesLoading>(),
          isA<LeavesError>().having((s) => s.message, 'message', 'Fetch failed'),
        ]),
      );

      bloc.add(const LoadStaffMyLeavesEvent());
    });
  });
}
