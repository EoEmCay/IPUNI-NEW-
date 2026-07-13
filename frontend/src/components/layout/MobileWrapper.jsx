import styles from './MobileWrapper.module.css';

export default function MobileWrapper({ children }) {
  return (
    <div className={styles.mobileWrapper}>
      {children}
    </div>
  );
}
