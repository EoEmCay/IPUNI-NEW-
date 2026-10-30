import { HeartHandshake, Stethoscope, FileText } from 'lucide-react';
import useRoleModeStore from '../../store/roleModeStore';
import styles from './CaregiverMedicalProfile.module.css';

// Hiển thị đúng những gì đã nhập. DIA+ không tự điền bệnh án, phác đồ hay lịch khám:
// thông tin y tế chỉ có khi người bệnh liên kết thật với tài khoản này.
export default function CaregiverMedicalProfile() {
  const caregiverData = useRoleModeStore((s) => s.caregiverData);
  const alertPrefs = useRoleModeStore((s) => s.alertPrefs);

  const patientName = caregiverData?.patientName?.trim();
  const nurseName = caregiverData?.nurseName?.trim();
  const nursePhone = caregiverData?.caregiverPhone?.trim();
  const supervisor = [alertPrefs?.supervisorName, alertPrefs?.supervisorPhone].filter(Boolean).join(' - ');

  return (
    <div className={styles.container}>
      <header className={styles.headerCard}>
        <div className={styles.headerTop}>
          <span className={styles.roleTag}>
            <HeartHandshake size={14} /> BỆNH ÁN
          </span>
        </div>
        <div>
          <h1 className={styles.title}>{patientName || 'Chưa chọn người bệnh'}</h1>
          <p className={styles.subtitle}>Hồ sơ người bệnh bạn đang chăm sóc</p>
        </div>
      </header>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Stethoscope size={18} color="#d97706" />
            Người Chăm Sóc Hiện Tại
          </h2>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Họ tên:</span>
            <span className={styles.infoValue}>{nurseName || 'Chưa cập nhật'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Số điện thoại liên hệ:</span>
            <span className={styles.infoValue}>{nursePhone || 'Chưa cập nhật'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Người giám sát từ xa:</span>
            <span className={styles.infoValue}>{supervisor || 'Chưa cập nhật'}</span>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <FileText size={18} color="#0284c7" />
            Bệnh nền, đơn thuốc, lịch tái khám
          </h2>
        </div>
        <p className={styles.diseaseText}>
          Chưa có thông tin. Đơn thuốc và lịch tái khám sẽ hiện ở đây khi người bệnh liên kết với tài khoản của bạn.
          Mọi chỉ định về thuốc và đường huyết phải theo đúng lời dặn của bác sĩ điều trị.
        </p>
      </section>
    </div>
  );
}
