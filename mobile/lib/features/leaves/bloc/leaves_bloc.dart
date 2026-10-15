import 'package:flutter_bloc/flutter_bloc.dart';
import '../repository/leaves_repository.dart';
import 'leaves_event.dart';
import 'leaves_state.dart';

class LeavesBloc extends Bloc<LeavesEvent, LeavesState> {
  final LeavesRepository repository;

  LeavesBloc({required this.repository}) : super(LeavesInitial()) {
    on<LoadStaffMyLeavesEvent>(_onLoadStaffMyLeaves);
    on<ApplyStaffLeaveEvent>(_onApplyStaffLeave);
    on<LoadCoordinatorWingLeavesEvent>(_onLoadCoordinatorWingLeaves);
    on<RecommendStaffLeaveEvent>(_onRecommendStaffLeave);
    on<LoadManagementLeaveQueueEvent>(_onLoadManagementLeaveQueue);
    on<DecideStaffLeaveEvent>(_onDecideStaffLeave);
    on<LoadStudentMyLeavesEvent>(_onLoadStudentMyLeaves);
    on<ApplyStudentLeaveEvent>(_onApplyStudentLeave);
    on<LoadClassStudentLeavesEvent>(_onLoadClassStudentLeaves);
    on<UpdateStudentLeaveStatusEvent>(_onUpdateStudentLeaveStatus);
  }


  Future<void> _onLoadStaffMyLeaves(
    LoadStaffMyLeavesEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      final leaves = await repository.getStaffMyLeaves();
      emit(StaffMyLeavesLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onApplyStaffLeave(
    ApplyStaffLeaveEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      await repository.applyStaffLeave(
        startDate: event.startDate,
        endDate: event.endDate,
        leaveType: event.leaveType,
        reason: event.reason,
      );
      emit(const LeaveActionSuccess('Leave application submitted successfully.'));
      final leaves = await repository.getStaffMyLeaves();
      emit(StaffMyLeavesLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadCoordinatorWingLeaves(
    LoadCoordinatorWingLeavesEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      final leaves = await repository.getStaffWingLeaves();
      emit(CoordinatorWingLeavesLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onRecommendStaffLeave(
    RecommendStaffLeaveEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      await repository.recommendStaffLeave(event.leaveId, note: event.note);
      emit(const LeaveActionSuccess('Leave recommendation recorded successfully.'));
      final leaves = await repository.getStaffWingLeaves();
      emit(CoordinatorWingLeavesLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadManagementLeaveQueue(
    LoadManagementLeaveQueueEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      final leaves = await repository.getManagementLeaveQueue();
      emit(ManagementLeaveQueueLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onDecideStaffLeave(
    DecideStaffLeaveEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      await repository.decideStaffLeave(
        event.leaveId,
        decision: event.decision,
        note: event.note,
        rejectionReason: event.rejectionReason,
      );
      emit(LeaveActionSuccess(
          'Leave ${event.decision == 'APPROVED' ? 'approved' : 'rejected'} successfully.'));
      final leaves = await repository.getManagementLeaveQueue();
      emit(ManagementLeaveQueueLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadStudentMyLeaves(
    LoadStudentMyLeavesEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      final leaves = await repository.getStudentMyLeaves();
      emit(StudentMyLeavesLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onApplyStudentLeave(
    ApplyStudentLeaveEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      await repository.applyStudentLeave(
        startDate: event.startDate,
        endDate: event.endDate,
        reason: event.reason,
      );
      emit(const LeaveActionSuccess('Student leave submitted successfully.'));
      final leaves = await repository.getStudentMyLeaves();
      emit(StudentMyLeavesLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadClassStudentLeaves(
    LoadClassStudentLeavesEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      final leaves = await repository.getClassStudentLeaves();
      emit(ClassStudentLeavesLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onUpdateStudentLeaveStatus(
    UpdateStudentLeaveStatusEvent event,
    Emitter<LeavesState> emit,
  ) async {
    emit(LeavesLoading());
    try {
      await repository.updateStudentLeaveStatus(
        event.leaveId,
        status: event.status,
        remarks: event.remarks,
      );
      emit(LeaveActionSuccess(
          'Student leave ${event.status == 'APPROVED' ? 'approved' : 'rejected'} successfully.'));
      final leaves = await repository.getClassStudentLeaves();
      emit(ClassStudentLeavesLoaded(leaves));
    } catch (e) {
      emit(LeavesError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}

