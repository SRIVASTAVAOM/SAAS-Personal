import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../academics/models/teacher_allocation_model.dart';
import '../../academics/repository/academics_repository.dart';
import '../bloc/schedule_bloc.dart';
import '../models/online_class_model.dart';

class TeacherOnlineClassesView extends StatefulWidget {
  const TeacherOnlineClassesView({super.key});

  @override
  State<TeacherOnlineClassesView> createState() => _TeacherOnlineClassesViewState();
}

class _TeacherOnlineClassesViewState extends State<TeacherOnlineClassesView> {
  @override
  void initState() {
    super.initState();
    context.read<ScheduleBloc>().add(const LoadOnlineClassesEvent());
  }

  void _showScheduleModal(BuildContext context) async {
    List<TeacherAllocationItem> allocations = [];
    try {
      final repo = context.read<AcademicsRepository>();
      final res = await repo.getTeacherAllocations();
      allocations = res.allocations;
    } catch (_) {}

    if (!context.mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (bottomSheetContext) {
        return _ScheduleOnlineClassSheet(
          allocations: allocations,
          onSchedule: (classId, sectionId, subjectId, title, date, time, duration, url) {
            context.read<ScheduleBloc>().add(
                  CreateOnlineClassEvent(
                    classId: classId,
                    sectionId: sectionId,
                    subjectId: subjectId,
                    title: title,
                    scheduledDate: date,
                    startTime: time,
                    durationMinutes: duration,
                    meetingUrl: url,
                  ),
                );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: BlocConsumer<ScheduleBloc, ScheduleState>(
        listener: (context, state) {
          if (state is ScheduleActionSuccessState) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is ScheduleErrorState) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          return Column(
            children: [
              // Top Action Header
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
                  children: [
                    const Text(
                      'Live & Scheduled Classes',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryText,
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _showScheduleModal(context),
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Schedule Class'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryAccent,
                        foregroundColor: AppColors.surface,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Sessions List
              Expanded(
                child: Builder(
                  builder: (context) {
                    if (state is ScheduleLoadingState) {
                      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
                    }

                    final sessions = state is ScheduleLoadedState
                        ? state.onlineClasses
                        : <OnlineClassModel>[];

                    if (sessions.isEmpty) {
                      return RefreshIndicator(
                        onRefresh: () async {
                          context.read<ScheduleBloc>().add(const LoadOnlineClassesEvent());
                        },
                        child: ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                            Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.video_call_outlined, size: 54, color: AppColors.tertiaryText),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'No online class sessions scheduled',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.secondaryText,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Tap "+ Schedule Class" to create a meeting session with Google Meet or Zoom',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.tertiaryText,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  OutlinedButton.icon(
                                    onPressed: () => _showScheduleModal(context),
                                    icon: const Icon(Icons.add, size: 16),
                                    label: const Text('Schedule First Session'),
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
                        context.read<ScheduleBloc>().add(const LoadOnlineClassesEvent());
                      },
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: sessions.length,
                        itemBuilder: (context, index) {
                          final session = sessions[index];
                          return _buildSessionCard(context, session);
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSessionCard(BuildContext context, OnlineClassModel session) {
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
            // Top Row: Date, Time & Delete button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.event, size: 14, color: AppColors.secondaryText),
                    const SizedBox(width: 4),
                    Text(
                      session.scheduledDate,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryText,
                      ),
                    ),
                    const Text(' • ', style: TextStyle(color: AppColors.secondaryText)),
                    const Icon(Icons.access_time, size: 14, color: AppColors.secondaryText),
                    const SizedBox(width: 4),
                    Text(
                      '${session.startTime} (${session.durationMinutes}m)',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
                  tooltip: 'Cancel Session',
                  visualDensity: VisualDensity.compact,
                  onPressed: () => _confirmDelete(context, session),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Title
            Text(
              session.title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryText,
              ),
            ),
            const SizedBox(height: 4),

            // Class & Subject Badge
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Text(
                    session.subjectName ?? 'Subject',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryText,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '${session.className ?? "Class"} • ${session.sectionName ?? "Section"}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.secondaryText,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Launch Meeting Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _launchMeeting(context, session.meetingUrl),
                icon: const Icon(Icons.videocam, size: 16),
                label: const Text('Launch Meeting'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryText,
                  foregroundColor: AppColors.surface,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _launchMeeting(BuildContext context, String url) {
    Clipboard.setData(ClipboardData(text: url));
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.video_call, color: AppColors.info),
              SizedBox(width: 8),
              Text('Online Class Meeting', style: TextStyle(fontSize: 16)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Meeting link has been copied to your clipboard. Paste into your browser or meeting app to join:',
                style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.border),
                ),
                child: SelectableText(
                  url,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.info,
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Done'),
            ),
          ],
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, OnlineClassModel session) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Cancel Online Class'),
          content: Text(
            'Are you sure you want to cancel and remove "${session.title}"? Students will no longer see this session.',
            style: const TextStyle(fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Keep'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                context.read<ScheduleBloc>().add(DeleteOnlineClassEvent(session.id));
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
              ),
              child: const Text('Cancel Session'),
            ),
          ],
        );
      },
    );
  }
}

class _ScheduleOnlineClassSheet extends StatefulWidget {
  final List<TeacherAllocationItem> allocations;
  final void Function(
    String classId,
    String sectionId,
    String subjectId,
    String title,
    String date,
    String time,
    int duration,
    String url,
  ) onSchedule;

  const _ScheduleOnlineClassSheet({
    required this.allocations,
    required this.onSchedule,
  });

  @override
  State<_ScheduleOnlineClassSheet> createState() => _ScheduleOnlineClassSheetState();
}

class _ScheduleOnlineClassSheetState extends State<_ScheduleOnlineClassSheet> {
  final _formKey = GlobalKey<FormState>();
  TeacherAllocationItem? _selectedAllocation;
  final _titleController = TextEditingController();
  final _dateController = TextEditingController();
  final _timeController = TextEditingController();
  final _durationController = TextEditingController(text: '40');
  final _urlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.allocations.isNotEmpty) {
      _selectedAllocation = widget.allocations.first;
    }
    final now = DateTime.now();
    _dateController.text =
        '${now.year}-${now.month.toString().padLeft(2, "0")}-${now.day.toString().padLeft(2, "0")}';
    _timeController.text = '10:00 AM';
  }

  @override
  void dispose() {
    _titleController.dispose();
    _dateController.dispose();
    _timeController.dispose();
    _durationController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Schedule Online Class',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryText,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Allocation Selector
              if (widget.allocations.isNotEmpty) ...[
                const Text(
                  'Class & Subject',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.secondaryText),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<TeacherAllocationItem>(
                  initialValue: _selectedAllocation,
                  isExpanded: true,
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  items: widget.allocations.map((a) {
                    return DropdownMenuItem(
                      value: a,
                      child: Text('${a.className} ${a.sectionName} • ${a.subjectName}',
                          style: const TextStyle(fontSize: 13)),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() => _selectedAllocation = val);
                  },
                ),
                const SizedBox(height: 12),
              ],

              // Session Title
              const Text(
                'Session Title',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.secondaryText),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  hintText: 'e.g. Revision on Quadratic Equations',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                ),
                validator: (val) =>
                    (val == null || val.trim().isEmpty) ? 'Please enter a session title' : null,
              ),
              const SizedBox(height: 12),

              // Date & Time Row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Date (YYYY-MM-DD)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.secondaryText),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _dateController,
                          decoration: InputDecoration(
                            hintText: '2026-10-20',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) return 'Date required';
                            if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(val.trim())) {
                              return 'Format YYYY-MM-DD';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Start Time',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.secondaryText),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _timeController,
                          decoration: InputDecoration(
                            hintText: '10:00 AM',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                          validator: (val) =>
                              (val == null || val.trim().isEmpty) ? 'Time required' : null,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Duration & Meeting URL
              Row(
                children: [
                  SizedBox(
                    width: 100,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Duration (min)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.secondaryText),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _durationController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            hintText: '40',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                          validator: (val) {
                            final parsed = int.tryParse(val ?? '');
                            if (parsed == null || parsed <= 0) return 'Invalid';
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Meeting URL (https://)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.secondaryText),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _urlController,
                          decoration: InputDecoration(
                            hintText: 'https://meet.google.com/xyz',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) return 'URL required';
                            if (!val.trim().startsWith('https://')) {
                              return 'Must start with https://';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState?.validate() ?? false) {
                      if (_selectedAllocation == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please select an allocated class & subject')),
                        );
                        return;
                      }
                      Navigator.pop(context);
                      widget.onSchedule(
                        _selectedAllocation!.classId,
                        _selectedAllocation!.sectionId,
                        _selectedAllocation!.subjectId,
                        _titleController.text.trim(),
                        _dateController.text.trim(),
                        _timeController.text.trim(),
                        int.tryParse(_durationController.text) ?? 40,
                        _urlController.text.trim(),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryAccent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  child: const Text('Schedule Class Session', style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
