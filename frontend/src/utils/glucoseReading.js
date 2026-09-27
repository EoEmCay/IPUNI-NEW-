import { getMetricStatus } from '../constants/metrics';
import { ALERT_TYPES } from '../services/voiceAlert.service';
import { notifyWithEffects } from '../lib/notify';

// Lưu 1 lần đo đường huyết rồi phát giọng cảnh báo nếu cao/thấp nguy hiểm
// (có thể là giọng người thân đã ghi âm ở trang Giọng nhắc).
export async function saveGlucoseReading(addMetric, data, diagnosis) {
  await addMetric(data);
  const status = getMetricStatus(data.measurement_type, data.value, diagnosis);
  if (status === 'danger') notifyWithEffects(ALERT_TYPES.SUGAR_HIGH);
  if (status === 'low') notifyWithEffects(ALERT_TYPES.SUGAR_LOW);
}
