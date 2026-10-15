import 'package:equatable/equatable.dart';

abstract class ScheduleEvent extends Equatable {
  const ScheduleEvent();

  @override
  List<Object?> get props => [];
}

class LoadTeacherTimetableEvent extends ScheduleEvent {
  const LoadTeacherTimetableEvent();
}

class LoadTeacherSubstitutionsEvent extends ScheduleEvent {
  const LoadTeacherSubstitutionsEvent();
}

class LoadOnlineClassesEvent extends ScheduleEvent {
  const LoadOnlineClassesEvent();
}

class CreateOnlineClassEvent extends ScheduleEvent {
  final String classId;
  final String sectionId;
  final String subjectId;
  final String title;
  final String scheduledDate;
  final String startTime;
  final int durationMinutes;
  final String meetingUrl;

  const CreateOnlineClassEvent({
    required this.classId,
    required this.sectionId,
    required this.subjectId,
    required this.title,
    required this.scheduledDate,
    required this.startTime,
    required this.durationMinutes,
    required this.meetingUrl,
  });

  @override
  List<Object?> get props => [
        classId,
        sectionId,
        subjectId,
        title,
        scheduledDate,
        startTime,
        durationMinutes,
        meetingUrl,
      ];
}

class DeleteOnlineClassEvent extends ScheduleEvent {
  final String sessionId;

  const DeleteOnlineClassEvent(this.sessionId);

  @override
  List<Object?> get props => [sessionId];
}
