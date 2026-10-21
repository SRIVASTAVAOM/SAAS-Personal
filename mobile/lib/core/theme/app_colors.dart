import 'package:flutter/material.dart';

/// Design Tokens matching Web-Admin ERP Theme
/// Features Indigo primary accents, rich Slate neutrals, dark hero header gradients,
/// and subtle Emerald/Rose/Amber functional status pills.
class AppColors {
  AppColors._();

  // --- Primary Indigo Palette (Matching web-admin) ---
  static const Color indigo50 = Color(0xFFEEF2FF);
  static const Color indigo100 = Color(0xFFE0E7FF);
  static const Color indigo200 = Color(0xFFC7D2FE);
  static const Color indigo300 = Color(0xFFA5B4FC);
  static const Color indigo400 = Color(0xFF818CF8);
  static const Color indigo500 = Color(0xFF6366F1);
  static const Color indigo600 = Color(0xFF4F46E5); // Primary Action CTA (#4F46E5)
  static const Color indigo700 = Color(0xFF4338CA);
  static const Color indigo800 = Color(0xFF3730A3);
  static const Color indigo900 = Color(0xFF312E81);
  static const Color indigo950 = Color(0xFF1E1B4B);

  // --- Deep Slate Palette (Matching web-admin dark headers & cards) ---
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate950 = Color(0xFF020617);

  // --- Core Backgrounds ---
  static const Color background = Color(0xFFFFFFFF);
  static const Color scaffoldBackground = Color(0xFFF8FAFC); // Clean Slate-50
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSubtle = Color(0xFFF8FAFC);

  // --- Borders & Dividers ---
  static const Color border = Color(0xFFE2E8F0); // Slate-200
  static const Color borderHover = Color(0xFFCBD5E1); // Slate-300
  static const Color borderLight = Color(0xFFF1F5F9); // Slate-100

  // --- Typography (Slate Palette) ---
  static const Color primaryText = Color(0xFF0F172A); // Slate-900 (High contrast)
  static const Color secondaryText = Color(0xFF475569); // Slate-600
  static const Color tertiaryText = Color(0xFF94A3B8); // Slate-400

  // --- Primary Brand Accent ---
  static const Color primaryAccent = Color(0xFF4F46E5); // Indigo-600
  static const Color primaryAccentDark = Color(0xFF4338CA); // Indigo-700
  static const Color primaryAccentLight = Color(0xFFEEF2FF); // Indigo-50

  // --- Functional Status Colors (Matching web-admin Pills & Alerts) ---
  static const Color success = Color(0xFF059669); // Emerald-600
  static const Color successLight = Color(0xFFECFDF5); // Emerald-50
  static const Color successBorder = Color(0xFFA7F3D0); // Emerald-200

  static const Color error = Color(0xFFE11D48); // Rose-600
  static const Color errorLight = Color(0xFFFFF1F2); // Rose-50
  static const Color errorBorder = Color(0xFFFECDD3); // Rose-200

  static const Color warning = Color(0xFFD97706); // Amber-600
  static const Color warningLight = Color(0xFFFFFBEB); // Amber-50
  static const Color warningBorder = Color(0xFFFDE68A); // Amber-200

  static const Color info = Color(0xFF2563EB); // Blue-600
  static const Color infoLight = Color(0xFFEFF6FF); // Blue-50
  static const Color infoBorder = Color(0xFFBFDBFE); // Blue-200

  // --- Web-Admin Header Dark Gradient ---
  static const LinearGradient headerGradient = LinearGradient(
    colors: [
      Color(0xFF0F172A), // Slate 900
      Color(0xFF1E1B4B), // Indigo 950
      Color(0xFF0F172A), // Slate 900
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // --- Vibrant Indigo Gradient ---
  static const LinearGradient indigoGradient = LinearGradient(
    colors: [
      Color(0xFF6366F1), // Indigo 500
      Color(0xFF4F46E5), // Indigo 600
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
