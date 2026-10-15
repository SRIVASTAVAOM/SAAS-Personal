import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/student/bloc/student_features_bloc.dart';
import 'package:mobile/features/student/bloc/student_features_event.dart';
import 'package:mobile/features/student/bloc/student_features_state.dart';
import 'package:mobile/features/student/models/student_features_model.dart';
import 'package:mobile/features/student/repository/student_features_repository.dart';
import 'package:mobile/features/student/presentation/views/student_notices_view.dart';
import 'package:mobile/features/student/presentation/views/student_fees_view.dart';
import 'package:mobile/features/student/presentation/views/school_contact_view.dart';
import 'package:mobile/features/profiles/bloc/profile_bloc.dart';
import 'package:mobile/features/profiles/bloc/profile_state.dart';
import 'package:mobile/features/profiles/models/student_profile_model.dart';
import 'package:mobile/features/profiles/repository/profile_repository.dart';

class MockStudentFeaturesRepository implements StudentFeaturesRepository {
  List<NoticeModel> notices = [];
  FeeOverviewModel feeOverview = const FeeOverviewModel(
    totalDues: 25000,
    totalPaid: 15000,
    totalOutstanding: 10000,
    fees: [],
  );
  List<FeeReceiptModel> receipts = [];
  List<ComplaintModel> complaints = [];
  List<FeedbackModel> feedbackList = [];
  bool shouldThrow = false;

  @override
  DioClient get dioClient => throw UnimplementedError();

  @override
  Future<List<NoticeModel>> getNotices() async {
    if (shouldThrow) throw Exception('Failed to load notices');
    return notices;
  }

  @override
  Future<FeeOverviewModel> getFeesOverview() async {
    if (shouldThrow) throw Exception('Failed to load fees');
    return feeOverview;
  }

  @override
  Future<List<FeeReceiptModel>> getReceipts() async {
    if (shouldThrow) throw Exception('Failed to load receipts');
    return receipts;
  }

  @override
  Future<List<ComplaintModel>> getComplaints() async {
    if (shouldThrow) throw Exception('Failed to load complaints');
    return complaints;
  }

  @override
  Future<ComplaintModel> submitComplaint({
    required String title,
    required String category,
    required String description,
  }) async {
    if (shouldThrow) throw Exception('Failed to submit complaint');
    final c = ComplaintModel(
      id: 'cmp-1',
      title: title,
      category: category,
      description: description,
      status: 'PENDING',
      createdAt: '2026-10-14',
    );
    complaints.add(c);
    return c;
  }

  @override
  Future<List<FeedbackModel>> getFeedback() async {
    if (shouldThrow) throw Exception('Failed to load feedback');
    return feedbackList;
  }

  @override
  Future<FeedbackModel> submitFeedback({
    required String category,
    required int rating,
    required String feedbackText,
  }) async {
    if (shouldThrow) throw Exception('Failed to submit feedback');
    final fb = FeedbackModel(
      id: 'fb-1',
      category: category,
      rating: rating,
      feedbackText: feedbackText,
      createdAt: '2026-10-14',
    );
    feedbackList.add(fb);
    return fb;
  }
}

class MockProfileRepository implements ProfileRepository {
  @override
  DioClient get dioClient => throw UnimplementedError();

  @override
  Future<StudentProfileModel> getStudentProfile() async {
    return const StudentProfileModel(
      id: 'std-1',
      admissionNumber: 'ADM001',
      firstName: 'Student',
      lastName: 'One',
      gender: 'Male',
      dateOfBirth: '2010-05-15',
      admissionDate: '2022-04-01',
      schoolName: 'Apex International School',
      schoolPhone: '+91 9876543210',
      schoolEmail: 'info@apexschool.edu',
      schoolAddress: '123 Education Lane, Knowledge Park',
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('StudentFeaturesBloc Unit Tests', () {
    late MockStudentFeaturesRepository repo;
    late StudentFeaturesBloc bloc;

    setUp(() {
      repo = MockStudentFeaturesRepository();
      bloc = StudentFeaturesBloc(repository: repo);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is StudentFeaturesInitial', () {
      expect(bloc.state, isA<StudentFeaturesInitial>());
    });

    test('emits [StudentFeaturesLoading, StudentNoticesLoaded] on LoadStudentNoticesEvent', () async {
      repo.notices = [
        const NoticeModel(
          id: 'n-1',
          title: 'Annual Sports Day',
          content: 'Sports day will be on Friday.',
          targetRole: 'STUDENT',
          priority: 'URGENT',
          publishedAt: '2026-10-14',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<StudentFeaturesLoading>(),
          isA<StudentNoticesLoaded>().having((s) => s.notices.length, 'count', 1),
        ]),
      );

      bloc.add(const LoadStudentNoticesEvent());
    });

    test('emits [StudentFeaturesLoading, StudentFeesLoaded] on LoadStudentFeesEvent', () async {
      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<StudentFeaturesLoading>(),
          isA<StudentFeesLoaded>().having((s) => s.overview.totalDues, 'totalDues', 25000),
        ]),
      );

      bloc.add(const LoadStudentFeesEvent());
    });

    test('emits [StudentFeaturesLoading, StudentReceiptsLoaded] on LoadStudentReceiptsEvent', () async {
      repo.receipts = [
        const FeeReceiptModel(
          id: 'rcpt-1',
          receiptNumber: 'RCP-2026-001',
          amountPaid: 15000,
          paymentMode: 'UPI',
          paymentDate: '2026-10-10',
        ),
      ];

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<StudentFeaturesLoading>(),
          isA<StudentReceiptsLoaded>().having((s) => s.receipts.first.receiptNumber, 'receiptNumber', 'RCP-2026-001'),
        ]),
      );

      bloc.add(const LoadStudentReceiptsEvent());
    });
  });

  group('Student Views Widget Tests', () {
    late MockStudentFeaturesRepository repo;

    setUp(() {
      repo = MockStudentFeaturesRepository();
    });

    testWidgets('StudentNoticesView renders notices list correctly', (tester) async {
      repo.notices = [
        const NoticeModel(
          id: 'n-1',
          title: 'Winter Vacation Notice',
          content: 'School closed from Dec 25.',
          targetRole: 'STUDENT',
          priority: 'INFO',
          publishedAt: '2026-10-14',
        ),
      ];

      final bloc = StudentFeaturesBloc(repository: repo);

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<StudentFeaturesBloc>.value(
            value: bloc,
            child: const Scaffold(body: StudentNoticesView()),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('School & Class Notices'), findsOneWidget);
      expect(find.text('Winter Vacation Notice'), findsOneWidget);
      expect(find.text('School closed from Dec 25.'), findsOneWidget);

      bloc.close();
    });

    testWidgets('StudentFeesView renders fee structure and dues summary', (tester) async {
      final bloc = StudentFeaturesBloc(repository: repo);

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<StudentFeaturesBloc>.value(
            value: bloc,
            child: const Scaffold(body: StudentFeesView()),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Fee Structure & Dues'), findsOneWidget);
      expect(find.text('Fee Receipts'), findsOneWidget);
      expect(find.text('₹25000'), findsOneWidget);
      expect(find.text('₹15000'), findsOneWidget);
      expect(find.text('₹10000'), findsOneWidget);

      bloc.close();
    });

    testWidgets('SchoolContactView renders institutional contact details', (tester) async {
      final profileRepo = MockProfileRepository();
      final profileBloc = ProfileBloc(repository: profileRepo);

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<ProfileBloc>.value(
            value: profileBloc,
            child: const Scaffold(body: SchoolContactView()),
          ),
        ),
      );

      profileBloc.emit(StudentProfileLoaded(
        await profileRepo.getStudentProfile(),
      ));
      await tester.pump();

      expect(find.text('Apex International School'), findsOneWidget);
      expect(find.text('+91 9876543210'), findsOneWidget);
      expect(find.text('info@apexschool.edu'), findsOneWidget);
      expect(find.text('123 Education Lane, Knowledge Park'), findsOneWidget);

      profileBloc.close();
    });
  });
}
