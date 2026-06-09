import '../../core/api/api_client.dart';
import '../models/medication.dart';

class MedicationsRepository {
  final ApiClient _api;
  MedicationsRepository(this._api);

  Future<List<Medication>> getToday() async {
    final data = await _api.get('/medications/today');
    return _list(data);
  }

  Future<List<Medication>> getAll() async {
    final data = await _api.get('/medications');
    return _list(data);
  }

  Future<Medication> create(Map<String, dynamic> payload) async {
    final data = await _api.post('/medications', body: payload);
    return Medication.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Medication> update(int id, Map<String, dynamic> payload) async {
    final data = await _api.put('/medications/$id', body: payload);
    return Medication.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> delete(int id) => _api.delete('/medications/$id');

  List<Medication> _list(dynamic data) => (data as List)
      .map((e) => Medication.fromJson(Map<String, dynamic>.from(e as Map)))
      .toList();
}
