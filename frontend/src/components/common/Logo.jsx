import styles from './Logo.module.css';

/**
 * Logo dạng chữ "DIA+" (không dùng ảnh).
 * Props:
 *   size    — 'sm' (TopBar) | 'md' | 'lg' (trang Login/Register)
 *   variant — 'onDark' (chữ trắng, mặc định) | 'onLight' (chữ xanh)
 */
export default function Logo({ size = 'md', variant = 'onDark', className = '' }) {
  return (
    <div className={`${styles.wrap} ${styles[size]} ${className}`}>
      <img src="/logo-moi.png" alt="DIA+" className={styles.logoImg} />
      <span className={`${styles.text} ${variant === 'onLight' ? styles.onLight : styles.onDark}`}>
        IA+
      </span>
    </div>
  );
}
