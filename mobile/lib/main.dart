import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/network/dio_client.dart';
import 'core/router/app_router.dart';
import 'core/storage/secure_storage_service.dart';
import 'core/theme/app_theme.dart';
import 'features/academics/repository/academics_repository.dart';
import 'features/attendance/repository/attendance_repository.dart';
import 'features/auth/bloc/auth_bloc.dart';
import 'features/auth/bloc/auth_event.dart';
import 'features/auth/repositories/auth_repository.dart';
import 'features/curriculum/repository/curriculum_repository.dart';
import 'features/homework/repository/homework_repository.dart';
import 'features/leaves/repository/leaves_repository.dart';
import 'features/materials/repository/materials_repository.dart';
import 'features/academics/repositories/exams_repository.dart';
import 'features/profiles/repository/profile_repository.dart';
import 'features/student/repository/student_features_repository.dart';
import 'features/schedule/repository/schedule_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Core Storage
  final storageService = SecureStorageService();

  late final AuthBloc authBloc;

  // Dio Client with 401 Unauthorized handler wired to AuthBloc
  final dioClient = DioClient(
    storageService: storageService,
    onUnauthorized: () {
      authBloc.add(LogoutRequestedEvent());
    },
  );

  final authRepository = AuthRepository(
    dioClient: dioClient,
    storageService: storageService,
  );

  final academicsRepository = AcademicsRepository(dioClient: dioClient);
  final profileRepository = ProfileRepository(dioClient: dioClient);
  final attendanceRepository = AttendanceRepository(dioClient: dioClient);
  final leavesRepository = LeavesRepository(dioClient: dioClient);
  final homeworkRepository = HomeworkRepository(dioClient);
  final curriculumRepository = CurriculumRepository(dioClient);
  final materialsRepository = MaterialsRepository(dioClient);
  final examsRepository = ExamsRepository(client: dioClient);
  final studentFeaturesRepository = StudentFeaturesRepository(dioClient: dioClient);
  final scheduleRepository = ScheduleRepository(dioClient: dioClient);

  // Authentication State BLoC
  authBloc = AuthBloc(authRepository: authRepository);

  // Trigger initial authentication status check
  authBloc.add(CheckAuthStatusEvent());

  // Declarative Router
  final appRouter = AppRouter(authBloc: authBloc);

  runApp(SchoolErpApp(
    authBloc: authBloc,
    authRepository: authRepository,
    appRouter: appRouter,
    dioClient: dioClient,
    academicsRepository: academicsRepository,
    profileRepository: profileRepository,
    attendanceRepository: attendanceRepository,
    leavesRepository: leavesRepository,
    homeworkRepository: homeworkRepository,
    curriculumRepository: curriculumRepository,
    materialsRepository: materialsRepository,
    examsRepository: examsRepository,
    studentFeaturesRepository: studentFeaturesRepository,
    scheduleRepository: scheduleRepository,
  ));
}

class SchoolErpApp extends StatelessWidget {
  final AuthBloc authBloc;
  final AuthRepository authRepository;
  final AppRouter appRouter;
  final DioClient dioClient;
  final AcademicsRepository academicsRepository;
  final ProfileRepository profileRepository;
  final AttendanceRepository attendanceRepository;
  final LeavesRepository leavesRepository;
  final HomeworkRepository homeworkRepository;
  final CurriculumRepository curriculumRepository;
  final MaterialsRepository materialsRepository;
  final ExamsRepository examsRepository;
  final StudentFeaturesRepository studentFeaturesRepository;
  final ScheduleRepository scheduleRepository;

  const SchoolErpApp({
    super.key,
    required this.authBloc,
    required this.authRepository,
    required this.appRouter,
    required this.dioClient,
    required this.academicsRepository,
    required this.profileRepository,
    required this.attendanceRepository,
    required this.leavesRepository,
    required this.homeworkRepository,
    required this.curriculumRepository,
    required this.materialsRepository,
    required this.examsRepository,
    required this.studentFeaturesRepository,
    required this.scheduleRepository,
  });

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: authRepository),
        RepositoryProvider.value(value: dioClient),
        RepositoryProvider.value(value: academicsRepository),
        RepositoryProvider.value(value: profileRepository),
        RepositoryProvider.value(value: attendanceRepository),
        RepositoryProvider.value(value: leavesRepository),
        RepositoryProvider.value(value: homeworkRepository),
        RepositoryProvider.value(value: curriculumRepository),
        RepositoryProvider.value(value: materialsRepository),
        RepositoryProvider.value(value: examsRepository),
        RepositoryProvider.value(value: studentFeaturesRepository),
        RepositoryProvider.value(value: scheduleRepository),
      ],
      child: BlocProvider.value(
        value: authBloc,
        child: MaterialApp.router(
          title: 'School ERP',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          routerConfig: appRouter.router,
        ),
      ),
    );
  }
}

