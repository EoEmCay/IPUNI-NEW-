import { useState, useEffect } from 'react';
import { Pill, Syringe, Sparkles } from 'lucide-react';
import { isInjection } from '../../utils/medForm';
import { getSavedDrugVisual, fetchAndCacheDrugVisual } from '../../utils/drugVisuals';
import styles from './MedicationTile.module.css';

// Ô vuông cho 1 thuốc: tự động tìm và hiển thị ảnh thật hộp/vỉ thuốc trên mạng,
// kèm mô tả nhận diện bằng tiếng Việt bình dân cho người cao tuổi. Bấm để xem chi tiết / đổi ảnh.
export default function MedicationTile({ medication, onClick, badge, accent }) {
  const injection = isInjection(medication);
  const Icon = injection ? Syringe : Pill;
  const [visual, setVisual] = useState(() => getSavedDrugVisual(medication?.name));
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!medication?.name) return;
    setCandidateIdx(0);
    setAllFailed(false);
    setVisual(getSavedDrugVisual(medication.name));
    fetchAndCacheDrugVisual(medication.name).then((res) => {
      if (active && res) {
        setVisual(res);
        setCandidateIdx(0);
        setAllFailed(false);
      }
    });

    const onUpdate = () => {
      if (active) {
        setVisual(getSavedDrugVisual(medication.name));
        setCandidateIdx(0);
        setAllFailed(false);
      }
    };
    window.addEventListener('drugVisualUpdated', onUpdate);
    return () => {
      active = false;
      window.removeEventListener('drugVisualUpdated', onUpdate);
    };
  }, [medication?.name]);

  const candidates = visual?.candidates?.length
    ? visual.candidates
    : visual?.imageUrl
    ? [visual.imageUrl]
    : [];
  const activeImgUrl = !allFailed ? (candidates[candidateIdx] || visual?.imageUrl) : null;

  const handleImgError = () => {
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx((idx) => idx + 1);
    } else {
      setAllFailed(true);
    }
  };

  return (
    <button
      type="button"
      className={styles.tile}
      onClick={onClick}
      style={accent ? { '--tile-accent': accent.c, '--tile-soft': accent.soft, '--tile-border': accent.c } : undefined}
      aria-label={`${medication.name}${injection ? ' (thuốc tiêm)' : ''} - xem chi tiết`}
    >
      {activeImgUrl ? (
        <div className={styles.photoWrap}>
          <img
            src={activeImgUrl}
            alt={medication.name}
            className={styles.photoImg}
            onError={handleImgError}
          />
          <span className={styles.photoTag}>
            {visual.isCustomUpload ? '📷 Ảnh chụp' : '🌐 Ảnh hộp thuốc'}
          </span>
        </div>
      ) : (
        <span className={`${styles.icon} ${injection ? styles.iconInjection : ''}`}>
          <Icon size={34} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      <span className={styles.name}>{medication.name}</span>
      {medication.dosage && <span className={styles.dosage}>{medication.dosage}</span>}
      {visual?.commonName && (
        <span className={styles.commonName}>{visual.commonName}</span>
      )}
      {badge && <span className={styles.badge}>{badge}</span>}
    </button>
  );
}

export function MedicationGrid({ children }) {
  return <div className={styles.grid}>{children}</div>;
}

