import { useEffect, useState } from 'react';
import { X, PhoneCall } from 'lucide-react';
import { useAdvice } from '../../hooks/useAdvice';
import FilterPills from '../../components/common/FilterPills';
import AdviceCard from '../../components/advice/AdviceCard';
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

      <div className={styles.bannerWrap} style={{ padding: '0 20px', marginBottom: '16px' }}>
        <a 
          href="tel:115" 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
            background: '#EF4444', color: 'white', padding: '16px', borderRadius: '16px', 
            textDecoration: 'none', fontWeight: 'bold', fontSize: '18px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          <PhoneCall size={22} /> Gọi Cấp Cứu 115
        </a>
      </div>

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
