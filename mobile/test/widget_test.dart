// Smoke test cơ bản. App thật (IpuniApp) cần SharedPreferences + provider nên
// được kiểm thử thủ công qua `flutter run`; ở đây chỉ giữ một test hợp lệ.
import 'package:flutter_test/flutter_test.dart';

import 'package:ipuni/core/constants/metric_constants.dart';

void main() {
  test('getMetricStatus phân loại đúng ngưỡng đường huyết', () {
    expect(getMetricStatus('fasting', 3.0), 'low'); // < 3.9 hạ đường huyết
    expect(getMetricStatus('fasting', 5.5), 'normal'); // < 7
    expect(getMetricStatus('fasting', 8.0), 'warning'); // 7–10
    expect(getMetricStatus('fasting', 12.0), 'danger'); // > 10
  });
}
