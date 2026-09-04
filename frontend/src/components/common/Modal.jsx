import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export default function Modal({ title, onClose, children, footer, noPadding }) {
  // Khoá cuộn trang nền khi mở Modal (giữ nguyên vị trí cuộn khi đóng)
  useEffect(() => {
    const y = window.scrollY;
    const body = document.body;
    body.classList.add('no-scroll');
    body.style.top = `-${y}px`;
    return () => {
      body.classList.remove('no-scroll');
      body.style.top = '';
      window.scrollTo(0, y);
    };
  }, []);

  return createPortal(
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={`${styles.header} ${noPadding ? styles.headerFloat : ''}`}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </div>
        <div className={noPadding ? styles.bodyNoPad : styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
