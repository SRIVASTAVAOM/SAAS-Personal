import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../bloc/student_features_bloc.dart';
import '../../bloc/student_features_event.dart';
import '../../bloc/student_features_state.dart';
import '../../models/student_features_model.dart';

class StudentFeesView extends StatefulWidget {
  const StudentFeesView({super.key});

  @override
  State<StudentFeesView> createState() => _StudentFeesViewState();
}

class _StudentFeesViewState extends State<StudentFeesView> {
  int _activeSubTab = 0; // 0: Dues & Structure, 1: Receipts

  @override
  void initState() {
    super.initState();
    context.read<StudentFeaturesBloc>().add(const LoadStudentFeesEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.scaffoldBackground,
      child: Column(
        children: [
          // Sub-Tab Switcher
          Container(
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildSubTabButton('Fee Structure & Dues', 0),
                const SizedBox(width: 8),
                _buildSubTabButton('Fee Receipts', 1),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.refresh, size: 20, color: AppColors.secondaryText),
                  tooltip: 'Refresh',
                  onPressed: () {
                    if (_activeSubTab == 0) {
                      context
                          .read<StudentFeaturesBloc>()
                          .add(const LoadStudentFeesEvent());
                    } else {
                      context
                          .read<StudentFeaturesBloc>()
                          .add(const LoadStudentReceiptsEvent());
                    }
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: _activeSubTab == 0
                ? _buildDuesTab()
                : _buildReceiptsTab(),
          ),
        ],
      ),
    );
  }

  Widget _buildSubTabButton(String title, int index) {
    final isSelected = _activeSubTab == index;
    return InkWell(
      onTap: () {
        setState(() => _activeSubTab = index);
        if (index == 0) {
          context.read<StudentFeaturesBloc>().add(const LoadStudentFeesEvent());
        } else {
          context
              .read<StudentFeaturesBloc>()
              .add(const LoadStudentReceiptsEvent());
        }
      },
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryText : AppColors.scaffoldBackground,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isSelected ? AppColors.primaryText : AppColors.border,
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isSelected ? AppColors.surface : AppColors.primaryText,
          ),
        ),
      ),
    );
  }

  Widget _buildDuesTab() {
    return BlocBuilder<StudentFeaturesBloc, StudentFeaturesState>(
      builder: (context, state) {
        if (state is StudentFeaturesLoading) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        }

        if (state is StudentFeaturesError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 36, color: AppColors.error),
                  const SizedBox(height: 12),
                  Text(
                    state.message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: () {
                      context
                          .read<StudentFeaturesBloc>()
                          .add(const LoadStudentFeesEvent());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }

        if (state is StudentFeesLoaded) {
          final overview = state.overview;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Summary Banner Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        _buildSummaryItem('Total Dues', '₹${overview.totalDues.toStringAsFixed(0)}', AppColors.primaryText),
                        Container(width: 1, height: 36, color: AppColors.border),
                        _buildSummaryItem('Total Paid', '₹${overview.totalPaid.toStringAsFixed(0)}', AppColors.success),
                        Container(width: 1, height: 36, color: AppColors.border),
                        _buildSummaryItem('Outstanding', '₹${overview.totalOutstanding.toStringAsFixed(0)}', AppColors.error),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.scaffoldBackground,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.info_outline, size: 16, color: AppColors.secondaryText),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Online payment gateway is currently deferred. Fee payments can be made directly at the school accounts counter.',
                              style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Fee Installments & Heads',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primaryText,
                ),
              ),
              const SizedBox(height: 8),
              if (overview.fees.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Center(
                    child: Text(
                      'No fee installments scheduled',
                      style: TextStyle(color: AppColors.secondaryText),
                    ),
                  ),
                )
              else
                ...overview.fees.map((fee) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _buildFeeCard(fee),
                    )),
            ],
          );
        }

        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildSummaryItem(String label, String value, Color valueColor) {
    return Expanded(
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.secondaryText)),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeeCard(FeeItemModel fee) {
    Color statusColor;
    switch (fee.status.toUpperCase()) {
      case 'PAID':
        statusColor = AppColors.success;
        break;
      case 'PARTIAL':
        statusColor = AppColors.info;
        break;
      default:
        statusColor = AppColors.warning;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fee.feeTitle,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryText,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Due: ${fee.dueDate}  •  Paid: ₹${fee.amountPaid.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${fee.amount.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryText,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  fee.status,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptsTab() {
    return BlocBuilder<StudentFeaturesBloc, StudentFeaturesState>(
      builder: (context, state) {
        if (state is StudentFeaturesLoading) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        }

        if (state is StudentReceiptsLoaded) {
          final receipts = state.receipts;
          if (receipts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.secondaryText),
                  SizedBox(height: 12),
                  Text(
                    'No payment receipts recorded yet',
                    style: TextStyle(color: AppColors.secondaryText),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: receipts.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final r = receipts[index];
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.scaffoldBackground,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.receipt_outlined, size: 22, color: AppColors.primaryText),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            r.receiptNumber,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primaryText,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${r.paymentDate}  •  ${r.paymentMode}',
                            style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                          ),
                          if (r.feeTitle != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              r.feeTitle!,
                              style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '₹${r.amountPaid.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.success,
                          ),
                        ),
                        const SizedBox(height: 4),
                        OutlinedButton(
                          onPressed: () => _showReceiptDialog(context, r),
                          style: OutlinedButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                            side: const BorderSide(color: AppColors.border),
                          ),
                          child: const Text('View', style: TextStyle(fontSize: 11)),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        }

        return const SizedBox.shrink();
      },
    );
  }

  void _showReceiptDialog(BuildContext context, FeeReceiptModel r) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: const [
            Icon(Icons.verified_outlined, color: AppColors.success, size: 20),
            SizedBox(width: 8),
            Text('Fee Receipt Details', style: TextStyle(fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDialogRow('Receipt #', r.receiptNumber),
            _buildDialogRow('Payment Date', r.paymentDate),
            _buildDialogRow('Amount Paid', '₹${r.amountPaid.toStringAsFixed(2)}'),
            _buildDialogRow('Payment Mode', r.paymentMode),
            if (r.feeTitle != null) _buildDialogRow('Fee Head', r.feeTitle!),
            if (r.transactionReference != null) _buildDialogRow('Reference', r.transactionReference!),
            if (r.remarks != null) _buildDialogRow('Remarks', r.remarks!),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildDialogRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
          Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryText),
          ),
        ],
      ),
    );
  }
}
