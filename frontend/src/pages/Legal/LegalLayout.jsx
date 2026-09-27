import { Link } from 'react-router-dom';
import styles from './Legal.module.css';

// Khung chung cho các trang pháp lý công khai (không cần đăng nhập)
export default function LegalLayout({ title, updated, children }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <img src="/logo.jpg" alt="" className={styles.logo} />
          <span>DIA+</span>
        </Link>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Cập nhật lần cuối: {updated}</p>
        {children}
        <nav className={styles.footerNav} aria-label="Trang pháp lý">
          <Link to="/chinh-sach-bao-mat">Chính sách quyền riêng tư</Link>
          <Link to="/xoa-du-lieu">Xoá dữ liệu người dùng</Link>
          <Link to="/">Trang chủ</Link>
        </nav>
      </main>
    </div>
  );
}
