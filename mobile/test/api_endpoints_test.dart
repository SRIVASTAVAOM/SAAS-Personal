import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_endpoints.dart';

void main() {
  group('ApiEndpoints Configuration Tests', () {
    test('baseUrl resolves non-empty valid URL structure', () {
      final url = ApiEndpoints.baseUrl;
      expect(url, isNotEmpty);
      expect(url.startsWith('http'), isTrue);
      expect(url.endsWith('/api/v1'), isTrue);
    });

    test('academic endpoints construct proper route paths', () {
      expect(ApiEndpoints.subjects, endsWith('/api/v1/academics/subjects'));
      expect(ApiEndpoints.myRoster, endsWith('/api/v1/academics/my-roster'));
      expect(ApiEndpoints.subjectTeachers, endsWith('/api/v1/academics/subject-teachers'));
      expect(ApiEndpoints.classRoster('class1', 'sec1'),
          endsWith('/api/v1/academics/class-roster/class1/sec1'));
      expect(ApiEndpoints.studentProfile, endsWith('/api/v1/profiles/student'));
      expect(ApiEndpoints.staffProfile, endsWith('/api/v1/profiles/staff'));
    });
  });
}
