import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ cccd: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!/^\d{12}$/.test(form.cccd)) errs.cccd = 'CCCD phải đúng 12 chữ số';
    if (!/^\d{9,11}$/.test(form.phone)) errs.phone = 'Số điện thoại không hợp lệ';
    if (form.password.length < 6) errs.password = 'Mật khẩu ít nhất 6 ký tự';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu nhập lại không khớp';
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
      await register(form.cccd, form.phone, form.password);
      navigate('/');
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}><Activity size={36} color="#fff" strokeWidth={2.5} /></div>
        <div className={styles.logoName}>IPUNI</div>
        <div className={styles.tagline}>Tạo tài khoản mới<br />để bắt đầu theo dõi sức khỏe</div>
      </div>

      <div className={styles.card}>
        <h1 className={styles.title}>Đăng ký</h1>
        <p className={styles.subtitle}>Nhập thông tin để tạo tài khoản</p>

        {serverError && <div className={styles.errorMsg}>{serverError}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <Input
              label="Số CCCD"
              type="text"
              inputMode="numeric"
              maxLength={12}
              placeholder="123456789012"
              value={form.cccd}
              onChange={set('cccd')}
            />
            {errors.cccd && <span className={styles.fieldError}>{errors.cccd}</span>}
          </div>

          <div className={styles.field}>
            <Input
              label="Số điện thoại"
              type="text"
              inputMode="numeric"
              maxLength={11}
              placeholder="0901234567"
              value={form.phone}
              onChange={set('phone')}
            />
            {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
          </div>

          <div className={styles.field}>
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••"
              value={form.password}
              onChange={set('password')}
            />
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <Input
              label="Nhập lại mật khẩu"
              type="password"
              placeholder="••••••"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
            />
            {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
          </div>

          <Button type="submit" full disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
        </form>

        <div className={styles.loginLink}>
          Đã có tài khoản?{' '}
          <Link to="/login" className={styles.link}>Đăng nhập</Link>
        </div>
      </div>

      <div className={styles.footer}>
        IPUNI · Ứng dụng theo dõi sức khỏe tiểu đường
      </div>
    </div>
  );
}
