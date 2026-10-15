import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../models/staff_attendance_record_model.dart';
import '../repository/attendance_repository.dart';

class ManagementStaffAttendanceView extends StatefulWidget {
  const ManagementStaffAttendanceView({super.key});

  @override
  State<ManagementStaffAttendanceView> createState() =>
      _ManagementStaffAttendanceViewState();
}

class _ManagementStaffAttendanceViewState
    extends State<ManagementStaffAttendanceView> {
  late String _selectedDate;
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  List<StaffAttendanceRecordModel> _staffList = [];
  final Map<String, String> _statusMap = {}; // staffId -> status ('PRESENT' / 'ABSENT')
  final Map<String, TextEditingController> _remarksControllers = {};
  final Map<String, TextEditingController> _inTimeControllers = {};
  final Map<String, TextEditingController> _outTimeControllers = {};

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().toIso8601String().split('T')[0];
    _fetchStaffAttendance();
  }

  @override
  void dispose() {
    for (final c in _remarksControllers.values) {
      c.dispose();
    }
    for (final c in _inTimeControllers.values) {
      c.dispose();
    }
    for (final c in _outTimeControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchStaffAttendance() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final repo = context.read<AttendanceRepository>();
      final records = await repo.getManagementStaffAttendanceOverview(
        date: _selectedDate,
      );

      _statusMap.clear();
      _remarksControllers.clear();
      _inTimeControllers.clear();
      _outTimeControllers.clear();

      for (final r in records) {
        // If status is 'PENDING', default to 'PRESENT' for quick workflow
        _statusMap[r.staffId] = (r.status == 'PENDING') ? 'PRESENT' : r.status;
        _remarksControllers[r.staffId] = TextEditingController(text: r.remarks ?? '');
        _inTimeControllers[r.staffId] = TextEditingController(text: r.inTime ?? '08:00:00');
        _outTimeControllers[r.staffId] = TextEditingController(text: r.outTime ?? '15:30:00');
      }

      setState(() {
        _staffList = records;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _saveAttendance() async {
    if (_staffList.isEmpty) return;

    setState(() => _isSaving = true);

    try {
      final repo = context.read<AttendanceRepository>();
      final recordsToSubmit = _staffList.map((s) {
        final status = _statusMap[s.staffId] ?? 'PRESENT';
        final inTime = _inTimeControllers[s.staffId]?.text.trim();
        final outTime = _outTimeControllers[s.staffId]?.text.trim();
        final remarks = _remarksControllers[s.staffId]?.text.trim();

        return {
          'staffId': s.staffId,
          'status': status,
          'inTime': inTime?.isNotEmpty == true ? inTime : null,
          'outTime': outTime?.isNotEmpty == true ? outTime : null,
          'remarks': remarks?.isNotEmpty == true ? remarks : null,
        };
      }).toList();

      await repo.markStaffAttendance(
        date: _selectedDate,
        records: recordsToSubmit,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Staff attendance for $_selectedDate saved successfully.',
            style: const TextStyle(color: Colors.white),
          ),
          backgroundColor: AppColors.success,
        ),
      );

      await _fetchStaffAttendance();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _markAll(String status) {
    setState(() {
      for (final s in _staffList) {
        _statusMap[s.staffId] = status;
      }
    });
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
      setState(() {
        _selectedDate = picked.toIso8601String().split('T')[0];
      });
      _fetchStaffAttendance();
    }
  }

  @override
  Widget build(BuildContext context) {
    final presentCount =
        _statusMap.values.where((v) => v == 'PRESENT').length;
    final absentCount =
        _statusMap.values.where((v) => v == 'ABSENT').length;

    return Column(
      children: [
        // Top Control Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Teacher & Staff Attendance',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryText,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Date: $_selectedDate',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ],
                ),
              ),
              OutlinedButton.icon(
                key: const Key('managementSelectDateBtn'),
                onPressed: _selectDate,
                icon: const Icon(Icons.calendar_today, size: 14),
                label: const Text('Change Date'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primaryText,
                  side: const BorderSide(color: AppColors.border),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ],
          ),
        ),

        // Summary Statistics & Quick Actions Bar
        if (!_isLoading && _staffList.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: AppColors.surface,
            child: Row(
              children: [
                _buildStatPill('Total: ${_staffList.length}', Colors.grey.shade700),
                const SizedBox(width: 8),
                _buildStatPill('Present: $presentCount', AppColors.success),
                const SizedBox(width: 8),
                _buildStatPill('Absent: $absentCount', AppColors.error),
                const Spacer(),
                TextButton(
                  onPressed: () => _markAll('PRESENT'),
                  child: const Text('All Present', style: TextStyle(fontSize: 12)),
                ),
                TextButton(
                  onPressed: () => _markAll('ABSENT'),
                  child: const Text('All Absent', style: TextStyle(fontSize: 12, color: AppColors.error)),
                ),
              ],
            ),
          ),

        const Divider(height: 1, color: AppColors.border),

        // Body Content
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _errorMessage != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline,
                                size: 40, color: AppColors.error),
                            const SizedBox(height: 12),
                            Text(
                              _errorMessage!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: AppColors.primaryText),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _fetchStaffAttendance,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _staffList.isEmpty
                      ? const Center(
                          child: Text(
                            'No staff members found in the school roster.',
                            style: TextStyle(color: AppColors.secondaryText),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _fetchStaffAttendance,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            itemCount: _staffList.length,
                            separatorBuilder: (ctx, i) =>
                                const SizedBox(height: 10),
                            itemBuilder: (ctx, i) =>
                                _buildStaffCard(_staffList[i]),
                          ),
                        ),
        ),

        // Bottom Save Bar
        if (!_isLoading && _staffList.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                key: const Key('saveStaffAttendanceBtn'),
                onPressed: _isSaving ? null : _saveAttendance,
                icon: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.check_circle_outline),
                label: Text(
                  _isSaving
                      ? 'Saving Attendance...'
                      : 'Save Staff Attendance ($_selectedDate)',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryText,
                  foregroundColor: AppColors.surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildStatPill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildStaffCard(StaffAttendanceRecordModel staff) {
    final currentStatus = _statusMap[staff.staffId] ?? 'PRESENT';
    final isPresent = currentStatus == 'PRESENT';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isPresent
              ? AppColors.border
              : AppColors.error.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar
              CircleAvatar(
                radius: 20,
                backgroundColor: isPresent
                    ? AppColors.primaryText
                    : AppColors.error.withValues(alpha: 0.8),
                child: Text(
                  staff.staffName?.isNotEmpty == true
                      ? staff.staffName![0].toUpperCase()
                      : 'S',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Name and Employee code
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      staff.staffName ?? 'Staff Member',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryText,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          staff.employeeCode ?? 'EMP-N/A',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.secondaryText,
                          ),
                        ),
                        if (staff.wingName != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: Colors.blue.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              staff.wingName!,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Colors.blueAccent,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              // Status Toggle Segment
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'PRESENT',
                    label: Text('P', style: TextStyle(fontWeight: FontWeight.bold)),
                    icon: Icon(Icons.check, size: 14),
                  ),
                  ButtonSegment(
                    value: 'ABSENT',
                    label: Text('A', style: TextStyle(fontWeight: FontWeight.bold)),
                    icon: Icon(Icons.close, size: 14),
                  ),
                ],
                selected: {currentStatus},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() {
                    _statusMap[staff.staffId] = newSelection.first;
                  });
                },
                style: ButtonStyle(
                  visualDensity: VisualDensity.compact,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),

          // In Time / Remarks row
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _inTimeControllers[staff.staffId],
                  decoration: const InputDecoration(
                    labelText: 'In-Time',
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    border: OutlineInputBorder(),
                  ),
                  style: const TextStyle(fontSize: 12),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _outTimeControllers[staff.staffId],
                  decoration: const InputDecoration(
                    labelText: 'Out-Time',
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    border: OutlineInputBorder(),
                  ),
                  style: const TextStyle(fontSize: 12),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 3,
                child: TextField(
                  controller: _remarksControllers[staff.staffId],
                  decoration: const InputDecoration(
                    labelText: 'Remarks',
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    border: OutlineInputBorder(),
                  ),
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
