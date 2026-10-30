import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../repositories/auth_repository.dart';

class ForgotPasswordDialog extends StatefulWidget {
  final AuthRepository authRepository;
  final String? initialIdentifier;

  const ForgotPasswordDialog({
    super.key,
    required this.authRepository,
    this.initialIdentifier,
  });

  @override
  State<ForgotPasswordDialog> createState() => _ForgotPasswordDialogState();
}

class _ForgotPasswordDialogState extends State<ForgotPasswordDialog> {
  int _currentStep = 1; // 1: Identifier, 2: Verification Challenge, 3: New Password
  bool _isLoading = false;
  String? _errorMessage;

  // Controllers
  late final TextEditingController _identifierController;
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();
  final _emailController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

  // Verification metadata
  String _userType = 'STUDENT';
  String _maskedPhone = '';
  String _prompt = '';
  String? _resetToken;

  @override
  void initState() {
    super.initState();
    _identifierController = TextEditingController(text: widget.initialIdentifier ?? '');
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _emailController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  // Step 1: Look up requirements
  Future<void> _handleStep1() async {
    final identifier = _identifierController.text.trim();
    if (identifier.isEmpty) {
      setState(() => _errorMessage = 'Please enter your Admission No or Employee ID');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final reqs = await widget.authRepository.getForgotRequirements(identifier);
      setState(() {
        _userType = reqs['userType'] ?? 'STUDENT';
        _maskedPhone = reqs['maskedPhone'] ?? '';
        _prompt = reqs['prompt'] ?? '';
        _currentStep = 2;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  // Step 2: Verify Challenge
  Future<void> _handleStep2() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final token = await widget.authRepository.verifyForgotChallenge(
        identifier: _identifierController.text.trim(),
        phone: _phoneController.text.trim(),
        dob: _dobController.text.trim(),
        email: _emailController.text.trim(),
      );

      setState(() {
        _resetToken = token;
        _currentStep = 3;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  // Step 3: Reset Password
  Future<void> _handleStep3() async {
    final newPass = _newPasswordController.text;
    final confirmPass = _confirmPasswordController.text;

    if (newPass.length < 6) {
      setState(() => _errorMessage = 'Password must be at least 6 characters long');
      return;
    }
    if (newPass != confirmPass) {
      setState(() => _errorMessage = 'Passwords do not match');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await widget.authRepository.resetPassword(
        resetToken: _resetToken!,
        newPassword: newPass,
      );

      if (mounted) {
        Navigator.of(context).pop(_identifierController.text.trim());
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: AppColors.surface,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.indigo50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.lock_reset, color: AppColors.indigo600, size: 22),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Forgot Password',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryText),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20, color: AppColors.secondaryText),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Progress Indicator
              Row(
                children: [
                  _buildStepDot(1, 'Identify'),
                  _buildStepLine(_currentStep >= 2),
                  _buildStepDot(2, 'Verify'),
                  _buildStepLine(_currentStep >= 3),
                  _buildStepDot(3, 'Reset'),
                ],
              ),
              const SizedBox(height: 20),

              // Error banner if any
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, size: 16, color: AppColors.error),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(fontSize: 12, color: AppColors.error, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // STEP 1: Enter Identifier
              if (_currentStep == 1) ...[
                const Text(
                  'Enter your Admission No (Students) or Employee ID / Email (Staff):',
                  style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _identifierController,
                  enabled: !_isLoading,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _handleStep1(),
                  decoration: const InputDecoration(
                    labelText: 'Identifier / Username',
                    hintText: 'e.g. ADM2024-001 or EMP-01',
                    prefixIcon: Icon(Icons.person_outline, size: 18),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleStep1,
                  child: _isLoading
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Continue to Verification'),
                ),
              ],

              // STEP 2: Challenge Verification
              if (_currentStep == 2) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.indigo50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _prompt,
                    style: const TextStyle(fontSize: 12, color: AppColors.indigo900, fontWeight: FontWeight.w500),
                  ),
                ),
                const SizedBox(height: 14),

                if (_userType == 'STUDENT') ...[
                  TextField(
                    controller: _phoneController,
                    enabled: !_isLoading,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Parent Mobile Number',
                      hintText: 'e.g. 9876543210 ($_maskedPhone)',
                      prefixIcon: const Icon(Icons.phone_outlined, size: 18),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _dobController,
                    enabled: !_isLoading,
                    decoration: const InputDecoration(
                      labelText: 'Date of Birth (DOB)',
                      hintText: 'YYYY-MM-DD or DD-MM-YYYY',
                      prefixIcon: Icon(Icons.calendar_today_outlined, size: 18),
                    ),
                  ),
                ] else ...[
                  TextField(
                    controller: _emailController,
                    enabled: !_isLoading,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Registered Email',
                      hintText: 'e.g. teacher@apex.edu',
                      prefixIcon: Icon(Icons.email_outlined, size: 18),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    enabled: !_isLoading,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Registered Mobile Number',
                      hintText: 'e.g. 9876543210',
                      prefixIcon: Icon(Icons.phone_outlined, size: 18),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleStep2,
                  child: _isLoading
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Verify Identity'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => setState(() => _currentStep = 1),
                  child: const Text('Change Username / ID', style: TextStyle(fontSize: 12)),
                ),
              ],

              // STEP 3: Set New Password
              if (_currentStep == 3) ...[
                const Text(
                  'Identity verified! Please set a new password for your account:',
                  style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _newPasswordController,
                  enabled: !_isLoading,
                  obscureText: _obscureNewPassword,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    hintText: 'Minimum 6 characters',
                    prefixIcon: const Icon(Icons.lock_outline, size: 18),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureNewPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 18),
                      onPressed: () => setState(() => _obscureNewPassword = !_obscureNewPassword),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _confirmPasswordController,
                  enabled: !_isLoading,
                  obscureText: _obscureConfirmPassword,
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    hintText: 'Re-enter new password',
                    prefixIcon: const Icon(Icons.lock_outline, size: 18),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureConfirmPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 18),
                      onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleStep3,
                  child: _isLoading
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Set New Password & Finish'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepDot(int step, String label) {
    final isActive = _currentStep >= step;
    final isCurrent = _currentStep == step;

    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? AppColors.indigo600 : AppColors.border,
          ),
          child: Center(
            child: Text(
              '$step',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isActive ? Colors.white : AppColors.secondaryText,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
            color: isCurrent ? AppColors.indigo600 : AppColors.secondaryText,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(bool isActive) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 14),
        color: isActive ? AppColors.indigo600 : AppColors.border,
      ),
    );
  }
}
