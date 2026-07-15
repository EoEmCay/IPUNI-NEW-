import React from 'react';
import styles from './HeroBackground.module.css';

export default function HeroBackground() {
  return (
    <>
      <div className={styles.heroStars}></div>
      <div className={styles.heroAurora}>
        <div className={styles.auroraBlob1}></div>
        <div className={styles.auroraBlob2}></div>
        <div className={styles.auroraBlob3}></div>
      </div>
      <div className={styles.heroMeteors}>
        <div className={`${styles.meteor} ${styles.meteor1}`}></div>
        <div className={`${styles.meteor} ${styles.meteor2}`}></div>
        <div className={`${styles.meteor} ${styles.meteor3}`}></div>
      </div>
      <div className={styles.heroGrid}></div>
    </>
  );
}
