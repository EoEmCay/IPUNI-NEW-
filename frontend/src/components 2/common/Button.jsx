import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', full, className = '', ...props }) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${full ? styles.full : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
