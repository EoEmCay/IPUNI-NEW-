import '../../core/utils/date_format.dart';

class Appointment {
  final int id;
  final int? userId;
  final String doctorName;
  final String? department;
  final DateTime? scheduledAt;
  final String? location;
  final String? note;
  final String status; // upcoming / completed / cancelled

  const Appointment({
    required this.id,
    this.userId,
    required this.doctorName,
    this.department,
    this.scheduledAt,
    this.location,
    this.note,
    this.status = 'upcoming',
  });

  factory Appointment.fromJson(Map<String, dynamic> json) => Appointment(
        id: (json['id'] as num).toInt(),
        userId: (json['user_id'] as num?)?.toInt(),
        doctorName: json['doctor_name'] as String? ?? '',
        department: json['department'] as String?,
        scheduledAt: AppDate.tryParse(json['scheduled_at']),
        location: json['location'] as String?,
        note: json['note'] as String?,
        status: json['status'] as String? ?? 'upcoming',
      );

  bool get hasNote => note != null && note!.trim().isNotEmpty;

  String get statusLabel {
    switch (status) {
      case 'completed':
        return 'Đã khám';
      case 'cancelled':
        return 'Đã huỷ';
      case 'upcoming':
      default:
        return 'Sắp tới';
    }
  }
}
