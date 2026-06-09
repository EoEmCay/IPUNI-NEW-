import '../../core/api/api_client.dart';
import '../models/metric.dart';

class MetricsRepository {
  final ApiClient _api;
  MetricsRepository(this._api);

  /// GET /metrics/latest → { fasting: {...}|null, post_meal_2h: ..., ... }
  Future<Map<String, Metric?>> getLatest() async {
    final data = await _api.get('/metrics/latest');
    final map = Map<String, dynamic>.from(data as Map);
    return map.map((key, value) => MapEntry(
          key,
          value == null
              ? null
              : Metric.fromJson(Map<String, dynamic>.from(value as Map)),
        ));
  }

  /// GET /metrics?type=&days=
  Future<List<Metric>> getMetrics({String? type, int days = 7}) async {
    final data = await _api.get('/metrics', query: {
      if (type != null) 'type': type,
      'days': days,
    });
    return (data as List)
        .map((e) => Metric.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  /// POST /metrics
  Future<Metric> create({
    required String type,
    required double value,
    required DateTime measuredAt,
    String? note,
  }) async {
    final data = await _api.post('/metrics', body: {
      'type': type,
      'value': value,
      'measured_at': measuredAt.toIso8601String(),
      if (note != null && note.isNotEmpty) 'note': note,
    });
    return Metric.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> delete(int id) => _api.delete('/metrics/$id');
}
