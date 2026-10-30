import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../academics/bloc/academics_bloc.dart';
import '../../academics/bloc/academics_event.dart';
import '../../academics/bloc/academics_state.dart';
import '../../academics/models/subject_model.dart';
import '../../academics/presentation/student_roster_view.dart';
import '../../academics/presentation/subject_teachers_view.dart';
import '../../academics/repository/academics_repository.dart';
import '../../academics/bloc/exams_bloc.dart';
import '../../academics/repositories/exams_repository.dart';
import '../../academics/views/exams_list_view.dart';
import '../../attendance/bloc/attendance_bloc.dart';
import '../../attendance/bloc/attendance_event.dart';
import '../../attendance/presentation/student_attendance_history_view.dart';
import '../../attendance/repository/attendance_repository.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/models/user_model.dart';
import '../../curriculum/bloc/curriculum_bloc.dart';
import '../../curriculum/presentation/curriculum_view.dart';
import '../../curriculum/repository/curriculum_repository.dart';
import '../../homework/bloc/homework_bloc.dart';
import '../../homework/presentation/student_homework_view.dart';
import '../../homework/repository/homework_repository.dart';
import '../../leaves/bloc/leaves_bloc.dart';
import '../../leaves/bloc/leaves_event.dart';
import '../../leaves/presentation/student_leave_view.dart';
import '../../leaves/repository/leaves_repository.dart';
import '../../materials/bloc/materials_bloc.dart';
import '../../materials/presentation/academic_materials_view.dart';
import '../../materials/repository/materials_repository.dart';
import '../../profiles/bloc/profile_bloc.dart';
import '../../profiles/bloc/profile_event.dart';
import '../../profiles/bloc/profile_state.dart';
import '../../profiles/presentation/student_profile_view.dart';
import '../../profiles/repository/profile_repository.dart';
import '../bloc/student_features_bloc.dart';
import '../bloc/student_features_event.dart';
import '../repository/student_features_repository.dart';
import 'views/school_contact_view.dart';
import 'views/student_birthdays_view.dart';
import 'views/student_complaints_view.dart';
import 'views/student_dashboard_view.dart';
import 'views/student_feedback_view.dart';
import 'views/student_fees_view.dart';
import 'views/student_notices_view.dart';
import '../../schedule/bloc/schedule_bloc.dart';
import '../../schedule/presentation/student_online_classes_view.dart';
import '../../schedule/repository/schedule_repository.dart';

class StudentShell extends StatefulWidget {
  final UserModel user;

  const StudentShell({super.key, required this.user});

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends State<StudentShell> {
  int _selectedIndex = 0;
  int _academicSubTab = 0; // 0: Homework, 1: Materials, 2: Syllabus, 3: Classmates, 4: Birthdays, 5: Teachers, 6: Exams
  int _servicesSubTab = 0; // 0: Profile, 1: Leaves, 2: Notices, 3: Complaints, 4: Feedback, 5: Contact

  List<SubjectModel> _subjects = [];
  SubjectModel? _selectedSubject;
  bool _loadingSubjects = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchSubjects();
    });
  }

  Future<void> _fetchSubjects() async {
    if (!mounted) return;
    try {
      setState(() => _loadingSubjects = true);
      final repo = context.read<AcademicsRepository>();
      final subjects = await repo.getSubjects();
      if (mounted) {
        setState(() {
          _subjects = subjects;
          if (subjects.isNotEmpty) {
            _selectedSubject = subjects.first;
          }
          _loadingSubjects = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingSubjects = false);
    }
  }

  void _navigateToTab(int tabIndex, {int? academicSubTab, int? servicesSubTab}) {
    setState(() {
      _selectedIndex = tabIndex;
      if (academicSubTab != null) {
        _academicSubTab = academicSubTab;
      }
      if (servicesSubTab != null) {
        _servicesSubTab = servicesSubTab;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (ctx) => AcademicsBloc(
            repository: ctx.read<AcademicsRepository>(),
          )..add(
              LoadClassRosterEvent(
                classId: widget.user.classId ?? '',
                sectionId: widget.user.sectionId ?? '',
              ),
            ),
        ),
        BlocProvider(
          create: (ctx) => ProfileBloc(
            repository: ctx.read<ProfileRepository>(),
          )..add(LoadStudentProfileEvent()),
        ),
        BlocProvider(
          create: (ctx) => AttendanceBloc(
            repository: ctx.read<AttendanceRepository>(),
          )..add(const LoadStudentOwnAttendanceEvent()),
        ),
        BlocProvider(
          create: (ctx) => LeavesBloc(
            repository: ctx.read<LeavesRepository>(),
          )..add(const LoadStudentMyLeavesEvent()),
        ),
        BlocProvider(
          create: (ctx) => HomeworkBloc(
            ctx.read<HomeworkRepository>(),
          )..add(const LoadStudentHomeworkEvent()),
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
          create: (ctx) => StudentFeaturesBloc(
            repository: ctx.read<StudentFeaturesRepository>(),
          )..add(const LoadStudentNoticesEvent())
           ..add(const LoadStudentFeesEvent()),
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
              Text(_selectedIndex == 0 ? 'Student Dashboard' : widget.user.displayName),
              BlocBuilder<ProfileBloc, ProfileState>(
                builder: (context, state) {
                  String subtitle = 'Student Portal';
                  if (state is StudentProfileLoaded) {
                    final isUuid = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
                    final rawCls = state.profile.className;
                    final rawSec = state.profile.sectionName;
                    final cls = (rawCls != null && rawCls.trim().isNotEmpty && !isUuid.hasMatch(rawCls)) ? rawCls.trim() : 'Grade 10';
                    final sec = (rawSec != null && rawSec.trim().isNotEmpty && !isUuid.hasMatch(rawSec)) ? rawSec.trim() : 'Section A';
                    subtitle = '$cls • $sec';
                    if (state.profile.rollNumber != null &&
                        state.profile.rollNumber!.isNotEmpty &&
                        !isUuid.hasMatch(state.profile.rollNumber!)) {
                      subtitle += ' • Roll #${state.profile.rollNumber}';
                    }
                  }
                  return Text(
                    subtitle,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.secondaryText),
                  );
                },
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
                icon: Icon(Icons.fact_check_outlined),
                selectedIcon: Icon(Icons.fact_check),
                label: 'Attendance',
              ),
              NavigationDestination(
                icon: Icon(Icons.menu_book_outlined),
                selectedIcon: Icon(Icons.menu_book),
                label: 'Academics',
              ),
              NavigationDestination(
                icon: Icon(Icons.receipt_long_outlined),
                selectedIcon: Icon(Icons.receipt_long),
                label: 'Fees',
              ),
              NavigationDestination(
                icon: Icon(Icons.apps_outlined),
                selectedIcon: Icon(Icons.apps),
                label: 'Services',
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
        return StudentDashboardView(
          user: widget.user,
          onNavigateToTab: _navigateToTab,
        );
      case 1:
        return const StudentAttendanceHistoryView();
      case 2:
        return _buildAcademicsTab();
      case 3:
        return const StudentFeesView();
      case 4:
      default:
        return _buildServicesTab();
    }
  }

  // --- ACADEMICS TAB ---
  Widget _buildAcademicsTab() {
    return Column(
      children: [
        // Sub-navigation bar
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
                  title: 'Homework',
                  isSelected: _academicSubTab == 0,
                  onTap: () {
                    setState(() => _academicSubTab = 0);
                    context
                        .read<HomeworkBloc>()
                        .add(const LoadStudentHomeworkEvent());
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Study Materials',
                  isSelected: _academicSubTab == 1,
                  onTap: () {
                    setState(() => _academicSubTab = 1);
                    final classId = widget.user.classId ?? '';
                    final subjectId = _selectedSubject?.id ?? '';
                    if (classId.isNotEmpty && subjectId.isNotEmpty) {
                      context.read<MaterialsBloc>().add(
                            LoadClassMaterialsEvent(classId, subjectId),
                          );
                    }
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Syllabus',
                  isSelected: _academicSubTab == 2,
                  onTap: () {
                    setState(() => _academicSubTab = 2);
                    final classId = widget.user.classId ?? '';
                    final subjectId = _selectedSubject?.id ?? '';
                    if (classId.isNotEmpty && subjectId.isNotEmpty) {
                      context.read<CurriculumBloc>().add(
                            LoadCurriculumUnitsEvent(classId, subjectId),
                          );
                    }
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Classmates',
                  isSelected: _academicSubTab == 3,
                  onTap: () {
                    setState(() => _academicSubTab = 3);
                    context.read<AcademicsBloc>().add(
                          LoadClassRosterEvent(
                            classId: widget.user.classId ?? '',
                            sectionId: widget.user.sectionId ?? '',
                          ),
                        );
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Birthdays',
                  isSelected: _academicSubTab == 4,
                  onTap: () {
                    setState(() => _academicSubTab = 4);
                    context
                        .read<AcademicsBloc>()
                        .add(LoadClassmatesBirthdaysEvent());
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Teachers',
                  isSelected: _academicSubTab == 5,
                  onTap: () {
                    setState(() => _academicSubTab = 5);
                    context
                        .read<AcademicsBloc>()
                        .add(LoadSubjectTeachersEvent());
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Exams & Results',
                  isSelected: _academicSubTab == 6,
                  onTap: () {
                    setState(() => _academicSubTab = 6);
                    context.read<ExamsBloc>().add(const LoadExamsEvent());
                  },
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Online Classes',
                  isSelected: _academicSubTab == 7,
                  onTap: () {
                    setState(() => _academicSubTab = 7);
                    context.read<ScheduleBloc>().add(const LoadOnlineClassesEvent());
                  },
                ),
              ],
            ),
          ),
        ),
        // Sub-tab content
        Expanded(
          child: Builder(
            builder: (context) {
              if (_academicSubTab == 7) {
                return const StudentOnlineClassesView();
              }
              if (_academicSubTab == 0) {
                return const StudentHomeworkView();
              }
              if (_academicSubTab == 1) {
                return Column(
                  children: [
                    _buildSubjectSelectorChips(isMaterials: true),
                    Expanded(
                      child: AcademicMaterialsView(
                        key: ValueKey('mat-${widget.user.classId}-${_selectedSubject?.id}'),
                        classId: widget.user.classId ?? '',
                        subjectId: _selectedSubject?.id ?? '',
                      ),
                    ),
                  ],
                );
              }
              if (_academicSubTab == 2) {
                return Column(
                  children: [
                    _buildSubjectSelectorChips(isMaterials: false),
                    Expanded(
                      child: CurriculumView(
                        key: ValueKey('curr-${widget.user.classId}-${_selectedSubject?.id}'),
                        classId: widget.user.classId ?? '',
                        subjectId: _selectedSubject?.id ?? '',
                      ),
                    ),
                  ],
                );
              }
              if (_academicSubTab == 4) {
                return const StudentBirthdaysView();
              }
              if (_academicSubTab == 6) {
                return const ExamsListView(userRole: 'STUDENT');
              }

              // AcademicsBloc handles Subtabs 3 (Classmates) and 5 (Teachers)
              return BlocBuilder<AcademicsBloc, AcademicsState>(
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
                                if (_academicSubTab == 3) {
                                  context.read<AcademicsBloc>().add(
                                        LoadClassRosterEvent(
                                          classId: widget.user.classId ?? '',
                                          sectionId:
                                              widget.user.sectionId ?? '',
                                        ),
                                      );
                                } else if (_academicSubTab == 5) {
                                  context
                                      .read<AcademicsBloc>()
                                      .add(LoadSubjectTeachersEvent());
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

                  if (_academicSubTab == 3 && state is RosterLoaded) {
                    return StudentRosterView(students: state.students);
                  }

                  if (_academicSubTab == 5 && state is SubjectTeachersLoaded) {
                    return SubjectTeachersView(teachers: state.teachers);
                  }

                  return const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectSelectorChips({required bool isMaterials}) {
    if (_loadingSubjects) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: LinearProgressIndicator(minHeight: 2),
      );
    }
    if (_subjects.isEmpty) {
      return const SizedBox.shrink();
    }
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _subjects.map((sub) {
            final isSelected = _selectedSubject?.id == sub.id;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                selected: isSelected,
                label: Text(
                  sub.name,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    color: isSelected ? AppColors.surface : AppColors.primaryText,
                  ),
                ),
                backgroundColor: AppColors.scaffoldBackground,
                selectedColor: AppColors.primaryText,
                checkmarkColor: AppColors.surface,
                side: BorderSide(
                  color: isSelected ? AppColors.primaryText : AppColors.border,
                ),
                onSelected: (val) {
                  if (val) {
                    setState(() => _selectedSubject = sub);
                    final classId = widget.user.classId ?? '';
                    if (classId.isNotEmpty) {
                      if (isMaterials) {
                        context.read<MaterialsBloc>().add(
                              LoadClassMaterialsEvent(classId, sub.id),
                            );
                      } else {
                        context.read<CurriculumBloc>().add(
                              LoadCurriculumUnitsEvent(classId, sub.id),
                            );
                      }
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

  // --- SERVICES TAB ---
  Widget _buildServicesTab() {
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
                  title: 'My Profile',
                  isSelected: _servicesSubTab == 0,
                  onTap: () => setState(() => _servicesSubTab = 0),
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Leave Applications',
                  isSelected: _servicesSubTab == 1,
                  onTap: () => setState(() => _servicesSubTab = 1),
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Notices',
                  isSelected: _servicesSubTab == 2,
                  onTap: () => setState(() => _servicesSubTab = 2),
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'Complaints',
                  isSelected: _servicesSubTab == 3,
                  onTap: () => setState(() => _servicesSubTab = 3),
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'School Feedback',
                  isSelected: _servicesSubTab == 4,
                  onTap: () => setState(() => _servicesSubTab = 4),
                ),
                const SizedBox(width: 8),
                _buildSubTabButton(
                  title: 'School Contact',
                  isSelected: _servicesSubTab == 5,
                  onTap: () => setState(() => _servicesSubTab = 5),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: _buildServicesContent(),
        ),
      ],
    );
  }

  Widget _buildServicesContent() {
    switch (_servicesSubTab) {
      case 0:
        return const StudentProfileView();
      case 1:
        return const StudentLeaveView();
      case 2:
        return const StudentNoticesView();
      case 3:
        return const StudentComplaintsView();
      case 4:
        return const StudentFeedbackView();
      case 5:
      default:
        return const SchoolContactView();
    }
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
}
