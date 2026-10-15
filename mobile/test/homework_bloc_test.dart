import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/homework/bloc/homework_bloc.dart';
import 'package:mobile/features/homework/models/homework_model.dart';
import 'package:mobile/features/homework/repository/homework_repository.dart';
import 'package:mobile/features/materials/models/academic_material_model.dart';

class MockHomeworkRepository implements HomeworkRepository {
  bool shouldThrow = false;

  final sampleHomework = const HomeworkModel(
    id: 'hw-123',
    schoolId: 'sch-1',
    classId: 'class-1',
    sectionId: 'sec-1',
    subjectId: 'sub-1',
    assignedByStaffId: 'staff-1',
    title: 'Algebra Exercise 4.2',
    description: 'Solve problems 1 through 10',
    assignedDate: '2026-10-10',
    dueDate: '2026-10-15',
    s3AttachmentKey: 'attachments/hw-123.pdf',
    attachmentName: 'Algebra_Notes.pdf',
    className: 'Grade 10',
    sectionName: 'A',
    subjectName: 'Mathematics',
    teacherName: 'John Doe',
    studentStatus: 'PENDING',
    totalStudents: 30,
    completedCount: 12,
  );

  @override
  Future<List<HomeworkModel>> getStudentMyClassHomework() async {
    if (shouldThrow) throw Exception('Network error');
    return [sampleHomework];
  }

  @override
  Future<List<HomeworkModel>> getTeacherMyAssignedHomework() async {
    if (shouldThrow) throw Exception('Network error');
    return [sampleHomework];
  }

  @override
  Future<List<HomeworkModel>> getClassHomework(String classId, String sectionId) async {
    if (shouldThrow) throw Exception('Network error');
    return [sampleHomework];
  }

  @override
  Future<HomeworkModel> createHomework({
    required String classId,
    required String sectionId,
    required String subjectId,
    required String title,
    required String description,
    String? assignedDate,
    required String dueDate,
    String? s3AttachmentKey,
    String? attachmentName,
  }) async {
    if (shouldThrow) throw Exception('Network error');
    return sampleHomework;
  }

  @override
  Future<HomeworkModel> updateHomework({
    required String id,
    String? title,
    String? description,
    String? dueDate,
    String? s3AttachmentKey,
    String? attachmentName,
  }) async {
    if (shouldThrow) throw Exception('Network error');
    return sampleHomework;
  }

  @override
  Future<void> setCompletionStatus(String homeworkId, String status) async {
    if (shouldThrow) throw Exception('Network error');
  }

  @override
  Future<PresignedDownloadResponse> getAttachmentDownloadUrl(String homeworkId) async {
    if (shouldThrow) throw Exception('Network error');
    return const PresignedDownloadResponse(
      downloadUrl: 'https://school-erp-bucket.s3.amazonaws.com/downloads/hw-123.pdf?sig=test',
      fileName: 'Algebra_Notes.pdf',
      contentType: 'application/pdf',
      expiresInSeconds: 900,
    );
  }
}

void main() {
  group('HomeworkBloc Unit Tests', () {
    late MockHomeworkRepository mockRepository;
    late HomeworkBloc bloc;

    setUp(() {
      mockRepository = MockHomeworkRepository();
      bloc = HomeworkBloc(mockRepository);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is HomeworkInitial', () {
      expect(bloc.state, isA<HomeworkInitial>());
    });

    test('emits [HomeworkLoading, StudentHomeworkLoaded] on LoadStudentHomeworkEvent', () async {
      final expected = [
        isA<HomeworkLoading>(),
        isA<StudentHomeworkLoaded>().having(
          (s) => s.homeworkList.length,
          'homeworkList length',
          1,
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const LoadStudentHomeworkEvent());
    });

    test('emits [HomeworkLoading, TeacherHomeworkLoaded] on LoadTeacherHomeworkEvent', () async {
      final expected = [
        isA<HomeworkLoading>(),
        isA<TeacherHomeworkLoaded>().having(
          (s) => s.homeworkList.first.title,
          'title',
          'Algebra Exercise 4.2',
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const LoadTeacherHomeworkEvent());
    });

    test('emits TeacherHomeworkLoaded on UpdateHomeworkEvent', () async {
      final expected = [
        isA<HomeworkLoading>(),
        isA<TeacherHomeworkLoaded>().having(
          (s) => s.homeworkList.first.title,
          'title',
          'Algebra Exercise 4.2',
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const UpdateHomeworkEvent(
        id: 'hw-123',
        title: 'Updated Algebra Exercise',
        description: 'New instructions',
        dueDate: '2026-10-20',
      ));
    });

    test('emits StudentHomeworkLoaded on ToggleHomeworkCompletionEvent', () async {
      final expected = [
        isA<StudentHomeworkLoaded>().having(
          (s) => s.homeworkList.length,
          'homeworkList length',
          1,
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const ToggleHomeworkCompletionEvent('hw-123', 'PENDING'));
    });

    test('emits HomeworkOperationSuccess on DownloadHomeworkAttachmentEvent', () async {
      final expected = [
        isA<HomeworkOperationSuccess>().having(
          (s) => s.downloadUrl,
          'downloadUrl',
          contains('s3.amazonaws.com'),
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const DownloadHomeworkAttachmentEvent('hw-123'));
    });

    test('emits [HomeworkLoading, HomeworkError] when repository throws', () async {
      mockRepository.shouldThrow = true;
      final expected = [
        isA<HomeworkLoading>(),
        isA<HomeworkError>().having(
          (s) => s.message,
          'error message',
          contains('Network error'),
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const LoadStudentHomeworkEvent());
    });
  });
}
