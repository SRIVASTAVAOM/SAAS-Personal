import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../academics/models/teacher_allocation_model.dart';
import '../../../auth/models/user_model.dart';
import '../../../homework/bloc/homework_bloc.dart';
import '../../../leaves/bloc/leaves_bloc.dart';
import '../../../leaves/bloc/leaves_state.dart';
import '../../../profiles/bloc/profile_bloc.dart';
import '../../../profiles/bloc/profile_event.dart';
import '../../../profiles/bloc/profile_state.dart';
import '../../../profiles/models/staff_profile_model.dart';
import '../../../student/models/student_features_model.dart';

class _TeacherMenuItem {
  final String key;
  final String defaultLabel;
  final String category;
  final IconData icon;
  final void Function(BuildContext) onTap;

  const _TeacherMenuItem({
    required this.key,
    required this.defaultLabel,
    this.category = 'General',
    required this.icon,
    required this.onTap,
  });
}

/// Clean, professional single-scroll overview layout for Teacher Dashboard.
/// Follows OEM Clean Light Theme principles with crisp typography and subtle borders.
class TeacherDashboardView extends StatefulWidget {
  final UserModel user;
  final TeacherAllocationsResponse? allocations;
  final void Function(int tabIndex, {int? attendanceSubTab, int? classesSubTab, int? leavesSubTab})?
      onNavigateToTab;

  const TeacherDashboardView({
    super.key,
    required this.user,
    this.allocations,
    this.onNavigateToTab,
  });

  @override
  State<TeacherDashboardView> createState() => _TeacherDashboardViewState();
}

class _TeacherDashboardViewState extends State<TeacherDashboardView> {
  List<NoticeModel>? _cachedNotices;
  List<String>? _customQuickLinkKeys;
  final SecureStorageService _storageService = SecureStorageService();

  static const List<String> _defaultQuickLinkKeys = [
    'mark_attendance',
    'my_attendance',
    'student_roster',
    'homework',
    'my_timetable',
    'student_leave_requests',
  ];

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    if (!mounted) return;
    try {
      final savedKeysJson = await _storageService.read('teacher_quick_links_${widget.user.id}');
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
  }

  Future<void> _saveQuickLinks(List<String> keys) async {
    setState(() {
      _customQuickLinkKeys = List<String>.from(keys);
    });
    try {
      await _storageService.write(
        'teacher_quick_links_${widget.user.id}',
        jsonEncode(keys),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProfileBloc, ProfileState>(
      builder: (context, profileState) {
        final profile = profileState is StaffProfileLoaded ? profileState.profile : null;
        final availableCatalog = _getAvailableCatalog(profile);

        return Scaffold(
          backgroundColor: AppColors.scaffoldBackground,
          body: RefreshIndicator(
            onRefresh: () async {
              context.read<ProfileBloc>().add(LoadStaffProfileEvent());
              await Future.delayed(const Duration(milliseconds: 300));
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // BLOCK 1: School & User Header Card
                  _buildHeaderCard(context, profile),
                  const SizedBox(height: 16),

                  // BLOCK 2: Overview Section (2 Side-by-Side Metric Boxes)
                  _buildOverviewHeader(),
                  const SizedBox(height: 10),
                  _buildOverviewSection(context),
                  const SizedBox(height: 20),

                  // BLOCK 3: Notices / Circulars Preview Box
                  _buildNoticesHeader(context),
                  const SizedBox(height: 10),
                  _buildNoticesSection(context),
                  const SizedBox(height: 20),

                  // BLOCK 4: Quick Links Dynamic SaaS Grid
                  _buildQuickLinksHeader(availableCatalog),
                  const SizedBox(height: 10),
                  _buildQuickLinksSection(context, profile, availableCatalog),
                  const SizedBox(height: 24),

                  // BLOCK 5: SaaS Company Footer
                  _buildCompanyFooter(profile),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // --- 1. HEADER CARD ---
  Widget _buildHeaderCard(BuildContext context, StaffProfileModel? profile) {
    final rawSchoolName = profile?.schoolName?.trim();
    final schoolName = (rawSchoolName != null && rawSchoolName.isNotEmpty)
        ? rawSchoolName
        : 'Delhi Public International School';

    final teacherName = (profile?.firstName != null && profile!.firstName.trim().isNotEmpty)
        ? '${profile.firstName} ${profile.lastName}'.trim()
        : widget.user.displayName;

    final designation = (profile?.designation != null && profile!.designation!.trim().isNotEmpty)
        ? profile.designation!
        : 'Faculty / Subject Teacher';

    final initials = teacherName.isNotEmpty
        ? teacherName
            .split(' ')
            .take(2)
            .map((e) => e.isNotEmpty ? e[0].toUpperCase() : '')
            .join()
        : 'T';

    final isClassTeacher = widget.allocations?.homeroom != null || profile?.isClassTeacher == true;
    final homeroomInfo = widget.allocations?.homeroom != null
        ? '${widget.allocations!.homeroom!.className} ${widget.allocations!.homeroom!.sectionName}'
        : null;

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
                // Teacher Name
                Text(
                  teacherName,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 3),
                // Designation Subtitle
                Text(
                  designation,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.slate300,
                  ),
                ),
                if (isClassTeacher) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.indigo500.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.indigo400.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      homeroomInfo != null
                          ? 'Class Teacher: $homeroomInfo'
                          : 'Class Teacher',
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
          // Clean monogram circle avatar with indigo gradient
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
  Widget _buildOverviewHeader() {
    return const Text(
      'Overview',
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.primaryText,
        letterSpacing: -0.1,
      ),
    );
  }

  Widget _buildOverviewSection(BuildContext context) {
    return BlocBuilder<LeavesBloc, LeavesState>(
      builder: (context, leavesState) {
        int pendingLeaves = 0;
        if (leavesState is ClassStudentLeavesLoaded) {
          pendingLeaves = leavesState.leaves.where((a) => a.status == 'PENDING').length;
        }

        return BlocBuilder<HomeworkBloc, HomeworkState>(
          builder: (context, hwState) {
            int activeHomework = 0;
            if (hwState is TeacherHomeworkLoaded) {
              activeHomework = hwState.homeworkList.length;
            }

            final assignedClassesCount = widget.allocations?.allocations.length ?? 0;

            return Row(
              children: [
                // Card 1: My Attendance & Classes
                Expanded(
                  child: Material(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      onTap: () => widget.onNavigateToTab?.call(1, attendanceSubTab: 1),
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
                                const Expanded(
                                  child: Text(
                                    'My Attendance & Classes',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.secondaryText,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFECFDF5),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFA7F3D0)),
                                  ),
                                  child: const Text(
                                    'On Duty',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF047857),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Present',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryText,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$assignedClassesCount Assigned Classes',
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
                const SizedBox(width: 12),

                // Card 2: Pending Actions (Leaves + Homework)
                Expanded(
                  child: Material(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      onTap: () => widget.onNavigateToTab?.call(3, leavesSubTab: 1),
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
                                const Expanded(
                                  child: Text(
                                    'Pending Actions',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.secondaryText,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: pendingLeaves > 0
                                        ? const Color(0xFFFFFBEB)
                                        : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: pendingLeaves > 0
                                          ? const Color(0xFFFDE68A)
                                          : AppColors.border,
                                    ),
                                  ),
                                  child: Text(
                                    pendingLeaves > 0 ? 'Review' : 'Clear',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: pendingLeaves > 0
                                          ? const Color(0xFFB45309)
                                          : AppColors.secondaryText,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '$pendingLeaves Pending',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryText,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$activeHomework Active Homework',
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
          },
        );
      },
    );
  }

  // --- 3. NOTICES / CIRCULARS PREVIEW BOX ---
  Widget _buildNoticesHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text(
          'Notices & Circulars',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.primaryText,
            letterSpacing: -0.1,
          ),
        ),
        InkWell(
          onTap: () => _openNoticesModal(context),
          borderRadius: BorderRadius.circular(4),
          child: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            child: Text(
              'View All',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF2563EB),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNoticesSection(BuildContext context) {
    final notices = _cachedNotices ?? [];

    if (notices.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border),
        ),
        child: const Column(
          children: [
            Icon(Icons.campaign_outlined, size: 28, color: AppColors.secondaryText),
            SizedBox(height: 8),
            Text(
              'No active circulars',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryText,
              ),
            ),
            SizedBox(height: 2),
            Text(
              'School announcements and circulars will appear here.',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.secondaryText,
              ),
            ),
          ],
        ),
      );
    }

    final previewList = notices.take(2).toList();

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: previewList.length,
        separatorBuilder: (context, index) => const Divider(height: 1, color: AppColors.border),
        itemBuilder: (context, idx) {
          final notice = previewList[idx];
          return _buildNoticeItem(context, notice);
        },
      ),
    );
  }

  Widget _buildNoticeItem(BuildContext context, NoticeModel notice) {
    return InkWell(
      onTap: () => _showNoticeDetail(context, notice),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    notice.publishedAt.isNotEmpty ? notice.publishedAt : 'Latest',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: AppColors.secondaryText,
                    ),
                  ),
                ),
                if (notice.priority == 'URGENT')
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(3),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: const Text(
                      'URGENT',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
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

  void _showNoticeDetail(BuildContext context, NoticeModel notice) {
    showDialog(
      context: context,
      builder: (dCtx) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: AppColors.border),
          ),
          title: Text(
            notice.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryText,
            ),
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (notice.publishedAt.isNotEmpty)
                  Text(
                    'Published on: ${notice.publishedAt}',
                    style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                  ),
                const SizedBox(height: 12),
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
            TextButton(
              onPressed: () => Navigator.of(dCtx).pop(),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  void _openNoticesModal(BuildContext context) {
    final notices = _cachedNotices ?? [];
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (bCtx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.7,
          maxChildSize: 0.9,
          minChildSize: 0.4,
          builder: (_, scrollCtrl) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'School Circulars',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryText,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.of(bCtx).pop(),
                      ),
                    ],
                  ),
                  const Divider(color: AppColors.border),
                  Expanded(
                    child: notices.isEmpty
                        ? const Center(
                            child: Text(
                              'No circulars available at this moment.',
                              style: TextStyle(color: AppColors.secondaryText),
                            ),
                          )
                        : ListView.separated(
                            controller: scrollCtrl,
                            itemCount: notices.length,
                            separatorBuilder: (context, index) =>
                                const Divider(height: 1, color: AppColors.border),
                            itemBuilder: (context, idx) {
                              final notice = notices[idx];
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  notice.title,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primaryText,
                                  ),
                                ),
                                subtitle: Text(
                                  notice.content,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.secondaryText,
                                  ),
                                ),
                                trailing: Text(
                                  notice.publishedAt,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: AppColors.secondaryText,
                                  ),
                                ),
                                onTap: () {
                                  Navigator.of(bCtx).pop();
                                  _showNoticeDetail(context, notice);
                                },
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // --- 4. QUICK LINKS GRID ---
  Widget _buildQuickLinksHeader(List<({_TeacherMenuItem item, String label})> availableCatalog) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text(
          'Quick Links',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.primaryText,
            letterSpacing: -0.1,
          ),
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
    );
  }

  List<({_TeacherMenuItem item, String label})> _getAvailableCatalog(StaffProfileModel? profile) {
    final teacherMenusConfig =
        (profile?.menuConfig?['teacher_menus'] as Map<String, dynamic>?) ?? {};

    final allCatalogItems = [
      _TeacherMenuItem(
        key: 'mark_attendance',
        defaultLabel: 'Mark Attendance',
        category: 'Attendance & Schedule',
        icon: Icons.how_to_reg_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(1, attendanceSubTab: 0),
      ),
      _TeacherMenuItem(
        key: 'my_attendance',
        defaultLabel: 'My Attendance',
        category: 'Attendance & Schedule',
        icon: Icons.fact_check_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(1, attendanceSubTab: 1),
      ),
      _TeacherMenuItem(
        key: 'student_roster',
        defaultLabel: 'Student Roster',
        category: 'Academics & Teaching',
        icon: Icons.groups_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 0),
      ),
      _TeacherMenuItem(
        key: 'homework',
        defaultLabel: 'Homework',
        category: 'Academics & Teaching',
        icon: Icons.assignment_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 1),
      ),
      _TeacherMenuItem(
        key: 'my_timetable',
        defaultLabel: 'My Timetable',
        category: 'Attendance & Schedule',
        icon: Icons.calendar_month_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 6),
      ),
      _TeacherMenuItem(
        key: 'student_leave_requests',
        defaultLabel: 'Student Leave Requests',
        category: 'Leaves & Approvals',
        icon: Icons.pending_actions_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(3, leavesSubTab: 1),
      ),
      _TeacherMenuItem(
        key: 'my_leaves',
        defaultLabel: 'My Leaves',
        category: 'Leaves & Approvals',
        icon: Icons.beach_access_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(3, leavesSubTab: 0),
      ),
      _TeacherMenuItem(
        key: 'examinations',
        defaultLabel: 'Examinations',
        category: 'Academics & Teaching',
        icon: Icons.assignment_turned_in_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 4),
      ),
      _TeacherMenuItem(
        key: 'study_materials',
        defaultLabel: 'Study Materials',
        category: 'Academics & Teaching',
        icon: Icons.menu_book_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 2),
      ),
      _TeacherMenuItem(
        key: 'syllabus',
        defaultLabel: 'Syllabus',
        category: 'Academics & Teaching',
        icon: Icons.format_list_bulleted_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 3),
      ),
      _TeacherMenuItem(
        key: 'substitutions',
        defaultLabel: 'Substitutions',
        category: 'Attendance & Schedule',
        icon: Icons.swap_horiz_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 7),
      ),
      _TeacherMenuItem(
        key: 'online_classes',
        defaultLabel: 'Online Classes',
        category: 'Academics & Teaching',
        icon: Icons.video_camera_front_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 8),
      ),
      _TeacherMenuItem(
        key: 'update_student_details',
        defaultLabel: 'Update Student Details',
        category: 'Academics & Teaching',
        icon: Icons.manage_accounts_outlined,
        onTap: (c) => widget.onNavigateToTab?.call(2, classesSubTab: 5),
      ),
    ];

    final available = <({_TeacherMenuItem item, String label})>[];
    for (final item in allCatalogItems) {
      final cfg = teacherMenusConfig[item.key];
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
        available.add((item: item, label: label));
      }
    }
    return available;
  }

  Widget _buildQuickLinksSection(
    BuildContext context,
    StaffProfileModel? profile,
    List<({_TeacherMenuItem item, String label})> availableCatalog,
  ) {
    // Determine active keys based on user preferences or defaults
    final activeKeys = _customQuickLinkKeys ?? _defaultQuickLinkKeys;
    final activeItems = <({_TeacherMenuItem item, String label})>[];

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

    final totalTileCount = activeItems.length + 1;

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 500 ? 4 : 3;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: totalTileCount,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.05,
          ),
          itemBuilder: (context, idx) {
            if (idx < activeItems.length) {
              final entry = activeItems[idx];
              return Material(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  onTap: () {
                    try {
                      entry.item.onTap(context);
                    } catch (_) {}
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border, width: 1.0),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.indigo50,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.indigo100),
                          ),
                          child: Icon(
                            entry.item.icon,
                            size: 20,
                            color: AppColors.primaryAccent,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          entry.label,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryText,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }
            // Last tile is "+ Add Menu"
            return _buildAddMenuCard(context, availableCatalog);
          },
        );
      },
    );
  }

  Widget _buildAddMenuCard(
    BuildContext context,
    List<({_TeacherMenuItem item, String label})> availableCatalog,
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
              const SizedBox(height: 8),
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
    List<({_TeacherMenuItem item, String label})> allCatalog,
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
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.primaryAccent,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, color: AppColors.border),
                    // List of all catalog items
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: allCatalog.length,
                        separatorBuilder: (context, index) =>
                            const Divider(height: 1, color: AppColors.border),
                        itemBuilder: (context, index) {
                          final entry = allCatalog[index];
                          final isSelected = selectedKeys.contains(entry.item.key);

                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.indigo50 : const Color(0xFFF1F5F9),
                                shape: BoxShape.circle,
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

  // --- 5. SAAS COMPANY FOOTER ---
  Widget _buildCompanyFooter(StaffProfileModel? profile) {
    final footer = profile?.menuConfig?['company_footer']?.toString().trim();
    final footerText = (footer != null && footer.isNotEmpty)
        ? footer
        : 'Powered by School ERP SaaS';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.border),
      ),
      child: Center(
        child: Text(
          footerText,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: AppColors.secondaryText,
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }
}
