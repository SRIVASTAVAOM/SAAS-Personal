import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/student_roster_item.dart';

class StudentRosterView extends StatefulWidget {
  final List<StudentRosterItem> students;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback? onRetry;
  final String title;
  final bool canEdit;
  final Function(StudentRosterItem)? onEditStudent;

  const StudentRosterView({
    super.key,
    required this.students,
    this.isLoading = false,
    this.errorMessage,
    this.onRetry,
    this.title = 'Class Roster',
    this.canEdit = false,
    this.onEditStudent,
  });

  @override

  State<StudentRosterView> createState() => _StudentRosterViewState();
}

class _StudentRosterViewState extends State<StudentRosterView> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    if (widget.errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 36, color: AppColors.error),
              const SizedBox(height: 12),
              Text(
                widget.errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
              ),
              const SizedBox(height: 16),
              if (widget.onRetry != null)
                OutlinedButton(
                  onPressed: widget.onRetry,
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

    final filtered = widget.students.where((s) {
      final q = _searchQuery.toLowerCase();
      return s.fullName.toLowerCase().contains(q) ||
          s.admissionNumber.toLowerCase().contains(q) ||
          (s.rollNumber != null && s.rollNumber!.toLowerCase().contains(q));
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search Input
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            onChanged: (val) => setState(() => _searchQuery = val),
            decoration: InputDecoration(
              hintText: 'Search by student name or roll no...',
              prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.secondaryText),
              isDense: true,
              filled: true,
              fillColor: AppColors.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: const BorderSide(color: AppColors.border),
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Text(
            '${filtered.length} students enrolled',
            style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
          ),
        ),
        const SizedBox(height: 4),
        if (filtered.isEmpty)
          const Padding(
            padding: EdgeInsets.all(32.0),
            child: Center(
              child: Text(
                'No students found matching your criteria.',
                style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
              ),
            ),
          )
        else
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              itemCount: filtered.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final student = filtered[index];
                return Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.border),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: AppColors.scaffoldBackground,
                        child: Text(
                          student.firstName.isNotEmpty
                              ? student.firstName[0].toUpperCase()
                              : 'S',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryText,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    student.fullName,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.primaryText,
                                    ),
                                  ),
                                ),
                                if (student.rollNumber != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.scaffoldBackground,
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: AppColors.border),
                                    ),
                                    child: Text(
                                      'Roll ${student.rollNumber}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.secondaryText,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Adm: ${student.admissionNumber} • ${student.gender}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.secondaryText,
                              ),
                            ),
                            if (student.bloodGroup != null ||
                                student.emergencyPhone != null ||
                                (student.medicalNotes != null &&
                                    student.medicalNotes!.isNotEmpty)) ...[
                              const SizedBox(height: 4),
                              Wrap(
                                spacing: 12,
                                runSpacing: 4,
                                children: [
                                  if (student.bloodGroup != null)
                                    Text(
                                      'Blood: ${student.bloodGroup}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.secondaryText,
                                      ),
                                    ),
                                  if (student.emergencyPhone != null)
                                    Text(
                                      'Emergency: ${student.emergencyPhone}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.secondaryText,
                                      ),
                                    ),
                                  if (student.medicalNotes != null &&
                                      student.medicalNotes!.isNotEmpty)
                                    Text(
                                      'Medical: ${student.medicalNotes}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontStyle: FontStyle.italic,
                                        color: Color(0xFFD97706),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (widget.canEdit && widget.onEditStudent != null)
                        IconButton(
                          icon: const Icon(Icons.edit_outlined,
                              size: 18, color: AppColors.primaryText),
                          tooltip: 'Update Student Details',
                          onPressed: () => widget.onEditStudent!(student),
                        ),
                    ],
                  ),
                );
              },

            ),
          ),
      ],
    );
  }
}
