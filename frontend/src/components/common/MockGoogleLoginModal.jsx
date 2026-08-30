import { useState } from 'react';
import { useT } from '../../hooks/useT';
import { GoogleIcon } from './AuthIcons';
import styles from './MockGoogleLoginModal.module.css';

export default function MockGoogleLoginModal({ onClose, onLogin }) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(t.mockGoogle?.invalidEmail || 'Vui lòng nhập địa chỉ email Google hợp lệ');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(email.trim().toLowerCase());
    } catch (err) {
      setError(err?.response?.data?.message || t.mockGoogle?.loginFailed || 'Đăng nhập Google thất bại');
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
            <GoogleIcon className={styles.gIcon} style={{ width: '28px', height: '28px' }} />
          </div>
          <h2 className={styles.title}>{t.mockGoogle?.title || 'Đăng nhập bằng Google'}</h2>
          <p className={styles.subtitle}>{t.mockGoogle?.subtitle || 'Sử dụng tài khoản Google để tiếp tục vào DIA+'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.content}>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <div className={styles.inputGroup}>
            <input 
              type="email" 
              className={styles.input} 
              placeholder={t.mockGoogle?.placeholder || 'Nhập địa chỉ Gmail của bạn (vd: ten@gmail.com)'} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <p className={styles.infoText}>
            {t.mockGoogle?.infoText || 'Để bảo vệ an toàn cho tài khoản, hệ thống sẽ xác thực và liên kết dữ liệu y tế với email Google của bạn.'}
          </p>
          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>{t.mockGoogle?.cancel || 'Hủy'}</button>
            <button type="submit" disabled={loading} className={styles.btnPrimary}>
              {loading ? (t.mockGoogle?.processing || 'Đang xử lý...') : (t.mockGoogle?.next || 'Tiếp tục')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
