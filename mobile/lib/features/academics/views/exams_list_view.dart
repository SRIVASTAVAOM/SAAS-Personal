import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
  @override
  void initState() {
    super.initState();
    context.read<ExamsBloc>().add(const LoadExamsEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: BlocConsumer<ExamsBloc, ExamsState>(
        listener: (context, state) {
          if (state is ExamsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red.shade700),
            );
          }
        },
        builder: (context, state) {
          if (state is ExamsLoading) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          if (state is ExamsLoaded) {
            final exams = state.exams;
            if (exams.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.assignment_outlined, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 12),
                    Text(
                      'No examinations scheduled.',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                    ),
                  ],
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: exams.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final exam = exams[index];
                return _buildExamCard(context, exam);
              },
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildExamCard(BuildContext context, ExamModel exam) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  exam.name,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: exam.isPublished ? Colors.green.shade50 : Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(
                    color: exam.isPublished ? Colors.green.shade200 : Colors.amber.shade200,
                  ),
                ),
                child: Text(
                  exam.isPublished ? 'PUBLISHED' : 'UPCOMING / UNPUBLISHED',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: exam.isPublished ? Colors.green.shade800 : Colors.amber.shade800,
                  ),
                ),
              ),
            ],
          ),
          if (exam.description != null) ...[
            const SizedBox(height: 6),
            Text(
              exam.description!,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.calendar_month_outlined, size: 16, color: Colors.grey.shade600),
              const SizedBox(width: 6),
              Text(
                '${exam.startDate} to ${exam.endDate}',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
              ),
              if (exam.academicYearLabel != null) ...[
                const SizedBox(width: 12),
                Text(
                  '• ${exam.academicYearLabel}',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: Colors.grey.shade100),
          const SizedBox(height: 6),
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
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => BlocProvider.value(
                      value: context.read<ExamsBloc>(),
                      child: ExamDatesheetView(
                        examId: exam.id,
                        examName: exam.name,
                      ),
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.calendar_today_outlined, size: 16),
              label: const Text('Datesheet'),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.black87),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
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
                );
              },
              icon: const Icon(Icons.assignment_turned_in_outlined, size: 16),
              label: const Text('View Result'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black87,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
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
            onPressed: () {
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
              );
            },
            icon: const Icon(Icons.calendar_today_outlined, size: 14),
            label: const Text('Datesheet', style: TextStyle(fontSize: 12)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.black87),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
          ),
          ElevatedButton.icon(
            onPressed: () => _openTeacherMarksEntry(exam),
            icon: const Icon(Icons.edit_note_outlined, size: 14),
            label: const Text('Marks Entry', style: TextStyle(fontSize: 12)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black87,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
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
                side: const BorderSide(color: Colors.black87),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
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
          onPressed: () {
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
            );
          },
          icon: const Icon(Icons.calendar_today_outlined, size: 14),
          label: const Text('Datesheet', style: TextStyle(fontSize: 12)),
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Colors.black87),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          ),
        ),
        ElevatedButton.icon(
          onPressed: () => _openCoordinatorReview(exam),
          icon: const Icon(Icons.verified_outlined, size: 14),
          label: const Text('Review & Verify', style: TextStyle(fontSize: 12)),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.black87,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
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
              side: const BorderSide(color: Colors.black87),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
          ),
      ],
    );
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
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(12))),
      builder: (bottomSheetCtx) => ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: dsList.length,
        separatorBuilder: (_, _) => const Divider(),
        itemBuilder: (ctx, i) {
          final ds = dsList[i];
          return ListTile(
            title: Text(ds.subjectName ?? 'Subject', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${ds.examDate} • Max: ${ds.maxMarks.toStringAsFixed(0)}'),
            trailing: const Icon(Icons.chevron_right),
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
              );
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
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(12))),
      builder: (bottomSheetCtx) => ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: dsList.length,
        separatorBuilder: (_, _) => const Divider(),
        itemBuilder: (ctx, i) {
          final ds = dsList[i];
          return ListTile(
            title: Text(ds.subjectName ?? 'Subject', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${ds.examDate} • Max: ${ds.maxMarks.toStringAsFixed(0)}'),
            trailing: const Icon(Icons.chevron_right),
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
