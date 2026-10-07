import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './PageHeader.module.css';

// Đầu trang chuẩn cho các trang mở từ Trang chủ: ← quay lại · tiêu đề · nút phụ (tuỳ chọn) · mô tả.
// Mở thẳng trang (không có trang trước trong app) -> ← về Trang chủ thay vì thoát khỏi app.
export default function PageHeader({ title, subtitle, action }) {
  const navigate = useNavigate();
  const location = useLocation();
  const back = () => (location.key === 'default' ? navigate('/dashboard') : navigate(-1));

  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <button type="button" className={styles.back} onClick={back} aria-label="Quay lại">
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1 className={styles.title}>{title}</h1>
        {action}
      </div>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}
