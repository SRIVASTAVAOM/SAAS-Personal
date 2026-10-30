import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/exams_bloc.dart';
import '../models/exam_model.dart';
import '../repositories/exams_repository.dart';
import 'exam_datesheet_view.dart';
import 'teacher_marks_entry_view.dart';
import 'coordinator_marks_review_view.dart';
import 'class_report_cards_view.dart';
import 'student_result_view.dart';

class ExamsListView extends StatefulWidget {
  final String userRole; // 'STUDENT', 'TEACHER', 'COORDINATOR'
  final String? classId;
  final String? sectionId;

  const ExamsListView({
    super.key,
    required this.userRole,
    this.classId,
    this.sectionId,
  });

  @override
  State<ExamsListView> createState() => _ExamsListViewState();
}

class _ExamsListViewState extends State<ExamsListView> {
  // Cache the last loaded exams so we can re-render after navigation back
  List<ExamModel>? _cachedExams;

  @override
  void initState() {
    super.initState();
    context.read<ExamsBloc>().add(const LoadExamsEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
          // Cache exams whenever they load so navigating to datesheet and back
          // doesn't produce a blank screen (Bloc state is overwritten by
          // ExamDatesheetsLoaded while on the child screen).
          if (state is ExamsLoaded) {
            _cachedExams = state.exams;
          }
        },
        builder: (context, state) {
          if (state is ExamsLoading && _cachedExams == null) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          // Prefer live data; fall back to cache when state has moved on
          // (e.g. ExamDatesheetsLoaded after returning from datesheet screen).
          final exams = (state is ExamsLoaded) ? state.exams : (_cachedExams ?? []);

          if (exams.isEmpty && state is! ExamsLoading) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.assignment_outlined, size: 48, color: AppColors.tertiaryText),
                  const SizedBox(height: 12),
                  Text(
                    'No examinations scheduled.',
                    style: TextStyle(color: AppColors.secondaryText, fontSize: 14),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () => context.read<ExamsBloc>().add(const LoadExamsEvent()),
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Refresh'),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.border),
                      foregroundColor: AppColors.primaryText,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
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
              context.read<ExamsBloc>().add(const LoadExamsEvent());
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: exams.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final exam = exams[index];
                return _buildExamCard(context, exam);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildExamCard(BuildContext context, ExamModel exam) {
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
                  exam.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.primaryText,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: exam.isPublished ? AppColors.successLight : AppColors.warningLight,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: exam.isPublished ? AppColors.successBorder : AppColors.warningBorder,
                  ),
                ),
                child: Text(
                  exam.isPublished ? 'PUBLISHED' : 'UPCOMING',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: exam.isPublished ? AppColors.success : AppColors.warning,
                  ),
                ),
              ),
            ],
          ),
          if (exam.description != null) ...[
            const SizedBox(height: 6),
            Text(
              exam.description!,
              style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.calendar_month_outlined, size: 15, color: AppColors.secondaryText),
              const SizedBox(width: 6),
              Text(
                '${exam.startDate} → ${exam.endDate}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.secondaryText,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (exam.academicYearLabel != null) ...[
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.indigo50,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppColors.indigo100),
                  ),
                  child: Text(
                    exam.academicYearLabel!,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.primaryAccent,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: AppColors.borderLight, height: 1),
          const SizedBox(height: 10),
          _buildActionRow(context, exam),
        ],
      ),
    );
  }

  Widget _buildActionRow(BuildContext context, ExamModel exam) {
    if (widget.userRole == 'STUDENT') {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _openDatesheet(context, exam),
              icon: const Icon(Icons.calendar_today_outlined, size: 15),
              label: const Text('Datesheet'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primaryAccent,
                side: const BorderSide(color: AppColors.indigo200),
                backgroundColor: AppColors.indigo50,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => BlocProvider.value(
                      value: context.read<ExamsBloc>(),
                      child: StudentResultView(
                        examId: exam.id,
                        examName: exam.name,
                      ),
                    ),
                  ),
                ).then((_) {
                  // Reload exams list when returning from result screen
                  if (mounted) {
                    context.read<ExamsBloc>().add(const LoadExamsEvent());
                  }
                });
              },
              icon: const Icon(Icons.assignment_turned_in_outlined, size: 15),
              label: const Text('View Result'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryAccent,
                foregroundColor: AppColors.surface,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      );
    }

    if (widget.userRole == 'TEACHER') {
      return Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          OutlinedButton.icon(
            onPressed: () => _openDatesheet(context, exam),
            icon: const Icon(Icons.calendar_today_outlined, size: 14),
            label: const Text('Datesheet', style: TextStyle(fontSize: 12)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primaryAccent,
              side: const BorderSide(color: AppColors.indigo200),
              backgroundColor: AppColors.indigo50,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          ElevatedButton.icon(
            onPressed: () => _openTeacherMarksEntry(exam),
            icon: const Icon(Icons.edit_note_outlined, size: 14),
            label: const Text('Marks Entry', style: TextStyle(fontSize: 12)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryAccent,
              foregroundColor: AppColors.surface,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          if (widget.classId != null && widget.sectionId != null)
            OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => BlocProvider.value(
                      value: context.read<ExamsBloc>(),
                      child: ClassReportCardsView(
                        examId: exam.id,
                        examName: exam.name,
                        classId: widget.classId!,
                        sectionId: widget.sectionId!,
                        isCoordinator: false,
                      ),
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.assessment_outlined, size: 14),
              label: const Text('Report Cards', style: TextStyle(fontSize: 12)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.secondaryText,
                side: const BorderSide(color: AppColors.border),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
        ],
      );
    }

    // Coordinator Role
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        OutlinedButton.icon(
          onPressed: () => _openDatesheet(context, exam),
          icon: const Icon(Icons.calendar_today_outlined, size: 14),
          label: const Text('Datesheet', style: TextStyle(fontSize: 12)),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primaryAccent,
            side: const BorderSide(color: AppColors.indigo200),
            backgroundColor: AppColors.indigo50,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
        ElevatedButton.icon(
          onPressed: () => _openCoordinatorReview(exam),
          icon: const Icon(Icons.verified_outlined, size: 14),
          label: const Text('Review & Verify', style: TextStyle(fontSize: 12)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryAccent,
            foregroundColor: AppColors.surface,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
        if (widget.classId != null && widget.sectionId != null)
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: context.read<ExamsBloc>(),
                    child: ClassReportCardsView(
                      examId: exam.id,
                      examName: exam.name,
                      classId: widget.classId!,
                      sectionId: widget.sectionId!,
                      isCoordinator: true,
                    ),
                  ),
                ),
              );
            },
            icon: const Icon(Icons.approval_outlined, size: 14),
            label: const Text('Approve Cards', style: TextStyle(fontSize: 12)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.secondaryText,
              side: const BorderSide(color: AppColors.border),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
      ],
    );
  }

  /// Opens the datesheet screen and reloads exams on return.
  void _openDatesheet(BuildContext context, ExamModel exam) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<ExamsBloc>(),
          child: ExamDatesheetView(
            examId: exam.id,
            examName: exam.name,
            classId: widget.classId,
          ),
        ),
      ),
    ).then((_) {
      // After returning, reload exams so the list is shown again
      // (navigating to datesheet changes Bloc state to ExamDatesheetsLoaded).
      if (mounted) {
        context.read<ExamsBloc>().add(const LoadExamsEvent());
      }
    });
  }

  void _openTeacherMarksEntry(ExamModel exam) async {
    final bloc = context.read<ExamsBloc>();
    final repo = context.read<ExamsRepository>();
    final dsList = await repo.getDatesheets(exam.id, classId: widget.classId);
    if (!mounted) return;
    if (dsList.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No scheduled subjects found for this exam.')),
      );
      return;
    }

    if (dsList.length == 1) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => BlocProvider.value(
            value: bloc,
            child: TeacherMarksEntryView(
              examId: exam.id,
              datesheetId: dsList.first.id,
              sectionId: widget.sectionId,
            ),
          ),
        ),
      ).then((_) {
        if (mounted) context.read<ExamsBloc>().add(const LoadExamsEvent());
      });
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (bottomSheetCtx) => ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: dsList.length,
        separatorBuilder: (_, _) => const Divider(color: AppColors.border),
        itemBuilder: (ctx, i) {
          final ds = dsList[i];
          return ListTile(
            title: Text(ds.subjectName ?? 'Subject', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${ds.examDate} • Max: ${ds.maxMarks.toStringAsFixed(0)}'),
            trailing: const Icon(Icons.chevron_right, color: AppColors.primaryAccent),
            onTap: () {
              Navigator.pop(ctx);
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: bloc,
                    child: TeacherMarksEntryView(
                      examId: exam.id,
                      datesheetId: ds.id,
                      sectionId: widget.sectionId,
                    ),
                  ),
                ),
              ).then((_) {
                if (mounted) context.read<ExamsBloc>().add(const LoadExamsEvent());
              });
            },
          );
        },
      ),
    );
  }

  void _openCoordinatorReview(ExamModel exam) async {
    final bloc = context.read<ExamsBloc>();
    final repo = context.read<ExamsRepository>();
    final dsList = await repo.getDatesheets(exam.id, classId: widget.classId);
    if (!mounted) return;
    if (dsList.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No scheduled subjects found for this exam.')),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (bottomSheetCtx) => ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: dsList.length,
        separatorBuilder: (_, _) => const Divider(color: AppColors.border),
        itemBuilder: (ctx, i) {
          final ds = dsList[i];
          return ListTile(
            title: Text(ds.subjectName ?? 'Subject', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${ds.examDate} • Max: ${ds.maxMarks.toStringAsFixed(0)}'),
            trailing: const Icon(Icons.chevron_right, color: AppColors.primaryAccent),
            onTap: () {
              Navigator.pop(ctx);
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: bloc,
                    child: CoordinatorMarksReviewView(
                      examId: exam.id,
                      datesheetId: ds.id,
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
