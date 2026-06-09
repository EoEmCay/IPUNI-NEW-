import 'package:flutter/foundation.dart';

import '../data/models/metric.dart';
import '../data/repositories/metrics_repository.dart';

/// Tương đương metricsStore.js.
class MetricsController extends ChangeNotifier {
  final MetricsRepository _repo;
  MetricsController(this._repo);

  Map<String, Metric?> _latest = {};
  List<Metric> _history = [];
  bool _loading = false;
  String? _error;

  Map<String, Metric?> get latest => _latest;
  List<Metric> get history => _history;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> fetchLatest() async {
    _setLoading(true);
    try {
      _latest = await _repo.getLatest();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchHistory({String? type, int days = 7}) async {
    _setLoading(true);
    try {
      _history = await _repo.getMetrics(type: type, days: days);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  /// Trả về true nếu lưu thành công.
  Future<bool> addMetric({
    required String type,
    required double value,
    required DateTime measuredAt,
    String? note,
  }) async {
    try {
      await _repo.create(
        type: type,
        value: value,
        measuredAt: measuredAt,
        note: note,
      );
      await fetchLatest();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> deleteMetric(int id) async {
    await _repo.delete(id);
    _history = _history.where((m) => m.id != id).toList();
    notifyListeners();
    fetchLatest();
  }

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }
}
