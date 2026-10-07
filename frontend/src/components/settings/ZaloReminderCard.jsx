import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { authService } from '../../services/auth.service';
import styles from './SettingsCards.module.css';

// Nhắc uống thuốc qua Zalo (ZNS). Chỉ hiện khi server đã cấu hình ZNS; người dùng phải tự bật (đồng ý nhận tin).
export default function ZaloReminderCard() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authService.getProfile().then((r) => setProfile(r.data.data)).catch(() => {});
  }, []);

  if (!profile?.zalo_reminders_available) return null;
  const on = profile.zalo_reminders;

  const toggle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const updated = (await authService.updateProfile({ zalo_reminders: !on })).data.data;
      setProfile(updated);
      setMessage({ ok: true, text: updated.zalo_reminders ? 'Đã bật nhắc qua Zalo.' : 'Đã tắt nhắc qua Zalo.' });
    } catch (err) {
      setMessage({ ok: false, text: err?.response?.data?.message || 'Chưa lưu được. Vui lòng thử lại.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.card} aria-labelledby="zalo-title">
      <div className={styles.row}>
        <span className={styles.icon}><MessageCircle size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="zalo-title" className={styles.title}>Nhắc uống thuốc qua Zalo</h2>
          <p className={styles.desc}>
            Đến giờ uống thuốc, DIA+ gửi tin Zalo tới số {profile.phone || '(chưa có số điện thoại)'}.
            Người nhà trong mục Gia đình sẽ được báo qua Zalo khi bạn quên uống.
          </p>
        </div>
      </div>
      {message && <p className={message.ok ? styles.okText : styles.error}>{message.text}</p>}
      <button type="button" className={styles.primary} onClick={toggle} disabled={busy} aria-pressed={on}>
        {busy ? 'Đang lưu…' : on ? 'Tắt nhắc qua Zalo' : 'Bật nhắc qua Zalo'}
      </button>
    </section>
  );
}
