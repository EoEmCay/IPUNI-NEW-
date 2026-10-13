import { useState, useEffect } from 'react';
import { Clock, Pill, Image as ImageIcon, X, Trash2, Activity, ArrowLeft } from 'lucide-react';
import { scanHistoryService } from '../services/scanHistory.service';
import { useT } from '../hooks/useT';
import styles from './ScanHistoryPage.module.css';
import PageHeader from '../components/common/PageHeader';

export default function ScanHistoryPage() {
  const t = useT();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);

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

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(t.scanHistory.deleteConfirm || 'Bạn có chắc chắn muốn xóa đơn thuốc này không?')) {
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
      <PageHeader title={t.scanHistory.title} subtitle={t.scanHistory.subtitle} />

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
              <img src={scan.image} alt="Original Image" className={styles.cardImage} />
              <div className={styles.cardContent}>
                <div className={styles.cardDate}>
                  <Clock size={12} /> {formatDate(scan.date)}
                </div>
                <h3 className={styles.cardTitle}>
                  {scan.result?.isLabReport 
                    ? `Phiếu xét nghiệm (${scan.result?.hospitalName || 'Phòng khám'})`
                    : (scan.result?.doctorName ? `${t.scanHistory.doctorPrefix} ${scan.result.doctorName}` : t.scanHistory.unknownDoctor)}
                </h3>
                <div className={styles.cardMeta}>
                  <span className={styles.metaItem}>
                    {scan.result?.isLabReport ? (
                      <><Activity size={14} /> Tình trạng: {scan.result?.labReportAdvice?.includes('tốt') ? 'Tốt' : 'Cần lưu ý'}</>
                    ) : (
                      <><Pill size={14} /> {scan.result?.medications?.length || 0} {t.scanHistory.medCount}</>
                    )}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.cardDeleteBtn}
                onClick={(e) => handleDelete(scan.id, e)}
                title="Xóa đơn thuốc này"
                aria-label="Xóa đơn thuốc này"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedScan && (
        <div className={styles.modalOverlay} onClick={() => setSelectedScan(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setSelectedScan(null)}
                title="Thoát ra danh sách"
              >
                <ArrowLeft size={18} />
                <span>Thoát ra</span>
              </button>

              <h2 className={styles.modalTitle}>
                {selectedScan.result?.isLabReport ? 'Chi tiết xét nghiệm' : t.scanHistory.detailTitle}
              </h2>

              <button 
                type="button"
                className={styles.trashBtn} 
                onClick={(e) => handleDelete(selectedScan.id, e)}
                title="Xóa đơn thuốc này"
              >
                <Trash2 size={16} />
                <span>Xóa đơn</span>
              </button>
            </div>

            <div className={styles.modalBody}>
              <img src={selectedScan.image} alt="Original Image" className={styles.modalImage} />
              
              <h3>{selectedScan.result?.isLabReport ? 'Kết quả chẩn đoán AI' : t.scanHistory.resultTitle}</h3>
              {selectedScan.result?.isLabReport ? (
                <div className={styles.rejectBanner} style={{ backgroundColor: 'rgba(27, 95, 166, 0.05)', borderColor: 'var(--color-primary)', padding: '16px', borderRadius: '12px', marginTop: '12px' }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 17 }}>
                    {selectedScan.result.labReportAdvice}
                  </p>
                </div>
              ) : (
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
              )}

              {/* Nút thao tác nhanh phía dưới để người dùng dễ bấm */}
              <div className={styles.modalBottomActions}>
                <button
                  type="button"
                  className={styles.bottomBackBtn}
                  onClick={() => setSelectedScan(null)}
                >
                  <ArrowLeft size={16} /> Thoát ra danh sách
                </button>
                <button
                  type="button"
                  className={styles.bottomDeleteBtn}
                  onClick={(e) => handleDelete(selectedScan.id, e)}
                >
                  <Trash2 size={16} /> Xóa đơn thuốc này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
