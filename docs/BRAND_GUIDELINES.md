# SAMAGRA Brand Guidelines & Identity Kit

**"The Complete School Platform"**

---

## 1. Brand Identity & Concept

The **SAMAGRA** identity fuses scholastic tradition with modern, dynamic cloud architecture. The emblem combines:
1. **The Scholar's Cap (Mortarboard & Tassel)**: Represents academic excellence, graduation, and educational attainment.
2. **The Dynamic "S" Ribbon Stream**: An organic, fluid multi-ribbon letter **"S"** symbolizing:
   - **Green Ribbon**: Foundation, growth, academic vitality, and student potential.
   - **Cyan & Royal Blue Ribbon**: Administrative trust, cloud reliability, and institutional governance.
   - **Amber & Orange Ribbon**: Communication, fee management, financial energy, and parent engagement.
3. **The Circular Head**: Represents the student/educator at the center of the educational ecosystem.

---

## 2. Brand Color Palette

| Token Name | Hex Code | RGB | Role / Usage |
| :--- | :--- | :--- | :--- |
| **Deep Brand Navy** | `#0A1128` | `rgb(10, 17, 40)` | Primary brand background, dark theme app icon, primary text |
| **Academic Navy** | `#001938` | `rgb(0, 25, 56)` | Wordmark "Samagra", mortarboard cap |
| **Vivid Cyan** | `#00B4D8` | `rgb(0, 180, 216)` | Center ribbon, focal accents, interactive focus |
| **Royal Azure** | `#023E8A` | `rgb(2, 62, 138)` | Shadow ribbon, depth gradients, buttons |
| **Emerald Vitality** | `#10B981` | `rgb(16, 185, 129)` | Top ribbon, success states, attendance indicators |
| **Amber Energy** | `#F59E0B` | `rgb(245, 158, 11)` | Bottom ribbon transition, highlights, reminders |
| **Coral Sunset** | `#F97316` | `rgb(249, 115, 22)` | Bottom ribbon tip, warnings, alerts |
| **Pure Slate White** | `#FFFFFF` | `rgb(255, 255, 255)` | Light app icon canvas, card backgrounds |
| **Cool Slate Gray** | `#94A3B8` | `rgb(148, 163, 184)` | Tagline in dark mode, secondary borders |

---

## 3. Official Logo Variants

### A. Primary Stacked Logo
- **Format**: Mark positioned centrally above the bold "Samagra" wordmark and "THE COMPLETE SCHOOL PLATFORM" tagline.
- **Transparent**: `docs/assets/branding/samagra-logo-stacked-transparent.png`
- **White Background**: `docs/assets/branding/samagra-logo-stacked-white.png`
- **Dark Background**: `docs/assets/branding/samagra-logo-stacked-dark.png`
- **Best For**: Splash screens, presentations, marketing brochures, official certificate headers.

### B. Horizontal Logo Lockup
- **Format**: Standalone emblem on the left, typography on the right with balanced optical alignment.
- **Transparent**: `docs/assets/branding/samagra-logo-horizontal-transparent.png`
- **White Background**: `docs/assets/branding/samagra-logo-horizontal-white.png`
- **Dark Theme**: `docs/assets/branding/samagra-logo-horizontal-dark.png`
- **Best For**: Web admin headers, application top bars, PDF report cards, invoices, email footers.

### C. Standalone Emblem (Mark Only)
- **Format**: Just the graduation cap + student 'S' ribbon shape.
- **Transparent**: `docs/assets/branding/samagra-logo-mark-transparent.png`
- **Best For**: Favicons, avatar placeholders, watermark badges, sidebar mini-brand.

---

## 4. App Logo & Mobile Icon Suite

Modern operating systems (iOS 18+ and Android 14/15+) require specialized app icon configurations to avoid clipping and pixel distortion.

### iOS Configuration
- **Master App Icon**: 1024x1024 (`Icon-App-1024x1024@1x.png`) with crisp white solid background.
- **All Standard iOS Resolutions**:
  - iPhone: `20x20@2x`, `20x20@3x`, `29x29@1x/@2x/@3x`, `40x40@2x/@3x`, `60x60@2x/@3x`
  - iPad: `20x20@1x/@2x`, `29x29@1x/@2x`, `40x40@1x/@2x`, `76x76@1x/@2x`, `83.5x83.5@2x`
- **Location**: `mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/`

### Android Configuration
- **Legacy & Standard Densities**:
  - `mipmap-mdpi` (48x48)
  - `mipmap-hdpi` (72x72)
  - `mipmap-xhdpi` (96x96)
  - `mipmap-xxhdpi` (144x144)
  - `mipmap-xxxhdpi` (192x192)
- **Adaptive Launcher (API 26+)**:
  - `drawable/ic_launcher_background.xml` (Vector #FFFFFF background)
  - `drawable/ic_launcher_foreground.png` (Emblem safely framed within the inner 66% circle zone)
  - `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml`
- **Location**: `mobile/android/app/src/main/res/`

### Web & Progressive Web App (PWA)
- **Multi-size ICO**: `16x16`, `32x32`, `48x48` in `web-admin/public/favicon.ico` & `web-admin/src/app/favicon.ico`
- **Apple Touch Icon**: `180x180` in `web-admin/public/apple-icon.png`
- **Web App Manifest**: `192x192` and `512x512` maskable and standard icons in `mobile/web/icons/`

---

## 5. Asset Directory Map

```
samagra/
├── docs/assets/branding/
│   ├── samagra-logo-stacked-transparent.png
│   ├── samagra-logo-stacked-white.png
│   ├── samagra-logo-stacked-dark.png
│   ├── samagra-logo-horizontal-transparent.png
│   ├── samagra-logo-horizontal-white.png
│   ├── samagra-logo-horizontal-dark.png
│   ├── samagra-logo-mark-transparent.png
│   ├── samagra-app-icon-ios.png
│   ├── samagra-app-icon-android.png
│   ├── samagra-app-icon-dark.png
│   ├── samagra-app-icon-round.png
│   └── samagra-app-icon-adaptive-foreground.png
│
├── web-admin/public/
│   ├── favicon.ico
│   ├── icon.png
│   ├── apple-icon.png
│   ├── logo.png
│   ├── logo-white.png
│   ├── logo-icon.png
│   ├── logo-horizontal.png
│   └── logo-dark-horizontal.png
│
└── mobile/
    ├── assets/images/
    │   ├── logo.png
    │   ├── logo_icon.png
    │   ├── logo_horizontal.png
    │   ├── logo_dark_horizontal.png
    │   └── app_icon.png
    ├── ios/Runner/Assets.xcassets/AppIcon.appiconset/
    └── android/app/src/main/res/
        ├── mipmap-*/
        └── drawable/
```

