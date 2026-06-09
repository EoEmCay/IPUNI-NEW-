import '../../core/api/api_client.dart';
import '../models/appointment.dart';

class AppointmentsRepository {
  final ApiClient _api;
  AppointmentsRepository(this._api);

  Future<List<Appointment>> getAll({String? status}) async {
    final data = await _api.get('/appointments', query: {
      if (status != null) 'status': status,
    });
    return _list(data);
  }

  Future<List<Appointment>> getDoctorNotes() async {
    final data = await _api.get('/appointments/doctor-notes');
    return _list(data);
  }

  Future<Appointment> create(Map<String, dynamic> payload) async {
    final data = await _api.post('/appointments', body: payload);
    return Appointment.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Appointment> update(int id, Map<String, dynamic> payload) async {
    final data = await _api.put('/appointments/$id', body: payload);
    return Appointment.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> delete(int id) => _api.delete('/appointments/$id');

  List<Appointment> _list(dynamic data) => (data as List)
      .map((e) => Appointment.fromJson(Map<String, dynamic>.from(e as Map)))
      .toList();
}
