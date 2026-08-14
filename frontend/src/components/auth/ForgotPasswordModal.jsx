import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import styles from './OtpVerifyModal.module.css';

const MailSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const ShieldSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const CloseSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function ForgotPasswordModal({ onClose }) {
  const navigate = useNavigate();
  const { completeRegistration } = useAuth();
  const [phase, setPhase] = useState('email'); // 'email' | 'otp' | 'newPassword' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetTicket, setResetTicket] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (phase !== 'otp' || timeLeft <= 0) return undefined;
    const interval = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [phase, timeLeft]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const timerColor = timeLeft > 60 ? '#22C55E' : timeLeft > 10 ? '#F59E0B' : '#EF4444';

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPasswordOtp(email.trim());
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(300);
      setPhase('otp');
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
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

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Vui lòng nhập đủ 6 số'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authService.verifyResetOtp(email.trim(), code);
      setResetTicket(res.data.data.resetTicket);
      setPhase('newPassword');
    } catch (err) {
      setError(err?.response?.data?.message || 'Mã xác thực không đúng');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResent(false);
    setLoading(true);
    try {
      await authService.forgotPasswordOtp(email.trim());
      setOtp(['', '', '', '', '', '']);
      setResent(true);
      setTimeLeft(300);
      setTimeout(() => setResent(false), 3000);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể gửi lại mã.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Mật khẩu mới ít nhất 6 ký tự'); return; }
    if (newPassword !== confirmNewPassword) { setError('Mật khẩu nhập lại không khớp'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authService.resetPassword(email.trim(), newPassword, confirmNewPassword, resetTicket);
      const { token, user } = res.data.data;
      completeRegistration(token, user);
      setPhase('done');
      setTimeout(() => { onClose(); navigate('/'); }, 1800);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.card}>
        <div className={styles.topBar} />
        {phase !== 'done' && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng"><CloseSVG /></button>
        )}

        {phase === 'email' && (
          <form className={styles.inputPhase} onSubmit={handleSendOtp}>
            <div className={styles.inputHeader}>
              <div className={`${styles.methodBadge} ${styles.badgeEmail}`}><MailSVG /></div>
              <h2 className={styles.inputTitle}>Quên mật khẩu?</h2>
              <p className={styles.inputSubtitle}>Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực để bạn đặt lại mật khẩu.</p>
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.fieldLabel}>Email</label>
              <input
                className={`${styles.textInput} ${error ? styles.textInputError : ''}`}
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoFocus
                autoComplete="email"
              />
            </div>
            {error && <div className={styles.errorBox}><span>⚠</span> {error}</div>}
            <button type="submit" className={styles.confirmBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : null}
              {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
          </form>
        )}

        {phase === 'otp' && (
          <div className={styles.inputPhase}>
            <div className={styles.inputHeader}>
              <div className={`${styles.methodBadge} ${styles.badgeEmail}`}><ShieldSVG /></div>
              <h2 className={styles.inputTitle}>Nhập mã xác thực</h2>
              <p className={styles.inputSubtitle}>Nếu email này có tài khoản, mã đã được gửi tới <strong>{email}</strong></p>
            </div>

            <div className={styles.otpRow} onPaste={handlePaste}>
              {otp.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
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

            <div className={styles.countdownWrap}>
              {timeLeft > 0 ? (
                <div className={styles.countdownPill} style={{ '--timer-color': timerColor }}>
                  <span>{formatTime(timeLeft)}</span>
                </div>
              ) : (
                <p className={styles.expiredText}>Mã đã hết hạn</p>
              )}
            </div>

            {error && <div className={styles.errorBox}><span>⚠</span> {error}</div>}
            {resent && <div className={styles.resentBox}>Đã gửi lại mã mới</div>}

            <button
              className={styles.confirmBtn}
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length < 6 || timeLeft === 0}
            >
              {loading ? <span className={styles.spinner} /> : null}
              {loading ? 'Đang xác thực...' : 'Xác nhận'}
            </button>

            <div className={styles.resendRow}>
              {timeLeft > 0 ? (
                <span className={styles.resendHint}>Chưa nhận được mã?</span>
              ) : (
                <button className={styles.resendBtn} onClick={handleResend} disabled={loading}>
                  {loading ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'newPassword' && (
          <form className={styles.inputPhase} onSubmit={handleResetPassword}>
            <div className={styles.inputHeader}>
              <div className={`${styles.methodBadge} ${styles.badgeEmail}`}><ShieldSVG /></div>
              <h2 className={styles.inputTitle}>Đặt mật khẩu mới</h2>
              <p className={styles.inputSubtitle}>Xác thực thành công. Nhập mật khẩu mới cho tài khoản của bạn.</p>
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.fieldLabel}>Mật khẩu mới</label>
              <input
                className={styles.textInput}
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.fieldLabel}>Nhập lại mật khẩu mới</label>
              <input
                className={styles.textInput}
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmNewPassword}
                onChange={(e) => { setConfirmNewPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
            </div>
            {error && <div className={styles.errorBox}><span>⚠</span> {error}</div>}
            <button type="submit" className={styles.confirmBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : null}
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        {phase === 'done' && (
          <div className={styles.blockedPhase}>
            <div className={`${styles.blockedIconWrap} ${styles.isInfo}`}><ShieldSVG /></div>
            <p className={styles.blockedTitle}>Đặt lại mật khẩu thành công</p>
            <p className={styles.blockedMessage}>Đang chuyển vào ứng dụng...</p>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
