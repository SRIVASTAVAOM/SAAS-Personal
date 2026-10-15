import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/academics/bloc/academics_bloc.dart';
import 'package:mobile/features/academics/bloc/academics_event.dart';
import 'package:mobile/features/academics/bloc/academics_state.dart';
import 'package:mobile/features/academics/models/student_roster_item.dart';
import 'package:mobile/features/academics/models/subject_model.dart';
import 'package:mobile/features/academics/models/subject_teacher_item.dart';
import 'package:mobile/features/academics/repository/academics_repository.dart';

import 'package:mobile/features/academics/models/classmate_birthday_model.dart';
import 'package:mobile/features/academics/models/teacher_allocation_model.dart';

class MockAcademicsRepository implements AcademicsRepository {
  List<SubjectModel> subjects = [];
  List<StudentRosterItem> roster = [];
  List<SubjectTeacherItem> teachers = [];
  List<ClassmateBirthdayModel> birthdays = [];
  TeacherAllocationsResponse allocations = const TeacherAllocationsResponse(allocations: []);
  bool shouldThrow = false;

  @override
  DioClient get dioClient => throw UnimplementedError();

  @override
  Future<TeacherAllocationsResponse> getTeacherAllocations() async {
    if (shouldThrow) throw Exception('Failed to load teacher allocations');
    return allocations;
  }

  @override
  Future<List<SubjectModel>> getSubjects() async {
    if (shouldThrow) throw Exception('Failed to load subjects');
    return subjects;
  }

  @override
  Future<List<StudentRosterItem>> getClassRoster(
      String classId, String sectionId) async {
    if (shouldThrow) throw Exception('Failed to load class roster');
    return roster;
  }

  @override
  Future<List<StudentRosterItem>> getMyTeacherRoster() async {
    if (shouldThrow) throw Exception('Failed to load teacher roster');
    return roster;
  }

  @override
  Future<List<SubjectTeacherItem>> getSubjectTeachers() async {
    if (shouldThrow) throw Exception('Failed to load subject teachers');
    return teachers;
  }

  @override
  Future<List<ClassmateBirthdayModel>> getClassmatesBirthdays() async {
    if (shouldThrow) throw Exception('Failed to load classmates birthdays');
    return birthdays;
  }
}

void main() {
  group('AcademicsBloc Unit Tests', () {
    late MockAcademicsRepository mockRepo;
    late AcademicsBloc bloc;

    setUp(() {
      mockRepo = MockAcademicsRepository();
      bloc = AcademicsBloc(repository: mockRepo);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is AcademicsInitial', () {
      expect(bloc.state, isA<AcademicsInitial>());
    });

    test('emits [AcademicsLoading, SubjectsLoaded] when LoadSubjectsEvent succeeds',
        () async {
      mockRepo.subjects = [
        const SubjectModel(
          id: '1',
          code: 'MATH10',
          name: 'Mathematics',
          creditHours: 4,
          isActive: true,
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AcademicsLoading>(),
          isA<SubjectsLoaded>().having(
            (s) => s.subjects.first.code,
            'subject code',
            'MATH10',
          ),
        ]),
      );

      bloc.add(LoadSubjectsEvent());
    });

    test('emits [AcademicsLoading, RosterLoaded] when LoadClassRosterEvent succeeds',
        () async {
      mockRepo.roster = [
        const StudentRosterItem(
          id: 's1',
          admissionNumber: 'ADM2026001',
          rollNumber: '101',
          firstName: 'Aarav',
          lastName: 'Sharma',
          gender: 'Male',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AcademicsLoading>(),
          isA<RosterLoaded>().having(
            (s) => s.students.first.admissionNumber,
            'admission number',
            'ADM2026001',
          ),
        ]),
      );

      bloc.add(const LoadClassRosterEvent(
          classId: 'class-1', sectionId: 'section-1'));
    });

    test('emits [AcademicsLoading, SubjectTeachersLoaded] when LoadSubjectTeachersEvent succeeds',
        () async {
      mockRepo.teachers = [
        const SubjectTeacherItem(
          subjectId: 'sub-1',
          subjectName: 'Mathematics',
          subjectCode: 'MATH10',
          teacherName: 'Vikram Mehta',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AcademicsLoading>(),
          isA<SubjectTeachersLoaded>().having(
            (s) => s.teachers.first.teacherName,
            'teacher name',
            'Vikram Mehta',
          ),
        ]),
      );

      bloc.add(LoadSubjectTeachersEvent());
    });

    test('emits [AcademicsLoading, TeacherAllocationsLoaded] on LoadTeacherAllocationsEvent',
        () async {
      mockRepo.allocations = const TeacherAllocationsResponse(
        homeroom: HomeroomInfo(
          id: 'hr-1',
          classId: 'c-1',
          className: 'Grade 10',
          sectionId: 's-1',
          sectionName: 'A',
        ),
        allocations: [
          TeacherAllocationItem(
            id: 'alloc-1',
            classId: 'c-1',
            className: 'Grade 10',
            sectionId: 's-1',
            sectionName: 'A',
            subjectId: 'sub-1',
            subjectName: 'Mathematics',
            subjectCode: 'MTH101',
          ),
        ],
      );

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AcademicsLoading>(),
          isA<TeacherAllocationsLoaded>().having(
            (s) => s.allocationsResponse.homeroom?.className,
            'homeroom class',
            'Grade 10',
          ),
        ]),
      );

      bloc.add(LoadTeacherAllocationsEvent());
    });

    test('emits [AcademicsLoading, AcademicsError] when repository throws',
        () async {
      mockRepo.shouldThrow = true;

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AcademicsLoading>(),
          isA<AcademicsError>().having(
            (s) => s.message,
            'error message',
            'Failed to load subjects',
          ),
        ]),
      );

      bloc.add(LoadSubjectsEvent());
    });
  });
}
