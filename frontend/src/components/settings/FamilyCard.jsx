import { useEffect, useState } from 'react';
import { Users, Copy, Check, UserMinus } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { careLinksService } from '../../services/careLinks.service';
import styles from './SettingsCards.module.css';

// "Gia đình": mỗi tài khoản có 1 mã riêng. Nhập mã của người nhà -> 2 người thành 1 gia đình,
// nhận cảnh báo khi người kia bỏ cữ / quên uống thuốc.
export default function FamilyCard() {
  const myCode = useAuthStore((s) => s.user?.user_code);
  const isDemo = useAuthStore((s) => s.user?.is_demo);
  const [members, setMembers] = useState([]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => careLinksService.getFamilyMembers().then((r) => setMembers(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(myCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* máy không cho sao chép */ }
  };

  const join = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const member = (await careLinksService.joinFamily(code)).data.data;
      setMessage({ ok: true, text: `Đã kết nối gia đình với ${member.name}.` });
      setCode('');
      load();
    } catch (err) {
      setMessage({ ok: false, text: err?.response?.data?.message || 'Chưa kết nối được. Vui lòng thử lại.' });
    } finally {
      setBusy(false);
    }
  };

  const leave = async (m) => {
    if (!window.confirm(`Gỡ ${m.name} khỏi gia đình? Hai người sẽ không nhận cảnh báo của nhau nữa.`)) return;
    await careLinksService.leaveFamily(m.id).catch(() => {});
    load();
  };

  return (
    <section className={styles.card} aria-labelledby="family-title">
      <div className={styles.row}>
        <span className={styles.icon}><Users size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="family-title" className={styles.title}>Gia đình</h2>
          <p className={styles.desc}>Khi một người bỏ cữ hoặc quên uống thuốc, người kia sẽ được báo.</p>
        </div>
      </div>

      {isDemo && (
        <p className={styles.note}>Bạn đang dùng tài khoản dùng thử: chỉ kết nối được với tài khoản dùng thử khác, không kết nối với tài khoản thật.</p>
      )}

      {myCode && (
        <div className={styles.codeBox}>
          <span className={styles.label}>Mã của bạn (gửi cho người nhà)</span>
          <div className={styles.codeRow}>
            <span className={styles.code}>{myCode}</span>
            <button type="button" className={styles.copy} onClick={copy} aria-label="Sao chép mã">
              {copied ? <Check size={20} /> : <Copy size={20} />} {copied ? 'Đã chép' : 'Chép'}
            </button>
          </div>
        </div>
      )}

      <form className={styles.form} onSubmit={join}>
        <label htmlFor="family-code" className={styles.label}>Nhập mã của người nhà</label>
        <input id="family-code" className={styles.input} value={code} placeholder="VD: DIA7K2M9P"
          autoComplete="off" autoCapitalize="characters"
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setMessage(null); }} />
        {message && <p className={message.ok ? styles.okText : styles.error}>{message.text}</p>}
        <button type="submit" className={styles.primary} disabled={busy || code.trim().length < 4}>
          {busy ? 'Đang kết nối…' : 'Kết nối'}
        </button>
      </form>

      {members.length > 0 && (
        <ul className={styles.members}>
          {members.map((m) => (
            <li key={m.id} className={styles.member}>
              <span className={styles.memberName}>{m.name}<span className={styles.memberCode}>{m.user_code}</span></span>
              <button type="button" className={styles.remove} onClick={() => leave(m)} aria-label={`Gỡ ${m.name}`}>
                <UserMinus size={20} /> Gỡ
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
