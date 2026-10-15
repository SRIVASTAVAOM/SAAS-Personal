import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<ExamsBloc>().add(
                    LoadExamDatesheetsEvent(widget.examId, classId: widget.classId),
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

          if (state is ExamDatesheetsLoaded) {
            final datesheets = state.datesheets;
            if (datesheets.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.calendar_today_outlined, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 12),
                    Text(
                      'No exam schedule published yet.',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                    ),
                  ],
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: datesheets.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final ds = datesheets[index];
                return _buildDatesheetCard(context, ds);
              },
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
                  ds.subjectName ?? 'Subject',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                ),
              ),
              if (ds.subjectCode != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Text(
                    ds.subjectCode!,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.event_outlined, size: 16, color: Colors.grey.shade600),
              const SizedBox(width: 6),
              Text(
                ds.examDate,
                style: TextStyle(fontSize: 13, color: Colors.grey.shade800, fontWeight: FontWeight.w500),
              ),
              const SizedBox(width: 16),
              Icon(Icons.access_time_outlined, size: 16, color: Colors.grey.shade600),
              const SizedBox(width: 6),
              Text(
                '${ds.startTime.substring(0, 5)} - ${ds.endTime.substring(0, 5)}',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Divider(color: Colors.grey.shade100),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Max: ${ds.maxMarks.toStringAsFixed(0)} marks',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
              ),
              Text(
                'Passing: ${ds.passingMarks.toStringAsFixed(0)} marks',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
              ),
              if (ds.className != null)
                Text(
                  ds.className!,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
