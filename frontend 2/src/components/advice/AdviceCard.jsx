import { CheckCircle, XCircle, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import styles from './AdviceCard.module.css';

const ICONS = {
  check: CheckCircle,
  cross: XCircle,
  exercise: ArrowLeftRight,
  warning: AlertTriangle
};

const ICON_COLORS = {
  should_eat: '#22C55E',
  should_avoid: '#EF4444',
  exercise: '#3B82F6',
  danger_sign: '#DC2626'
};

export default function AdviceCard({ advice, onView }) {
  const Icon = ICONS[advice.icon_type] || CheckCircle;
  const iconColor = ICON_COLORS[advice.category];

  return (
    <div className={`${styles.card} ${styles[advice.category]}`}>
      <div className={styles.iconWrap}>
        <Icon size={22} color={iconColor} />
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{advice.title}</div>
        <div className={styles.desc}>{advice.description}</div>
      </div>
      {advice.detail_content && (
        <button className={`${styles.viewBtn} ${styles[advice.category]}`} onClick={() => onView(advice)}>
          Xem
        </button>
      )}
    </div>
  );
}
