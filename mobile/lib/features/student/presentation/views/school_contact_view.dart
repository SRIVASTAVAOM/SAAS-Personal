import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../profiles/bloc/profile_bloc.dart';
import '../../../profiles/bloc/profile_event.dart';
import '../../../profiles/bloc/profile_state.dart';

class SchoolContactView extends StatelessWidget {
  const SchoolContactView({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'School Contact Information',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primaryText,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, size: 20, color: AppColors.secondaryText),
                tooltip: 'Refresh',
                onPressed: () {
                  context.read<ProfileBloc>().add(LoadStudentProfileEvent());
                },
              ),
            ],
          ),
        ),
        Expanded(
          child: BlocBuilder<ProfileBloc, ProfileState>(
            builder: (context, state) {
              if (state is ProfileLoading) {
                return const Center(child: CircularProgressIndicator(strokeWidth: 2));
              }

              if (state is StudentProfileLoaded) {
                final p = state.profile;
                final schoolName = p.schoolName ?? 'Apex International School';
                final phone = p.schoolPhone ?? '+91 9876543210';
                final email = p.schoolEmail ?? 'info@apexschool.edu';
                final address = p.schoolAddress ?? '123 Education Lane, Knowledge Park';

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Header Banner
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.scaffoldBackground,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.school, size: 36, color: AppColors.primaryAccent),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        schoolName,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryText,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Official Institutional Contact Details',
                        style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _buildContactTile(
                  icon: Icons.phone_outlined,
                  title: 'School Reception & Helpdesk',
                  value: phone,
                ),
                const SizedBox(height: 10),
                _buildContactTile(
                  icon: Icons.email_outlined,
                  title: 'Official Inquiries Email',
                  value: email,
                ),
                const SizedBox(height: 10),
                _buildContactTile(
                  icon: Icons.location_on_outlined,
                  title: 'Campus Physical Address',
                  value: address,
                ),
                const SizedBox(height: 10),
                _buildContactTile(
                  icon: Icons.access_time_outlined,
                  title: 'Office Working Hours',
                  value: 'Monday to Friday: 8:00 AM – 3:30 PM\nSaturday: 8:00 AM – 1:00 PM',
                ),
              ],
            );
          }

          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        },
      ),
    ),
  ],
);
}

  Widget _buildContactTile({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.scaffoldBackground,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, size: 20, color: AppColors.primaryAccent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryText,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
