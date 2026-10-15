import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/attendance/bloc/attendance_bloc.dart';
import 'package:mobile/features/attendance/bloc/attendance_event.dart';
import 'package:mobile/features/attendance/bloc/attendance_state.dart';
import 'package:mobile/features/attendance/models/staff_attendance_record_model.dart';
import 'package:mobile/features/attendance/models/student_attendance_record_model.dart';
import 'package:mobile/features/attendance/repository/attendance_repository.dart';

class MockAttendanceRepository implements AttendanceRepository {
  @override
  DioClient get dioClient =>
      DioClient(storageService: SecureStorageService());

  bool shouldThrow = false;
  List<StudentAttendanceRecordModel> mockStudentRecords = [];
  List<StaffAttendanceRecordModel> mockStaffRecords = [];

  @override
  Future<List<StudentAttendanceRecordModel>> getStudentAttendanceHistory() async {
    if (shouldThrow) throw Exception('Network error');
    return mockStudentRecords;
  }

  @override
  Future<List<StudentAttendanceRecordModel>> getClassAttendance(
    String classId,
    String sectionId, {
    String? date,
  }) async {
    if (shouldThrow) throw Exception('Class not found');
    return mockStudentRecords;
  }

  @override
  Future<void> markStudentAttendance({
    required String classId,
    required String sectionId,
    required String attendanceDate,
    required List<Map<String, dynamic>> records,
  }) async {
    if (shouldThrow) throw Exception('Marking failed');
  }

  @override
  Future<List<StaffAttendanceRecordModel>> getStaffAttendanceHistory() async {
    if (shouldThrow) throw Exception('Staff history error');
    return mockStaffRecords;
  }

  @override
  Future<List<StaffAttendanceRecordModel>> getWingStaffAttendance(
    String wingId, {
    String? date,
  }) async {
    if (shouldThrow) throw Exception('Unauthorized wing');
    return mockStaffRecords;
  }

  @override
  Future<List<StaffAttendanceRecordModel>> getManagementStaffAttendanceOverview({
    String? date,
    String? wingId,
  }) async {
    if (shouldThrow) throw Exception('Management overview error');
    return mockStaffRecords;
  }

  @override
  Future<void> markStaffAttendance({
    required String date,
    required List<Map<String, dynamic>> records,
  }) async {
    if (shouldThrow) throw Exception('Marking staff attendance failed');
  }
}

void main() {
  group('AttendanceBloc Unit Tests', () {
    late MockAttendanceRepository repository;
    late AttendanceBloc bloc;

    setUp(() {
      repository = MockAttendanceRepository();
      bloc = AttendanceBloc(repository: repository);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is AttendanceInitial', () {
      expect(bloc.state, isA<AttendanceInitial>());
    });

    test('emits [AttendanceLoading, StudentAttendanceHistoryLoaded] on LoadStudentOwnAttendanceEvent', () async {
      repository.mockStudentRecords = [
        const StudentAttendanceRecordModel(
          studentId: 'std_1',
          attendanceDate: '2026-10-10',
          status: 'PRESENT',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AttendanceLoading>(),
          isA<StudentAttendanceHistoryLoaded>().having(
            (s) => s.records.length,
            'records length',
            1,
          ),
        ]),
      );

      bloc.add(const LoadStudentOwnAttendanceEvent());
    });

    test('emits [AttendanceLoading, ClassAttendanceLoaded] on LoadClassAttendanceEvent', () async {
      repository.mockStudentRecords = [
        const StudentAttendanceRecordModel(
          studentId: 'std_1',
          attendanceDate: '2026-10-10',
          status: 'PRESENT',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AttendanceLoading>(),
          isA<ClassAttendanceLoaded>()
              .having((s) => s.classId, 'classId', 'cls_1')
              .having((s) => s.records.length, 'records length', 1),
        ]),
      );

      bloc.add(const LoadClassAttendanceEvent(
        classId: 'cls_1',
        sectionId: 'sec_1',
        date: '2026-10-10',
      ));
    });

    test('emits [AttendanceLoading, AttendanceSubmittedSuccess, ClassAttendanceLoaded] on SubmitClassAttendanceEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AttendanceLoading>(),
          isA<AttendanceSubmittedSuccess>(),
          isA<ClassAttendanceLoaded>(),
        ]),
      );

      bloc.add(const SubmitClassAttendanceEvent(
        classId: 'cls_1',
        sectionId: 'sec_1',
        attendanceDate: '2026-10-10',
        records: [
          {'student_id': 'std_1', 'status': 'PRESENT'},
        ],
      ));
    });

    test('emits [AttendanceLoading, StaffAttendanceHistoryLoaded] on LoadStaffOwnAttendanceEvent', () async {
      repository.mockStaffRecords = [
        const StaffAttendanceRecordModel(
          staffId: 'stf_1',
          attendanceDate: '2026-10-10',
          status: 'PRESENT',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AttendanceLoading>(),
          isA<StaffAttendanceHistoryLoaded>().having(
            (s) => s.records.length,
            'records length',
            1,
          ),
        ]),
      );

      bloc.add(const LoadStaffOwnAttendanceEvent());
    });

    test('emits [AttendanceLoading, WingStaffAttendanceLoaded] on LoadWingStaffAttendanceEvent', () async {
      repository.mockStaffRecords = [
        const StaffAttendanceRecordModel(
          staffId: 'stf_1',
          attendanceDate: '2026-10-10',
          status: 'PRESENT',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AttendanceLoading>(),
          isA<WingStaffAttendanceLoaded>().having(
            (s) => s.records.length,
            'records length',
            1,
          ),
        ]),
      );

      bloc.add(const LoadWingStaffAttendanceEvent(wingId: 'wing_senior'));
    });

    test('emits [AttendanceLoading, AttendanceError] when repository throws', () async {
      repository.shouldThrow = true;

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AttendanceLoading>(),
          isA<AttendanceError>().having((s) => s.message, 'message', 'Network error'),
        ]),
      );

      bloc.add(const LoadStudentOwnAttendanceEvent());
    });
  });
}
