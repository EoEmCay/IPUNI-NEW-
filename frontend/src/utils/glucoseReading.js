import { getMetricStatus } from '../constants/metrics';
import { voiceAlertService, ALERT_TYPES } from '../services/voiceAlert.service';

// Lưu 1 lần đo đường huyết rồi phát giọng cảnh báo nếu cao/thấp nguy hiểm
// (có thể là giọng người thân đã ghi âm ở trang Giọng nhắc).
export async function saveGlucoseReading(addMetric, data, diagnosis) {
  await addMetric(data);
  const status = getMetricStatus(data.measurement_type, data.value, diagnosis);
  if (status === 'danger') voiceAlertService.playAlert(ALERT_TYPES.SUGAR_HIGH);
  if (status === 'low') voiceAlertService.playAlert(ALERT_TYPES.SUGAR_LOW);
}
