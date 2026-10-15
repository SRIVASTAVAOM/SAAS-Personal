import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../bloc/schedule_bloc.dart';
import '../models/teacher_substitution_model.dart';

class TeacherSubstitutionsView extends StatefulWidget {
  const TeacherSubstitutionsView({super.key});

  @override
  State<TeacherSubstitutionsView> createState() => _TeacherSubstitutionsViewState();
}

class _TeacherSubstitutionsViewState extends State<TeacherSubstitutionsView> {
  int _activeSegment = 0; // 0: Assigned to Me, 1: Covering My Class

  @override
  void initState() {
    super.initState();
    context.read<ScheduleBloc>().add(const LoadTeacherSubstitutionsEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: Column(
        children: [
          // Segmented Tab Selector
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(
                bottom: BorderSide(color: AppColors.border),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _activeSegment = 0),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _activeSegment == 0
                            ? AppColors.primaryText
                            : AppColors.scaffoldBackground,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: _activeSegment == 0
                              ? AppColors.primaryText
                              : AppColors.border,
                        ),
                      ),
                      child: Text(
                        'Assigned to Me',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: _activeSegment == 0
                              ? FontWeight.w600
                              : FontWeight.w500,
                          color: _activeSegment == 0
                              ? AppColors.surface
                              : AppColors.primaryText,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _activeSegment = 1),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _activeSegment == 1
                            ? AppColors.primaryText
                            : AppColors.scaffoldBackground,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: _activeSegment == 1
                              ? AppColors.primaryText
                              : AppColors.border,
                        ),
                      ),
                      child: Text(
                        'Covering My Class',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: _activeSegment == 1
                              ? FontWeight.w600
                              : FontWeight.w500,
                          color: _activeSegment == 1
                              ? AppColors.surface
                              : AppColors.primaryText,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content List
          Expanded(
            child: BlocBuilder<ScheduleBloc, ScheduleState>(
              builder: (context, state) {
                if (state is ScheduleLoadingState) {
                  return const Center(child: CircularProgressIndicator(strokeWidth: 2));
                }

                if (state is ScheduleErrorState) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error_outline, size: 40, color: AppColors.error),
                          const SizedBox(height: 12),
                          Text(
                            state.message,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton(
                            onPressed: () => context
                                .read<ScheduleBloc>()
                                .add(const LoadTeacherSubstitutionsEvent()),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final assigned = state is ScheduleLoadedState
                    ? state.assignedToMeSubstitutions
                    : <TeacherSubstitutionModel>[];
                final covering = state is ScheduleLoadedState
                    ? state.coveringForMeSubstitutions
                    : <TeacherSubstitutionModel>[];

                final activeList = _activeSegment == 0 ? assigned : covering;

                if (activeList.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<ScheduleBloc>().add(const LoadTeacherSubstitutionsEvent());
                    },
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                        Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.swap_horiz, size: 48, color: AppColors.tertiaryText),
                              const SizedBox(height: 12),
                              Text(
                                _activeSegment == 0
                                    ? 'No substitution duties assigned to you'
                                    : 'No substitute arrangements for your classes',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.secondaryText,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Arrangements will appear here when scheduled by administration',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.tertiaryText,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    context.read<ScheduleBloc>().add(const LoadTeacherSubstitutionsEvent());
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: activeList.length,
                    itemBuilder: (context, index) {
                      final item = activeList[index];
                      return _buildSubstitutionCard(item);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubstitutionCard(TeacherSubstitutionModel item) {
    final isAssignedToMe = _activeSegment == 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Date & Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.event_outlined, size: 14, color: AppColors.secondaryText),
                    const SizedBox(width: 4),
                    Text(
                      item.substitutionDate,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryText,
                      ),
                    ),
                    if (item.periodNumber != null) ...[
                      const Text(' • ', style: TextStyle(color: AppColors.secondaryText)),
                      Text(
                        'Period ${item.periodNumber}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppColors.secondaryText,
                        ),
                      ),
                    ],
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Text(
                    item.status,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1D4ED8),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Subject & Class
            Text(
              item.subjectName ?? 'Subject',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryText,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.class_outlined, size: 14, color: AppColors.secondaryText),
                const SizedBox(width: 4),
                Text(
                  '${item.className ?? "Class"} • ${item.sectionName ?? "Section"}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.secondaryText,
                  ),
                ),
                if (item.startTime != null && item.endTime != null) ...[
                  const Text(' • ', style: TextStyle(color: AppColors.secondaryText)),
                  Text(
                    '${item.startTime} – ${item.endTime}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.secondaryText,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),

            // Teacher relation detail
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                children: [
                  Icon(
                    isAssignedToMe ? Icons.person_outline : Icons.supervised_user_circle_outlined,
                    size: 16,
                    color: AppColors.secondaryText,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      isAssignedToMe
                          ? 'Original Teacher: ${item.originalTeacherName ?? "Teacher"}'
                          : 'Covering Teacher: ${item.substituteTeacherName ?? "Teacher"}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.primaryText,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            if (item.remarks != null && item.remarks!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.notes, size: 14, color: AppColors.tertiaryText),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      item.remarks!,
                      style: const TextStyle(
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
