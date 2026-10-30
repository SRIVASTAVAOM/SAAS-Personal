import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../academics/bloc/academics_bloc.dart';
import '../../academics/bloc/academics_event.dart';
import '../../academics/bloc/academics_state.dart';
import '../../academics/models/student_roster_item.dart';
import '../../academics/presentation/student_roster_view.dart';
import '../../academics/repository/academics_repository.dart';
import '../../attendance/bloc/attendance_bloc.dart';
import '../../attendance/presentation/teacher_attendance_marking_view.dart';
import '../../attendance/presentation/teacher_own_attendance_view.dart';
import '../../attendance/repository/attendance_repository.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/models/user_model.dart';
import '../../curriculum/bloc/curriculum_bloc.dart';
import '../../curriculum/presentation/curriculum_view.dart';
import '../../curriculum/repository/curriculum_repository.dart';
import '../../homework/bloc/homework_bloc.dart';
import '../../homework/presentation/teacher_homework_manage_view.dart';
import '../../homework/repository/homework_repository.dart';
import '../../leaves/bloc/leaves_bloc.dart';
import '../../leaves/bloc/leaves_event.dart';
import '../../leaves/presentation/teacher_leave_view.dart';
import '../../leaves/repository/leaves_repository.dart';
import '../../materials/bloc/materials_bloc.dart';
import '../../materials/presentation/academic_materials_view.dart';
import '../../materials/repository/materials_repository.dart';
import '../../profiles/bloc/profile_bloc.dart';
import '../../profiles/bloc/profile_event.dart';
import '../../profiles/presentation/teacher_profile_view.dart';
import '../../profiles/repository/profile_repository.dart';
import '../../academics/bloc/exams_bloc.dart';
import '../../academics/models/teacher_allocation_model.dart';
import '../../academics/repositories/exams_repository.dart';
import '../../academics/views/exams_list_view.dart';
import '../../schedule/bloc/schedule_bloc.dart';
import '../../schedule/presentation/teacher_timetable_view.dart';
import '../../schedule/presentation/teacher_substitutions_view.dart';
import '../../schedule/presentation/teacher_online_classes_view.dart';
import '../../schedule/repository/schedule_repository.dart';
import 'views/teacher_dashboard_view.dart';

class TeacherShell extends StatefulWidget {
  final UserModel user;

  const TeacherShell({super.key, required this.user});

  @override
  State<TeacherShell> createState() => _TeacherShellState();
}

class _TeacherShellState extends State<TeacherShell> {
  int _selectedIndex = 0;
  int _attendanceSubTab = 0; // 0: Mark Class, 1: My Own Attendance
  int _classesSubTab = 0; // 0: Roster, 1: Homework, 2: Materials, 3: Syllabus, 4: Exams, 5: Update Student Details
  int _leavesInitialTab = 0; // 0: My Leaves, 1: Student Leave Requests
  int _rosterSegment = 0; // 0: Homeroom (Class Teacher), 1: All Taught Students / By Subject-Class
  String? _selectedClassSectionFilter; // e.g. '${classId}-${sectionId}' for All Taught view

  TeacherAllocationsResponse? _allocations;
  TeacherAllocationItem? _selectedAllocation;
  bool _isLoadingAllocations = true;
  AcademicsBloc? _academicsBloc;

  void _navigateToTab(int tabIndex, {int? attendanceSubTab, int? classesSubTab, int? leavesSubTab}) {
    setState(() {
      _selectedIndex = tabIndex;
      if (attendanceSubTab != null) _attendanceSubTab = attendanceSubTab;
      if (classesSubTab != null) _classesSubTab = classesSubTab;
      if (leavesSubTab != null) _leavesInitialTab = leavesSubTab;
    });
  }

  @override
  void initState() {
    super.initState();
    _academicsBloc = AcademicsBloc(
      repository: context.read<AcademicsRepository>(),
    )..add(LoadTeacherRosterEvent());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAllocations();
    });
  }

  @override
  void dispose() {
    _academicsBloc?.close();
    super.dispose();
  }

  Future<void> _loadAllocations() async {
    if (!mounted) return;
    try {
      setState(() => _isLoadingAllocations = true);
      final repo = context.read<AcademicsRepository>();
      final res = await repo.getTeacherAllocations();
      if (mounted) {
        setState(() {
          _allocations = res;
          if (res.allocations.isNotEmpty) {
            _selectedAllocation = res.allocations.first;
          }
          if (res.homeroom != null && res.homeroom!.classId.isNotEmpty) {
            _rosterSegment = 0;
            _academicsBloc?.add(
              LoadClassRosterEvent(
                classId: res.homeroom!.classId,
                sectionId: res.homeroom!.sectionId,
              ),
            );
          } else {
            _rosterSegment = 1;
          }
          _isLoadingAllocations = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingAllocations = false);
    }
  }

  List<({String classId, String sectionId, String label})> get _distinctClassSections {
    final result = <({String classId, String sectionId, String label})>[];
    final seen = <String>{};
    for (final a in (_allocations?.allocations ?? [])) {
      final key = '${a.classId}-${a.sectionId}';
      if (!seen.contains(key)) {
        seen.add(key);
        result.add((classId: a.classId, sectionId: a.sectionId, label: '${a.className} ${a.sectionName}'));
      }
    }
    return result;
  }

  String? get _attendanceClassId {
    if (_allocations?.homeroom != null && _allocations!.homeroom!.classId.isNotEmpty) {
      return _allocations!.homeroom!.classId;
    }
    if (widget.user.classId != null && widget.user.classId!.isNotEmpty) {
      return widget.user.classId;
    }
    if (_allocations?.allocations.isNotEmpty == true) {
      return _allocations!.allocations.first.classId;
    }
    return null;
  }

  String? get _attendanceSectionId {
    if (_allocations?.homeroom != null && _allocations!.homeroom!.sectionId.isNotEmpty) {
      return _allocations!.homeroom!.sectionId;
    }
    if (widget.user.sectionId != null && widget.user.sectionId!.isNotEmpty) {
      return widget.user.sectionId;
    }
    if (_allocations?.allocations.isNotEmpty == true) {
      return _allocations!.allocations.first.sectionId;
    }
    return null;
  }

  String get _attendanceClassName {
    if (_allocations?.homeroom != null && _allocations!.homeroom!.className.isNotEmpty) {
      return _allocations!.homeroom!.className;
    }
    if (_allocations?.allocations.isNotEmpty == true) {
      return _allocations!.allocations.first.className;
    }
    return 'Assigned Class';
  }

  String get _attendanceSectionName {
    if (_allocations?.homeroom != null && _allocations!.homeroom!.sectionName.isNotEmpty) {
      return _allocations!.homeroom!.sectionName;
    }
    if (_allocations?.allocations.isNotEmpty == true) {
      return _allocations!.allocations.first.sectionName;
    }
    return 'Section';
  }

  String? get _activeClassId =>
      _selectedAllocation?.classId ?? widget.user.classId;

  String? get _activeSectionId =>
      _selectedAllocation?.sectionId ?? widget.user.sectionId;

  String? get _activeSubjectId =>
      _selectedAllocation?.subjectId;

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(
          value: _academicsBloc!,
        ),
        BlocProvider(
          create: (ctx) => ProfileBloc(
            repository: ctx.read<ProfileRepository>(),
          )..add(LoadStaffProfileEvent()),
        ),
        BlocProvider(
          create: (ctx) => AttendanceBloc(
            repository: ctx.read<AttendanceRepository>(),
          ),
        ),
        BlocProvider(
          create: (ctx) => LeavesBloc(
            repository: ctx.read<LeavesRepository>(),
          )..add(const LoadStaffMyLeavesEvent()),
        ),
        BlocProvider(
          create: (ctx) => HomeworkBloc(
            ctx.read<HomeworkRepository>(),
          ),
        ),
        BlocProvider(
          create: (ctx) => CurriculumBloc(
            ctx.read<CurriculumRepository>(),
          ),
        ),
        BlocProvider(
          create: (ctx) => MaterialsBloc(
            ctx.read<MaterialsRepository>(),
          ),
        ),
        BlocProvider(
          create: (ctx) => ExamsBloc(
            repository: ctx.read<ExamsRepository>(),
          )..add(const LoadExamsEvent()),
        ),
        BlocProvider(
          create: (ctx) => ScheduleBloc(
            repository: ctx.read<ScheduleRepository>(),
          ),
        ),
      ],
      child: Scaffold(
        backgroundColor: AppColors.scaffoldBackground,
        appBar: AppBar(
          leading: Padding(
            padding: const EdgeInsets.only(left: 14, top: 10, bottom: 10, right: 2),
            child: Image.asset(
              'assets/images/logo_icon.png',
              fit: BoxFit.contain,
            ),
          ),
          leadingWidth: 44,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.user.displayName),
              Text(
                _allocations?.homeroom != null
                    ? 'Teacher Portal • Class Teacher: ${_allocations!.homeroom!.className} ${_allocations!.homeroom!.sectionName}'
                    : 'Teacher Portal • Subject Teacher',
                style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
              ),
            ],
          ),
          actions: [
            IconButton(
              tooltip: 'Sign Out',
              icon: const Icon(Icons.logout,
                  size: 20, color: AppColors.secondaryText),
              onPressed: () {
                context.read<AuthBloc>().add(LogoutRequestedEvent());
              },
            ),
          ],
        ),
        body: _buildCurrentTab(),
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            border: Border(
                top: BorderSide(color: AppColors.border, width: 1.0)),
          ),
          child: NavigationBar(
            selectedIndex: _selectedIndex,
            onDestinationSelected: (idx) =>
                setState(() => _selectedIndex = idx),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.dashboard_outlined),
                selectedIcon: Icon(Icons.dashboard),
                label: 'Dashboard',
              ),
              NavigationDestination(
                icon: Icon(Icons.check_circle_outline),
                selectedIcon: Icon(Icons.check_circle),
                label: 'Attendance',
              ),
              NavigationDestination(
                icon: Icon(Icons.class_outlined),
                selectedIcon: Icon(Icons.class_),
                label: 'Classes',
              ),
              NavigationDestination(
                icon: Icon(Icons.beach_access_outlined),
                selectedIcon: Icon(Icons.beach_access),
                label: 'Leaves',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentTab() {
    switch (_selectedIndex) {
      case 0:
        return TeacherDashboardView(
          user: widget.user,
          allocations: _allocations,
          onNavigateToTab: _navigateToTab,
        );
      case 1:
        return _buildAttendanceTab();
      case 2:
        return _buildClassesTab();
      case 3:
        return TeacherLeaveView(initialTab: _leavesInitialTab);
      case 4:
      default:
        return const TeacherProfileView();
    }
  }

  Widget _buildAttendanceTab() {
    return Column(
      children: [
        Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(
              bottom: BorderSide(color: AppColors.border),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              _buildSubTabButton(
                title: 'Mark Class Attendance',
                isSelected: _attendanceSubTab == 0,
                onTap: () => setState(() => _attendanceSubTab = 0),
              ),
              const SizedBox(width: 8),
              _buildSubTabButton(
                title: 'My Own Attendance',
                isSelected: _attendanceSubTab == 1,
                onTap: () => setState(() => _attendanceSubTab = 1),
              ),
            ],
          ),
        ),
        Expanded(
          child: _attendanceSubTab == 0
              ? (_attendanceClassId != null && _attendanceSectionId != null
                  ? TeacherAttendanceMarkingView(
                      key: ValueKey('att-$_attendanceClassId-$_attendanceSectionId'),
                      classId: _attendanceClassId!,
                      sectionId: _attendanceSectionId!,
                      className: _attendanceClassName,
                      sectionName: _attendanceSectionName,
                    )
                  : _buildNoAssignmentCard(
                      'No homeroom or class assigned for attendance marking.\nContact school administration to assign your class.',
                    ))
              : const TeacherOwnAttendanceView(),
        ),
      ],
    );
  }

  Widget _buildSubTabButton({
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primaryText
              : AppColors.scaffoldBackground,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isSelected ? AppColors.primaryText : AppColors.border,
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isSelected ? AppColors.surface : AppColors.primaryText,
          ),
        ),
      ),
    );
  }

  Widget _buildAllocationSelectorChips() {
    if (_isLoadingAllocations) {
      return const Padding(
        padding: EdgeInsets.all(8.0),
        child: SizedBox(
          height: 16,
          width: 16,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }
    final list = _allocations?.allocations ?? [];
    if (list.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: list.map((item) {
            final isSelected = _selectedAllocation?.id == item.id;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(
                  '${item.className} ${item.sectionName} • ${item.subjectName}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    color: isSelected ? AppColors.surface : AppColors.primaryText,
                  ),
                ),
                selected: isSelected,
                backgroundColor: AppColors.scaffoldBackground,
                selectedColor: AppColors.primaryText,
                checkmarkColor: AppColors.surface,
                side: BorderSide(
                  color: isSelected ? AppColors.primaryText : AppColors.border,
                ),
                onSelected: (val) {
                  if (val) {
                    setState(() => _selectedAllocation = item);
                    if (_classesSubTab == 2) {
                      context.read<MaterialsBloc>().add(
                            LoadClassMaterialsEvent(item.classId, item.subjectId),
                          );
                    } else if (_classesSubTab == 3) {
                      context.read<CurriculumBloc>().add(
                            LoadCurriculumUnitsEvent(item.classId, item.subjectId),
                          );
                    }
                  }
                },
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildNoAssignmentCard(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.school_outlined, size: 48, color: AppColors.secondaryText),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClassesTab() {
    return Column(
      children: [
        Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(
              bottom: BorderSide(color: AppColors.border),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildSubTabButton(
                  title: 'Student Roster',
                  isSelected: _classesSubTab == 0,
                  onTap: () {
                    setState(() => _classesSubTab = 0);
                    if (_rosterSegment == 0 && _allocations?.homeroom != null) {
                      _academicsBloc?.add(
                        LoadClassRosterEvent(
                          classId: _allocations!.homeroom!.classId,
                          sectionId: _allocations!.homeroom!.sectionId,
                        ),
                      );
                    } else {
                      _academicsBloc?.add(LoadTeacherRosterEvent());
                    }
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Update Student Details',
                  isSelected: _classesSubTab == 5,
                  onTap: () {
                    setState(() {
                      _classesSubTab = 5;
                      _rosterSegment = 0;
                    });
                    if (_allocations?.homeroom != null) {
                      _academicsBloc?.add(
                        LoadClassRosterEvent(
                          classId: _allocations!.homeroom!.classId,
                          sectionId: _allocations!.homeroom!.sectionId,
                        ),
                      );
                    }
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Homework',
                  isSelected: _classesSubTab == 1,
                  onTap: () {
                    setState(() => _classesSubTab = 1);
                    context.read<HomeworkBloc>().add(
                          const LoadTeacherHomeworkEvent(),
                        );
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Study Materials',
                  isSelected: _classesSubTab == 2,
                  onTap: () {
                    setState(() => _classesSubTab = 2);
                    final cId = _activeClassId ?? '';
                    final sId = _activeSubjectId ?? '';
                    if (cId.isNotEmpty && sId.isNotEmpty) {
                      context.read<MaterialsBloc>().add(
                            LoadClassMaterialsEvent(cId, sId),
                          );
                    }
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Syllabus & Topics',
                  isSelected: _classesSubTab == 3,
                  onTap: () {
                    setState(() => _classesSubTab = 3);
                    final cId = _activeClassId ?? '';
                    final sId = _activeSubjectId ?? '';
                    if (cId.isNotEmpty && sId.isNotEmpty) {
                      context.read<CurriculumBloc>().add(
                            LoadCurriculumUnitsEvent(cId, sId),
                          );
                    }
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Examinations',
                  isSelected: _classesSubTab == 4,
                  onTap: () {
                    setState(() => _classesSubTab = 4);
                    context.read<ExamsBloc>().add(const LoadExamsEvent());
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'My Timetable',
                  isSelected: _classesSubTab == 6,
                  onTap: () {
                    setState(() => _classesSubTab = 6);
                    context.read<ScheduleBloc>().add(const LoadTeacherTimetableEvent());
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Substitutions',
                  isSelected: _classesSubTab == 7,
                  onTap: () {
                    setState(() => _classesSubTab = 7);
                    context.read<ScheduleBloc>().add(const LoadTeacherSubstitutionsEvent());
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Online Classes',
                  isSelected: _classesSubTab == 8,
                  onTap: () {
                    setState(() => _classesSubTab = 8);
                    context.read<ScheduleBloc>().add(const LoadOnlineClassesEvent());
                  },
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: Builder(
            builder: (context) {
              if (_classesSubTab == 6) {
                return const TeacherTimetableView();
              }
              if (_classesSubTab == 7) {
                return const TeacherSubstitutionsView();
              }
              if (_classesSubTab == 8) {
                return const TeacherOnlineClassesView();
              }
              if (_classesSubTab == 1) {
                return Column(
                  children: [
                    _buildAllocationSelectorChips(),
                    Expanded(
                      child: TeacherHomeworkManageView(
                        key: ValueKey('hw-$_activeClassId-$_activeSectionId-$_activeSubjectId'),
                        classId: _activeClassId,
                        sectionId: _activeSectionId,
                        subjectId: _activeSubjectId,
                      ),
                    ),
                  ],
                );
              }
              if (_classesSubTab == 2) {
                if (_activeClassId == null || _activeSubjectId == null) {
                  return _buildNoAssignmentCard('No subject allocated to load study materials.');
                }
                return Column(
                  children: [
                    _buildAllocationSelectorChips(),
                    Expanded(
                      child: AcademicMaterialsView(
                        key: ValueKey('mat-$_activeClassId-$_activeSubjectId'),
                        classId: _activeClassId!,
                        subjectId: _activeSubjectId!,
                      ),
                    ),
                  ],
                );
              }
              if (_classesSubTab == 3) {
                if (_activeClassId == null || _activeSubjectId == null) {
                  return _buildNoAssignmentCard('No subject allocated to load syllabus & topics.');
                }
                return Column(
                  children: [
                    _buildAllocationSelectorChips(),
                    Expanded(
                      child: CurriculumView(
                        key: ValueKey('curr-$_activeClassId-$_activeSubjectId'),
                        classId: _activeClassId!,
                        subjectId: _activeSubjectId!,
                      ),
                    ),
                  ],
                );
              }
              if (_classesSubTab == 4) {
                return Column(
                  children: [
                    _buildAllocationSelectorChips(),
                    Expanded(
                      child: ExamsListView(
                        key: ValueKey('exam-$_activeClassId-$_activeSectionId'),
                        userRole: 'TEACHER',
                        classId: _activeClassId,
                        sectionId: _activeSectionId,
                      ),
                    ),
                  ],
                );
              }

              // ClassesSubTab 0 (Student Roster) and 5 (Update Student Details)
              return Column(
                children: [
                  if (_classesSubTab == 5 && _allocations?.homeroom != null)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.edit_note, size: 18, color: Color(0xFF2563EB)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Class Teacher Edit Mode (${_allocations!.homeroom!.className} ${_allocations!.homeroom!.sectionName}): Tap the edit icon next to any student to update roll number, blood group, emergency contact, or medical notes.',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF1E40AF)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  Container(
                    color: AppColors.surface,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: Row(
                      children: [
                        _buildSubTabButton(
                          title: 'Homeroom (Class Teacher)',
                          isSelected: _rosterSegment == 0,
                          onTap: () {
                            setState(() {
                              _rosterSegment = 0;
                              _selectedClassSectionFilter = null;
                            });
                            if (_allocations?.homeroom != null) {
                              _academicsBloc?.add(
                                LoadClassRosterEvent(
                                  classId: _allocations!.homeroom!.classId,
                                  sectionId: _allocations!.homeroom!.sectionId,
                                ),
                              );
                            }
                          },
                        ),
                        const SizedBox(width: 8),
                        _buildSubTabButton(
                          title: 'All Taught Students / By Subject-Class',
                          isSelected: _rosterSegment == 1,
                          onTap: () {
                            setState(() {
                              _rosterSegment = 1;
                              _selectedClassSectionFilter = null;
                            });
                            _academicsBloc?.add(LoadTeacherRosterEvent());
                          },
                        ),
                      ],
                    ),
                  ),
                  if (_rosterSegment == 1 && _distinctClassSections.isNotEmpty)
                    Container(
                      width: double.infinity,
                      color: AppColors.surface,
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(right: 6),
                              child: FilterChip(
                                label: const Text('All Classes', style: TextStyle(fontSize: 11)),
                                selected: _selectedClassSectionFilter == null,
                                onSelected: (val) {
                                  if (val) setState(() => _selectedClassSectionFilter = null);
                                },
                                backgroundColor: AppColors.scaffoldBackground,
                                selectedColor: AppColors.primaryText,
                                checkmarkColor: AppColors.surface,
                                labelStyle: TextStyle(
                                  color: _selectedClassSectionFilter == null
                                      ? AppColors.surface
                                      : AppColors.primaryText,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                            ..._distinctClassSections.map((cs) {
                              final key = '${cs.classId}-${cs.sectionId}';
                              final isSel = _selectedClassSectionFilter == key;
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: FilterChip(
                                  label: Text(cs.label, style: const TextStyle(fontSize: 11)),
                                  selected: isSel,
                                  onSelected: (val) {
                                    setState(() {
                                      _selectedClassSectionFilter = val ? key : null;
                                    });
                                  },
                                  backgroundColor: AppColors.scaffoldBackground,
                                  selectedColor: AppColors.primaryText,
                                  checkmarkColor: AppColors.surface,
                                  labelStyle: TextStyle(
                                    color: isSel ? AppColors.surface : AppColors.primaryText,
                                    fontSize: 11,
                                  ),
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    ),
                  Expanded(
                    child: _rosterSegment == 0 && _allocations?.homeroom == null
                        ? _buildNoAssignmentCard(
                            'You are not currently assigned as a Class Teacher for any homeroom.\nHomeroom roster and details editing are only available for Class Teachers.',
                          )
                        : BlocBuilder<AcademicsBloc, AcademicsState>(
                            builder: (context, state) {
                              if (state is AcademicsLoading) {
                                return const Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(32.0),
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                );
                              }

                              if (state is AcademicsError) {
                                return Center(
                                  child: Padding(
                                    padding: const EdgeInsets.all(24.0),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.error_outline,
                                            size: 36, color: AppColors.error),
                                        const SizedBox(height: 12),
                                        Text(
                                          state.message,
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                              fontSize: 13,
                                              color: AppColors.secondaryText),
                                        ),
                                        const SizedBox(height: 16),
                                        OutlinedButton(
                                          onPressed: () {
                                            if (_rosterSegment == 0 &&
                                                _allocations?.homeroom != null) {
                                              _academicsBloc?.add(
                                                LoadClassRosterEvent(
                                                  classId: _allocations!.homeroom!.classId,
                                                  sectionId: _allocations!.homeroom!.sectionId,
                                                ),
                                              );
                                            } else {
                                              _academicsBloc?.add(
                                                  LoadTeacherRosterEvent());
                                            }
                                          },
                                          style: OutlinedButton.styleFrom(
                                            side: const BorderSide(
                                                color: AppColors.border),
                                          ),
                                          child: const Text('Retry'),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }

                              if (state is RosterLoaded) {
                                List<StudentRosterItem> displayed = state.students;
                                if (_rosterSegment == 1 &&
                                    _selectedClassSectionFilter != null) {
                                  displayed = displayed.where((s) {
                                    if (s.classId == null || s.sectionId == null) {
                                      return true;
                                    }
                                    return '${s.classId}-${s.sectionId}' ==
                                        _selectedClassSectionFilter;
                                  }).toList();
                                }

                                final isHomeroom = _rosterSegment == 0 &&
                                    _allocations?.homeroom != null;
                                final title = isHomeroom
                                    ? '${_allocations!.homeroom!.className} ${_allocations!.homeroom!.sectionName} Homeroom Roster'
                                    : 'Taught Students Roster';

                                return StudentRosterView(
                                  title: title,
                                  students: displayed,
                                  canEdit: isHomeroom,
                                  onEditStudent: isHomeroom
                                      ? (student) => _openEditStudentDetailsDialog(
                                          context, student)
                                      : null,
                                );
                              }

                              return const Center(
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              );
                            },
                          ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  void _openEditStudentDetailsDialog(
    BuildContext context,
    StudentRosterItem student,
  ) {
    final rollCtrl = TextEditingController(text: student.rollNumber ?? '');
    final phoneCtrl = TextEditingController(text: student.emergencyPhone ?? '');
    final medicalCtrl = TextEditingController(text: student.medicalNotes ?? '');
    String? selectedBloodGroup = student.bloodGroup;

    final bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (selectedBloodGroup != null &&
        selectedBloodGroup.isNotEmpty &&
        !bloodGroups.contains(selectedBloodGroup)) {
      bloodGroups.add(selectedBloodGroup);
    }

    bool isSubmitting = false;
    String? errorMessage;

    showDialog(
      context: context,
      barrierDismissible: !isSubmitting,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (dialogCtx, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              actionsPadding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.scaffoldBackground,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Icon(Icons.edit_note, size: 20, color: AppColors.primaryText),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Update Student Details',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryText,
                          ),
                        ),
                        Text(
                          '${student.fullName} • Adm: ${student.admissionNumber}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.secondaryText,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.scaffoldBackground,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.lock_outline, size: 14, color: AppColors.secondaryText),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Identity fields (Admission: ${student.admissionNumber}, Class/Section) are immutable.',
                              style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFFFCA5A5)),
                        ),
                        child: Text(
                          errorMessage!,
                          style: const TextStyle(fontSize: 12, color: AppColors.error),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    TextField(
                      controller: rollCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Roll Number',
                        hintText: 'e.g. 15',
                        isDense: true,
                        filled: true,
                        fillColor: AppColors.surface,
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: selectedBloodGroup,
                      isDense: true,
                      decoration: const InputDecoration(
                        labelText: 'Blood Group',
                        filled: true,
                        fillColor: AppColors.surface,
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      items: [
                        const DropdownMenuItem<String>(
                          value: null,
                          child: Text('Not Specified', style: TextStyle(color: AppColors.secondaryText)),
                        ),
                        ...bloodGroups.map((bg) => DropdownMenuItem(
                              value: bg,
                              child: Text(bg),
                            )),
                      ],
                      onChanged: (val) {
                        setDialogState(() => selectedBloodGroup = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Emergency Contact Phone',
                        hintText: 'e.g. +91 9876543210',
                        isDense: true,
                        filled: true,
                        fillColor: AppColors.surface,
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: medicalCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Medical Notes / Allergies',
                        hintText: 'e.g. Asthmatic, allergic to peanuts',
                        isDense: true,
                        filled: true,
                        fillColor: AppColors.surface,
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.of(dialogCtx).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          setDialogState(() {
                            isSubmitting = true;
                            errorMessage = null;
                          });
                          try {
                            final profileRepo = context.read<ProfileRepository>();
                            await profileRepo.updateStudentProfileByTeacher(
                              student.id,
                              rollNumber: rollCtrl.text.trim().isEmpty ? null : rollCtrl.text.trim(),
                              bloodGroup: selectedBloodGroup,
                              emergencyContactPhone:
                                  phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                              medicalNotes:
                                  medicalCtrl.text.trim().isEmpty ? null : medicalCtrl.text.trim(),
                            );
                            if (dialogCtx.mounted) {
                              Navigator.of(dialogCtx).pop();
                            }
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Student details updated successfully'),
                                  backgroundColor: Color(0xFF16A34A),
                                ),
                              );
                              if (_rosterSegment == 0 && _allocations?.homeroom != null) {
                                _academicsBloc?.add(
                                  LoadClassRosterEvent(
                                    classId: _allocations!.homeroom!.classId,
                                    sectionId: _allocations!.homeroom!.sectionId,
                                  ),
                                );
                              } else {
                                _academicsBloc?.add(LoadTeacherRosterEvent());
                              }
                            }
                          } catch (e) {
                            setDialogState(() {
                              isSubmitting = false;
                              errorMessage = e.toString().replaceAll('Exception: ', '');
                            });
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryText,
                    foregroundColor: AppColors.surface,
                  ),
                  child: isSubmitting
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.surface),
                        )
                      : const Text('Save Changes'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
