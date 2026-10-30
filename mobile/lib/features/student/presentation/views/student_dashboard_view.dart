import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../academics/bloc/exams_bloc.dart';
import '../../../academics/views/exams_list_view.dart';
import '../../../attendance/bloc/attendance_bloc.dart';
import '../../../attendance/bloc/attendance_state.dart';
import '../../../attendance/presentation/student_attendance_history_view.dart';
import '../../../auth/models/user_model.dart';
import '../../../homework/bloc/homework_bloc.dart';
import '../../../homework/presentation/student_homework_view.dart';
import '../../../leaves/bloc/leaves_bloc.dart';
import '../../../leaves/presentation/student_leave_view.dart';
import '../../../materials/bloc/materials_bloc.dart';
import '../../../materials/presentation/academic_materials_view.dart';
import '../../../profiles/bloc/profile_bloc.dart';
import '../../../profiles/bloc/profile_state.dart';
import '../../../profiles/models/student_profile_model.dart';
import '../../../schedule/bloc/schedule_bloc.dart';
import '../../../schedule/presentation/student_online_classes_view.dart';
import '../../bloc/student_features_bloc.dart';
import '../../bloc/student_features_state.dart';
import '../../models/student_features_model.dart';
import '../../repository/student_features_repository.dart';
import '../../../academics/presentation/student_roster_view.dart';
import '../../../academics/presentation/subject_teachers_view.dart';
import '../../../curriculum/presentation/curriculum_view.dart';
import '../../../profiles/presentation/student_profile_view.dart';
import 'school_contact_view.dart';
import 'student_birthdays_view.dart';
import 'student_complaints_view.dart';
import 'student_feedback_view.dart';
import 'student_fees_view.dart';
import 'student_notices_view.dart';

class _StudentMenuItem {
  final String key;
  final String defaultLabel;
  final String category;
  final IconData icon;
  final void Function(BuildContext) onTap;

  const _StudentMenuItem({
    required this.key,
    required this.defaultLabel,
    this.category = 'General',
    required this.icon,
    required this.onTap,
  });
}

/// Clean, professional single-scroll overview layout for Student Dashboard.
/// Follows OEM Clean Light Theme principles with crisp typography and subtle borders.
class StudentDashboardView extends StatefulWidget {
  final UserModel user;
  final void Function(int tabIndex, {int? academicSubTab, int? servicesSubTab})? onNavigateToTab;

  const StudentDashboardView({
    super.key,
    required this.user,
    this.onNavigateToTab,
  });

  @override
  State<StudentDashboardView> createState() => _StudentDashboardViewState();
}

class _StudentDashboardViewState extends State<StudentDashboardView> {
  List<NoticeModel>? _cachedNotices;
  FeeOverviewModel? _cachedFeeOverview;
  List<String>? _customQuickLinkKeys;
  final SecureStorageService _storageService = SecureStorageService();

  static const List<String> _defaultQuickLinkKeys = [
    'fee',
    'exams',
    'timetable',
    'study_materials',
    'leaves',
    'online_classes',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchInitialData();
    });
  }

  Future<void> _fetchInitialData() async {
    if (!mounted) return;
    try {
      final savedKeysJson = await _storageService.read('student_quick_links_${widget.user.id}');
      if (savedKeysJson != null && savedKeysJson.isNotEmpty) {
        final decoded = jsonDecode(savedKeysJson);
        if (decoded is List) {
          final loadedKeys = decoded.map((e) => e.toString()).toList();
          if (loadedKeys.isNotEmpty && mounted) {
            setState(() {
              _customQuickLinkKeys = loadedKeys;
            });
          }
        }
      }
    } catch (_) {}

    try {
      StudentFeaturesRepository? repo;
      try {
        repo = context.read<StudentFeaturesRepository>();
      } catch (_) {}

      if (repo != null) {
        final noticesFuture = repo.getNotices();
        final feesFuture = repo.getFeesOverview();
        final results = await Future.wait([noticesFuture, feesFuture]);
        if (mounted) {
          setState(() {
            _cachedNotices = results[0] as List<NoticeModel>;
            _cachedFeeOverview = results[1] as FeeOverviewModel;
          });
        }
      }
    } catch (_) {
      // Graceful fallback to Bloc states
    }
  }

  Future<void> _saveQuickLinks(List<String> keys) async {
    setState(() {
      _customQuickLinkKeys = List<String>.from(keys);
    });
    try {
      await _storageService.write(
        'student_quick_links_${widget.user.id}',
        jsonEncode(keys),
      );
    } catch (_) {}
  }

  // --- Safe Navigation Handlers ---

  void _navigateToAttendance(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(1);
    } else {
      AttendanceBloc? bloc;
      try {
        bloc = context.read<AttendanceBloc>();
      } catch (_) {}

      Widget content = Scaffold(
        appBar: AppBar(title: const Text('Attendance History')),
        body: const StudentAttendanceHistoryView(),
      );
      if (bloc != null) {
        content = BlocProvider<AttendanceBloc>.value(value: bloc, child: content);
      }

      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => content),
      );
    }
  }

  void _navigateToHomework(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 0);
    } else {
      HomeworkBloc? bloc;
      try {
        bloc = context.read<HomeworkBloc>();
      } catch (_) {}

      Widget content = const StudentHomeworkView();
      if (bloc != null) {
        content = BlocProvider<HomeworkBloc>.value(value: bloc, child: content);
      }

      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => content),
      );
    }
  }

  void _navigateToFee(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(3);
    } else {
      StudentFeaturesBloc? bloc;
      try {
        bloc = context.read<StudentFeaturesBloc>();
      } catch (_) {}

      Widget content = Scaffold(
        appBar: AppBar(title: const Text('Fee Structure & Receipts')),
        body: const StudentFeesView(),
      );
      if (bloc != null) {
        content = BlocProvider<StudentFeaturesBloc>.value(value: bloc, child: content);
      }

      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => content),
      );
    }
  }

  void _navigateToNotices(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(4, servicesSubTab: 2);
    } else {
      StudentFeaturesBloc? bloc;
      try {
        bloc = context.read<StudentFeaturesBloc>();
      } catch (_) {}

      Widget content = Scaffold(
        appBar: AppBar(title: const Text('Notices & Circulars')),
        body: const StudentNoticesView(),
      );
      if (bloc != null) {
        content = BlocProvider<StudentFeaturesBloc>.value(value: bloc, child: content);
      }

      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => content),
      );
    }
  }

  void _navigateToExams(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 6);
    } else {
      ExamsBloc? bloc;
      try {
        bloc = context.read<ExamsBloc>();
      } catch (_) {}

      Widget content = Scaffold(
        appBar: AppBar(title: const Text('Exams & Results')),
        body: const ExamsListView(userRole: 'STUDENT'),
      );
      if (bloc != null) {
        content = BlocProvider<ExamsBloc>.value(value: bloc, child: content);
      }

      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => content),
      );
    }
  }

  void _navigateToTimetable(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 7);
    } else {
      ScheduleBloc? bloc;
      try {
        bloc = context.read<ScheduleBloc>();
      } catch (_) {}

      Widget content = Scaffold(
        appBar: AppBar(title: const Text('Timetable & Online Classes')),
        body: const StudentOnlineClassesView(),
      );
      if (bloc != null) {
        content = BlocProvider<ScheduleBloc>.value(value: bloc, child: content);
      }

      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => content),
      );
    }
  }

  void _navigateToStudyMaterials(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 1);
    } else {
      MaterialsBloc? bloc;
      try {
        bloc = context.read<MaterialsBloc>();
      } catch (_) {}

      Widget content = Scaffold(
        appBar: AppBar(title: const Text('Study Materials')),
        body: AcademicMaterialsView(
          classId: widget.user.classId ?? '',
          subjectId: '',
        ),
      );
      if (bloc != null) {
        content = BlocProvider<MaterialsBloc>.value(value: bloc, child: content);
      }

      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => content),
      );
    }
  }

  void _navigateToLeaves(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(4, servicesSubTab: 1);
    } else {
      LeavesBloc? bloc;
      try {
        bloc = context.read<LeavesBloc>();
      } catch (_) {}

      Widget content = Scaffold(
        appBar: AppBar(title: const Text('Leave Applications')),
        body: const StudentLeaveView(),
      );
      if (bloc != null) {
        content = BlocProvider<LeavesBloc>.value(value: bloc, child: content);
      }

      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => content),
      );
    }
  }

  void _navigateToSyllabus(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 2);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Syllabus')),
            body: CurriculumView(classId: widget.user.classId ?? '', subjectId: ''),
          ),
        ),
      );
    }
  }

  void _navigateToClassmates(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 3);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Classmates')),
            body: const StudentRosterView(students: []),
          ),
        ),
      );
    }
  }

  void _navigateToBirthdays(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 4);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Birthdays')),
            body: const StudentBirthdaysView(),
          ),
        ),
      );
    }
  }

  void _navigateToTeachers(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 5);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Teachers')),
            body: const SubjectTeachersView(teachers: []),
          ),
        ),
      );
    }
  }

  void _navigateToOnlineClasses(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 7);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Online Classes')),
            body: const StudentOnlineClassesView(),
          ),
        ),
      );
    }
  }

  void _navigateToProfile(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(4, servicesSubTab: 0);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('My Profile')),
            body: const StudentProfileView(),
          ),
        ),
      );
    }
  }

  void _navigateToComplaints(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(4, servicesSubTab: 3);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Complaints')),
            body: const StudentComplaintsView(),
          ),
        ),
      );
    }
  }

  void _navigateToFeedback(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(4, servicesSubTab: 4);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Feedback')),
            body: const StudentFeedbackView(),
          ),
        ),
      );
    }
  }

  void _navigateToSchoolContact(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(4, servicesSubTab: 5);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('School Contact')),
            body: const SchoolContactView(),
          ),
        ),
      );
    }
  }

  void _navigateToReportCard(BuildContext context) {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2, academicSubTab: 6);
    } else {
      _navigateToExams(context);
    }
  }

  void _showNoticeDetailDialog(BuildContext context, NoticeModel notice) {
    Color priorityColor;
    switch (notice.priority.toUpperCase()) {
      case 'URGENT':
        priorityColor = AppColors.error;
        break;
      case 'INFO':
        priorityColor = AppColors.info;
        break;
      default:
        priorityColor = AppColors.secondaryText;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: AppColors.border),
        ),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        actionsPadding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
        title: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                notice.title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryText,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: priorityColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: priorityColor.withValues(alpha: 0.3)),
              ),
              child: Text(
                notice.priority.toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: priorityColor,
                ),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (notice.publishedAt.isNotEmpty) ...[
                Text(
                  notice.publishedAt.length >= 10
                      ? 'Published: ${notice.publishedAt.substring(0, 10)}'
                      : 'Published: ${notice.publishedAt}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.secondaryText,
                  ),
                ),
                const SizedBox(height: 10),
                const Divider(color: AppColors.border, height: 1),
                const SizedBox(height: 10),
              ],
              Text(
                notice.content,
                style: const TextStyle(
                  fontSize: 13,
                  height: 1.45,
                  color: AppColors.primaryText,
                ),
              ),
            ],
          ),
        ),
        actions: [
          OutlinedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.border),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Student Profile Data
    final profileState = context.watch<ProfileBloc>().state;
    StudentProfileModel? profile;
    if (profileState is StudentProfileLoaded) {
      profile = profileState.profile;
    }

    // 2. Attendance Data
    final attendanceState = context.watch<AttendanceBloc>().state;
    String attendancePercentage = '--%';
    if (attendanceState is StudentAttendanceHistoryLoaded) {
      final records = attendanceState.records;
      if (records.isNotEmpty) {
        final presentCount = records.where((r) => r.status == 'PRESENT').length;
        attendancePercentage = '${((presentCount / records.length) * 100).toStringAsFixed(1)}%';
      } else {
        attendancePercentage = '100.0%';
      }
    }

    // 3. Homework Data
    final homeworkState = context.watch<HomeworkBloc>().state;
    int pendingHomework = 0;
    if (homeworkState is StudentHomeworkLoaded) {
      pendingHomework = homeworkState.homeworkList
          .where((h) => h.studentStatus != 'COMPLETED')
          .length;
    }

    // 4. Features Data (Notices & Fees)
    final featuresState = context.watch<StudentFeaturesBloc>().state;
    if (featuresState is StudentNoticesLoaded) {
      _cachedNotices = featuresState.notices;
    } else if (featuresState is StudentFeesLoaded) {
      _cachedFeeOverview = featuresState.overview;
    }

    final notices = _cachedNotices ?? [];
    final feeOverview = _cachedFeeOverview;
    final double outstanding = feeOverview?.totalOutstanding ?? 0.0;
    final bool isFeeDue = outstanding > 0.0;

    return RefreshIndicator(
      color: AppColors.primaryAccent,
      backgroundColor: AppColors.surface,
      onRefresh: () async {
        await _fetchInitialData();
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Top Header Card
            _buildTopHeaderCard(context, profile),
            const SizedBox(height: 14),

            // 2. Overview Section (Row of 2 compact summary cards side-by-side)
            _buildOverviewSection(
              context: context,
              attendancePercentage: attendancePercentage,
              pendingHomework: pendingHomework,
              outstanding: outstanding,
              isFeeDue: isFeeDue,
            ),
            const SizedBox(height: 14),

            // 3. Notices & Circulars Section
            _buildNoticesSection(context, notices),
            const SizedBox(height: 14),

            // 4. Quick Links Grid
            _buildQuickLinksSection(context, profile),
            const SizedBox(height: 24),

            // 5. Footer
            _buildFooter(profile),
          ],
        ),
      ),
    );
  }

  // --- 1. TOP HEADER CARD ---
  Widget _buildTopHeaderCard(BuildContext context, StudentProfileModel? profile) {
    final schoolName = (profile?.schoolName?.trim().isNotEmpty == true)
        ? profile!.schoolName!
        : 'Apex International School';

    final studentName = (profile?.fullName.trim().isNotEmpty == true)
        ? profile!.fullName
        : widget.user.displayName;

    bool isUuid(String? s) {
      if (s == null) return false;
      return RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').hasMatch(s.trim());
    }

    String resolveClass(String? raw) {
      if (raw == null || raw.trim().isEmpty || isUuid(raw)) return 'Grade 10';
      return raw.trim();
    }

    String resolveSection(String? raw) {
      if (raw == null || raw.trim().isEmpty || isUuid(raw)) return 'Section A';
      return raw.trim();
    }

    final cls = resolveClass(profile?.className);
    final sec = resolveSection(profile?.sectionName);
    String classSubtitle = '$cls • $sec';
    if (profile?.rollNumber != null && profile!.rollNumber!.trim().isNotEmpty && !isUuid(profile.rollNumber)) {
      classSubtitle += ' • Roll #${profile.rollNumber}';
    }

    String initials = 'S';
    if (studentName.trim().isNotEmpty) {
      final parts = studentName.trim().split(RegExp(r'\s+'));
      if (parts.length >= 2 && parts[0].isNotEmpty && parts[1].isNotEmpty) {
        initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else if (parts.isNotEmpty && parts[0].isNotEmpty) {
        initials = parts[0][0].toUpperCase();
      }
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.headerGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.indigo500.withValues(alpha: 0.25),
          width: 1.0,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F0F172A),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // School Name and Session Badge at top
                Row(
                  children: [
                    const Icon(
                      Icons.account_balance_outlined,
                      size: 14,
                      color: AppColors.indigo300,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        schoolName.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.6,
                          color: AppColors.indigo200,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                      ),
                      child: const Text(
                        '2026-2027',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Student Name
                Text(
                  studentName,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 3),
                // Class & Section Subtitle
                Text(
                  classSubtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.slate300,
                  ),
                ),
                if (profile?.admissionNumber != null && profile!.admissionNumber.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.indigo500.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.indigo400.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      'Adm: ${profile.admissionNumber}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.indigo100,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 14),
          // Monogram avatar with indigo gradient
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: AppColors.indigoGradient,
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.35),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.indigo500.withValues(alpha: 0.4),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- 2. OVERVIEW SECTION (2 SUMMARY CARDS SIDE-BY-SIDE) ---
  Widget _buildOverviewSection({
    required BuildContext context,
    required String attendancePercentage,
    required int pendingHomework,
    required double outstanding,
    required bool isFeeDue,
  }) {
    return Row(
      children: [
        // Card 1: Attendance Percentage (with a green trend badge)
        Expanded(
          child: Material(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: () => _navigateToAttendance(context),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Attendance',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.secondaryText,
                          ),
                        ),
                        // Green trend badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFBBF7D0)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(Icons.trending_up, size: 12, color: AppColors.success),
                              SizedBox(width: 3),
                              Text(
                                'Good',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.success,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      attendancePercentage,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryText,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 3),
                    const Text(
                      'Overall rate',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Card 2: Pending Homework count / Fee Status
        Expanded(
          child: Material(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: () => _navigateToHomework(context),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Tasks & Dues',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.secondaryText,
                          ),
                        ),
                        // Fee status badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: isFeeDue ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isFeeDue ? const Color(0xFFFDE68A) : const Color(0xFFBBF7D0),
                            ),
                          ),
                          child: Text(
                            isFeeDue ? 'Fee: Due' : 'Fee: Paid',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: isFeeDue ? AppColors.warning : AppColors.success,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '$pendingHomework Pending',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryText,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      isFeeDue
                          ? '₹${outstanding.toInt()} fee dues'
                          : 'Homework & dues clear',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // --- 3. NOTICES & CIRCULARS SECTION ---
  Widget _buildNoticesSection(BuildContext context, List<NoticeModel> notices) {
    final displayNotices = notices.take(3).toList();

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.campaign_outlined, size: 19, color: AppColors.primaryAccent),
                    SizedBox(width: 8),
                    Text(
                      'Notices & Circulars',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryText,
                      ),
                    ),
                  ],
                ),
                InkWell(
                  onTap: () => _navigateToNotices(context),
                  borderRadius: BorderRadius.circular(6),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Text(
                          'View All',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryAccent,
                          ),
                        ),
                        SizedBox(width: 2),
                        Icon(Icons.chevron_right, size: 16, color: AppColors.primaryAccent),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(color: AppColors.border, height: 1),
          if (displayNotices.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              child: Center(
                child: Text(
                  'No new notices or circulars posted',
                  style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.all(12),
              itemCount: displayNotices.length,
              separatorBuilder: (context, index) => const Divider(color: AppColors.border, height: 14),
              itemBuilder: (ctx, index) {
                final notice = displayNotices[index];
                return _buildNoticeItem(context, notice);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildNoticeItem(BuildContext context, NoticeModel notice) {
    Color priorityColor;
    switch (notice.priority.toUpperCase()) {
      case 'URGENT':
        priorityColor = AppColors.error;
        break;
      case 'INFO':
        priorityColor = AppColors.info;
        break;
      default:
        priorityColor = AppColors.secondaryText;
    }

    return InkWell(
      onTap: () => _showNoticeDetailDialog(context, notice),
      borderRadius: BorderRadius.circular(6),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: priorityColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: priorityColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    notice.priority.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: priorityColor,
                    ),
                  ),
                ),
                const Spacer(),
                if (notice.publishedAt.isNotEmpty)
                  Text(
                    notice.publishedAt.length >= 10
                        ? notice.publishedAt.substring(0, 10)
                        : notice.publishedAt,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.secondaryText,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              notice.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryText,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              notice.content,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                height: 1.35,
                color: AppColors.secondaryText,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- 4. QUICK LINKS GRID (CUSTOMIZABLE) ---
  Widget _buildQuickLinksSection(BuildContext context, StudentProfileModel? profile) {
    final studentMenusConfig =
        (profile?.menuConfig?['student_menus'] as Map<String, dynamic>?) ?? {};

    final allCatalogItems = [
      _StudentMenuItem(
        key: 'fee',
        defaultLabel: 'Fee',
        category: 'Finance',
        icon: Icons.receipt_long_outlined,
        onTap: (c) => _navigateToFee(c),
      ),
      _StudentMenuItem(
        key: 'exams',
        defaultLabel: 'Exams/Results',
        category: 'Academics',
        icon: Icons.assignment_turned_in_outlined,
        onTap: (c) => _navigateToExams(c),
      ),
      _StudentMenuItem(
        key: 'timetable',
        defaultLabel: 'Timetable',
        category: 'Daily Routine',
        icon: Icons.calendar_month_outlined,
        onTap: (c) => _navigateToTimetable(c),
      ),
      _StudentMenuItem(
        key: 'study_materials',
        defaultLabel: 'Study Materials',
        category: 'Academics',
        icon: Icons.menu_book_outlined,
        onTap: (c) => _navigateToStudyMaterials(c),
      ),
      _StudentMenuItem(
        key: 'leaves',
        defaultLabel: 'Leaves',
        category: 'Services',
        icon: Icons.event_busy_outlined,
        onTap: (c) => _navigateToLeaves(c),
      ),
      _StudentMenuItem(
        key: 'online_classes',
        defaultLabel: 'Online Classes',
        category: 'Daily Routine',
        icon: Icons.video_camera_front_outlined,
        onTap: (c) => _navigateToOnlineClasses(c),
      ),
      _StudentMenuItem(
        key: 'homework',
        defaultLabel: 'Homework',
        category: 'Academics',
        icon: Icons.assignment_outlined,
        onTap: (c) => _navigateToHomework(c),
      ),
      _StudentMenuItem(
        key: 'attendance',
        defaultLabel: 'My Attendance',
        category: 'Daily Routine',
        icon: Icons.fact_check_outlined,
        onTap: (c) => _navigateToAttendance(c),
      ),
      _StudentMenuItem(
        key: 'syllabus',
        defaultLabel: 'Syllabus',
        category: 'Academics',
        icon: Icons.format_list_bulleted_outlined,
        onTap: (c) => _navigateToSyllabus(c),
      ),
      _StudentMenuItem(
        key: 'classmates',
        defaultLabel: 'Classmates',
        category: 'Academics',
        icon: Icons.people_outline,
        onTap: (c) => _navigateToClassmates(c),
      ),
      _StudentMenuItem(
        key: 'birthdays',
        defaultLabel: 'Birthdays',
        category: 'Academics',
        icon: Icons.cake_outlined,
        onTap: (c) => _navigateToBirthdays(c),
      ),
      _StudentMenuItem(
        key: 'teachers',
        defaultLabel: 'Teachers',
        category: 'Academics',
        icon: Icons.person_outline,
        onTap: (c) => _navigateToTeachers(c),
      ),
      _StudentMenuItem(
        key: 'report_card',
        defaultLabel: 'Report Card',
        category: 'Academics',
        icon: Icons.grade_outlined,
        onTap: (c) => _navigateToReportCard(c),
      ),
      _StudentMenuItem(
        key: 'school_contact',
        defaultLabel: 'School Contact',
        category: 'Services',
        icon: Icons.contact_phone_outlined,
        onTap: (c) => _navigateToSchoolContact(c),
      ),
      _StudentMenuItem(
        key: 'notices',
        defaultLabel: 'Notices',
        category: 'Services',
        icon: Icons.campaign_outlined,
        onTap: (c) => _navigateToNotices(c),
      ),
      _StudentMenuItem(
        key: 'complaints',
        defaultLabel: 'Complaints',
        category: 'Services',
        icon: Icons.report_problem_outlined,
        onTap: (c) => _navigateToComplaints(c),
      ),
      _StudentMenuItem(
        key: 'feedback',
        defaultLabel: 'Feedback',
        category: 'Services',
        icon: Icons.rate_review_outlined,
        onTap: (c) => _navigateToFeedback(c),
      ),
      _StudentMenuItem(
        key: 'profile',
        defaultLabel: 'Profile',
        category: 'Services',
        icon: Icons.account_circle_outlined,
        onTap: (c) => _navigateToProfile(c),
      ),
    ];

    // Filter available catalog by school-level config (if super admin disabled anything)
    final availableCatalog = <({_StudentMenuItem item, String label})>[];
    for (final item in allCatalogItems) {
      final cfg = studentMenusConfig[item.key];
      bool enabled = true;
      String label = item.defaultLabel;
      if (cfg is Map<String, dynamic>) {
        if (cfg['enabled'] == false) {
          enabled = false;
        }
        if (cfg['label'] != null &&
            (cfg['label'] as String).trim().isNotEmpty) {
          label = cfg['label'] as String;
        }
      }
      if (enabled) {
        availableCatalog.add((item: item, label: label));
      }
    }

    // Determine active keys based on user preferences or defaults
    final activeKeys = _customQuickLinkKeys ?? _defaultQuickLinkKeys;
    final activeItems = <({_StudentMenuItem item, String label})>[];

    for (final key in activeKeys) {
      final match = availableCatalog.where((e) => e.item.key == key);
      if (match.isNotEmpty) {
        activeItems.add(match.first);
      }
    }

    // Fallback if user had no matches
    if (activeItems.isEmpty && availableCatalog.isNotEmpty) {
      activeItems.addAll(availableCatalog.take(6));
    }

    // Total tiles = active shortcuts + 1 ("+ Add Menu" tile)
    final totalTileCount = activeItems.length + 1;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(Icons.grid_view_outlined,
                      size: 16, color: AppColors.primaryAccent),
                  SizedBox(width: 8),
                  Text(
                    'Quick Links',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryText,
                    ),
                  ),
                ],
              ),
              InkWell(
                key: const Key('customize_quick_links_btn'),
                onTap: () => _showCustomizeQuickLinksModal(context, availableCatalog),
                borderRadius: BorderRadius.circular(6),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.tune_rounded, size: 14, color: AppColors.primaryAccent),
                      SizedBox(width: 4),
                      Text(
                        'Customize',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryAccent,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: totalTileCount,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 0.95,
            ),
            itemBuilder: (context, index) {
              if (index < activeItems.length) {
                final entry = activeItems[index];
                return _buildQuickActionCard(
                  context: context,
                  label: entry.label,
                  icon: entry.item.icon,
                  onTap: () => entry.item.onTap(context),
                );
              }
              // Last tile is "+ Add Menu"
              return _buildAddMenuCard(context, availableCatalog);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAddMenuCard(
    BuildContext context,
    List<({_StudentMenuItem item, String label})> availableCatalog,
  ) {
    return Material(
      color: AppColors.scaffoldBackground,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        key: const Key('add_menu_tile'),
        onTap: () => _showCustomizeQuickLinksModal(context, availableCatalog),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: AppColors.primaryAccent.withValues(alpha: 0.35),
              width: 1.2,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.primaryAccent.withValues(alpha: 0.35),
                  ),
                ),
                child: const Icon(
                  Icons.add_rounded,
                  size: 22,
                  color: AppColors.primaryAccent,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Add Menu',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryAccent,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCustomizeQuickLinksModal(
    BuildContext context,
    List<({_StudentMenuItem item, String label})> allCatalog,
  ) {
    final currentKeys = _customQuickLinkKeys ?? _defaultQuickLinkKeys;
    final selectedKeys = Set<String>.from(currentKeys);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Material(
              color: AppColors.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              clipBehavior: Clip.antiAlias,
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.75,
                child: Column(
                  children: [
                  // Drag handle & Header
                  Container(
                    margin: const EdgeInsets.only(top: 10, bottom: 6),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 16, 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Customize Quick Links',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryText,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${selectedKeys.length} shortcuts selected',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.secondaryText,
                              ),
                            ),
                          ],
                        ),
                        TextButton(
                          onPressed: () {
                            setModalState(() {
                              selectedKeys.clear();
                              selectedKeys.addAll(_defaultQuickLinkKeys);
                            });
                          },
                          child: const Text(
                            'Reset Default',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(color: AppColors.border, height: 1),
                  // Catalog List
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: allCatalog.length,
                      separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
                      itemBuilder: (ctx, index) {
                        final entry = allCatalog[index];
                        final isSelected = selectedKeys.contains(entry.item.key);

                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          leading: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.indigo50 : AppColors.scaffoldBackground,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? AppColors.indigo200 : AppColors.border,
                              ),
                            ),
                            child: Icon(
                              entry.item.icon,
                              size: 20,
                              color: isSelected ? AppColors.primaryAccent : AppColors.secondaryText,
                            ),
                          ),
                          title: Text(
                            entry.label,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              color: AppColors.primaryText,
                            ),
                          ),
                          subtitle: Text(
                            entry.item.category,
                            style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                          ),
                          trailing: Checkbox(
                            value: isSelected,
                            activeColor: AppColors.primaryAccent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                            onChanged: (val) {
                              setModalState(() {
                                if (val == true) {
                                  selectedKeys.add(entry.item.key);
                                } else {
                                  if (selectedKeys.length > 1) {
                                    selectedKeys.remove(entry.item.key);
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('At least 1 shortcut is required.'),
                                        duration: Duration(seconds: 2),
                                      ),
                                    );
                                  }
                                }
                              });
                            },
                          ),
                          onTap: () {
                            setModalState(() {
                              if (isSelected) {
                                if (selectedKeys.length > 1) {
                                  selectedKeys.remove(entry.item.key);
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('At least 1 shortcut is required.'),
                                      duration: Duration(seconds: 2),
                                    ),
                                  );
                                }
                              } else {
                                selectedKeys.add(entry.item.key);
                              }
                            });
                          },
                        );
                      },
                    ),
                  ),
                  // Bottom Save Button
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: AppColors.surface,
                      border: Border(top: BorderSide(color: AppColors.border)),
                    ),
                    child: SafeArea(
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            _saveQuickLinks(selectedKeys.toList());
                            Navigator.of(sheetContext).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Quick links updated!'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryText,
                            foregroundColor: AppColors.surface,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            'Save Quick Links',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
          },
        );
      },
    );
  }

  Widget _buildQuickActionCard({
    required BuildContext context,
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: AppColors.scaffoldBackground,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.indigo50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.indigo100),
                ),
                child: Icon(icon, size: 19, color: AppColors.primaryAccent),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primaryText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- 5. FOOTER ---
  Widget _buildFooter(StudentProfileModel? profile) {
    final footerText = (profile?.menuConfig?['company_footer'] as String?)
                ?.trim()
                .isNotEmpty ==
            true
        ? profile!.menuConfig!['company_footer'] as String
        : 'Powered by School ERP SaaS';

    return Center(
      child: Padding(
        padding: const EdgeInsets.only(top: 4, bottom: 20),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.shield_outlined,
                size: 13, color: AppColors.tertiaryText),
            const SizedBox(width: 6),
            Text(
              footerText,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppColors.tertiaryText,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
