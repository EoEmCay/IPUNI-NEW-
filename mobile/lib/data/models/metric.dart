import '../../core/constants/metric_constants.dart';
import '../../core/utils/date_format.dart';

class Metric {
  final int id;
  final int? userId;
  final String type;
  final double value;
  final DateTime? measuredAt;
  final String? note;

  const Metric({
    required this.id,
    this.userId,
    required this.type,
    required this.value,
    this.measuredAt,
    this.note,
  });

  factory Metric.fromJson(Map<String, dynamic> json) => Metric(
        id: (json['id'] as num).toInt(),
        userId: (json['user_id'] as num?)?.toInt(),
        type: json['type'] as String,
        value: (json['value'] as num).toDouble(),
        measuredAt: AppDate.tryParse(json['measured_at']),
        note: json['note'] as String?,
      );

  MetricType? get meta => kMetricTypes[type];

  String get typeLabel => meta?.label ?? type;

  /// 'low' / 'normal' / 'warning' / 'danger'
  String get status => getMetricStatus(type, value);

  String get statusLabel => kStatusLabel[status] ?? '';

  /// "5.6" (bỏ .0 thừa)
  String get valueText {
    if (value == value.roundToDouble()) return value.toStringAsFixed(0);
    return value.toStringAsFixed(1);
  }
}
