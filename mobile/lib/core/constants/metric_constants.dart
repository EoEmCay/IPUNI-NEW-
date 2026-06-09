// Tương đương frontend/src/constants/metrics.js — ngưỡng đường huyết (mmol/L).

class MetricType {
  final String key;
  final String label;
  final String normal;
  final String danger;
  final double normalMax;
  final double dangerMin;

  const MetricType({
    required this.key,
    required this.label,
    required this.normal,
    required this.danger,
    required this.normalMax,
    required this.dangerMin,
  });
}

const double kHypoglycemiaThreshold = 3.9;

const Map<String, MetricType> kMetricTypes = {
  'fasting': MetricType(
    key: 'fasting',
    label: 'Đường huyết lúc đói',
    normal: '<7 mmol/L',
    danger: '>10 mmol/L',
    normalMax: 7,
    dangerMin: 10,
  ),
  'post_meal_2h': MetricType(
    key: 'post_meal_2h',
    label: 'Đường huyết sau ăn 2h',
    normal: '<7.8 mmol/L',
    danger: '>11.1 mmol/L',
    normalMax: 7.8,
    dangerMin: 11.1,
  ),
  'pre_meal': MetricType(
    key: 'pre_meal',
    label: 'Đường huyết trước ăn',
    normal: '4.4-7.2 mmol/L',
    danger: '>10 mmol/L',
    normalMax: 7.2,
    dangerMin: 10,
  ),
  'pre_sleep': MetricType(
    key: 'pre_sleep',
    label: 'Đường huyết trước ngủ',
    normal: '5.0-8.3 mmol/L',
    danger: '>10 mmol/L',
    normalMax: 8.3,
    dangerMin: 10,
  ),
};

/// Thứ tự hiển thị các loại chỉ số.
const List<String> kMetricTypeOrder = [
  'fasting',
  'post_meal_2h',
  'pre_meal',
  'pre_sleep',
];

/// Trả về 'low' / 'normal' / 'warning' / 'danger'. Khớp getMetricStatus() web.
String getMetricStatus(String type, double value) {
  final t = kMetricTypes[type];
  if (t == null) return 'normal';
  if (value < kHypoglycemiaThreshold) return 'low';
  if (value >= t.dangerMin) return 'danger';
  if (value > t.normalMax) return 'warning';
  return 'normal';
}

/// Nhãn tiếng Việt cho từng trạng thái.
const Map<String, String> kStatusLabel = {
  'low': 'Hạ đường huyết',
  'normal': 'Bình thường',
  'warning': 'Cảnh báo',
  'danger': 'Nguy hiểm',
};
