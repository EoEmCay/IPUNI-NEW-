import styles from './CuteBackground.module.css';

export default function CuteBackground() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.starField}>
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} className={styles.star} />
        ))}
      </div>
      <div className={styles.cloud1} />
      <div className={styles.cloud2} />
      <div className={styles.cloud3} />
      <div className={styles.cloud4} />
      <div className={styles.planet1} />
      <div className={styles.planet2} />
      <div className={styles.planet3} />
      <div className={styles.sparkle1}>✦</div>
      <div className={styles.sparkle2}>✧</div>
      <div className={styles.sparkle3}>✦</div>
    </div>
  );
}
