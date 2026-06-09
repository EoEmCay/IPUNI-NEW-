import 'package:flutter/foundation.dart';

import '../data/models/appointment.dart';
import '../data/repositories/appointments_repository.dart';

/// Tương đương appointmentsStore.js.
class AppointmentsController extends ChangeNotifier {
  final AppointmentsRepository _repo;
  AppointmentsController(this._repo);

  List<Appointment> _all = [];
  List<Appointment> _doctorNotes = [];
  bool _loading = false;
  String? _error;

  List<Appointment> get all => _all;
  List<Appointment> get doctorNotes => _doctorNotes;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> fetchAll({String? status}) async {
    _setLoading(true);
    try {
      _all = await _repo.getAll(status: status);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchDoctorNotes() async {
    try {
      _doctorNotes = await _repo.getDoctorNotes();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<bool> addAppointment(Map<String, dynamic> payload) async {
    try {
      await _repo.create(payload);
      await fetchAll();
      fetchDoctorNotes();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateAppointment(int id, Map<String, dynamic> payload) async {
    try {
      await _repo.update(id, payload);
      await fetchAll();
      fetchDoctorNotes();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> deleteAppointment(int id) async {
    await _repo.delete(id);
    _all = _all.where((a) => a.id != id).toList();
    _doctorNotes = _doctorNotes.where((a) => a.id != id).toList();
    notifyListeners();
  }

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }
}
