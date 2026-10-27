import 'package:flutter_bloc/flutter_bloc.dart';
import '../repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository})
      : super(AuthInitial()) {
    on<CheckAuthStatusEvent>(_onCheckAuthStatus);
    on<LoginSubmittedEvent>(_onLoginSubmitted);
    on<LogoutRequestedEvent>(_onLogoutRequested);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatusEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await authRepository.checkAuthStatus();
      if (user != null) {
        final upperRoles = user.roles.map((r) => r.toUpperCase()).toList();
        final hasValidRole = upperRoles.any((r) =>
            ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'STAFF'].contains(r));

        if (!hasValidRole) {
          await authRepository.logout();
          emit(Unauthenticated());
        } else {
          final activeRole = upperRoles.contains('STUDENT')
              ? 'STUDENT'
              : 'TEACHER';

          emit(Authenticated(
            user: user,
            activeRole: activeRole,
          ));
        }
      } else {
        emit(Unauthenticated());
      }
    } catch (_) {
      emit(Unauthenticated());
    }
  }

  Future<void> _onLoginSubmitted(
    LoginSubmittedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await authRepository.login(
        identifier: event.identifier,
        password: event.password,
      );

      final upperRoles = user.roles.map((r) => r.toUpperCase()).toList();
      final hasValidRole = upperRoles.any((r) =>
          ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'STAFF'].contains(r));

      if (!hasValidRole) {
        await authRepository.logout();
        emit(const AuthFailure(
          'Your account does not have mobile app permissions. Please contact your administrator.',
        ));
        return;
      }

      final activeRole = upperRoles.contains('STUDENT')
          ? 'STUDENT'
          : 'TEACHER';

      emit(Authenticated(
        user: user,
        activeRole: activeRole,
      ));
    } catch (e) {
      final msg = e.toString().replaceAll('Exception: ', '');
      emit(AuthFailure(msg));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequestedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    await authRepository.logout();
    emit(Unauthenticated());
  }
}
