import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/core/widgets/document_picker_bottom_sheet.dart';

void main() {
  group('DocumentPickerBottomSheet Widget Tests', () {
    testWidgets('renders both Device/System and Camera options cleanly',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  DocumentPickerBottomSheet.show(
                    context,
                    title: 'Attach Supporting Document',
                    subtitle: 'Choose from system files or take a photo with camera',
                  );
                },
                child: const Text('Open Picker'),
              ),
            ),
          ),
        ),
      );

      // Open bottom sheet
      await tester.tap(find.text('Open Picker'));
      await tester.pumpAndSettle();

      // Verify header and both options are rendered
      expect(find.text('Attach Supporting Document'), findsOneWidget);
      expect(find.text('Choose from system files or take a photo with camera'), findsOneWidget);
      expect(find.byKey(const Key('doc_picker_device_option')), findsOneWidget);
      expect(find.byKey(const Key('doc_picker_camera_option')), findsOneWidget);
      expect(find.text('Device / Gallery se Chunein (Files & Gallery)'), findsOneWidget);
      expect(find.text('Camera se Photo Kheenche (Take Photo)'), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);
    });

    testWidgets('selecting Device/System option returns device document result',
        (tester) async {
      PickedDocument? selectedDoc;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () async {
                  selectedDoc = await DocumentPickerBottomSheet.show(
                    context,
                    categoryPrefix: 'leave_doc',
                    pickImageFn: (src) async => XFile('prescription_report.pdf'),
                  );
                },
                child: const Text('Open Picker'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Picker'));
      await tester.pumpAndSettle();

      // Tap device option
      await tester.tap(find.byKey(const Key('doc_picker_device_option')));
      await tester.pumpAndSettle();

      // Verify bottom sheet closed and returned result
      expect(find.byType(DocumentPickerBottomSheet), findsNothing);
      expect(selectedDoc, isNotNull);
      expect(selectedDoc!.source, DocumentUploadSource.device);
      expect(selectedDoc!.name, 'prescription_report.pdf');
      expect(selectedDoc!.url, contains('leave_doc'));
    });

    testWidgets('selecting Camera option returns camera document result',
        (tester) async {
      PickedDocument? selectedDoc;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () async {
                  selectedDoc = await DocumentPickerBottomSheet.show(
                    context,
                    categoryPrefix: 'camera_capture',
                    pickImageFn: (src) async => XFile('camera_doc_photo.jpg'),
                  );
                },
                child: const Text('Open Picker'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Picker'));
      await tester.pumpAndSettle();

      // Tap camera option
      await tester.tap(find.byKey(const Key('doc_picker_camera_option')));
      await tester.pumpAndSettle();

      // Verify bottom sheet closed and returned result
      expect(find.byType(DocumentPickerBottomSheet), findsNothing);
      expect(selectedDoc, isNotNull);
      expect(selectedDoc!.source, DocumentUploadSource.camera);
      expect(selectedDoc!.url, contains('camera'));
    });

    testWidgets('tapping Cancel closes sheet without selection',
        (tester) async {
      PickedDocument? selectedDoc;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () async {
                  selectedDoc = await DocumentPickerBottomSheet.show(context);
                },
                child: const Text('Open Picker'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Picker'));
      await tester.pumpAndSettle();

      // Tap Cancel
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();

      expect(find.byType(DocumentPickerBottomSheet), findsNothing);
      expect(selectedDoc, isNull);
    });
  });
}
