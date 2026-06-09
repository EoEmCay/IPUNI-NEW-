import 'package:flutter/foundation.dart';

import '../data/models/medication.dart';
import '../data/repositories/medications_repository.dart';

/// Tương đương medicationsStore.js.
class MedicationsController extends ChangeNotifier {
  final MedicationsRepository _repo;
  MedicationsController(this._repo);

  List<Medication> _today = [];
  List<Medication> _all = [];
  bool _loading = false;
  String? _error;

  List<Medication> get today => _today;
  List<Medication> get all => _all;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> fetchToday() async {
    _setLoading(true);
    try {
      _today = await _repo.getToday();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchAll() async {
    _setLoading(true);
    try {
      _all = await _repo.getAll();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> addMedication(Map<String, dynamic> payload) async {
    try {
      await _repo.create(payload);
      await fetchAll();
      fetchToday();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateMedication(int id, Map<String, dynamic> payload) async {
    try {
      await _repo.update(id, payload);
      await fetchAll();
      fetchToday();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> deleteMedication(int id) async {
    await _repo.delete(id);
    _all = _all.where((m) => m.id != id).toList();
    _today = _today.where((m) => m.id != id).toList();
    notifyListeners();
  }

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }
}
