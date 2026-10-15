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
        if (user.primaryRole != 'STUDENT' && user.primaryRole != 'TEACHER') {
          await authRepository.logout();
          emit(Unauthenticated());
        } else {
          emit(Authenticated(
            user: user,
            activeRole: user.primaryRole,
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

      // Mobile app restriction: only STUDENT and TEACHER roles permitted
      if (user.primaryRole != 'STUDENT' && user.primaryRole != 'TEACHER') {
        await authRepository.logout();
        emit(const AuthFailure(
          'Mobile app access is restricted to Student and Teacher roles. Please log in via the Web Admin Portal.',
        ));
        return;
      }

      emit(Authenticated(
        user: user,
        activeRole: user.primaryRole,
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
