import { useEffect, useState, useMemo } from 'react';
import { X, PhoneCall } from 'lucide-react';
import { useAdvice } from '../../hooks/useAdvice';
import { useT } from '../../hooks/useT';
import FilterPills from '../../components/common/FilterPills';
import AdviceCard from '../../components/advice/AdviceCard';
import styles from './AdvicePage.module.css';

export default function AdvicePage() {
  const t = useT();
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const { advice, loading, fetchAdvice } = useAdvice();

  const CATEGORIES = useMemo(() => [
    { value: 'all', label: `📖 ${t.advice.allAdvice}` },
    { value: 'should_eat', label: `✓ ${t.advice.shouldEat}` },
    { value: 'should_avoid', label: `✗ ${t.advice.shouldAvoid}` },
    { value: 'exercise', label: `↔ ${t.advice.exercise}` },
    { value: 'danger_sign', label: `🔔 ${t.advice.danger}` },
  ], [t]);

  useEffect(() => { fetchAdvice(category); }, [category]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.advice.title}</h1>
        <p className={styles.subtitle}>{t.advice.subtitle}</p>
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
          <PhoneCall size={22} /> {t.profile?.callEmergency || 'Gọi Cấp Cứu 115'}
        </a>
      </div>

      <div className={styles.pillsRow}>
        <FilterPills options={CATEGORIES} value={category} onChange={setCategory} />
      </div>

      <div className={styles.list}>
        {advice.map((a) => (
          <AdviceCard key={a.id} advice={a} onView={setSelected} t={t} />
        ))}
      </div>

      {selected && (
        <div className={styles.detailOverlay} onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className={styles.detailSheet}>
            <div className={styles.detailHeader}>
              <span className={styles.detailTitle}>{t?.adviceData?.[selected.title] || selected.title}</span>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className={styles.detailBody}>{t?.adviceData?.[selected.detail_content || selected.description] || (selected.detail_content || selected.description)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
