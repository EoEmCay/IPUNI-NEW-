import styles from './EmptyState.module.css';

export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className={styles.empty}>
      <div className={styles.iconWrap}>
        <Icon size={32} />
      </div>
      <p className={styles.title}>{title}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
