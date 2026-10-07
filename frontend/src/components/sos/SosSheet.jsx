import { useEffect, useState } from 'react';
import { Siren, Phone, Ambulance } from 'lucide-react';
import Modal from '../common/Modal';
import { careLinksService } from '../../services/careLinks.service';
import { getCaregiverInfo } from '../../store/medicationAdherenceStore';
import styles from './SosSheet.module.css';

// Bảng SOS: báo khẩn cho người nhà (Telegram/SMS/email + hiện trong app người nhà) và gọi điện ngay.
// Mở bảng là bước 1, bấm "Báo khẩn" là bước 2 -> tránh lỡ tay gửi.
export default function SosSheet({ onClose }) {
  const [contacts, setContacts] = useState(() => {
    const c = getCaregiverInfo();
    return c.phone ? [{ name: c.name || 'Người nhà', phone: c.phone }] : [];
  });
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [notified, setNotified] = useState(0);

  // Gom số điện thoại người nhà: liên hệ đã lưu + người nhà kết nối bằng mã gia đình
  useEffect(() => {
    Promise.allSettled([careLinksService.getFamily(), careLinksService.getFamilyMembers()]).then(([fam, mem]) => {
      const list = [
        ...((fam.value?.data?.data) || []).map((l) => ({ name: l.display_name || 'Người nhà', phone: l.contact_phone })),
        ...((mem.value?.data?.data) || []).map((m) => ({ name: m.name, phone: m.phone })),
      ].filter((c) => c.phone);
      if (list.length) setContacts([...new Map(list.map((c) => [c.phone, c])).values()]);
    });
  }, []);

  const sendAlert = async () => {
    setState('sending');
    try {
      const res = await careLinksService.sendSos();
      setNotified(res.data.data?.notified || 0);
      setState('sent');
    } catch {
      setState('error');
    }
  };

  return (
    <Modal title="Cảnh báo SOS" onClose={onClose}>
      <div className={styles.body}>
        <p className={styles.lead}>Bạn cần giúp đỡ? Chọn một việc bên dưới.</p>

        {state === 'sent' ? (
          <p className={notified ? styles.ok : styles.warn} role="status">
            {notified
              ? `Đã báo khẩn cho ${notified} người nhà. Họ sẽ gọi lại cho bạn.`
              : 'Chưa có người nhà nào được kết nối nên chưa ai nhận được cảnh báo. Hãy gọi điện trực tiếp.'}
          </p>
        ) : (
          <button type="button" className={styles.alertBtn} onClick={sendAlert} disabled={state === 'sending'}>
            <Siren size={26} aria-hidden="true" />
            {state === 'sending' ? 'Đang gửi…' : 'Báo khẩn cho người nhà'}
          </button>
        )}
        {state === 'error' && (
          <p className={styles.warn} role="alert">Không gửi được (mất mạng?). Hãy gọi điện trực tiếp bên dưới.</p>
        )}

        {contacts.map((c) => (
          <a key={c.phone} className={styles.call} href={`tel:${c.phone}`}>
            <Phone size={22} aria-hidden="true" /> Gọi {c.name} ({c.phone})
          </a>
        ))}
        <a className={styles.emergency} href="tel:115">
          <Ambulance size={24} aria-hidden="true" /> Gọi cấp cứu 115
        </a>
      </div>
    </Modal>
  );
}
