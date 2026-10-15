import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/academics/models/student_roster_item.dart';
import 'package:mobile/features/academics/models/subject_model.dart';
import 'package:mobile/features/academics/models/subject_teacher_item.dart';
import 'package:mobile/features/academics/presentation/student_roster_view.dart';
import 'package:mobile/features/academics/presentation/subject_teachers_view.dart';
import 'package:mobile/features/academics/presentation/subjects_catalog_view.dart';

void main() {
  group('Academics Views Widget Tests', () {
    testWidgets('StudentRosterView renders student list correctly',
        (tester) async {
      final students = [
        const StudentRosterItem(
          id: 's1',
          admissionNumber: 'ADM2026001',
          rollNumber: '101',
          firstName: 'Aarav',
          lastName: 'Sharma',
          gender: 'Male',
          bloodGroup: 'O+',
        ),
        const StudentRosterItem(
          id: 's2',
          admissionNumber: 'ADM2026002',
          rollNumber: '102',
          firstName: 'Riya',
          lastName: 'Patel',
          gender: 'Female',
          bloodGroup: 'B+',
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StudentRosterView(students: students),
          ),
        ),
      );

      expect(find.text('Aarav Sharma'), findsOneWidget);
      expect(find.text('Riya Patel'), findsOneWidget);
      expect(find.text('Adm: ADM2026001 • Male'), findsOneWidget);
      expect(find.text('Roll 101'), findsOneWidget);
      expect(find.text('2 students enrolled'), findsOneWidget);
      expect(find.byIcon(Icons.edit_outlined), findsNothing);
    });

    testWidgets('StudentRosterView renders edit action and triggers onEditStudent when canEdit is true',
        (tester) async {
      StudentRosterItem? editedStudent;
      final students = [
        const StudentRosterItem(
          id: 's1',
          admissionNumber: 'ADM2026001',
          rollNumber: '101',
          firstName: 'Aarav',
          lastName: 'Sharma',
          gender: 'Male',
          bloodGroup: 'O+',
          emergencyPhone: '+91 9876543210',
          medicalNotes: 'Asthmatic',
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StudentRosterView(
              students: students,
              canEdit: true,
              onEditStudent: (student) {
                editedStudent = student;
              },
            ),
          ),
        ),
      );

      expect(find.text('Aarav Sharma'), findsOneWidget);
      expect(find.text('Emergency: +91 9876543210'), findsOneWidget);
      expect(find.text('Medical: Asthmatic'), findsOneWidget);
      expect(find.byIcon(Icons.edit_outlined), findsOneWidget);

      await tester.tap(find.byIcon(Icons.edit_outlined));
      await tester.pump();

      expect(editedStudent, isNotNull);
      expect(editedStudent!.id, 's1');
      expect(editedStudent!.admissionNumber, 'ADM2026001');
    });

    testWidgets('SubjectTeachersView renders subject and teacher cards',
        (tester) async {
      final teachers = [
        const SubjectTeacherItem(
          subjectId: 'sub-1',
          subjectName: 'Mathematics',
          subjectCode: 'MATH10',
          teacherName: 'Vikram Mehta',
          teacherPhone: '+91 9876543210',
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SubjectTeachersView(teachers: teachers),
          ),
        ),
      );

      expect(find.text('Mathematics'), findsOneWidget);
      expect(find.text('MATH10'), findsOneWidget);
      expect(find.text('Teacher: Vikram Mehta'), findsOneWidget);
      expect(find.text('Contact: +91 9876543210'), findsOneWidget);
    });

    testWidgets('SubjectsCatalogView renders subject list', (tester) async {
      final subjects = [
        const SubjectModel(
          id: '1',
          code: 'SCI10',
          name: 'Science',
          type: 'CORE',
          creditHours: 4,
          isActive: true,
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SubjectsCatalogView(subjects: subjects),
          ),
        ),
      );

      expect(find.text('Science'), findsOneWidget);
      expect(find.text('SCI10'), findsOneWidget);
      expect(find.text('Type: CORE • Credit Hours: 4'), findsOneWidget);
    });
  });
}
