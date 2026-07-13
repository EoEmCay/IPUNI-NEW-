import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useThemeStore from '../../store/themeStore';
import { useT } from '../../hooks/useT';
import { GoogleIcon } from '../../components/common/AuthIcons';
import MockGoogleLoginModal from '../../components/common/MockGoogleLoginModal';
import styles from './LoginPage.module.css';

const PhoneSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const MailSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const UserSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const LockSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
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
const ArrowLeftSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

export default function LoginPage() {
  const { login, googleMockLogin, demoLogin } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const applyDefaultLook = useThemeStore((s) => s.applyDefaultLook);

  const [view, setView] = useState('options');
  const [showGoogleMock, setShowGoogleMock] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);

  useEffect(() => { applyDefaultLook(); }, [applyDefaultLook]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setError('');
    setLoading(true);
    setError('');
    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (email) => {
    await googleMockLogin(email);
    setShowGoogleMock(false);
    navigate('/');
  };

  const handlePhoneClick = () => {
    setComingSoon(true);
    setTimeout(() => setComingSoon(false), 2500);
  };

  const goToEmail = () => {
    setError('');
    setIdentifier('');
    setPassword('');
    setView('email');
  };

  const goBack = () => {
    setError('');
    setView('options');
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      localStorage.setItem('diaplus_force_tour', 'true');
      await demoLogin();
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể vào chế độ demo');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logoCard}>
            <img src="/logo-moi.png" alt="DIA+" className={styles.logoImg} />
          </div>
          <p className={styles.appName}>DIA+</p>
          <p className={styles.tagline}>Giải pháp toàn diện quản lý bệnh lý,<br />dinh dưỡng & vận động</p>
        </div>

        {view === 'options' && (
          <div className={styles.panel}>
            <button
              className={`${styles.authBtn} ${styles.phoneBtn}`}
              onClick={handlePhoneClick}
            >
              <PhoneSVG />
              <span>{comingSoon ? 'Tính năng sắp ra mắt...' : 'Tiếp tục qua Số điện thoại'}</span>
            </button>

            <button
              className={`${styles.authBtn} ${styles.googleBtn}`}
              onClick={() => setShowGoogleMock(true)}
            >
              <GoogleIcon className={styles.gIcon} />
              <span>Tiếp tục qua Google</span>
            </button>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>hoặc</span>
              <div className={styles.dividerLine} />
            </div>

            <button className={`${styles.authBtn} ${styles.emailBtn}`} onClick={goToEmail}>
              <MailSVG />
              <span>Đăng nhập bằng Email / Mật khẩu</span>
            </button>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>hoặc</span>
              <div className={styles.dividerLine} />
            </div>

            <button
              className={`${styles.authBtn} ${styles.demoBtn}`}
              onClick={handleDemoLogin}
              disabled={demoLoading}
            >
              {demoLoading ? (
                <span className={styles.demoSpinner} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              )}
              <span>{demoLoading ? 'Đang vào demo...' : 'Sử Dụng Demo'}</span>
            </button>

            <p className={styles.registerRow}>
              Chưa có tài khoản?{' '}
              <Link to="/register" className={styles.registerLink}>Tạo tài khoản mới</Link>
            </p>
          </div>
        )}

        {view === 'email' && (
          <div className={styles.formPanel}>
            <button className={styles.backBtn} onClick={goBack}>
              <ArrowLeftSVG />
              <span>Quay lại</span>
            </button>

            <h2 className={styles.formTitle}>Đăng nhập</h2>
            <p className={styles.formSub}>Nhập tài khoản và mật khẩu của bạn</p>

            {error && (
              <div className={styles.errorBox}>
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Email / CCCD</label>
                <div className={styles.inputBox}>
                  <span className={styles.inputIcon}><UserSVG /></span>
                  <input
                    className={styles.inputField}
                    type="text"
                    placeholder="Nhập email hoặc số CCCD"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Mật khẩu</label>
                <div className={styles.inputBox}>
                  <span className={styles.inputIcon}><LockSVG /></span>
                  <input
                    className={styles.inputField}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffSVG /> : <EyeSVG />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : null}
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <p className={styles.registerRow}>
              Chưa có tài khoản?{' '}
              <Link to="/register" className={styles.registerLink}>Tạo tài khoản mới</Link>
            </p>
          </div>
        )}

        <p className={styles.footer}>DIA+ · Giải pháp y tế thông minh</p>
      </div>

      {showGoogleMock && (
        <MockGoogleLoginModal
          onClose={() => setShowGoogleMock(false)}
          onLogin={handleGoogleLogin}
        />
      )}
    </div>
  );
}
