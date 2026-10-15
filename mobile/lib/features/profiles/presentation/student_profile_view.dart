import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../bloc/profile_bloc.dart';
import '../bloc/profile_event.dart';
import '../bloc/profile_state.dart';
import '../models/student_profile_model.dart';

class StudentProfileView extends StatelessWidget {
  const StudentProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProfileBloc, ProfileState>(
      listener: (context, state) {
        if (state is ProfileUpdateSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.primaryText,
              duration: const Duration(seconds: 3),
            ),
          );
        } else if (state is ProfileError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      },
      builder: (context, state) {
        if (state is ProfileLoading || state is ProfileUpdating) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32.0),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          );
        }

        if (state is ProfileError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 36, color: AppColors.error),
                  const SizedBox(height: 12),
                  Text(
                    state.message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: () {
                      context.read<ProfileBloc>().add(LoadStudentProfileEvent());
                    },
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

        if (state is StudentProfileLoaded) {
          return _buildProfileContent(context, state.profile);
        }

        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildProfileContent(BuildContext context, StudentProfileModel p) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header Identity Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: AppColors.scaffoldBackground,
                child: Text(
                  p.firstName.isNotEmpty ? p.firstName[0].toUpperCase() : 'S',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryText,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.fullName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryText,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Adm: ${p.admissionNumber} • Roll: ${p.rollNumber ?? "N/A"}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.secondaryText,
                      ),
                    ),
                    if (p.className != null && p.sectionName != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Class: ${p.className} - ${p.sectionName}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.secondaryText,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Personal & Family Info (Read-only Institutional Records)
        _buildSectionCard(
          title: 'Institutional Records (Read-only)',
          rows: [
            _buildRow('Date of Birth', p.dateOfBirth),
            _buildRow('Gender', p.gender),
            _buildRow('Admission Date', p.admissionDate),
            if (p.fatherName != null) _buildRow("Father's Name", p.fatherName!),
            if (p.motherName != null) _buildRow("Mother's Name", p.motherName!),
          ],
        ),
        const SizedBox(height: 16),

        // Editable Emergency & Health Information
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.border),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Emergency & Health Details',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryText,
                    ),
                  ),
                  TextButton.icon(
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    icon: const Icon(Icons.edit_outlined, size: 14),
                    label: const Text('Edit', style: TextStyle(fontSize: 13)),
                    onPressed: () => _showEditDialog(context, p),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _buildRow('Emergency Phone', p.emergencyPhone ?? 'Not Provided'),
              _buildRow('Blood Group', p.bloodGroup ?? 'Not Provided'),
              _buildRow('Medical Notes', p.medicalNotes ?? 'None recorded'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // School Contact Details (Read-only verified database records)
        _buildSectionCard(
          title: 'School Contact & Institutional Details',
          rows: [
            _buildRow('School Name', p.schoolName ?? 'Apex International School'),
            _buildRow('Helpline / Phone', p.schoolPhone ?? '+91 9876543210'),
            _buildRow('Contact Email', p.schoolEmail ?? 'info@apexschool.edu'),
            _buildRow('Campus Address', p.schoolAddress ?? '123 Education Lane, Knowledge Park'),
          ],
        ),
      ],
    );
  }


  Widget _buildSectionCard({required String title, required List<Widget> rows}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.primaryText,
            ),
          ),
          const SizedBox(height: 12),
          ...rows,
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 13, color: AppColors.secondaryText),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.primaryText,
            ),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(BuildContext context, StudentProfileModel profile) {
    final phoneController = TextEditingController(text: profile.emergencyPhone ?? '');
    final bloodGroupController = TextEditingController(text: profile.bloodGroup ?? '');
    final notesController = TextEditingController(text: profile.medicalNotes ?? '');

    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text(
          'Edit Emergency & Health',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Emergency Phone',
                  hintText: '+91 9876543210',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: bloodGroupController,
                decoration: const InputDecoration(
                  labelText: 'Blood Group',
                  hintText: 'e.g. O+, A+, B-',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Medical Notes / Allergies',
                  hintText: 'e.g. Asthmatic, peanut allergy',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final newPhone = phoneController.text.trim();
              final newBlood = bloodGroupController.text.trim();
              final newNotes = notesController.text.trim();

              context.read<ProfileBloc>().add(
                    UpdateStudentProfileEvent(
                      emergencyPhone: newPhone.isNotEmpty ? newPhone : null,
                      bloodGroup: newBlood.isNotEmpty ? newBlood : null,
                      medicalNotes: newNotes.isNotEmpty ? newNotes : null,
                    ),
                  );
              Navigator.pop(dialogCtx);
            },
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }
}
