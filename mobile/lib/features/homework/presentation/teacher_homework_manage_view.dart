import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../academics/bloc/academics_bloc.dart';
import '../../academics/bloc/academics_event.dart';
import '../../academics/bloc/academics_state.dart';
import '../../academics/models/subject_model.dart';
import '../bloc/homework_bloc.dart';
import '../models/homework_model.dart';
import '../../../core/widgets/document_picker_bottom_sheet.dart';

class TeacherHomeworkManageView extends StatefulWidget {
  final String? classId;
  final String? sectionId;
  final String? subjectId;

  const TeacherHomeworkManageView({
    super.key,
    this.classId,
    this.sectionId,
    this.subjectId,
  });

  @override
  State<TeacherHomeworkManageView> createState() => _TeacherHomeworkManageViewState();
}

class _TeacherHomeworkManageViewState extends State<TeacherHomeworkManageView> {
  @override
  void initState() {
    super.initState();
    context.read<HomeworkBloc>().add(const LoadTeacherHomeworkEvent());
    context.read<AcademicsBloc>().add(LoadSubjectsEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Homework Assignments'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<HomeworkBloc>().add(const LoadTeacherHomeworkEvent()),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: Colors.grey.shade200, height: 1.0),
        ),
      ),
      backgroundColor: const Color(0xFFF9FAFB),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('assign_homework_fab'),
        onPressed: () => _showCreateHomeworkDialog(context),
        backgroundColor: Colors.black87,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Assign Homework', style: TextStyle(color: Colors.white)),
      ),
      body: BlocConsumer<HomeworkBloc, HomeworkState>(
        listener: (context, state) {
          if (state is HomeworkError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red.shade700),
            );
          }
        },
        builder: (context, state) {
          if (state is HomeworkLoading) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          if (state is TeacherHomeworkLoaded) {
            final list = state.homeworkList;
            if (list.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.assignment_outlined, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 12),
                    Text(
                      'No homework assigned yet',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 8),
                    const Text('Tap "Assign Homework" to create a new task.'),
                  ],
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _buildTeacherHomeworkCard(list[index]);
              },
            );
          }

          return Center(
            child: ElevatedButton(
              onPressed: () => context.read<HomeworkBloc>().add(const LoadTeacherHomeworkEvent()),
              child: const Text('Load Assigned Homework'),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTeacherHomeworkCard(HomeworkModel hw) {
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Text(
                  '${hw.className ?? "Class"} - ${hw.subjectName ?? "Subject"}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Text(
                  '${hw.completedCount} / ${hw.totalStudents} Completed',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.blue.shade800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  hw.title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
              ),
              IconButton(
                key: Key('edit_hw_${hw.id}'),
                icon: const Icon(Icons.edit_outlined, size: 20, color: Colors.black87),
                tooltip: 'Edit Homework',
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () => _showEditHomeworkDialog(context, hw),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            hw.description,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade700, height: 1.4),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey.shade600),
              const SizedBox(width: 4),
              Text(
                'Due: ${hw.dueDate}',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.grey.shade700),
              ),
              if (hw.hasAttachment) ...[
                const SizedBox(width: 16),
                Icon(Icons.attach_file, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    hw.attachmentName ?? 'Attachment',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  void _showCreateHomeworkDialog(BuildContext context) {
    final academicsBloc = context.read<AcademicsBloc>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (bottomSheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(bottomSheetContext).viewInsets.bottom,
          ),
          child: BlocProvider.value(
            value: academicsBloc,
            child: _CreateHomeworkSheet(
              classId: widget.classId,
              sectionId: widget.sectionId,
              onSubmitted: (event) {
                context.read<HomeworkBloc>().add(event);
                Navigator.pop(bottomSheetContext);
              },
            ),
          ),
        );
      },
    );
  }

  void _showEditHomeworkDialog(BuildContext context, HomeworkModel hw) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (bottomSheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(bottomSheetContext).viewInsets.bottom,
          ),
          child: _EditHomeworkSheet(
            hw: hw,
            onSubmitted: (event) {
              context.read<HomeworkBloc>().add(event);
              Navigator.pop(bottomSheetContext);
            },
          ),
        );
      },
    );
  }
}

class _EditHomeworkSheet extends StatefulWidget {
  final HomeworkModel hw;
  final void Function(UpdateHomeworkEvent) onSubmitted;

  const _EditHomeworkSheet({
    required this.hw,
    required this.onSubmitted,
  });

  @override
  State<_EditHomeworkSheet> createState() => _EditHomeworkSheetState();
}

class _EditHomeworkSheetState extends State<_EditHomeworkSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descController;
  late DateTime _dueDate;
  String? _attachedDocumentName;
  String? _attachedDocumentKey;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.hw.title);
    _descController = TextEditingController(text: widget.hw.description);
    _dueDate = DateTime.tryParse(widget.hw.dueDate) ?? DateTime.now().add(const Duration(days: 2));
    _attachedDocumentName = widget.hw.attachmentName;
    _attachedDocumentKey = widget.hw.s3AttachmentKey;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Edit Homework',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                key: const Key('edit_homework_title_field'),
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title *',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Title is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                key: const Key('edit_homework_desc_field'),
                controller: _descController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Instructions / Description *',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Instructions are required' : null,
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('Due Date: ${_dueDate.toLocal().toString().split(' ')[0]}'),
                trailing: OutlinedButton(
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _dueDate,
                      firstDate: DateTime.now().subtract(const Duration(days: 1)),
                      lastDate: DateTime.now().add(const Duration(days: 90)),
                    );
                    if (picked != null) {
                      setState(() => _dueDate = picked);
                    }
                  },
                  child: const Text('Change Date'),
                ),
              ),
              const SizedBox(height: 12),
              // Attachment Section with Camera & Gallery / Device options
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
                              'Assignment Document / Photo',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        if (_attachedDocumentName != null)
                          InkWell(
                            onTap: () {
                              setState(() {
                                _attachedDocumentName = null;
                                _attachedDocumentKey = null;
                              });
                            },
                            child: const Text(
                              'Remove',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.red,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_attachedDocumentName == null) ...[
                      OutlinedButton.icon(
                        key: const Key('edit_hw_attach_btn'),
                        onPressed: () async {
                          final doc = await DocumentPickerBottomSheet.show(
                            context,
                            title: 'Attach Assignment Document',
                            subtitle:
                                'Choose from device storage or take a photo with camera',
                            categoryPrefix: 'homework_doc',
                          );
                          if (doc != null) {
                            setState(() {
                              _attachedDocumentName = doc.name;
                              _attachedDocumentKey = doc.url;
                            });
                          }
                        },
                        icon: const Icon(Icons.upload_file, size: 14),
                        label: const Text('Attach File / Photo (Camera & Gallery)',
                            style: TextStyle(fontSize: 11)),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Colors.grey.shade300),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        ),
                      ),
                    ] else ...[
                      Row(
                        children: [
                          Icon(
                            _attachedDocumentName!.toLowerCase().endsWith('.pdf')
                                ? Icons.picture_as_pdf
                                : Icons.camera_alt_outlined,
                            size: 16,
                            color: _attachedDocumentName!.toLowerCase().endsWith('.pdf')
                                ? const Color(0xFFB91C1C)
                                : const Color(0xFF2563EB),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              _attachedDocumentName!,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          TextButton(
                            onPressed: () async {
                              final doc = await DocumentPickerBottomSheet.show(
                                context,
                                title: 'Attach Assignment Document',
                                subtitle:
                                    'Choose from device storage or take a photo with camera',
                                categoryPrefix: 'homework_doc',
                              );
                              if (doc != null) {
                                setState(() {
                                  _attachedDocumentName = doc.name;
                                  _attachedDocumentKey = doc.url;
                                });
                              }
                            },
                            child: const Text('Change', style: TextStyle(fontSize: 11)),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                key: const Key('update_homework_btn'),
                onPressed: () {
                  if (_formKey.currentState!.validate()) {
                    widget.onSubmitted(
                      UpdateHomeworkEvent(
                        id: widget.hw.id,
                        title: _titleController.text.trim(),
                        description: _descController.text.trim(),
                        dueDate: _dueDate.toLocal().toString().split(' ')[0],
                        s3AttachmentKey: _attachedDocumentKey,
                        attachmentName: _attachedDocumentName,
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black87,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Save Changes'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CreateHomeworkSheet extends StatefulWidget {
  final String? classId;
  final String? sectionId;
  final void Function(CreateHomeworkEvent) onSubmitted;

  const _CreateHomeworkSheet({
    this.classId,
    this.sectionId,
    required this.onSubmitted,
  });

  @override
  State<_CreateHomeworkSheet> createState() => _CreateHomeworkSheetState();
}

class _CreateHomeworkSheetState extends State<_CreateHomeworkSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  DateTime _dueDate = DateTime.now().add(const Duration(days: 2));
  String? _selectedSubjectId;
  String? _attachedDocumentName;
  String? _attachedDocumentKey;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AcademicsBloc, AcademicsState>(
      builder: (context, state) {
        List<SubjectModel> subjects = [];
        if (state is SubjectsLoaded) {
          subjects = state.subjects;
          if (_selectedSubjectId == null && subjects.isNotEmpty) {
            _selectedSubjectId = subjects.first.id;
          }
        }

        return Container(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Assign New Homework',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (subjects.isNotEmpty)
                    DropdownButtonFormField<String>(
                      initialValue: _selectedSubjectId,
                      decoration: const InputDecoration(
                        labelText: 'Subject',
                        border: OutlineInputBorder(),
                      ),
                      items: subjects.map((s) {
                        return DropdownMenuItem(value: s.id, child: Text(s.name));
                      }).toList(),
                      onChanged: (val) => setState(() => _selectedSubjectId = val),
                    ),
                  const SizedBox(height: 12),
                  TextFormField(
                    key: const Key('homework_title_field'),
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Title *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Title is required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    key: const Key('homework_desc_field'),
                    controller: _descController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Instructions / Description *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Instructions are required' : null,
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('Due Date: ${_dueDate.toLocal().toString().split(' ')[0]}'),
                    trailing: OutlinedButton(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _dueDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 90)),
                        );
                        if (picked != null) {
                          setState(() => _dueDate = picked);
                        }
                      },
                      child: const Text('Change Date'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Attachment Section with Camera & Gallery / Device options
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
                                  'Assignment Document / Photo (Optional)',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            if (_attachedDocumentName != null)
                              InkWell(
                                onTap: () {
                                  setState(() {
                                    _attachedDocumentName = null;
                                    _attachedDocumentKey = null;
                                  });
                                },
                                child: const Text(
                                  'Remove',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.red,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (_attachedDocumentName == null) ...[
                          OutlinedButton.icon(
                            key: const Key('create_hw_attach_btn'),
                            onPressed: () async {
                              final doc = await DocumentPickerBottomSheet.show(
                                context,
                                title: 'Attach Assignment Document',
                                subtitle:
                                    'Choose from device storage or take a photo with camera',
                                categoryPrefix: 'homework_doc',
                              );
                              if (doc != null) {
                                setState(() {
                                  _attachedDocumentName = doc.name;
                                  _attachedDocumentKey = doc.url;
                                });
                              }
                            },
                            icon: const Icon(Icons.upload_file, size: 14),
                            label: const Text('Attach File / Photo (Camera & Gallery)',
                                style: TextStyle(fontSize: 11)),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: Colors.grey.shade300),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            ),
                          ),
                        ] else ...[
                          Row(
                            children: [
                              Icon(
                                _attachedDocumentName!.toLowerCase().endsWith('.pdf')
                                    ? Icons.picture_as_pdf
                                    : Icons.camera_alt_outlined,
                                size: 16,
                                color: _attachedDocumentName!.toLowerCase().endsWith('.pdf')
                                    ? const Color(0xFFB91C1C)
                                    : const Color(0xFF2563EB),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  _attachedDocumentName!,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    key: const Key('submit_homework_btn'),
                    onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        final targetClassId = widget.classId ?? '';
                        final targetSectionId = widget.sectionId ?? '';
                        final subjectId = _selectedSubjectId ??
                            (subjects.isNotEmpty ? subjects.first.id : '');
                        if (targetClassId.isEmpty || targetSectionId.isEmpty || subjectId.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Class, section, and subject must be selected.')),
                          );
                          return;
                        }
                        widget.onSubmitted(
                          CreateHomeworkEvent(
                            classId: targetClassId,
                            sectionId: targetSectionId,
                            subjectId: subjectId,
                            title: _titleController.text.trim(),
                            description: _descController.text.trim(),
                            dueDate: _dueDate.toLocal().toString().split(' ')[0],
                            s3AttachmentKey: _attachedDocumentKey,
                            attachmentName: _attachedDocumentName,
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black87,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Assign to Class'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
