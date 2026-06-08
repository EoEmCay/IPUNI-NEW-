import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('khoi@example.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) { setError('Vui lòng nhập đầy đủ thông tin'); return; }
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}><Activity size={36} color="#fff" strokeWidth={2.5} /></div>
        <div className={styles.logoName}>IPUNI</div>
        <div className={styles.tagline}>Theo dõi sức khỏe tiểu đường<br />mọi lúc, mọi nơi</div>
      </div>

      <div className={styles.card}>
        <h1 className={styles.title}>Đăng nhập</h1>
        <p className={styles.subtitle}>Chào mừng bạn quay trở lại</p>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <Input label="Email / CCCD" type="text" placeholder="Email hoặc số CCCD" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <Input label="Mật khẩu" type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" full disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        <div className={styles.registerLink}>
          Chưa có tài khoản?{' '}
          <Link to="/register" className={styles.link}>Đăng ký ngay</Link>
        </div>
      </div>

      <div className={styles.footer}>
        IPUNI · Ứng dụng theo dõi sức khỏe tiểu đường
      </div>
    </div>
  );
}
