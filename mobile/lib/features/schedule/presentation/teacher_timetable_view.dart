import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../bloc/schedule_bloc.dart';
import '../models/timetable_slot_model.dart';

class TeacherTimetableView extends StatefulWidget {
  const TeacherTimetableView({super.key});

  @override
  State<TeacherTimetableView> createState() => _TeacherTimetableViewState();
}

class _TeacherTimetableViewState extends State<TeacherTimetableView> {
  late int _selectedDay; // 1 = Mon ... 6 = Sat

  final List<({int id, String label, String full})> _days = const [
    (id: 1, label: 'Mon', full: 'Monday'),
    (id: 2, label: 'Tue', full: 'Tuesday'),
    (id: 3, label: 'Wed', full: 'Wednesday'),
    (id: 4, label: 'Thu', full: 'Thursday'),
    (id: 5, label: 'Fri', full: 'Friday'),
    (id: 6, label: 'Sat', full: 'Saturday'),
  ];

  @override
  void initState() {
    super.initState();
    // Default to current weekday if Mon-Sat, else Monday
    final currentWeekday = DateTime.now().weekday;
    _selectedDay = (currentWeekday >= 1 && currentWeekday <= 6) ? currentWeekday : 1;
    context.read<ScheduleBloc>().add(const LoadTeacherTimetableEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: Column(
        children: [
          // Day selector tab bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(
                bottom: BorderSide(color: AppColors.border),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: _days.map((day) {
                final isSelected = _selectedDay == day.id;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: InkWell(
                      onTap: () => setState(() => _selectedDay = day.id),
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primaryText
                              : AppColors.scaffoldBackground,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primaryText
                                : AppColors.border,
                          ),
                        ),
                        child: Text(
                          day.label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            color: isSelected
                                ? AppColors.surface
                                : AppColors.primaryText,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Period list
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
                                .add(const LoadTeacherTimetableEvent()),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final slots = state is ScheduleLoadedState ? state.timetable : <TimetableSlotModel>[];
                final daySlots = slots.where((s) => s.dayOfWeek == _selectedDay).toList()
                  ..sort((a, b) => a.periodNumber.compareTo(b.periodNumber));

                if (daySlots.isEmpty) {
                  final dayName = _days.firstWhere((d) => d.id == _selectedDay).full;
                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<ScheduleBloc>().add(const LoadTeacherTimetableEvent());
                    },
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                        Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.calendar_today_outlined, size: 48, color: AppColors.tertiaryText),
                              const SizedBox(height: 12),
                              Text(
                                'No periods scheduled for $dayName',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.secondaryText,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Enjoy your preparation time or free period',
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
                    context.read<ScheduleBloc>().add(const LoadTeacherTimetableEvent());
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: daySlots.length,
                    itemBuilder: (context, index) {
                      final slot = daySlots[index];
                      return _buildPeriodCard(slot);
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

  Widget _buildPeriodCard(TimetableSlotModel slot) {
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Period Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Text(
                    'Period ${slot.periodNumber}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryText,
                    ),
                  ),
                ),
                // Time Range
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 14, color: AppColors.secondaryText),
                    const SizedBox(width: 4),
                    Text(
                      '${slot.startTime} – ${slot.endTime}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Subject & Class row
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        slot.subjectName ?? 'Subject',
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
                            '${slot.className ?? "Class"} • ${slot.sectionName ?? "Section"}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.secondaryText,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Room info if available
                if (slot.roomNumber != null && slot.roomNumber!.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.meeting_room_outlined, size: 14, color: AppColors.secondaryText),
                        const SizedBox(width: 4),
                        Text(
                          slot.roomNumber!,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.secondaryText,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
