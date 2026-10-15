import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/router/app_router.dart';

void main() {
  group('AppRouter Route Guard Tests', () {
    test('getHomeForRole returns correct home path for Student and Teacher, restricts others to /login', () {
      expect(AppRouter.getHomeForRole('STUDENT'), equals('/student'));
      expect(AppRouter.getHomeForRole('TEACHER'), equals('/teacher'));
      expect(AppRouter.getHomeForRole('ACCOUNTANT'), equals('/login'));
      expect(AppRouter.getHomeForRole('COORDINATOR'), equals('/login'));
      expect(AppRouter.getHomeForRole('MANAGEMENT'), equals('/login'));
      expect(AppRouter.getHomeForRole('UNKNOWN'), equals('/login'));
    });
  });
}
