import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { authService } from '../../services/auth.service';
import styles from './OtpVerifyModal.module.css';

const MailSVG = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const PhoneSVG = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const ShieldSVG = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const CloseSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ArrowLeftSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

export default function OtpVerifyModal({ email, phone, formData, onVerified, onClose }) {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'choose' | 'input'
  const [method, setMethod] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef([]);

  // Loading phase: 1.5s then show choose
  useEffect(() => {
    const t = setTimeout(() => setPhase('choose'), 1500);
    return () => clearTimeout(t);
  }, []);

  // Countdown only when in input phase
  useEffect(() => {
    if (phase !== 'input' || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [phase, timeLeft]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const timerColor = timeLeft > 60 ? '#22C55E' : timeLeft > 10 ? '#F59E0B' : '#EF4444';

  const handleChoose = async (m) => {
    setSending(true);
    setMethod(m);
    setError('');
    try {
      await authService.sendOtp(email, formData.password);
    } catch {
      // fail silently — backend may not be configured yet
    } finally {
      setSending(false);
    }
    setOtp(['', '', '', '', '', '']);
    setTimeLeft(300);
    setPhase('input');
    setTimeout(() => inputRefs.current[0]?.focus(), 150);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp]; next[index] = ''; setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Vui lòng nhập đủ 6 chữ số'); return; }
    setSubmitting(true);
    setError('');
    try {
      await authService.verifyOtp(email, code);
      // OTP verified → tạo tài khoản đầy đủ
      const res = await authService.register(
        formData.email, formData.phone, formData.password, formData.confirmPassword,
        { name: formData.name, diagnosis: formData.diagnosis }
      );
      onVerified(res.data.data);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Mã không đúng. Vui lòng thử lại.';
      setError(msg);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setResent(false);
    setSending(true);
    try {
      await authService.sendOtp(email, formData.password);
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch {}
    finally { setSending(false); }
    setTimeLeft(300);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleBack = () => {
    setPhase('choose');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c);
  const maskedPhone = phone ? phone.replace(/(\d{2})(\d*)(\d{2})/, (_, a, b, c) => a + '*'.repeat(b.length) + c) : '';

  const modal = (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.card}>

        {/* ── Header bar ── */}
        <div className={styles.topBar} />
        <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
          <CloseSVG />
        </button>

        {/* ══════════ PHASE: LOADING ══════════ */}
        {phase === 'loading' && (
          <div className={styles.loadingPhase}>
            <div className={styles.loadingIconWrap}>
              <div className={styles.loadingRing} />
              <div className={styles.loadingIcon}><ShieldSVG /></div>
            </div>
            <p className={styles.loadingTitle}>Đang chuẩn bị<span className={styles.dots} /></p>
            <p className={styles.loadingSubtitle}>Xác thực bảo mật tài khoản của bạn</p>
          </div>
        )}

        {/* ══════════ PHASE: CHOOSE ══════════ */}
        {phase === 'choose' && (
          <div className={styles.choosePhase}>
            <div className={styles.chooseIcon}>
              <ShieldSVG />
            </div>
            <h2 className={styles.chooseTitle}>Xác thực OTP</h2>
            <p className={styles.chooseSubtitle}>
              Chọn cách nhận mã xác thực 6 số
            </p>

            <div className={styles.methodList}>
              <button
                className={`${styles.methodCard} ${styles.methodEmail}`}
                onClick={() => handleChoose('email')}
                disabled={sending}
              >
                <div className={styles.methodIconWrap}>
                  <MailSVG />
                </div>
                <div className={styles.methodInfo}>
                  <span className={styles.methodLabel}>Qua Email</span>
                  <span className={styles.methodValue}>{maskedEmail}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.methodArrow}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              <button
                className={`${styles.methodCard} ${styles.methodPhone} ${!phone ? styles.methodDisabled : ''}`}
                onClick={() => phone && handleChoose('phone')}
                disabled={sending || !phone}
              >
                <div className={styles.methodIconWrap}>
                  <PhoneSVG />
                </div>
                <div className={styles.methodInfo}>
                  <span className={styles.methodLabel}>Qua Số Điện Thoại</span>
                  <span className={styles.methodValue}>
                    {phone ? maskedPhone : 'Chưa cung cấp số điện thoại'}
                  </span>
                </div>
                {phone ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.methodArrow}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                ) : (
                  <span className={styles.methodLock}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                )}
              </button>
            </div>

            <p className={styles.chooseNote}>
              Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ cho bất kỳ ai.
            </p>
          </div>
        )}

        {/* ══════════ PHASE: INPUT ══════════ */}
        {phase === 'input' && (
          <div className={styles.inputPhase}>
            <button className={styles.backBtn} onClick={handleBack}>
              <ArrowLeftSVG />
              <span>Đổi phương thức</span>
            </button>

            <div className={styles.inputHeader}>
              <div className={`${styles.methodBadge} ${method === 'email' ? styles.badgeEmail : styles.badgePhone}`}>
                {method === 'email' ? <MailSVG /> : <PhoneSVG />}
              </div>
              <h2 className={styles.inputTitle}>Nhập mã OTP</h2>
              <p className={styles.inputSubtitle}>
                Mã đã được gửi đến{' '}
                <strong>{method === 'email' ? maskedEmail : maskedPhone}</strong>
              </p>
            </div>

            {/* 6 OTP boxes */}
            <div className={styles.otpRow} onPaste={handlePaste}>
              {otp.map((val, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  className={`${styles.otpBox} ${val ? styles.otpBoxFilled : ''} ${error ? styles.otpBoxError : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoComplete="off"
                />
              ))}
            </div>

            {/* Countdown */}
            <div className={styles.countdownWrap}>
              {timeLeft > 0 ? (
                <div className={styles.countdownPill} style={{ '--timer-color': timerColor }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>{formatTime(timeLeft)}</span>
                </div>
              ) : (
                <p className={styles.expiredText}>Mã đã hết hạn</p>
              )}
            </div>

            {/* Error */}
            {error && <div className={styles.errorBox}><span>⚠</span> {error}</div>}

            {/* Resent success */}
            {resent && <div className={styles.resentBox}>✓ Đã gửi lại mã mới</div>}

            {/* Confirm button */}
            <button
              className={styles.confirmBtn}
              onClick={handleVerify}
              disabled={submitting || otp.join('').length < 6 || timeLeft === 0}
            >
              {submitting ? <span className={styles.spinner} /> : null}
              {submitting ? 'Đang xác thực...' : 'Xác nhận'}
            </button>

            {/* Resend */}
            <div className={styles.resendRow}>
              {timeLeft > 0 ? (
                <span className={styles.resendHint}>Chưa nhận được mã?</span>
              ) : (
                <button className={styles.resendBtn} onClick={handleResend} disabled={sending}>
                  {sending ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
