import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/exams_bloc.dart';
import '../models/exam_model.dart';

class ExamDatesheetView extends StatefulWidget {
  final String examId;
  final String examName;
  final String? classId;

  const ExamDatesheetView({
    super.key,
    required this.examId,
    required this.examName,
    this.classId,
  });

  @override
  State<ExamDatesheetView> createState() => _ExamDatesheetViewState();
}

class _ExamDatesheetViewState extends State<ExamDatesheetView> {
  @override
  void initState() {
    super.initState();
    context.read<ExamsBloc>().add(
          LoadExamDatesheetsEvent(widget.examId, classId: widget.classId),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.examName} Schedule'),
        elevation: 0,
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.primaryText,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.primaryAccent),
            onPressed: () {
              context.read<ExamsBloc>().add(
                    LoadExamDatesheetsEvent(widget.examId, classId: widget.classId),
                  );
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: AppColors.border, height: 1.0),
        ),
      ),
      backgroundColor: AppColors.scaffoldBackground,
      body: BlocConsumer<ExamsBloc, ExamsState>(
        listener: (context, state) {
          if (state is ExamsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is ExamsLoading) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          if (state is ExamDatesheetsLoaded) {
            final datesheets = state.datesheets;
            if (datesheets.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.calendar_today_outlined, size: 48, color: AppColors.tertiaryText),
                    const SizedBox(height: 12),
                    Text(
                      'No exam schedule published yet.',
                      style: TextStyle(color: AppColors.secondaryText, fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () {
                        context.read<ExamsBloc>().add(
                              LoadExamDatesheetsEvent(widget.examId, classId: widget.classId),
                            );
                      },
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('Refresh'),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.border),
                        foregroundColor: AppColors.primaryText,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              color: AppColors.primaryAccent,
              backgroundColor: AppColors.surface,
              onRefresh: () async {
                context.read<ExamsBloc>().add(
                      LoadExamDatesheetsEvent(widget.examId, classId: widget.classId),
                    );
              },
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: datesheets.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final ds = datesheets[index];
                  return _buildDatesheetCard(context, ds);
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildDatesheetCard(BuildContext context, ExamDatesheetModel ds) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x080F172A),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  ds.subjectName ?? 'Subject',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.primaryText,
                  ),
                ),
              ),
              if (ds.subjectCode != null) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.indigo50,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.indigo100),
                  ),
                  child: Text(
                    ds.subjectCode!,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.primaryAccent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          // Date and Time Row
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.indigo50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.indigo100),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(Icons.event_outlined, size: 16, color: AppColors.primaryAccent),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          ds.examDate,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.primaryText,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Row(
                  children: [
                    const Icon(Icons.access_time_outlined, size: 16, color: AppColors.primaryAccent),
                    const SizedBox(width: 6),
                    Text(
                      '${ds.startTime.substring(0, 5)} - ${ds.endTime.substring(0, 5)}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.secondaryText,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Divider(color: AppColors.borderLight, height: 1),
          const SizedBox(height: 10),
          // Marks Info Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildInfoChip(
                icon: Icons.star_outline,
                label: 'Max Marks',
                value: ds.maxMarks.toStringAsFixed(0),
                color: AppColors.primaryAccent,
              ),
              _buildInfoChip(
                icon: Icons.check_circle_outline,
                label: 'Passing',
                value: ds.passingMarks.toStringAsFixed(0),
                color: AppColors.success,
              ),
            ],
          ),
          if (ds.className != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.scaffoldBackground,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.class_outlined, size: 13, color: AppColors.secondaryText),
                  const SizedBox(width: 5),
                  Text(
                    ds.className!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.secondaryText,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoChip({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.scaffoldBackground,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 14, color: color),
                const SizedBox(width: 4),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.secondaryText,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
