import 'package:flutter/material.dart';

/// Design Tokens matching SAMAGRA Official Logo & Brand Identity
/// Features Academic Navy, Royal Azure, and Vivid Cyan from the dynamic 'S' ribbon,
/// with Emerald, Amber, and Coral accents matching the official logo mark.
class AppColors {
  AppColors._();

  // --- Official SAMAGRA Brand Palette ---
  static const Color brandNavy = Color(0xFF0A1128);       // Deep Brand Navy (App Icon Dark Canvas, Splash, Dark Cards)
  static const Color academicNavy = Color(0xFF001938);   // Academic Navy (Logo Wordmark "Samagra" & Mortarboard Cap)
  static const Color royalAzure = Color(0xFF023E8A);     // Royal Azure (Depth Ribbon Gradient & Strong Actions)
  static const Color brandBlue = Color(0xFF0284C7);      // Samagra Brand Blue (Primary Interactive CTA)
  static const Color vividCyan = Color(0xFF00B4D8);      // Vivid Cyan (Dynamic 'S' Ribbon Center & Highlights)

  // --- Brand Azure & Vivid Cyan Scale (Directly derived from Logo Mark) ---
  static const Color indigo50 = Color(0xFFF0F9FF);       // Sky-50 (Subtle cyan-azure card tint)
  static const Color indigo100 = Color(0xFFE0F2FE);      // Sky-100 (Cyan soft border & subtle chips)
  static const Color indigo200 = Color(0xFFBAE6FD);      // Sky-200 (Light Cyan highlight badge)
  static const Color indigo300 = Color(0xFF7DD3FC);      // Sky-300 (Soft Cyan icon/text)
  static const Color indigo400 = Color(0xFF38BDF8);      // Sky-400 (Vivid Cyan border)
  static const Color indigo500 = Color(0xFF00B4D8);      // Logo Vivid Cyan (#00B4D8)
  static const Color indigo600 = Color(0xFF0284C7);      // Samagra Primary Action CTA (#0284C7)
  static const Color indigo700 = Color(0xFF0369A1);      // Deep Brand Blue
  static const Color indigo800 = Color(0xFF023E8A);      // Logo Royal Azure (#023E8A)
  static const Color indigo900 = Color(0xFF001938);      // Logo Academic Navy (#001938)
  static const Color indigo950 = Color(0xFF0A1128);      // Logo Deep Brand Navy (#0A1128)

  // --- Deep Slate Palette (Rich contrast for typography and cards) ---
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
  static const Color scaffoldBackground = Color(0xFFF8FAFC); // Clean Canvas
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSubtle = Color(0xFFF8FAFC);

  // --- Borders & Dividers ---
  static const Color border = Color(0xFFE2E8F0); // Slate-200
  static const Color borderHover = Color(0xFFCBD5E1); // Slate-300
  static const Color borderLight = Color(0xFFF1F5F9); // Slate-100

  // --- Typography (High Contrast) ---
  static const Color primaryText = Color(0xFF0F172A); // Slate-900
  static const Color secondaryText = Color(0xFF475569); // Slate-600
  static const Color tertiaryText = Color(0xFF94A3B8); // Slate-400

  // --- Primary Brand Accent (Samagra Azure & Cyan) ---
  static const Color primaryAccent = Color(0xFF0284C7); // Samagra Brand Blue CTA
  static const Color primaryAccentDark = Color(0xFF023E8A); // Royal Azure
  static const Color primaryAccentLight = Color(0xFFF0F9FF); // Soft Sky Tint

  // --- Functional Status Colors (Matching Logo Ribbon Accents) ---
  static const Color success = Color(0xFF10B981); // Emerald Vitality (Top Green Ribbon)
  static const Color successLight = Color(0xFFECFDF5); // Emerald-50
  static const Color successBorder = Color(0xFFA7F3D0); // Emerald-200

  static const Color error = Color(0xFFEF4444); // Red/Coral (Important alerts)
  static const Color errorLight = Color(0xFFFEF2F2); // Red-50
  static const Color errorBorder = Color(0xFFFECACA); // Red-200

  static const Color warning = Color(0xFFF59E0B); // Amber Energy (Lower Amber Ribbon)
  static const Color warningLight = Color(0xFFFFFBEB); // Amber-50
  static const Color warningBorder = Color(0xFFFDE68A); // Amber-200

  static const Color info = Color(0xFF0284C7); // Vivid Brand Cyan
  static const Color infoLight = Color(0xFFF0F9FF); // Sky-50
  static const Color infoBorder = Color(0xFFBAE6FD); // Sky-200

  // --- SAMAGRA Hero Header Gradient (Academic Navy -> Deep Navy -> Royal Azure) ---
  static const LinearGradient headerGradient = LinearGradient(
    colors: [
      Color(0xFF001938), // Academic Navy
      Color(0xFF0A1128), // Deep Brand Navy
      Color(0xFF023E8A), // Royal Azure
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // --- SAMAGRA Dynamic Ribbon Gradient (Vivid Cyan -> Royal Azure) ---
  static const LinearGradient indigoGradient = LinearGradient(
    colors: [
      Color(0xFF00B4D8), // Vivid Cyan
      Color(0xFF023E8A), // Royal Azure
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient brandGradient = indigoGradient;
}
