import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/schedule/bloc/schedule_bloc.dart';
import 'package:mobile/features/schedule/models/online_class_model.dart';
import 'package:mobile/features/schedule/models/teacher_substitution_model.dart';
import 'package:mobile/features/schedule/models/timetable_slot_model.dart';
import 'package:mobile/features/schedule/presentation/student_online_classes_view.dart';
import 'package:mobile/features/schedule/presentation/teacher_online_classes_view.dart';
import 'package:mobile/features/schedule/presentation/teacher_substitutions_view.dart';
import 'package:mobile/features/schedule/presentation/teacher_timetable_view.dart';
import 'package:mobile/features/schedule/repository/schedule_repository.dart';
import 'package:mocktail/mocktail.dart';

class MockDioClient extends Mock implements DioClient {}

class FakeScheduleRepository implements ScheduleRepository {
  @override
  DioClient get dioClient => MockDioClient();

  bool shouldThrow = false;

  final sampleSlots = [
    const TimetableSlotModel(
      id: 'slot-1',
      schoolId: 'sch-1',
      academicYearId: 'ay-1',
      classId: 'cls-1',
      sectionId: 'sec-1',
      dayOfWeek: 1, // Mon
      periodNumber: 1,
      startTime: '08:30 AM',
      endTime: '09:15 AM',
      subjectId: 'sub-1',
      teacherId: 't-1',
      roomNumber: 'Room 101',
      className: 'Grade 10',
      sectionName: 'A',
      subjectName: 'Mathematics',
      teacherName: 'John Doe',
    ),
    const TimetableSlotModel(
      id: 'slot-2',
      schoolId: 'sch-1',
      academicYearId: 'ay-1',
      classId: 'cls-1',
      sectionId: 'sec-1',
      dayOfWeek: 1, // Mon
      periodNumber: 2,
      startTime: '09:15 AM',
      endTime: '10:00 AM',
      subjectId: 'sub-2',
      teacherId: 't-1',
      roomNumber: 'Room 101',
      className: 'Grade 10',
      sectionName: 'A',
      subjectName: 'Physics',
      teacherName: 'John Doe',
    ),
  ];

  final sampleAssigned = [
    const TeacherSubstitutionModel(
      id: 'sub-1',
      schoolId: 'sch-1',
      timetableSlotId: 'slot-1',
      substitutionDate: '2026-10-20',
      originalTeacherId: 't-orig',
      substituteTeacherId: 't-me',
      status: 'ASSIGNED',
      periodNumber: 3,
      startTime: '10:15 AM',
      endTime: '11:00 AM',
      className: 'Grade 10',
      sectionName: 'B',
      subjectName: 'Chemistry',
      originalTeacherName: 'Dr. Jane Smith',
      substituteTeacherName: 'John Doe',
      arrangementType: 'ASSIGNED_TO_ME',
      remarks: 'Covering medical leave',
    ),
  ];

  final sampleCovering = [
    const TeacherSubstitutionModel(
      id: 'sub-2',
      schoolId: 'sch-1',
      timetableSlotId: 'slot-2',
      substitutionDate: '2026-10-21',
      originalTeacherId: 't-me',
      substituteTeacherId: 't-cov',
      status: 'ASSIGNED',
      periodNumber: 4,
      startTime: '11:00 AM',
      endTime: '11:45 AM',
      className: 'Grade 10',
      sectionName: 'A',
      subjectName: 'Mathematics',
      originalTeacherName: 'John Doe',
      substituteTeacherName: 'Robert Brown',
      arrangementType: 'COVERING_FOR_ME',
      remarks: 'Attending training conference',
    ),
  ];

  final sampleOnlineClasses = [
    const OnlineClassModel(
      id: 'online-1',
      schoolId: 'sch-1',
      academicYearId: 'ay-1',
      classId: 'cls-1',
      sectionId: 'sec-1',
      subjectId: 'sub-1',
      teacherId: 't-1',
      title: 'Quadratic Equations Revision',
      scheduledDate: '2026-10-22',
      startTime: '04:00 PM',
      durationMinutes: 45,
      meetingUrl: 'https://meet.google.com/abc-xyz-123',
      status: 'SCHEDULED',
      className: 'Grade 10',
      sectionName: 'A',
      subjectName: 'Mathematics',
      teacherName: 'John Doe',
    ),
  ];

  @override
  Future<List<TimetableSlotModel>> getTeacherTimetable() async {
    if (shouldThrow) throw Exception('Timetable network failure');
    return sampleSlots;
  }

  @override
  Future<({List<TeacherSubstitutionModel> assignedToMe, List<TeacherSubstitutionModel> coveringForMe})>
      getTeacherSubstitutions() async {
    if (shouldThrow) throw Exception('Substitutions network failure');
    return (assignedToMe: sampleAssigned, coveringForMe: sampleCovering);
  }

  @override
  Future<List<OnlineClassModel>> getOnlineClasses() async {
    if (shouldThrow) throw Exception('Online classes network failure');
    return sampleOnlineClasses;
  }

  @override
  Future<OnlineClassModel> createOnlineClass({
    required String classId,
    required String sectionId,
    required String subjectId,
    required String title,
    required String scheduledDate,
    required String startTime,
    required int durationMinutes,
    required String meetingUrl,
  }) async {
    if (shouldThrow) throw Exception('Failed to create online class');
    return sampleOnlineClasses.first;
  }

  @override
  Future<void> deleteOnlineClass(String id) async {
    if (shouldThrow) throw Exception('Failed to delete online class');
  }
}

void main() {
  group('Schedule Models Serialization', () {
    test('TimetableSlotModel fromJson handles all fields', () {
      final json = {
        'id': 'slot-10',
        'school_id': 'sch-1',
        'academic_year_id': 'ay-1',
        'class_id': 'cls-1',
        'section_id': 'sec-1',
        'day_of_week': 2,
        'period_number': 3,
        'start_time': '10:00 AM',
        'end_time': '10:45 AM',
        'subject_id': 'sub-1',
        'teacher_id': 'teach-1',
        'room_number': 'Lab 2',
        'class_name': 'Grade 10',
        'section_name': 'A',
        'subject_name': 'Biology',
        'teacher_name': 'Alice Green',
      };
      final model = TimetableSlotModel.fromJson(json);
      expect(model.id, 'slot-10');
      expect(model.dayName, 'Tuesday');
      expect(model.dayShort, 'Tue');
      expect(model.periodNumber, 3);
      expect(model.roomNumber, 'Lab 2');
    });

    test('TeacherSubstitutionModel fromJson handles ISO date', () {
      final json = {
        'id': 'sub-10',
        'school_id': 'sch-1',
        'timetable_slot_id': 'slot-1',
        'substitution_date': '2026-10-25T00:00:00.000Z',
        'original_teacher_id': 't-orig',
        'substitute_teacher_id': 't-sub',
        'remarks': 'Testing substitution',
        'status': 'ASSIGNED',
        'period_number': 5,
        'start_time': '12:00 PM',
        'end_time': '12:45 PM',
        'class_name': 'Grade 9',
        'section_name': 'B',
        'subject_name': 'English',
        'original_teacher_name': 'Teacher A',
        'substitute_teacher_name': 'Teacher B',
        'arrangement_type': 'ASSIGNED_TO_ME',
      };
      final model = TeacherSubstitutionModel.fromJson(json);
      expect(model.substitutionDate, '2026-10-25');
      expect(model.periodNumber, 5);
      expect(model.arrangementType, 'ASSIGNED_TO_ME');
    });

    test('OnlineClassModel fromJson handles duration and meeting URL', () {
      final json = {
        'id': 'oc-1',
        'school_id': 'sch-1',
        'academic_year_id': 'ay-1',
        'class_id': 'cls-1',
        'section_id': 'sec-1',
        'subject_id': 'sub-1',
        'teacher_id': 't-1',
        'title': 'Trigonometry Session',
        'scheduled_date': '2026-10-25',
        'start_time': '02:00 PM',
        'duration_minutes': 60,
        'meeting_url': 'https://meet.google.com/test-meet',
        'status': 'SCHEDULED',
        'class_name': 'Grade 11',
        'section_name': 'A',
        'subject_name': 'Maths',
        'teacher_name': 'Mr. Smith',
      };
      final model = OnlineClassModel.fromJson(json);
      expect(model.title, 'Trigonometry Session');
      expect(model.durationMinutes, 60);
      expect(model.meetingUrl, 'https://meet.google.com/test-meet');
    });
  });

  group('ScheduleBloc Tests', () {
    late FakeScheduleRepository repository;

    setUp(() {
      repository = FakeScheduleRepository();
    });

    blocTest<ScheduleBloc, ScheduleState>(
      'emits [ScheduleLoadingState, ScheduleLoadedState] on LoadTeacherTimetableEvent success',
      build: () => ScheduleBloc(repository: repository),
      act: (bloc) => bloc.add(const LoadTeacherTimetableEvent()),
      expect: () => [
        isA<ScheduleLoadingState>(),
        isA<ScheduleLoadedState>().having((s) => s.timetable.length, 'timetable.length', 2),
      ],
    );

    blocTest<ScheduleBloc, ScheduleState>(
      'emits [ScheduleLoadingState, ScheduleErrorState] on LoadTeacherTimetableEvent error',
      build: () {
        repository.shouldThrow = true;
        return ScheduleBloc(repository: repository);
      },
      act: (bloc) => bloc.add(const LoadTeacherTimetableEvent()),
      expect: () => [
        isA<ScheduleLoadingState>(),
        isA<ScheduleErrorState>().having((s) => s.message, 'message', contains('network failure')),
      ],
    );

    blocTest<ScheduleBloc, ScheduleState>(
      'emits [ScheduleLoadingState, ScheduleLoadedState] on LoadTeacherSubstitutionsEvent success',
      build: () => ScheduleBloc(repository: repository),
      act: (bloc) => bloc.add(const LoadTeacherSubstitutionsEvent()),
      expect: () => [
        isA<ScheduleLoadingState>(),
        isA<ScheduleLoadedState>()
            .having((s) => s.assignedToMeSubstitutions.length, 'assignedToMe.length', 1)
            .having((s) => s.coveringForMeSubstitutions.length, 'coveringForMe.length', 1),
      ],
    );

    blocTest<ScheduleBloc, ScheduleState>(
      'emits [ScheduleLoadingState, ScheduleLoadedState] on LoadOnlineClassesEvent success',
      build: () => ScheduleBloc(repository: repository),
      act: (bloc) => bloc.add(const LoadOnlineClassesEvent()),
      expect: () => [
        isA<ScheduleLoadingState>(),
        isA<ScheduleLoadedState>().having((s) => s.onlineClasses.length, 'onlineClasses.length', 1),
      ],
    );

    blocTest<ScheduleBloc, ScheduleState>(
      'emits [ScheduleLoadingState, ScheduleActionSuccessState, ScheduleLoadedState] on DeleteOnlineClassEvent',
      build: () => ScheduleBloc(repository: repository),
      act: (bloc) => bloc.add(const DeleteOnlineClassEvent('online-1')),
      expect: () => [
        isA<ScheduleLoadingState>(),
        isA<ScheduleActionSuccessState>(),
        isA<ScheduleLoadedState>(),
      ],
    );
  });

  group('Schedule Views Widget Tests', () {
    late FakeScheduleRepository repository;

    setUp(() {
      repository = FakeScheduleRepository();
    });

    testWidgets('TeacherTimetableView renders day selector and periods', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<ScheduleBloc>(
            create: (_) => ScheduleBloc(repository: repository),
            child: const TeacherTimetableView(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Day selector buttons
      expect(find.text('Mon'), findsOneWidget);
      expect(find.text('Tue'), findsOneWidget);
      expect(find.text('Wed'), findsOneWidget);

      // Tap 'Mon' tab to display Monday periods
      await tester.tap(find.text('Mon'));
      await tester.pump();

      expect(find.text('Mathematics'), findsOneWidget);
      expect(find.text('Physics'), findsOneWidget);
      expect(find.text('Period 1'), findsOneWidget);
      expect(find.text('Period 2'), findsOneWidget);
    });

    testWidgets('TeacherSubstitutionsView renders segmented tabs and substitution items', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<ScheduleBloc>(
            create: (_) => ScheduleBloc(repository: repository),
            child: const TeacherSubstitutionsView(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Check tab buttons
      expect(find.text('Assigned to Me'), findsOneWidget);
      expect(find.text('Covering My Class'), findsOneWidget);

      // In Assigned to Me tab
      expect(find.text('Chemistry'), findsOneWidget);
      expect(find.text('Original Teacher: Dr. Jane Smith'), findsOneWidget);
      expect(find.text('Covering medical leave'), findsOneWidget);

      // Switch to Covering My Class tab
      await tester.tap(find.text('Covering My Class'));
      await tester.pump();

      expect(find.text('Covering Teacher: Robert Brown'), findsOneWidget);
      expect(find.text('Attending training conference'), findsOneWidget);
    });

    testWidgets('TeacherOnlineClassesView renders scheduled class session and launch button', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<ScheduleBloc>(
            create: (_) => ScheduleBloc(repository: repository),
            child: const TeacherOnlineClassesView(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Live & Scheduled Classes'), findsOneWidget);
      expect(find.text('Schedule Class'), findsOneWidget);
      expect(find.text('Quadratic Equations Revision'), findsOneWidget);
      expect(find.text('Launch Meeting'), findsOneWidget);
    });

    testWidgets('StudentOnlineClassesView renders join live class session', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<ScheduleBloc>(
            create: (_) => ScheduleBloc(repository: repository),
            child: const StudentOnlineClassesView(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Quadratic Equations Revision'), findsOneWidget);
      expect(find.text('Join Live Class'), findsOneWidget);
      expect(find.text('John Doe'), findsOneWidget);
    });
  });
}
