import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_state.dart';
import '../bloc/materials_bloc.dart';
import '../models/academic_material_model.dart';
import '../../../core/widgets/document_picker_bottom_sheet.dart';

class AcademicMaterialsView extends StatefulWidget {
  final String classId;
  final String subjectId;
  final String? className;
  final String? subjectName;

  const AcademicMaterialsView({
    super.key,
    required this.classId,
    required this.subjectId,
    this.className,
    this.subjectName,
  });

  @override
  State<AcademicMaterialsView> createState() => _AcademicMaterialsViewState();
}

class _AcademicMaterialsViewState extends State<AcademicMaterialsView> {
  @override
  void initState() {
    super.initState();
    if (widget.classId.isNotEmpty && widget.subjectId.isNotEmpty) {
      context.read<MaterialsBloc>().add(
            LoadClassMaterialsEvent(widget.classId, widget.subjectId),
          );
    }
  }

  @override
  void didUpdateWidget(AcademicMaterialsView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if ((oldWidget.classId != widget.classId || oldWidget.subjectId != widget.subjectId) &&
        widget.classId.isNotEmpty &&
        widget.subjectId.isNotEmpty) {
      context.read<MaterialsBloc>().add(
            LoadClassMaterialsEvent(widget.classId, widget.subjectId),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final isTeacher = authState is Authenticated && authState.activeRole == 'TEACHER';

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.subjectName ?? "Subject"} Study Materials'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              if (widget.classId.isNotEmpty && widget.subjectId.isNotEmpty) {
                context.read<MaterialsBloc>().add(
                      LoadClassMaterialsEvent(widget.classId, widget.subjectId),
                    );
              }
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: Colors.grey.shade200, height: 1.0),
        ),
      ),
      backgroundColor: const Color(0xFFF9FAFB),
      floatingActionButton: isTeacher
          ? FloatingActionButton.extended(
              key: const Key('upload_material_fab'),
              onPressed: () => _showUploadDialog(context),
              backgroundColor: Colors.black87,
              icon: const Icon(Icons.upload_file, color: Colors.white),
              label: const Text('Upload Material', style: TextStyle(color: Colors.white)),
            )
          : null,
      body: (widget.classId.isEmpty || widget.subjectId.isEmpty)
          ? const Center(
              child: Text(
                'Please select a class and subject to view study materials.',
                style: TextStyle(color: Colors.grey),
              ),
            )
          : BlocConsumer<MaterialsBloc, MaterialsState>(
        listener: (context, state) {
          if (state is MaterialOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.downloadUrl != null
                    ? 'Download link ready: ${state.fileName ?? "Document"}'
                    : state.message),
                backgroundColor: Colors.black87,
              ),
            );
          } else if (state is MaterialsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red.shade700),
            );
          }
        },
        builder: (context, state) {
          if (state is MaterialsLoading) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          if (state is MaterialUploading) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    LinearProgressIndicator(value: state.progress, minHeight: 6),
                    const SizedBox(height: 16),
                    Text(
                      state.statusText,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state is MaterialsLoaded) {
            final materials = state.materials;
            if (materials.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.folder_open_outlined, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 12),
                    Text(
                      'No study materials uploaded yet',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: materials.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _buildMaterialCard(materials[index]);
              },
            );
          }

          return Center(
            child: ElevatedButton(
              onPressed: () {
                context.read<MaterialsBloc>().add(
                      LoadClassMaterialsEvent(widget.classId, widget.subjectId),
                    );
              },
              child: const Text('Load Materials'),
            ),
          );
        },
      ),
    );
  }

  Widget _buildMaterialCard(AcademicMaterialModel item) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(
                  item.contentType.contains('pdf') ? Icons.picture_as_pdf : Icons.image,
                  color: Colors.black87,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.fileName,
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  item.formattedSize,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
          if (item.description != null && item.description!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              item.description!,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'By ${item.teacherName ?? "Teacher"}',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              OutlinedButton.icon(
                key: Key('download_material_${item.id}'),
                onPressed: () {
                  context.read<MaterialsBloc>().add(DownloadMaterialEvent(item.id));
                },
                icon: const Icon(Icons.download_outlined, size: 16),
                label: const Text('Download Document'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.black87,
                  side: BorderSide(color: Colors.grey.shade300),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showUploadDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return _UploadMaterialDialog(
          classId: widget.classId,
          subjectId: widget.subjectId,
          onSubmitted: (event) {
            context.read<MaterialsBloc>().add(event);
            Navigator.pop(dialogContext);
          },
        );
      },
    );
  }
}

class _UploadMaterialDialog extends StatefulWidget {
  final String classId;
  final String subjectId;
  final void Function(UploadMaterialEvent) onSubmitted;

  const _UploadMaterialDialog({
    required this.classId,
    required this.subjectId,
    required this.onSubmitted,
  });

  @override
  State<_UploadMaterialDialog> createState() => _UploadMaterialDialogState();
}

class _UploadMaterialDialogState extends State<_UploadMaterialDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _fileNameController = TextEditingController(text: 'Chapter_Summary_Guide.pdf');
  String _selectedContentType = 'application/pdf';
  String? _pickedDocumentSource;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _fileNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Upload Study Material'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                key: const Key('material_title_field'),
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title *', border: OutlineInputBorder()),
                validator: (val) => val == null || val.trim().isEmpty ? 'Title is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('material_desc_field'),
                controller: _descController,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              // Camera / Gallery / Device Picker Container
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.attach_file, size: 15, color: Colors.black54),
                            SizedBox(width: 4),
                            Text(
                              'Choose / Capture Document',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        if (_pickedDocumentSource != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFFBFDBFE)),
                            ),
                            child: Text(
                              _pickedDocumentSource!,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF1D4ED8),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      key: const Key('material_pick_file_btn'),
                      onPressed: () async {
                        final doc = await DocumentPickerBottomSheet.show(
                          context,
                          title: 'Upload Syllabus / Study Material',
                          subtitle:
                              'Choose from device storage or take a photo with camera',
                          categoryPrefix: 'study_material',
                        );
                        if (doc != null) {
                          setState(() {
                            _fileNameController.text = doc.name;
                            _pickedDocumentSource = doc.source == DocumentUploadSource.camera
                                ? 'From Camera'
                                : 'From Gallery/Device';
                            if (doc.name.toLowerCase().endsWith('.pdf')) {
                              _selectedContentType = 'application/pdf';
                            } else if (doc.name.toLowerCase().endsWith('.png')) {
                              _selectedContentType = 'image/png';
                            } else {
                              _selectedContentType = 'image/jpeg';
                            }
                          });
                        }
                      },
                      icon: const Icon(Icons.add_a_photo_outlined, size: 14),
                      label: const Text(
                        'Device / Camera se File Chunein',
                        style: TextStyle(fontSize: 11),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: Colors.grey.shade300),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('material_filename_field'),
                controller: _fileNameController,
                decoration: const InputDecoration(labelText: 'File Name *', border: OutlineInputBorder()),
                validator: (val) => val == null || val.trim().isEmpty ? 'File name is required' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _selectedContentType,
                decoration: const InputDecoration(labelText: 'MIME Type', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'application/pdf', child: Text('PDF Document (.pdf)')),
                  DropdownMenuItem(value: 'image/jpeg', child: Text('JPEG Image (.jpg)')),
                  DropdownMenuItem(value: 'image/png', child: Text('PNG Image (.png)')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _selectedContentType = val);
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          key: const Key('confirm_upload_btn'),
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              // Simulated 1.5MB file bytes for upload workflow verification
              final sampleBytes = List<int>.filled(1024 * 100, 65);
              widget.onSubmitted(
                UploadMaterialEvent(
                  classId: widget.classId,
                  subjectId: widget.subjectId,
                  title: _titleController.text.trim(),
                  description: _descController.text.trim(),
                  fileName: _fileNameController.text.trim(),
                  fileBytes: sampleBytes,
                  contentType: _selectedContentType,
                ),
              );
            }
          },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.black87, foregroundColor: Colors.white),
          child: const Text('Upload to S3'),
        ),
      ],
    );
  }
}
