import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/bloc/auth_bloc.dart';
import '../../features/auth/bloc/auth_state.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/student/presentation/student_shell.dart';
import '../../features/teacher/presentation/teacher_shell.dart';

class AppRouter {
  final AuthBloc authBloc;

  AppRouter({required this.authBloc});

  static String getHomeForRole(String role) {
    switch (role.toUpperCase()) {
      case 'STUDENT':
        return '/student';
      case 'TEACHER':
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'STAFF':
      case 'PRINCIPAL':
        return '/teacher';
      default:
        return '/login';
    }
  }

  late final GoRouter router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: GoRouterRefreshStream(authBloc.stream),
    redirect: (context, state) {
      final authState = authBloc.state;
      final location = state.matchedLocation;
      final isSplash = location == '/splash';
      final isLoggingIn = location == '/login';

      // Keep splash intact while initializing
      if (isSplash) {
        return null;
      }

      if (authState is! Authenticated) {
        return isLoggingIn ? null : '/login';
      }

      final roleHome = getHomeForRole(authState.activeRole);

      // If user is authenticated and currently on /login, redirect to their role home
      if (isLoggingIn) {
        return roleHome;
      }

      // Role Route Guards (Cross-Role Protection):
      // Prevent unauthorized cross-role route navigation on client side
      if (location.startsWith('/student') && authState.activeRole != 'STUDENT') {
        return roleHome;
      }
      if (location.startsWith('/teacher') &&
          authState.activeRole != 'TEACHER' &&
          authState.activeRole != 'ADMIN' &&
          authState.activeRole != 'SUPER_ADMIN') {
        return roleHome;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/student',
        builder: (context, state) {
          final authState = authBloc.state;
          if (authState is Authenticated && authState.activeRole == 'STUDENT') {
            return StudentShell(user: authState.user);
          }
          return const LoginScreen();
        },
      ),
      GoRoute(
        path: '/teacher',
        builder: (context, state) {
          final authState = authBloc.state;
          if (authState is Authenticated &&
              (authState.activeRole == 'TEACHER' ||
               authState.activeRole == 'ADMIN' ||
               authState.activeRole == 'SUPER_ADMIN' ||
               authState.user.roles.any((r) =>
                   ['TEACHER', 'ADMIN', 'SUPER_ADMIN', 'STAFF', 'PRINCIPAL'].contains(r.toUpperCase())))) {
            return TeacherShell(user: authState.user);
          }
          return const LoginScreen();
        },
      ),
    ],
  );
}

class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<dynamic> _subscription;

  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
