import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/exams_bloc.dart';
import '../models/exam_model.dart';

class CoordinatorMarksReviewView extends StatefulWidget {
  final String examId;
  final String datesheetId;

  const CoordinatorMarksReviewView({
    super.key,
    required this.examId,
    required this.datesheetId,
  });

  @override
  State<CoordinatorMarksReviewView> createState() => _CoordinatorMarksReviewViewState();
}

class _CoordinatorMarksReviewViewState extends State<CoordinatorMarksReviewView> {
  @override
  void initState() {
    super.initState();
    context.read<ExamsBloc>().add(
          LoadDatesheetSummaryEvent(widget.examId, widget.datesheetId),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Marks Verification & Review'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<ExamsBloc>().add(
                    LoadDatesheetSummaryEvent(widget.examId, widget.datesheetId),
                  );
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: Colors.grey.shade200, height: 1.0),
        ),
      ),
      backgroundColor: const Color(0xFFF9FAFB),
      body: BlocConsumer<ExamsBloc, ExamsState>(
        listener: (context, state) {
          if (state is ExamOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.black87),
            );
          } else if (state is ExamsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red.shade700),
            );
          }
        },
        builder: (context, state) {
          if (state is ExamsLoading) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          if (state is DatesheetSummaryLoaded) {
            final summary = state.summary;
            return _buildContent(context, summary);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildContent(BuildContext context, DatesheetSummaryModel summary) {
    final isVerified = summary.status == 'VERIFIED';
    final hasMissing = summary.missingCount > 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Container(
            width: double.infinity,
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
                    Text(
                      summary.subjectName,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isVerified
                            ? Colors.green.shade50
                            : (summary.status == 'SUBMITTED' ? Colors.blue.shade50 : Colors.amber.shade50),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: isVerified
                              ? Colors.green.shade200
                              : (summary.status == 'SUBMITTED' ? Colors.blue.shade200 : Colors.amber.shade200),
                        ),
                      ),
                      child: Text(
                        summary.status,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isVerified
                              ? Colors.green.shade800
                              : (summary.status == 'SUBMITTED' ? Colors.blue.shade800 : Colors.amber.shade800),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Max Marks: ${summary.maxMarks.toStringAsFixed(0)}',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Missing marks alert
          if (hasMissing)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.amber.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.amber.shade800, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${summary.missingCount} student(s) have missing marks or unentered records.',
                      style: TextStyle(fontSize: 13, color: Colors.amber.shade900),
                    ),
                  ),
                ],
              ),
            ),

          // Statistics Grid
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.8,
            children: [
              _buildStatCard('Total Students', summary.totalStudents.toString(), Icons.people_outline),
              _buildStatCard('Marks Entered', summary.enteredCount.toString(), Icons.edit_note_outlined),
              _buildStatCard('Absent Students', summary.absentCount.toString(), Icons.event_busy_outlined),
              _buildStatCard(
                'Class Average',
                summary.averageMarks != null ? summary.averageMarks!.toStringAsFixed(1) : '-',
                Icons.trending_up_outlined,
              ),
              _buildStatCard(
                'Highest Mark',
                summary.highestMarks != null ? summary.highestMarks!.toStringAsFixed(1) : '-',
                Icons.emoji_events_outlined,
              ),
              _buildStatCard(
                'Lowest Mark',
                summary.lowestMarks != null ? summary.lowestMarks!.toStringAsFixed(1) : '-',
                Icons.insights_outlined,
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Action Button
          if (!isVerified)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  context.read<ExamsBloc>().add(
                        VerifyMarksEvent(widget.examId, widget.datesheetId),
                      );
                },
                icon: const Icon(Icons.check_circle_outline, size: 18),
                label: const Text('Verify Marks as Coordinator'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black87,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
              ),
            )
          else
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.green.shade200),
              ),
              alignment: Alignment.center,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.verified, size: 18, color: Colors.green.shade800),
                  const SizedBox(width: 8),
                  Text(
                    'Marks Verified by Coordinator',
                    style: TextStyle(color: Colors.green.shade900, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.grey.shade600),
              const SizedBox(width: 6),
              Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
        ],
      ),
    );
  }
}
