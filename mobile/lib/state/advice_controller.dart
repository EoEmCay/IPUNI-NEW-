import 'package:flutter/foundation.dart';

import '../data/models/advice.dart';
import '../data/repositories/advice_repository.dart';

/// Tương đương adviceStore.js.
class AdviceController extends ChangeNotifier {
  final AdviceRepository _repo;
  AdviceController(this._repo);

  List<Advice> _items = [];
  bool _loading = false;
  String? _error;
  String _category = 'all';

  List<Advice> get items => _items;
  bool get loading => _loading;
  String? get error => _error;
  String get category => _category;

  /// Danh sách category có trong dữ liệu hiện tại (để render filter pills).
  List<String> get categories {
    final set = <String>{for (final a in _items) a.category};
    return set.toList()..sort();
  }

  Future<void> fetchAdvice({String category = 'all'}) async {
    _category = category;
    _setLoading(true);
    try {
      _items = await _repo.getAdvice(category: category);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }
}
