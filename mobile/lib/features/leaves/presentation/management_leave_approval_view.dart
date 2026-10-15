import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../bloc/leaves_bloc.dart';
import '../bloc/leaves_event.dart';
import '../bloc/leaves_state.dart';
import '../models/staff_leave_model.dart';

class ManagementLeaveApprovalView extends StatefulWidget {
  const ManagementLeaveApprovalView({super.key});

  @override
  State<ManagementLeaveApprovalView> createState() =>
      _ManagementLeaveApprovalViewState();
}

class _ManagementLeaveApprovalViewState
    extends State<ManagementLeaveApprovalView> {
  @override
  void initState() {
    super.initState();
    context.read<LeavesBloc>().add(const LoadManagementLeaveQueueEvent());
  }

  void _openDecisionDialog(StaffLeaveModel leave, bool isApprove) {
    final noteController = TextEditingController();
    final reasonController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: AppColors.border),
          ),
          title: Text(
            isApprove
                ? 'Approve Leave: ${leave.staffName ?? 'Teacher'}'
                : 'Reject Leave: ${leave.staffName ?? 'Teacher'}',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.primaryText,
            ),
          ),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${leave.leaveType} Leave (${leave.startDate} to ${leave.endDate})',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.secondaryText),
                ),
                const SizedBox(height: 4),
                Text(
                  'Reason: "${leave.reason}"',
                  style: const TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                      color: AppColors.primaryText),
                ),
                if (leave.recommendationNote != null &&
                    leave.recommendationNote!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Coordinator Recommendation: "${leave.recommendationNote}"',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF1D4ED8),
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                if (isApprove)
                  TextField(
                    controller: noteController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Decision Note (Optional)',
                      hintText: 'e.g., Sanctioned as per school policy',
                      border: OutlineInputBorder(),
                    ),
                  )
                else
                  TextFormField(
                    controller: reasonController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Rejection Reason (Required)',
                      hintText: 'State reason for rejection',
                      border: OutlineInputBorder(),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return 'Rejection reason is required';
                      }
                      return null;
                    },
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Cancel',
                  style: TextStyle(color: AppColors.secondaryText)),
            ),
            ElevatedButton(
              onPressed: () {
                if (!isApprove && !formKey.currentState!.validate()) {
                  return;
                }
                Navigator.pop(dialogCtx);
                context.read<LeavesBloc>().add(
                      DecideStaffLeaveEvent(
                        leaveId: leave.id,
                        decision: isApprove ? 'APPROVED' : 'REJECTED',
                        note: noteController.text.trim().isNotEmpty
                            ? noteController.text.trim()
                            : null,
                        rejectionReason:
                            reasonController.text.trim().isNotEmpty
                                ? reasonController.text.trim()
                                : null,
                      ),
                    );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: isApprove
                    ? const Color(0xFF15803D)
                    : const Color(0xFFB91C1C),
                foregroundColor: AppColors.surface,
                elevation: 0,
              ),
              child: Text(isApprove ? 'Confirm Approval' : 'Confirm Rejection'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<LeavesBloc, LeavesState>(
      listener: (context, state) {
        if (state is LeaveActionSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.primaryText,
            ),
          );
        }
      },
      child: Column(
        children: [
          // Header info
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Executive Leave Approval Queue',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryText,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Final sanction authority for teacher leave requests.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.secondaryText,
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: BlocBuilder<LeavesBloc, LeavesState>(
              builder: (context, state) {
                if (state is LeavesLoading) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  );
                }

                if (state is LeavesError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error_outline,
                              size: 36, color: AppColors.error),
                          const SizedBox(height: 12),
                          Text(
                            state.message,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.secondaryText),
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton(
                            onPressed: () {
                              context
                                  .read<LeavesBloc>()
                                  .add(const LoadManagementLeaveQueueEvent());
                            },
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.border),
                            ),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (state is ManagementLeaveQueueLoaded) {
                  final leaves = state.leaves;

                  if (leaves.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Text(
                          'No pending leave applications in the approval queue.',
                          style: TextStyle(
                              fontSize: 13, color: AppColors.secondaryText),
                        ),
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: leaves.length,
                    itemBuilder: (context, index) {
                      return _buildApprovalCard(leaves[index]);
                    },
                  );
                }

                return const Center(
                  child: CircularProgressIndicator(strokeWidth: 2),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApprovalCard(StaffLeaveModel leave) {
    Color badgeColor;
    Color badgeBg;
    Color badgeBorder;

    switch (leave.status) {
      case 'APPROVED':
        badgeColor = const Color(0xFF15803D);
        badgeBg = const Color(0xFFF0FDF4);
        badgeBorder = const Color(0xFF86EFAC);
        break;
      case 'RECOMMENDED':
        badgeColor = const Color(0xFF1D4ED8);
        badgeBg = const Color(0xFFEFF6FF);
        badgeBorder = const Color(0xFF93C5FD);
        break;
      case 'REJECTED':
        badgeColor = const Color(0xFFB91C1C);
        badgeBg = const Color(0xFFFEF2F2);
        badgeBorder = const Color(0xFFFCA5A5);
        break;
      case 'PENDING':
      default:
        badgeColor = const Color(0xFFB45309);
        badgeBg = const Color(0xFFFFFBEB);
        badgeBorder = const Color(0xFFFDE68A);
        break;
    }

    final isActionable =
        leave.status == 'PENDING' || leave.status == 'RECOMMENDED';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                leave.staffName ?? 'Teacher',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryText,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: badgeBorder),
                ),
                child: Text(
                  leave.status,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
          Text(
            '${leave.leaveType} Leave • ${leave.startDate} to ${leave.endDate}',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.secondaryText,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Reason: "${leave.reason}"',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.primaryText,
            ),
          ),
          if (leave.recommendationNote != null &&
              leave.recommendationNote!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFF93C5FD)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.thumb_up_alt_outlined,
                      size: 14, color: Color(0xFF1D4ED8)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Coordinator Recommendation: "${leave.recommendationNote}" (${leave.recommendedByName ?? 'Coordinator'})',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF1E40AF),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (isActionable) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: () => _openDecisionDialog(leave, false),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFB91C1C)),
                    foregroundColor: const Color(0xFFB91C1C),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                  ),
                  child: const Text('Reject'),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => _openDecisionDialog(leave, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF15803D),
                    foregroundColor: AppColors.surface,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                  ),
                  child: const Text('Approve'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
