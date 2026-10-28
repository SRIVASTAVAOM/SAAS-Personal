# 🎓 SAMAGRA — The Complete School Platform

> *Holistic, Complete, Comprehensive, and All-Encompassing School ERP System*

SAMAGRA is a multi-tenant, 360° school management platform connecting School Owners, Administrators, Teachers, Students, and Parents into a single, unified digital ecosystem.

---

## 🏛️ Project Architecture

```
samagra/
├── backend/            # Express, TypeScript, PostgreSQL, Zod, JWT
├── web-admin/          # Next.js 16 (App Router), React 19, Tailwind CSS
├── mobile/             # Flutter (Dart), BLoC architecture, Dio, GoRouter
├── docs/               # System architecture, RBAC, and security documentation
└── render.yaml         # Cloud deployment configuration
```

## 🚀 Quick Start

### 1. Backend API
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

### 2. Web Admin Dashboard
```bash
cd web-admin
npm install
npm run dev
```

### 3. Mobile App
```bash
cd mobile
flutter pub get
flutter run
```

---

## 💎 Key Features
- **Super Admin Portal:** Multi-tenant school onboarding and subscription lifecycle.
- **School Admin Dashboard:** Student & teacher management, 12-month fee matrix, class allocation, digital receipts.
- **Teacher Workspace:** Quick attendance, homework publishing, grades, and timetables.
- **Student & Parent App:** Real-time attendance, fee receipts, notices, and exam cards.