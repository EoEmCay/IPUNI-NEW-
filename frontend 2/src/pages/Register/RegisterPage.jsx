import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useThemeStore from '../../store/themeStore';
import { authService } from '../../services/auth.service';
import TermsModal from '../../components/common/TermsModal';
import OtpVerifyModal from '../../components/auth/OtpVerifyModal';
import styles from './RegisterPage.module.css';

/* ─── Inline SVG icons ─── */
const EyeSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function RegisterPage() {
  const { register, completeRegistration } = useAuth();
  const navigate = useNavigate();
  const applyDefaultLook = useThemeStore((s) => s.applyDefaultLook);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cccd: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { applyDefaultLook(); }, [applyDefaultLook]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (form.name.trim() && form.name.trim().length < 2)
      errs.name = 'Họ tên ít nhất 2 ký tự';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email không hợp lệ';
    if (form.phone && !/^\d{9,11}$/.test(form.phone))
      errs.phone = 'Số điện thoại không hợp lệ (9-11 chữ số, VD: 0901234567)';
    if (form.password.length < 6)
      errs.password = 'Mật khẩu ít nhất 6 ký tự';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Mật khẩu nhập lại không khớp';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setServerError('');
    setLoading(true);
    try {
      // Gửi OTP trước, hiển thị modal chọn kênh
      await authService.sendOtp(form.email, form.password);
      setShowOtp(true);
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = (authData) => {
    setShowOtp(false);
    setPendingAuth(authData);
    setShowTerms(true);
  };

  const handleTermsComplete = () => {
    if (!pendingAuth) return;
    completeRegistration(pendingAuth.token, pendingAuth.user);
    navigate('/');
  };

  const pwStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  };
  const strength = pwStrength();
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'][strength];

  return (
    <div className={styles.page}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.container}>
        {/* Logo nhỏ gọn */}
        <div className={styles.logoWrap}>
          <div className={styles.logoCard}>
            <img src="/logo-moi.png" alt="DIA+" className={styles.logoImg} />
          </div>
          <p className={styles.appName}>DIA+</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Tạo tài khoản</h1>
            <p className={styles.subtitle}>Điền đầy đủ để bắt đầu hành trình sức khoẻ</p>
          </div>

          {serverError && (
            <div className={styles.errorBox}>
              <span>⚠</span> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Thông tin cá nhân ── */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionDot} />
                Thông tin cá nhân
              </div>

              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>
                  Họ và tên <span className={styles.optional}>(tuỳ chọn)</span>
                </label>
                <input
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={set('name')}
                  maxLength={60}
                />
                {errors.name && <span className={styles.fieldErr}>{errors.name}</span>}
              </div>

              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>
                  Số CCCD/CMND <span className={styles.optional}>(tuỳ chọn)</span>
                </label>
                <input
                  className={`${styles.input} ${errors.cccd ? styles.inputError : ''}`}
                  type="text"
                  placeholder="Nhập 12 số CCCD"
                  value={form.cccd}
                  onChange={set('cccd')}
                  maxLength={12}
                />
              </div>
            </div>

            {/* ── Thông tin tài khoản ── */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionDot} />
                Thông tin đăng ký
              </div>

              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Email <span className={styles.required}>*</span></label>
                <input
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  type="text"
                  inputMode="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                />
                {errors.email && <span className={styles.fieldErr}>{errors.email}</span>}
              </div>

              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>
                  Số điện thoại <span className={styles.optional}>(tuỳ chọn)</span>
                </label>
                <input
                  className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={set('phone')}
                />
                {errors.phone && <span className={styles.fieldErr}>{errors.phone}</span>}
              </div>
            </div>

            {/* ── Mật khẩu ── */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionDot} />
                Mật khẩu
              </div>

              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Mật khẩu <span className={styles.required}>*</span></label>
                <div className={`${styles.inputBox} ${errors.password ? styles.inputBoxError : ''}`}>
                  <input
                    className={styles.inputInner}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ít nhất 6 ký tự"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                    {showPassword ? <EyeOffSVG /> : <EyeSVG />}
                  </button>
                </div>
                {form.password && (
                  <div className={styles.strengthRow}>
                    <div className={styles.strengthBar}>
                      {[1,2,3,4].map((i) => (
                        <div
                          key={i}
                          className={styles.strengthSegment}
                          style={{ background: i <= strength ? strengthColor : '#E2E8F0' }}
                        />
                      ))}
                    </div>
                    <span className={styles.strengthLabel} style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
                {errors.password && <span className={styles.fieldErr}>{errors.password}</span>}
              </div>

              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Nhập lại mật khẩu <span className={styles.required}>*</span></label>
                <div className={`${styles.inputBox} ${errors.confirmPassword ? styles.inputBoxError : ''}`}>
                  <input
                    className={styles.inputInner}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                    {showConfirm ? <EyeOffSVG /> : <EyeSVG />}
                  </button>
                </div>
                {errors.confirmPassword && <span className={styles.fieldErr}>{errors.confirmPassword}</span>}
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? <span className={styles.spinner} /> : null}
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className={styles.loginRow}>
            Đã có tài khoản?{' '}
            <Link to="/login" className={styles.loginLink}>Đăng nhập ngay</Link>
          </p>
        </div>

        <p className={styles.footer}>DIA+ · Giải pháp y tế thông minh</p>
      </div>

      {showOtp && (
        <OtpVerifyModal
          email={form.email}
          phone={form.phone || null}
          formData={form}
          onVerified={handleOtpVerified}
          onClose={() => setShowOtp(false)}
        />
      )}

      {showTerms && <TermsModal onComplete={handleTermsComplete} />}
    </div>
  );
}
