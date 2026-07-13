import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAdvice } from '../../hooks/useAdvice';
import FilterPills from '../../components/common/FilterPills';
import AdviceCard from '../../components/advice/AdviceCard';
import AlertBanner from '../../components/advice/AlertBanner';
import styles from './AdvicePage.module.css';

const CATEGORIES = [
  { value: 'all', label: '📖 Tất cả' },
  { value: 'should_eat', label: '✓ Nên ăn' },
  { value: 'should_avoid', label: '✗ Nên tránh' },
  { value: 'exercise', label: '↔ Vận động' },
  { value: 'danger_sign', label: '🔔 Nguy hiểm' },
];

export default function AdvicePage() {
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const { advice, loading, fetchAdvice } = useAdvice();

  useEffect(() => { fetchAdvice(category); }, [category]);

  const dangerAdvice = advice.filter((a) => a.category === 'danger_sign');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lời khuyên sức khỏe</h1>
        <p className={styles.subtitle}>Hướng dẫn dành cho bệnh nhân Tiểu đường</p>
      </div>

      {dangerAdvice.length > 0 && (
        <div className={styles.bannerWrap}>
          <AlertBanner onClick={() => setCategory('danger_sign')} />
        </div>
      )}

      <div className={styles.pillsRow}>
        <FilterPills options={CATEGORIES} value={category} onChange={setCategory} />
      </div>

      <div className={styles.list}>
        {advice.map((a) => (
          <AdviceCard key={a.id} advice={a} onView={setSelected} />
        ))}
      </div>

      {selected && (
        <div className={styles.detailOverlay} onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className={styles.detailSheet}>
            <div className={styles.detailHeader}>
              <span className={styles.detailTitle}>{selected.title}</span>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className={styles.detailBody}>{selected.detail_content || selected.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}
