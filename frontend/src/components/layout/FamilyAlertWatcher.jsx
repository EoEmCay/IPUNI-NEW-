import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Phone } from 'lucide-react';
import Modal from '../common/Modal';
import { careLinksService } from '../../services/careLinks.service';
import { notifyWithEffects } from '../../lib/notify';
import { ALERT_TYPES } from '../../services/voiceAlert.service';
import styles from './FamilyAlertWatcher.module.css';

const POLL_MS = 60 * 1000;       // hỏi server mỗi phút để thấy cảnh báo mới sớm
const REMIND_MS = 5 * 60 * 1000; // "Nhắc lại sau" -> hiện lại sau 5 phút, tới khi bấm "Đã biết"

const timeOf = (iso) => {
  const d = new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${String(iso).replace(' ', 'T')}Z`);
  return isNaN(d) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// Cảnh báo người trong gia đình bỏ cữ / quên uống. Hiện khi đang mở app, nhắc lại mỗi 5 phút
// cho tới khi người nhà bấm "Đã biết".
// ponytail: chỉ hoạt động khi app đang mở; muốn báo cả khi tắt app cần push notification (FCM).
export default function FamilyAlertWatcher() {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const snoozeUntil = useRef(0);
  const seen = useRef(new Set());
  const openRef = useRef(false);
  const show = (value) => { openRef.current = value; setOpen(value); };

  const check = useCallback(async () => {
    try {
      const list = (await careLinksService.getFamilyAlerts()).data.data || [];
      setAlerts(list);
      const hasNew = list.some((a) => !seen.current.has(a.id));
      list.forEach((a) => seen.current.add(a.id));
      if (list.length > 0 && (hasNew || Date.now() >= snoozeUntil.current)) {
        // Âm thanh (giọng đã ghi cho "Báo người nhà quên/bỏ thuốc") + rung + đèn, mỗi lần khung hiện lại
        if (!openRef.current) {
          const a = list.find((x) => x.type === 'sos') || list[0];
          notifyWithEffects(ALERT_TYPES.FAMILY, {
            ttsText: a.type === 'sos' ? `Khẩn cấp! ${a.patient_name} vừa bấm SOS. Hãy gọi điện ngay.` : `${a.patient_name}: ${a.title}. Hãy gọi điện nhắc nhé.`,
          });
        }
        show(true);
      }
      if (list.length === 0) show(false);
    } catch { /* mạng lỗi: thử lại lần sau */ }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [check]);

  const remindLater = () => { snoozeUntil.current = Date.now() + REMIND_MS; show(false); };

  const acknowledge = async () => {
    setBusy(true);
    await Promise.all(alerts.map((a) => careLinksService.ackFamilyAlert(a.id).catch(() => {})));
    setBusy(false);
    show(false);
    setAlerts([]);
  };

  if (!open || alerts.length === 0) return null;
  const phone = alerts.find((a) => a.patient_phone)?.patient_phone;
  const firstName = alerts[0].patient_name;

  return (
    <Modal title={alerts.some((a) => a.type === 'sos') ? '🚨 Người nhà cần giúp đỡ gấp' : 'Nhắc người nhà uống thuốc'} onClose={remindLater}>
      <div className={styles.body}>
        {alerts.map((a) => (
          <div key={a.id} className={styles.alert}>
            <AlertTriangle size={24} className={styles.icon} aria-hidden="true" />
            <div>
              <p className={styles.title}>{a.patient_name}: {a.title}</p>
              <p className={styles.detail}>{a.detail} {timeOf(a.created_at) && `(báo lúc ${timeOf(a.created_at)})`}</p>
            </div>
          </div>
        ))}
        {phone && (
          <a className={styles.call} href={`tel:${phone}`}>
            <Phone size={22} aria-hidden="true" /> Gọi cho {firstName} ({phone})
          </a>
        )}
        <button type="button" className={styles.ack} onClick={acknowledge} disabled={busy}>
          {busy ? 'Đang lưu…' : 'Đã biết'}
        </button>
        <button type="button" className={styles.later} onClick={remindLater}>Nhắc lại sau 5 phút</button>
      </div>
    </Modal>
  );
}
