import React, { useState, useEffect } from 'react';
import styles from './ImageCarousel.module.css';

const ImageCarousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) {
    return <div className={styles.placeholderContainer}>Thư viện bài học</div>;
  }

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.imageWrapper}>
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Slide ${idx + 1}`}
            className={`${styles.image} ${idx === currentIndex ? styles.active : ''}`}
          />
        ))}
      </div>
      <div className={styles.dotsContainer}>
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
