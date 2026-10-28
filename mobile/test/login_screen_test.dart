import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/auth/bloc/auth_bloc.dart';
import 'package:mobile/features/auth/presentation/login_screen.dart';
import 'package:mobile/features/auth/repositories/auth_repository.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockAuthRepository;
  late AuthBloc authBloc;

  setUp(() {
    mockAuthRepository = MockAuthRepository();
    authBloc = AuthBloc(authRepository: mockAuthRepository);
  });

  tearDown(() {
    authBloc.close();
  });

  Widget createWidgetUnderTest() {
    return MaterialApp(
      theme: AppTheme.lightTheme,
      home: BlocProvider<AuthBloc>.value(
        value: authBloc,
        child: const LoginScreen(),
      ),
    );
  }

  group('LoginScreen Widget Tests', () {
    testWidgets('renders all required minimalist UI elements cleanly',
        (tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      // Header
      expect(find.text('SAMAGRA'), findsOneWidget);
      expect(find.text('THE COMPLETE SCHOOL PLATFORM'), findsOneWidget);

      // Form Fields
      expect(find.byKey(const Key('identifierField')), findsOneWidget);
      expect(find.byKey(const Key('passwordField')), findsOneWidget);

      // Sign In CTA
      expect(find.byKey(const Key('signInButton')), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
    });

    testWidgets('triggers validation errors when fields are empty',
        (tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      // Tap Sign In directly
      await tester.tap(find.byKey(const Key('signInButton')));
      await tester.pumpAndSettle();

      // Check validation error messages
      expect(find.text('Identifier is required'), findsOneWidget);
      expect(find.text('Password is required'), findsOneWidget);
    });
  });
}
