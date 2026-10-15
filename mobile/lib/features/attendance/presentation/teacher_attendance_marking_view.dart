import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../academics/models/student_roster_item.dart';
import '../../academics/repository/academics_repository.dart';
import '../bloc/attendance_bloc.dart';
import '../bloc/attendance_event.dart';
import '../bloc/attendance_state.dart';

class TeacherAttendanceMarkingView extends StatefulWidget {
  final String classId;
  final String sectionId;
  final String className;
  final String sectionName;

  const TeacherAttendanceMarkingView({
    super.key,
    required this.classId,
    required this.sectionId,
    this.className = 'Grade 10',
    this.sectionName = 'Section A',
  });

  @override
  State<TeacherAttendanceMarkingView> createState() =>
      _TeacherAttendanceMarkingViewState();
}

class _TeacherAttendanceMarkingViewState
    extends State<TeacherAttendanceMarkingView> {
  late String _selectedDate;
  List<StudentRosterItem> _students = [];
  Map<String, String> _attendanceMap = {}; // studentId -> 'PRESENT' | 'ABSENT'
  bool _isLoadingRoster = true;
  String? _rosterError;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().toIso8601String().split('T')[0];
    _fetchClassData();
  }

  Future<void> _fetchClassData() async {
    setState(() {
      _isLoadingRoster = true;
      _rosterError = null;
    });

    try {
      final academicsRepo = context.read<AcademicsRepository>();
      final students = await academicsRepo.getClassRoster(
        widget.classId,
        widget.sectionId,
      );

      // Default attendance to PRESENT for all students
      final map = <String, String>{};
      for (final s in students) {
        map[s.id] = 'PRESENT';
      }

      setState(() {
        _students = students;
        _attendanceMap = map;
        _isLoadingRoster = false;
      });

      // Load already saved attendance for the date if any
      if (mounted) {
        context.read<AttendanceBloc>().add(
              LoadClassAttendanceEvent(
                classId: widget.classId,
                sectionId: widget.sectionId,
                date: _selectedDate,
              ),
            );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _rosterError = e.toString().replaceAll('Exception: ', '');
          _isLoadingRoster = false;
        });
      }
    }
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.tryParse(_selectedDate) ?? now,
      firstDate: DateTime(2025),
      lastDate: DateTime(2027),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryText,
              onPrimary: AppColors.surface,
              surface: AppColors.surface,
              onSurface: AppColors.primaryText,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted = picked.toIso8601String().split('T')[0];
      setState(() {
        _selectedDate = formatted;
      });
      if (mounted) {
        context.read<AttendanceBloc>().add(
              LoadClassAttendanceEvent(
                classId: widget.classId,
                sectionId: widget.sectionId,
                date: _selectedDate,
              ),
            );
      }
    }
  }

  void _submitAttendance() {
    final records = _attendanceMap.entries.map((e) {
      return {
        'student_id': e.key,
        'status': e.value,
        'remarks': null,
      };
    }).toList();

    context.read<AttendanceBloc>().add(
          SubmitClassAttendanceEvent(
            classId: widget.classId,
            sectionId: widget.sectionId,
            attendanceDate: _selectedDate,
            records: records,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AttendanceBloc, AttendanceState>(
      listener: (context, state) {
        if (state is AttendanceSubmittedSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.primaryText,
            ),
          );
        } else if (state is ClassAttendanceLoaded) {
          // Merge existing saved records into our local state map
          setState(() {
            for (final record in state.records) {
              _attendanceMap[record.studentId] = record.status;
            }
          });
        }
      },
      child: Column(
        children: [
          // Header Controls
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${widget.className} - ${widget.sectionName}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryText,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Homeroom Daily Attendance',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.secondaryText,
                          ),
                        ),
                      ],
                    ),
                    OutlinedButton.icon(
                      onPressed: _selectDate,
                      icon: const Icon(Icons.calendar_month_outlined, size: 16),
                      label: Text(_selectedDate),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.border),
                        foregroundColor: AppColors.primaryText,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Stats preview
                Row(
                  children: [
                    _buildStatChip(
                      label: 'Total',
                      count: _students.length,
                      color: AppColors.primaryText,
                    ),
                    const SizedBox(width: 8),
                    _buildStatChip(
                      label: 'Present',
                      count: _attendanceMap.values
                          .where((s) => s == 'PRESENT')
                          .length,
                      color: const Color(0xFF15803D),
                    ),
                    const SizedBox(width: 8),
                    _buildStatChip(
                      label: 'Absent',
                      count: _attendanceMap.values
                          .where((s) => s == 'ABSENT')
                          .length,
                      color: const Color(0xFFB91C1C),
                    ),
                    const Spacer(),
                    BlocBuilder<AttendanceBloc, AttendanceState>(
                      builder: (context, state) {
                        final isSaving = state is AttendanceLoading;
                        return ElevatedButton(
                          onPressed: isSaving || _isLoadingRoster
                              ? null
                              : _submitAttendance,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryText,
                            foregroundColor: AppColors.surface,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                          ),
                          child: isSaving
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.surface,
                                  ),
                                )
                              : const Text('Save Attendance'),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Student Roster list
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoadingRoster) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    if (_rosterError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 36, color: AppColors.error),
              const SizedBox(height: 12),
              Text(
                _rosterError!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.secondaryText,
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: _fetchClassData,
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

    if (_students.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text(
            'No students enrolled in this section.',
            style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _students.length,
      itemBuilder: (context, index) {
        final student = _students[index];
        final currentStatus = _attendanceMap[student.id] ?? 'PRESENT';
        final isPresent = currentStatus == 'PRESENT';

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.scaffoldBackground,
                child: Text(
                  student.rollNumber?.toString() ?? '${index + 1}',
                  style: const TextStyle(
                    fontSize: 12,
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
                    Text(
                      '${student.firstName} ${student.lastName}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryText,
                      ),
                    ),
                    Text(
                      'Adm: ${student.admissionNumber}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ],
                ),
              ),
              // Status Toggle (PRESENT / ABSENT)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ChoiceChip(
                    label: const Text('P'),
                    selected: isPresent,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _attendanceMap[student.id] = 'PRESENT';
                        });
                      }
                    },
                    selectedColor: const Color(0xFFDCFCE7),
                    backgroundColor: AppColors.scaffoldBackground,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isPresent
                          ? const Color(0xFF15803D)
                          : AppColors.secondaryText,
                    ),
                    visualDensity: VisualDensity.compact,
                  ),
                  const SizedBox(width: 6),
                  ChoiceChip(
                    label: const Text('A'),
                    selected: !isPresent,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _attendanceMap[student.id] = 'ABSENT';
                        });
                      }
                    },
                    selectedColor: const Color(0xFFFEE2E2),
                    backgroundColor: AppColors.scaffoldBackground,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: !isPresent
                          ? const Color(0xFFB91C1C)
                          : AppColors.secondaryText,
                    ),
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatChip({
    required String label,
    required int count,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.scaffoldBackground,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
          ),
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
