import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/homework_bloc.dart';
import '../models/homework_model.dart';

class StudentHomeworkView extends StatefulWidget {
  const StudentHomeworkView({super.key});

  @override
  State<StudentHomeworkView> createState() => _StudentHomeworkViewState();
}

class _StudentHomeworkViewState extends State<StudentHomeworkView> {
  String _selectedFilter = 'ALL'; // 'ALL', 'PENDING', 'COMPLETED'

  @override
  void initState() {
    super.initState();
    context.read<HomeworkBloc>().add(const LoadStudentHomeworkEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Homework & Assignments'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: Colors.grey.shade200, height: 1.0),
        ),
      ),
      backgroundColor: const Color(0xFFF9FAFB),
      body: BlocConsumer<HomeworkBloc, HomeworkState>(
        listener: (context, state) {
          if (state is HomeworkOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.downloadUrl != null
                    ? '${state.message}: ${state.attachmentName ?? "File"}'
                    : state.message),
                backgroundColor: Colors.black87,
              ),
            );
          } else if (state is HomeworkError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red.shade700),
            );
          }
        },
        builder: (context, state) {
          if (state is HomeworkLoading) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          if (state is StudentHomeworkLoaded) {
            final allItems = state.homeworkList;
            final filtered = allItems.where((hw) {
              if (_selectedFilter == 'PENDING') return hw.studentStatus != 'COMPLETED';
              if (_selectedFilter == 'COMPLETED') return hw.studentStatus == 'COMPLETED';
              return true;
            }).toList();

            return Column(
              children: [
                _buildFilterChips(allItems),
                Expanded(
                  child: filtered.isEmpty
                      ? _buildEmptyState()
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            return _buildHomeworkCard(filtered[index]);
                          },
                        ),
                ),
              ],
            );
          }

          return Center(
            child: ElevatedButton(
              onPressed: () => context.read<HomeworkBloc>().add(const LoadStudentHomeworkEvent()),
              child: const Text('Load Homework'),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFilterChips(List<HomeworkModel> allItems) {
    final pendingCount = allItems.where((h) => h.studentStatus != 'COMPLETED').length;
    final completedCount = allItems.where((h) => h.studentStatus == 'COMPLETED').length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.white,
      child: Row(
        children: [
          _filterChip('ALL', 'All (${allItems.length})'),
          const SizedBox(width: 8),
          _filterChip('PENDING', 'Pending ($pendingCount)'),
          const SizedBox(width: 8),
          _filterChip('COMPLETED', 'Completed ($completedCount)'),
        ],
      ),
    );
  }

  Widget _filterChip(String filterKey, String label) {
    final isSelected = _selectedFilter == filterKey;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = filterKey),
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.black87 : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected ? Colors.black87 : Colors.grey.shade300,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected ? Colors.white : Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _buildHomeworkCard(HomeworkModel hw) {
    final isDone = hw.studentStatus == 'COMPLETED';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Text(
                  hw.subjectName ?? 'Subject',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isDone ? Colors.green.shade50 : Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: isDone ? Colors.green.shade200 : Colors.amber.shade200),
                ),
                child: Text(
                  isDone ? 'Completed' : 'Pending',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDone ? Colors.green.shade800 : Colors.amber.shade800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            hw.title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 6),
          Text(
            hw.description,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade700, height: 1.4),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey.shade600),
              const SizedBox(width: 4),
              Text(
                'Due: ${hw.dueDate}',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.grey.shade700),
              ),
              if (hw.teacherName != null) ...[
                const SizedBox(width: 12),
                Icon(Icons.person_outline, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(
                  hw.teacherName!,
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                ),
              ],
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              OutlinedButton.icon(
                key: Key('toggle_completion_${hw.id}'),
                onPressed: () {
                  context.read<HomeworkBloc>().add(
                        ToggleHomeworkCompletionEvent(hw.id, hw.studentStatus),
                      );
                },
                icon: Icon(
                  isDone ? Icons.undo_outlined : Icons.check_circle_outline,
                  size: 16,
                  color: isDone ? Colors.black87 : Colors.green.shade700,
                ),
                label: Text(
                  isDone ? 'Mark as Pending' : 'Mark Completed',
                  style: TextStyle(
                    color: isDone ? Colors.black87 : Colors.green.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.grey.shade300),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
              if (hw.hasAttachment) ...[
                const SizedBox(width: 8),
                TextButton.icon(
                  key: Key('download_attachment_${hw.id}'),
                  onPressed: () {
                    context.read<HomeworkBloc>().add(
                          DownloadHomeworkAttachmentEvent(hw.id),
                        );
                  },
                  icon: const Icon(Icons.download_outlined, size: 16, color: Colors.black87),
                  label: Text(
                    hw.attachmentName ?? 'Attachment',
                    style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_turned_in_outlined, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          Text(
            'No homework assignments found',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }
}
