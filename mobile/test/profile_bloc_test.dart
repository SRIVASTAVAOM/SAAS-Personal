import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/features/profiles/bloc/profile_bloc.dart';
import 'package:mobile/features/profiles/bloc/profile_event.dart';
import 'package:mobile/features/profiles/bloc/profile_state.dart';
import 'package:mobile/features/profiles/models/staff_profile_model.dart';
import 'package:mobile/features/profiles/models/student_profile_model.dart';
import 'package:mobile/features/profiles/repository/profile_repository.dart';

class MockProfileRepository implements ProfileRepository {
  StudentProfileModel? studentProfile;
  StaffProfileModel? staffProfile;
  bool shouldThrow = false;

  @override
  DioClient get dioClient => throw UnimplementedError();

  @override
  Future<StudentProfileModel> getStudentProfile() async {
    if (shouldThrow) throw Exception('Failed to load student profile');
    return studentProfile!;
  }

  @override
  Future<StudentProfileModel> updateStudentProfile({
    String? emergencyPhone,
    String? bloodGroup,
    String? medicalNotes,
    String? documentUrl,
  }) async {
    if (shouldThrow) throw Exception('Failed to update student profile');
    return StudentProfileModel(
      id: studentProfile!.id,
      admissionNumber: studentProfile!.admissionNumber,
      firstName: studentProfile!.firstName,
      lastName: studentProfile!.lastName,
      gender: studentProfile!.gender,
      dateOfBirth: studentProfile!.dateOfBirth,
      admissionDate: studentProfile!.admissionDate,
      emergencyPhone: emergencyPhone ?? studentProfile!.emergencyPhone,
      bloodGroup: bloodGroup ?? studentProfile!.bloodGroup,
      medicalNotes: medicalNotes ?? studentProfile!.medicalNotes,
      documentUrl: documentUrl ?? studentProfile!.documentUrl,
    );
  }

  @override
  Future<void> updateStudentProfileByTeacher(
    String studentId, {
    String? rollNumber,
    String? bloodGroup,
    String? emergencyContactPhone,
    String? medicalNotes,
    String? documentUrl,
  }) async {
    if (shouldThrow) throw Exception('Failed to update student details');
  }

  @override
  Future<StaffProfileModel> getStaffProfile() async {
    if (shouldThrow) throw Exception('Failed to load staff profile');
    return staffProfile!;
  }

  @override
  Future<StaffProfileModel> updateStaffProfile({
    String? phone,
    String? emergencyPhone,
    String? qualification,
    String? bloodGroup,
  }) async {
    if (shouldThrow) throw Exception('Failed to update staff profile');
    return StaffProfileModel(
      id: staffProfile!.id,
      employeeCode: staffProfile!.employeeCode,
      firstName: staffProfile!.firstName,
      lastName: staffProfile!.lastName,
      gender: staffProfile!.gender,
      dateOfBirth: staffProfile!.dateOfBirth,
      joiningDate: staffProfile!.joiningDate,
      qualification: qualification ?? staffProfile!.qualification,
      phone: phone ?? staffProfile!.phone,
      emergencyPhone: emergencyPhone ?? staffProfile!.emergencyPhone,
      bloodGroup: bloodGroup ?? staffProfile!.bloodGroup,
      allocations: staffProfile!.allocations,
    );
  }
}

void main() {
  group('ProfileBloc Unit Tests', () {
    late MockProfileRepository mockRepo;
    late ProfileBloc bloc;

    setUp(() {
      mockRepo = MockProfileRepository();
      bloc = ProfileBloc(repository: mockRepo);
    });

    tearDown(() {
      bloc.close();
    });

    test('initial state is ProfileInitial', () {
      expect(bloc.state, isA<ProfileInitial>());
    });

    test(
        'emits [ProfileLoading, StudentProfileLoaded] on LoadStudentProfileEvent',
        () async {
      mockRepo.studentProfile = const StudentProfileModel(
        id: 'std-1',
        admissionNumber: 'ADM2026001',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'Male',
        dateOfBirth: '2010-05-15',
        admissionDate: '2026-04-01',
        emergencyPhone: '+91 9876543210',
        bloodGroup: 'O+',
      );

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ProfileLoading>(),
          isA<StudentProfileLoaded>().having(
            (s) => s.profile.admissionNumber,
            'admission number',
            'ADM2026001',
          ),
        ]),
      );

      bloc.add(LoadStudentProfileEvent());
    });

    test(
        'emits [ProfileUpdating, ProfileUpdateSuccess, StudentProfileLoaded] on UpdateStudentProfileEvent',
        () async {
      mockRepo.studentProfile = const StudentProfileModel(
        id: 'std-1',
        admissionNumber: 'ADM2026001',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'Male',
        dateOfBirth: '2010-05-15',
        admissionDate: '2026-04-01',
        emergencyPhone: '+91 9876543210',
        bloodGroup: 'O+',
      );

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ProfileUpdating>(),
          isA<ProfileUpdateSuccess>(),
          isA<StudentProfileLoaded>().having(
            (s) => s.profile.emergencyPhone,
            'emergency phone',
            '+91 9123456789',
          ),
        ]),
      );

      bloc.add(const UpdateStudentProfileEvent(emergencyPhone: '+91 9123456789'));
    });

    test('emits [ProfileLoading, StaffProfileLoaded] on LoadStaffProfileEvent',
        () async {
      mockRepo.staffProfile = const StaffProfileModel(
        id: 'stf-1',
        employeeCode: 'EMP-TEACHER1',
        firstName: 'Vikram',
        lastName: 'Mehta',
        gender: 'Male',
        dateOfBirth: '1988-08-20',
        joiningDate: '2024-06-01',
        qualification: 'M.Sc., B.Ed.',
        allocations: [],
      );

      expectLater(
        bloc.stream,
        emitsInOrder([
          isA<ProfileLoading>(),
          isA<StaffProfileLoaded>().having(
            (s) => s.profile.employeeCode,
            'employee code',
            'EMP-TEACHER1',
          ),
        ]),
      );

      bloc.add(LoadStaffProfileEvent());
    });
  });
}
