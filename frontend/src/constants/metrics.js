export const METRIC_TYPES = {
  fasting: { label: 'Đường huyết lúc đói', normal: '<7 mmol/L', danger: '>10 mmol/L', normalMax: 7, dangerMin: 10 },
  post_meal_2h: { label: 'Đường huyết sau ăn 2h', normal: '<7.8 mmol/L', danger: '>11.1 mmol/L', normalMax: 7.8, dangerMin: 11.1 },
  pre_meal: { label: 'Đường huyết trước ăn', normal: '4.4-7.2 mmol/L', danger: '>10 mmol/L', normalMax: 7.2, dangerMin: 10 },
  pre_sleep: { label: 'Đường huyết trước ngủ', normal: '5.0-8.3 mmol/L', danger: '>10 mmol/L', normalMax: 8.3, dangerMin: 10 }
};

export const HYPOGLYCEMIA_THRESHOLD = 3.9;

export function getMetricStatus(type, value) {
  const thresholds = METRIC_TYPES[type];
  if (!thresholds) return 'normal';
  if (value < HYPOGLYCEMIA_THRESHOLD) return 'low';
  if (value >= thresholds.dangerMin) return 'danger';
  if (value > thresholds.normalMax) return 'warning';
  return 'normal';
}
