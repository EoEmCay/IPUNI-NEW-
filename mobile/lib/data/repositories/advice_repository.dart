import '../../core/api/api_client.dart';
import '../models/advice.dart';

class AdviceRepository {
  final ApiClient _api;
  AdviceRepository(this._api);

  Future<List<Advice>> getAdvice({String? category}) async {
    final data = await _api.get('/advice', query: {
      if (category != null && category != 'all') 'category': category,
    });
    return (data as List)
        .map((e) => Advice.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}
