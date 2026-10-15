import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/curriculum/bloc/curriculum_bloc.dart';
import 'package:mobile/features/curriculum/models/curriculum_model.dart';
import 'package:mobile/features/curriculum/repository/curriculum_repository.dart';

class MockCurriculumRepository implements CurriculumRepository {
  bool shouldThrow = false;

  final sampleUnit = const CurriculumUnitModel(
    id: 'unit-1',
    schoolId: 'sch-1',
    classId: 'cls-1',
    subjectId: 'sub-1',
    academicYearId: 'ay-2026',
    unitNumber: 1,
    title: 'Unit 1: Real Numbers',
    description: 'Fundamental theorem of arithmetic',
    createdAt: '2026-10-10T00:00:00Z',
    topics: [
      CurriculumTopicModel(
        id: 'topic-1',
        unitId: 'unit-1',
        topicNumber: 1,
        title: 'Euclid Division Lemma',
        description: 'Division algorithm and applications',
        learningObjectives: 'Understand fundamental lemma',
        createdAt: '2026-10-10T00:00:00Z',
      ),
    ],
  );

  @override
  Future<List<CurriculumUnitModel>> getCurriculumUnits(
    String classId,
    String subjectId, {
    String? academicYearId,
  }) async {
    if (shouldThrow) throw Exception('Curriculum fetch failed');
    return [sampleUnit];
  }

  @override
  Future<CurriculumUnitModel> createUnit({
    required String classId,
    required String subjectId,
    String? academicYearId,
    required int unitNumber,
    required String title,
    String? description,
  }) async {
    if (shouldThrow) throw Exception('Unit creation failed');
    return sampleUnit;
  }

  @override
  Future<CurriculumTopicModel> createTopic({
    required String unitId,
    required int topicNumber,
    required String title,
    String? description,
    String? learningObjectives,
  }) async {
    if (shouldThrow) throw Exception('Topic creation failed');
    return sampleUnit.topics.first;
  }
}

void main() {
  group('CurriculumBloc Unit Tests', () {
    late MockCurriculumRepository mockRepository;
    late CurriculumBloc bloc;

    setUp(() {
      mockRepository = MockCurriculumRepository();
      bloc = CurriculumBloc(mockRepository);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is CurriculumInitial', () {
      expect(bloc.state, isA<CurriculumInitial>());
    });

    test('emits [CurriculumLoading, CurriculumLoaded] on LoadCurriculumUnitsEvent', () async {
      final expected = [
        isA<CurriculumLoading>(),
        isA<CurriculumLoaded>().having(
          (s) => s.units.first.title,
          'unit title',
          'Unit 1: Real Numbers',
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const LoadCurriculumUnitsEvent('cls-1', 'sub-1'));
    });

    test('emits [CurriculumLoading, CurriculumLoaded] on CreateCurriculumUnitEvent', () async {
      final expected = [
        isA<CurriculumLoading>(),
        isA<CurriculumLoaded>().having(
          (s) => s.units.length,
          'units count',
          1,
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(
        const CreateCurriculumUnitEvent(
          classId: 'cls-1',
          subjectId: 'sub-1',
          unitNumber: 2,
          title: 'Unit 2: Polynomials',
        ),
      );
    });

    test('emits [CurriculumLoading, CurriculumLoaded] on CreateCurriculumTopicEvent', () async {
      final expected = [
        isA<CurriculumLoading>(),
        isA<CurriculumLoaded>().having(
          (s) => s.units.first.topics.length,
          'topics count',
          1,
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(
        const CreateCurriculumTopicEvent(
          unitId: 'unit-1',
          topicNumber: 2,
          title: 'Geometric Meaning of Zeroes',
          classId: 'cls-1',
          subjectId: 'sub-1',
        ),
      );
    });

    test('emits [CurriculumLoading, CurriculumError] on error', () async {
      mockRepository.shouldThrow = true;
      final expected = [
        isA<CurriculumLoading>(),
        isA<CurriculumError>().having(
          (s) => s.message,
          'error message',
          contains('Curriculum fetch failed'),
        ),
      ];

      expectLater(bloc.stream, emitsInOrder(expected));
      bloc.add(const LoadCurriculumUnitsEvent('cls-1', 'sub-1'));
    });
  });
}
