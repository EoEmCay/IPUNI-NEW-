import { useState } from 'react';
import { useT } from '../../hooks/useT';
import styles from './MockGoogleLoginModal.module.css';

export default function MockGoogleLoginModal({ onClose, onLogin }) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(t.mockGoogle.invalidEmail);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(email);
    } catch (err) {
      setError(err?.response?.data?.message || t.mockGoogle.loginFailed);
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <img src="/logo-moi.png" alt="Google" style={{ width: '100px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          <h2 className={styles.title}>{t.mockGoogle.title}</h2>
          <p className={styles.subtitle}>{t.mockGoogle.subtitle}</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.content}>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <div className={styles.inputGroup}>
            <input 
              type="email" 
              className={styles.input} 
              placeholder={t.mockGoogle.placeholder} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <p className={styles.infoText}>
            {t.mockGoogle.infoText}
          </p>
          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>{t.mockGoogle.cancel}</button>
            <button type="submit" disabled={loading} className={styles.btnPrimary}>
              {loading ? t.mockGoogle.processing : t.mockGoogle.next}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
