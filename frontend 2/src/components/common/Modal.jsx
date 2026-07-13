import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export default function Modal({ title, onClose, children, noPadding }) {
  return createPortal(
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={`${styles.header} ${noPadding ? styles.headerFloat : ''}`}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={noPadding ? styles.bodyNoPad : styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
