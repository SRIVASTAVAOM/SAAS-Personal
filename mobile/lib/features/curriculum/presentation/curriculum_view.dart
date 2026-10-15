import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/curriculum_bloc.dart';
import '../models/curriculum_model.dart';

class CurriculumView extends StatefulWidget {
  final String classId;
  final String subjectId;
  final String? className;
  final String? subjectName;

  const CurriculumView({
    super.key,
    required this.classId,
    required this.subjectId,
    this.className,
    this.subjectName,
  });

  @override
  State<CurriculumView> createState() => _CurriculumViewState();
}

class _CurriculumViewState extends State<CurriculumView> {
  @override
  void initState() {
    super.initState();
    if (widget.classId.isNotEmpty && widget.subjectId.isNotEmpty) {
      context.read<CurriculumBloc>().add(
            LoadCurriculumUnitsEvent(widget.classId, widget.subjectId),
          );
    }
  }

  @override
  void didUpdateWidget(CurriculumView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if ((oldWidget.classId != widget.classId || oldWidget.subjectId != widget.subjectId) &&
        widget.classId.isNotEmpty &&
        widget.subjectId.isNotEmpty) {
      context.read<CurriculumBloc>().add(
            LoadCurriculumUnitsEvent(widget.classId, widget.subjectId),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.subjectName ?? "Subject"} Syllabus & Curriculum'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              if (widget.classId.isNotEmpty && widget.subjectId.isNotEmpty) {
                context.read<CurriculumBloc>().add(
                      LoadCurriculumUnitsEvent(widget.classId, widget.subjectId),
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
      body: (widget.classId.isEmpty || widget.subjectId.isEmpty)
          ? const Center(
              child: Text(
                'Please select a class and subject to view curriculum.',
                style: TextStyle(color: Colors.grey),
              ),
            )
          : BlocConsumer<CurriculumBloc, CurriculumState>(
        listener: (context, state) {
          if (state is CurriculumError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red.shade700),
            );
          }
        },
        builder: (context, state) {
          if (state is CurriculumLoading) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
          }

          if (state is CurriculumLoaded) {
            final units = state.units;
            if (units.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.menu_book_outlined, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 12),
                    Text(
                      'No curriculum units defined yet',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: units.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _buildUnitCard(units[index]);
              },
            );
          }

          return Center(
            child: ElevatedButton(
              onPressed: () {
                context.read<CurriculumBloc>().add(
                      LoadCurriculumUnitsEvent(widget.classId, widget.subjectId),
                    );
              },
              child: const Text('Load Curriculum'),
            ),
          );
        },
      ),
    );
  }

  Widget _buildUnitCard(CurriculumUnitModel unit) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Material(
        color: Colors.transparent,
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            initiallyExpanded: true,
            tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: CircleAvatar(
              backgroundColor: Colors.grey.shade100,
              radius: 18,
              child: Text(
                '${unit.unitNumber}',
                style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          title: Text(
            unit.title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87),
          ),
          subtitle: unit.description != null
              ? Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    unit.description!,
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                )
              : null,
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                  const Text(
                    'Topics & Learning Objectives',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54),
                  ),
                  const SizedBox(height: 8),
                  if (unit.topics.isEmpty)
                    Text(
                      'No sub-topics added to this unit yet.',
                      style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: Colors.grey.shade500),
                    )
                  else
                    ...unit.topics.map((t) => _buildTopicTile(t)),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
  }

  Widget _buildTopicTile(CurriculumTopicModel topic) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Text(
              '${topic.topicNumber}',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  topic.title,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87),
                ),
                if (topic.learningObjectives != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Objective: ${topic.learningObjectives!}',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
