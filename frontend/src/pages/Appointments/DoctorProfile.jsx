import { useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, Stethoscope, Calendar, NotebookPen } from 'lucide-react';
import { formatDateVN } from '../../utils/date';
import styles from './DoctorProfile.module.css';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const doc = state?.doctor || {
    name: decodeURIComponent(id || 'Bác sĩ DIA+'),
    title: 'Chuyên gia',
    specialty: 'Đái tháo đường & Dinh dưỡng',
    hospital: 'DIA+ Health Center',
    notes: 'Tiếp tục theo dõi đường huyết đói hàng ngày, uống thuốc đúng giờ sau bữa ăn.'
  };

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.simpleHeader}>
        <button onClick={handleBack} className={styles.backBtn}>
          <ChevronLeft size={22} />
        </button>
        <span className={styles.navTitle}>Thông tin Bác sĩ</span>
      </div>

      <div className={styles.simpleCard}>
        <div className={styles.nameHeader}>
          <h1 className={styles.docName}>{doc.title} {doc.name}</h1>
          <p className={styles.docSub}>{doc.specialty} | {doc.hospital}</p>
        </div>

        <div className={styles.notesBox}>
          <div className={styles.notesLabel}>
            <Stethoscope size={18} />
            <span>Lời dặn của Bác sĩ (Chỉ dẫn điều trị)</span>
          </div>
          <p className={styles.notesText}>
            {doc.notes || 'Theo dõi đường huyết định kỳ, uống thuốc đúng liều và tuân thủ chế độ ăn giảm bớt tinh bột.'}
          </p>
        </div>

        {doc.scheduled_at && (
          <div className={styles.notesBox}>
            <div className={styles.notesLabel}>
              <Calendar size={18} />
              <span>Ngày Tái Khám</span>
            </div>
            <p className={styles.notesText}>{formatDateVN(doc.scheduled_at)}</p>
          </div>
        )}

        {doc.extraNote && (
          <div className={styles.notesBox}>
            <div className={styles.notesLabel}>
              <NotebookPen size={18} />
              <span>Dặn Dò Thêm</span>
            </div>
            <p className={styles.notesText}>{doc.extraNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
