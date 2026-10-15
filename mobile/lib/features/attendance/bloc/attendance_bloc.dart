import 'package:flutter_bloc/flutter_bloc.dart';
import '../repository/attendance_repository.dart';
import 'attendance_event.dart';
import 'attendance_state.dart';

class AttendanceBloc extends Bloc<AttendanceEvent, AttendanceState> {
  final AttendanceRepository repository;

  AttendanceBloc({required this.repository}) : super(AttendanceInitial()) {
    on<LoadStudentOwnAttendanceEvent>(_onLoadStudentOwnAttendance);
    on<LoadClassAttendanceEvent>(_onLoadClassAttendance);
    on<SubmitClassAttendanceEvent>(_onSubmitClassAttendance);
    on<LoadStaffOwnAttendanceEvent>(_onLoadStaffOwnAttendance);
    on<LoadWingStaffAttendanceEvent>(_onLoadWingStaffAttendance);
  }

  Future<void> _onLoadStudentOwnAttendance(
    LoadStudentOwnAttendanceEvent event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(AttendanceLoading());
    try {
      final records = await repository.getStudentAttendanceHistory();
      emit(StudentAttendanceHistoryLoaded(records));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadClassAttendance(
    LoadClassAttendanceEvent event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(AttendanceLoading());
    try {
      final date = event.date ?? DateTime.now().toIso8601String().split('T')[0];
      final records = await repository.getClassAttendance(
        event.classId,
        event.sectionId,
        date: date,
      );
      emit(ClassAttendanceLoaded(
        classId: event.classId,
        sectionId: event.sectionId,
        date: date,
        records: records,
      ));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onSubmitClassAttendance(
    SubmitClassAttendanceEvent event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(AttendanceLoading());
    try {
      await repository.markStudentAttendance(
        classId: event.classId,
        sectionId: event.sectionId,
        attendanceDate: event.attendanceDate,
        records: event.records,
      );
      emit(const AttendanceSubmittedSuccess('Attendance saved successfully.'));
      // Reload class attendance after submit
      final updatedRecords = await repository.getClassAttendance(
        event.classId,
        event.sectionId,
        date: event.attendanceDate,
      );
      emit(ClassAttendanceLoaded(
        classId: event.classId,
        sectionId: event.sectionId,
        date: event.attendanceDate,
        records: updatedRecords,
      ));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadStaffOwnAttendance(
    LoadStaffOwnAttendanceEvent event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(AttendanceLoading());
    try {
      final records = await repository.getStaffAttendanceHistory();
      emit(StaffAttendanceHistoryLoaded(records));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadWingStaffAttendance(
    LoadWingStaffAttendanceEvent event,
    Emitter<AttendanceState> emit,
  ) async {
    emit(AttendanceLoading());
    try {
      final records = await repository.getWingStaffAttendance(
        event.wingId,
        date: event.date,
      );
      emit(WingStaffAttendanceLoaded(records));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
