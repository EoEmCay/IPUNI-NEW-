import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Pill, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { scanHistoryService } from '../services/scanHistory.service';
import { useT } from '../hooks/useT';
import styles from './ScanHistoryPage.module.css';

export default function ScanHistoryPage() {
  const t = useT();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await scanHistoryService.getHistory();
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(t.scanHistory.deleteConfirm)) {
      await scanHistoryService.deleteScan(id);
      loadHistory();
      if (selectedScan && selectedScan.id === id) {
        setSelectedScan(null);
      }
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/scan')}>
            <ChevronLeft size={24} />
          </button>
          <h1>{t.scanHistory.title}</h1>
        </div>
        <p>{t.scanHistory.subtitle}</p>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>
          <p>{t.scanHistory.loading}</p>
        </div>
      ) : history.length === 0 ? (
        <div className={styles.emptyState}>
          <ImageIcon size={48} />
          <p>{t.scanHistory.empty}</p>
        </div>
      ) : (
        <div className={styles.historyList}>
          {history.map((scan) => (
            <div key={scan.id} className={styles.historyCard} onClick={() => setSelectedScan(scan)}>
              <img src={scan.image} alt="Đơn thuốc" className={styles.cardImage} />
              <div className={styles.cardContent}>
                <div className={styles.cardDate}>
                  <Clock size={12} /> {formatDate(scan.date)}
                </div>
                <h3 className={styles.cardTitle}>
                  {scan.result?.doctorName ? `${t.scanHistory.doctorPrefix} ${scan.result.doctorName}` : t.scanHistory.unknownDoctor}
                </h3>
                <div className={styles.cardMeta}>
                  <span className={styles.metaItem}>
                    <Pill size={14} /> {scan.result?.medications?.length || 0} {t.scanHistory.medCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedScan && (
        <div className={styles.modalOverlay} onClick={() => setSelectedScan(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{t.scanHistory.detailTitle}</h2>
              <div className={styles.modalHeaderActions}>
                <button 
                  className={styles.trashBtn} 
                  onClick={() => handleDelete(selectedScan.id)}
                  title="Xóa"
                >
                  <Trash2 size={18} />
                </button>
                <button className={styles.closeBtn} onClick={() => setSelectedScan(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className={styles.modalBody}>
              <img src={selectedScan.image} alt="Original Prescription" className={styles.modalImage} />
              
              <h3>{t.scanHistory.resultTitle}</h3>
              <div className={styles.medList}>
                {selectedScan.result?.medications?.map((med, idx) => (
                  <div key={idx} className={styles.medItem}>
                    <h4 className={styles.medItemName}>{med.name}</h4>
                    <div className={styles.medItemMeta}>
                      {med.dosage && <span>{t.scanHistory.dosage} {med.dosage}</span>}
                      {med.instructions && <span>{t.scanHistory.instructions} {med.instructions}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
