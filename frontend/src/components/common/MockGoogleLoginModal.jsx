import { useState } from 'react';
import styles from './MockGoogleLoginModal.module.css';

export default function MockGoogleLoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(email);
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập Google thất bại');
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <img src="/logo-moi.png" alt="Google" style={{ width: '100px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          <h2 className={styles.title}>Đăng nhập (Giả lập)</h2>
          <p className={styles.subtitle}>Sử dụng tài khoản Google của bạn</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.content}>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <div className={styles.inputGroup}>
            <input 
              type="email" 
              className={styles.input} 
              placeholder="Email hoặc số điện thoại" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <p className={styles.infoText}>
            Đây là giao diện mô phỏng đăng nhập bằng Google. Hệ thống sẽ tạo tài khoản tự động dựa trên email này.
          </p>
          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>Huỷ</button>
            <button type="submit" disabled={loading} className={styles.btnPrimary}>
              {loading ? 'Đang xử lý...' : 'Tiếp theo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
