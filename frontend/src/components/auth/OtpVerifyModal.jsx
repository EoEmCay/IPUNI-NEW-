import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useT } from '../../hooks/useT';
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
export default function OtpVerifyModal({ target: propTarget, email, phone, formData, onVerified, onClose }) {
  const t = useT();
  const navigate = useNavigate();
  const actualTarget = propTarget || email || phone;
  const isPhone = !actualTarget.includes('@');
  const [phase, setPhase] = useState('loading'); // 'loading' | 'choose' | 'input' | 'blocked'
  const [method, setMethod] = useState(isPhone ? 'phone' : 'email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);
  // { message, isAlreadyRegistered } - lý do bị chặn không cho vào màn nhập mã
  const [blockedInfo, setBlockedInfo] = useState(null);
  const inputRefs = useRef([]);

  const attemptSendOtp = async () => {
    setMethod(isPhone ? 'phone' : 'email');
    setSending(true);
    setError('');
    try {
      await authService.sendOtp(actualTarget, formData.password);
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(300);
      setPhase('input');
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err) {
      // Không gửi được mã (đã có tài khoản, hết lượt gửi, lỗi mạng...) -> KHÔNG được
      // âm thầm đưa người dùng vào màn "nhập mã" vì sẽ không bao giờ có mã nào tới.
      const data = err?.response?.data;
      setBlockedInfo({
        message: data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại sau.',
        isAlreadyRegistered: data?.code === 'ALREADY_REGISTERED',
      });
      setPhase('blocked');
    } finally {
      setSending(false);
    }
  };

  // Loading phase: 1.2s rồi mới gửi OTP (hiệu ứng "đang chuẩn bị")
  useEffect(() => {
    const t = setTimeout(() => { attemptSendOtp(); }, 1200);
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
    if (code.length < 6) { setError(t.otp.enter6Digits); return; }
    setSubmitting(true);
    setError('');
    try {
      const verifyRes = await authService.verifyOtp(actualTarget, code);
      const registrationTicket = verifyRes.data.data.registrationTicket;
      // OTP verified → tạo tài khoản đầy đủ, kèm vé xác thực OTP để backend đối chiếu
      const regEmail = formData.email ? formData.email.trim() : '';
      const regPhone = formData.phone ? formData.phone.trim() : '';
      const res = await authService.register(
        regEmail, regPhone, formData.password, formData.confirmPassword,
        { name: formData.name, diagnosis: formData.diagnosis, registrationTicket }
      );
      onVerified(res.data.data);
    } catch (err) {
      const msg = err?.response?.data?.message || t.otp.incorrectCode;
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
      await authService.sendOtp(actualTarget, formData.password);
      setResent(true);
      setTimeLeft(300);
      setTimeout(() => setResent(false), 3000);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      // Gửi lại thất bại (hết cooldown 60s, hết lượt/ngày...) -> hiển thị rõ lý do
      // ngay trong ô lỗi có sẵn, thay vì im lặng để người dùng tưởng mã đã gửi lại.
      setError(err?.response?.data?.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.');
    } finally {
      setSending(false);
    }
  };

  const maskedTarget = isPhone
    ? actualTarget.replace(/(\d{2})(\d*)(\d{2})/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : actualTarget.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c);

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
            <p className={styles.loadingTitle}>{t.otp.preparing}<span className={styles.dots} /></p>
            <p className={styles.loadingSubtitle}>{t.otp.verifyingSecurity}</p>
          </div>
        )}

        {/* ══════════ PHASE: BLOCKED (đã có tài khoản / không gửi được mã) ══════════ */}
        {phase === 'blocked' && blockedInfo && (
          <div className={styles.blockedPhase}>
            <div className={`${styles.blockedIconWrap} ${blockedInfo.isAlreadyRegistered ? styles.isInfo : styles.isWarning}`}>
              {blockedInfo.isAlreadyRegistered ? <ShieldSVG /> : <span>⚠</span>}
            </div>
            <p className={styles.blockedTitle}>
              {blockedInfo.isAlreadyRegistered ? 'Email này đã có tài khoản' : 'Không thể gửi mã xác thực'}
            </p>
            <p className={styles.blockedMessage}>{blockedInfo.message}</p>
            <div className={styles.blockedActions}>
              {blockedInfo.isAlreadyRegistered ? (
                <button className={styles.confirmBtn} onClick={() => navigate('/login')}>Đăng nhập ngay</button>
              ) : (
                <button className={styles.confirmBtn} onClick={attemptSendOtp} disabled={sending}>
                  {sending ? t.otp.sending : 'Thử lại'}
                </button>
              )}
              <button className={styles.resendBtn} onClick={onClose}>Đóng</button>
            </div>
          </div>
        )}

        {/* ══════════ PHASE: INPUT ══════════ */}
        {phase === 'input' && (
          <div className={styles.inputPhase}>

            <div className={styles.inputHeader}>
              <div className={`${styles.methodBadge} ${method === 'email' ? styles.badgeEmail : styles.badgePhone}`}>
                {method === 'email' ? <MailSVG /> : <PhoneSVG />}
              </div>
              <h2 className={styles.inputTitle}>{t.otp.enterOtp}</h2>
              <p className={styles.inputSubtitle}>
                {t.otp.codeSentTo}{' '}
                <strong>{maskedTarget}</strong>
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
                <p className={styles.expiredText}>{t.otp.codeExpired}</p>
              )}
            </div>

            {/* Error */}
            {error && <div className={styles.errorBox}><span>⚠</span> {error}</div>}

            {/* Resent success */}
            {resent && <div className={styles.resentBox}>{t.otp.newCodeSent}</div>}

            {/* Confirm button */}
            <button
              className={styles.confirmBtn}
              onClick={handleVerify}
              disabled={submitting || otp.join('').length < 6 || timeLeft === 0}
            >
              {submitting ? <span className={styles.spinner} /> : null}
              {submitting ? t.otp.verifying : t.otp.confirm}
            </button>

            {/* Resend */}
            <div className={styles.resendRow}>
              {timeLeft > 0 ? (
                <span className={styles.resendHint}>{t.otp.notReceived}</span>
              ) : (
                <button className={styles.resendBtn} onClick={handleResend} disabled={sending}>
                  {sending ? t.otp.sending : t.otp.resend}
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
