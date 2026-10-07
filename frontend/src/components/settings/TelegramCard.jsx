import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { authService } from '../../services/auth.service';
import styles from './SettingsCards.module.css';

// Nhắc uống thuốc + cảnh báo gia đình qua Telegram. Chỉ hiện khi server đã cấu hình bot.
export default function TelegramCard() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState(null);

  const load = () => authService.getProfile().then((r) => setProfile(r.data.data)).catch(() => {});
  useEffect(() => {
    load();
    // Quay lại app sau khi bấm Start trên Telegram -> cập nhật trạng thái "Đã kết nối".
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Lấy sẵn link để nút là thẻ <a> thật - window.open sau await bị Safari iPhone chặn.
  const needLink = profile?.telegram_available && !profile.telegram_linked;
  useEffect(() => {
    if (needLink && !linkUrl) authService.getTelegramLink().then((r) => setLinkUrl(r.data.data.url)).catch(() => {});
  }, [needLink, linkUrl]);

  if (!profile?.telegram_available) return null;

  const disconnect = async () => {
    if (!window.confirm('Ngắt kết nối Telegram? Bạn sẽ không nhận tin nhắc và cảnh báo qua Telegram nữa.')) return;
    setBusy(true);
    try {
      setProfile((await authService.unlinkTelegram()).data.data);
      setMessage({ ok: true, text: 'Đã ngắt kết nối Telegram.' });
    } catch {
      setMessage({ ok: false, text: 'Chưa ngắt được. Vui lòng thử lại.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.card} aria-labelledby="telegram-title">
      <div className={styles.row}>
        <span className={styles.icon}><Send size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="telegram-title" className={styles.title}>Nhắc qua Telegram</h2>
          <p className={styles.desc}>
            {profile.telegram_linked
              ? 'Đã kết nối. Bạn nhận tin khi đến giờ uống thuốc và khi người trong gia đình quên uống.'
              : 'Nhận tin nhắc uống thuốc trên Telegram, bấm "Đã uống" ngay trong tin. Người nhà kết nối thì được báo khi bạn quên uống.'}
          </p>
        </div>
      </div>
      {message && <p className={message.ok ? styles.okText : styles.error}>{message.text}</p>}
      {profile.telegram_linked ? (
        <button type="button" className={styles.primary} onClick={disconnect} disabled={busy}>Ngắt kết nối</button>
      ) : (
        <a className={styles.primary} href={linkUrl || undefined} target="_blank" rel="noopener noreferrer"
          aria-disabled={!linkUrl}
          onClick={() => setMessage({ ok: true, text: 'Trong Telegram, bấm nút "Start" (Bắt đầu) để hoàn tất kết nối.' })}>
          Kết nối Telegram
        </a>
      )}
    </section>
  );
}
