import 'package:flutter/material.dart';

/// Minimalist Design Tokens (Strict Rule #7)
/// Pure White & Off-White backgrounds, subtle borders, restrained slate accents.
/// No decorative gradients, no unnecessary drop shadows.
class AppColors {
  AppColors._();

  // Backgrounds
  static const Color background = Color(0xFFFFFFFF);
  static const Color scaffoldBackground = Color(0xFFF8F9FA);
  static const Color surface = Color(0xFFFFFFFF);

  // Borders & Dividers
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderHover = Color(0xFFCBD5E1);

  // Typography & Accents (Slate Palette)
  static const Color primaryText = Color(0xFF1E293B); // Deep Slate
  static const Color secondaryText = Color(0xFF64748B); // Muted Slate
  static const Color tertiaryText = Color(0xFF94A3B8); // Light Slate
  static const Color primaryAccent = Color(0xFF0F172A); // Charcoal Action CTA

  // Functional Status Colors
  static const Color success = Color(0xFF16A34A);
  static const Color error = Color(0xFFDC2626);
  static const Color warning = Color(0xFFD97706);
  static const Color info = Color(0xFF2563EB);
}
