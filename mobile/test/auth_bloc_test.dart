import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mobile/features/auth/bloc/auth_bloc.dart';
import 'package:mobile/features/auth/bloc/auth_event.dart';
import 'package:mobile/features/auth/bloc/auth_state.dart';
import 'package:mobile/features/auth/models/user_model.dart';
import 'package:mobile/features/auth/repositories/auth_repository.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockAuthRepository;

  const testUser = UserModel(
    id: 'user-uuid-1',
    schoolId: 'school-uuid-1',
    identifier: 'student1',
    roles: ['STUDENT'],
    firstName: 'Aarav',
    lastName: 'Sharma',
  );

  const testAdminUser = UserModel(
    id: 'admin-uuid-1',
    schoolId: 'school-uuid-1',
    identifier: 'management1',
    roles: ['MANAGEMENT'],
    firstName: 'Admin',
    lastName: 'User',
  );

  setUp(() {
    mockAuthRepository = MockAuthRepository();
  });

  group('AuthBloc Unit Tests', () {
    test('initial state is AuthInitial', () {
      final authBloc = AuthBloc(authRepository: mockAuthRepository);
      expect(authBloc.state, equals(AuthInitial()));
      authBloc.close();
    });

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, Authenticated] when LoginSubmittedEvent succeeds for Student',
      build: () {
        when(() => mockAuthRepository.login(
              identifier: 'student1',
              password: 'Password@123',
            )).thenAnswer((_) async => testUser);
        return AuthBloc(authRepository: mockAuthRepository);
      },
      act: (bloc) => bloc.add(const LoginSubmittedEvent(
        identifier: 'student1',
        password: 'Password@123',
      )),
      expect: () => [
        AuthLoading(),
        const Authenticated(user: testUser, activeRole: 'STUDENT'),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthFailure] when LoginSubmittedEvent is attempted by Management on mobile',
      build: () {
        when(() => mockAuthRepository.login(
              identifier: 'management1',
              password: 'Password@123',
            )).thenAnswer((_) async => testAdminUser);
        when(() => mockAuthRepository.logout()).thenAnswer((_) async {});
        return AuthBloc(authRepository: mockAuthRepository);
      },
      act: (bloc) => bloc.add(const LoginSubmittedEvent(
        identifier: 'management1',
        password: 'Password@123',
      )),
      expect: () => [
        AuthLoading(),
        isA<AuthFailure>().having(
          (f) => f.errorMessage,
          'errorMessage',
          contains('mobile app permissions'),
        ),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthFailure] when LoginSubmittedEvent fails with invalid credentials',
      build: () {
        when(() => mockAuthRepository.login(
              identifier: 'student1',
              password: 'WrongPassword',
            )).thenThrow(Exception('Invalid credentials'));
        return AuthBloc(authRepository: mockAuthRepository);
      },
      act: (bloc) => bloc.add(const LoginSubmittedEvent(
        identifier: 'student1',
        password: 'WrongPassword',
      )),
      expect: () => [
        AuthLoading(),
        const AuthFailure('Invalid credentials'),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, Unauthenticated] on LogoutRequestedEvent',
      build: () {
        when(() => mockAuthRepository.logout()).thenAnswer((_) async {});
        return AuthBloc(authRepository: mockAuthRepository);
      },
      act: (bloc) => bloc.add(LogoutRequestedEvent()),
      expect: () => [
        AuthLoading(),
        Unauthenticated(),
      ],
    );
  });
}
