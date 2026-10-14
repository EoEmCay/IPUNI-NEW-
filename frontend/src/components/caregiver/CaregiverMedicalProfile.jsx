import { HeartHandshake, Stethoscope, Calendar, Clock, AlertCircle, FileText, Phone } from 'lucide-react';
import useRoleModeStore from '../../store/roleModeStore';
import styles from './CaregiverMedicalProfile.module.css';

export default function CaregiverMedicalProfile() {
  const caregiverData = useRoleModeStore((s) => s.caregiverData);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTop}>
          <span className={styles.roleTag}>
            <HeartHandshake size={14} /> BỆNH ÁN
          </span>
        </div>

        <div>
          <h1 className={styles.title}>Cụ Nguyễn Văn An (72 tuổi)</h1>
          <p className={styles.subtitle}>
            Bệnh án gia đình · BHYT: GD-79-02-1488 · Điều trị ngoại trú tại nhà
          </p>
        </div>
      </header>

      {/* KHỐI 1: NGƯỜI CHĂM SÓC HIỆN TẠI (HỘ LÝ) */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Stethoscope size={18} color="#d97706" />
            Người Chăm Sóc Hiện Tại
          </h2>
          <span className={styles.sectionBadge}>Hộ lý ca trực</span>
        </div>

        <div className={styles.caregiverProfile}>
          <div className={styles.avatarCircle}>Lan</div>
          <div className={styles.caregiverDetails}>
            <h3 className={styles.caregiverName}>Cô Lan</h3>
            <p className={styles.caregiverRole}>Hộ lý gia đình · Chứng chỉ Điều dưỡng Y tế</p>
            <p className={styles.caregiverMeta}>SĐT liên hệ: 0912 345 678 · Trực ca ngày (07:00 - 19:00)</p>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Phạm vi phụ trách ca trực:</span>
            <span className={styles.infoValue}>
              Chia & cho cụ uống thuốc đúng cữ, chụp ảnh xác nhận, đo đường huyết, chụp ảnh máy đo huyết áp, hỗ trợ dinh dưỡng & giấc ngủ.
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Người bảo trợ / Giám sát từ xa:</span>
            <span className={styles.infoValue}>
              Chị Trinh (Con trưởng - 0908 123 456)
            </span>
          </div>
        </div>
      </section>

      {/* KHỐI 2: THÔNG TIN BỆNH NỀN CỦA CỤ */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <AlertCircle size={18} color="#dc2626" />
            Thông Tin Bệnh Nền Của Cụ
          </h2>
          <span className={styles.sectionBadge}>Y lệnh bác sĩ</span>
        </div>

        <div className={styles.diseaseList}>
          {/* Bệnh nền 1: Đái tháo đường */}
          <div className={styles.diseaseCard}>
            <div className={styles.diseaseHead}>
              <h3 className={styles.diseaseTitle}>
                🩸 Đái tháo đường Type 2
              </h3>
              <span className={styles.diseaseBadge}>Mãn tính (10 năm)</span>
            </div>
            <p className={styles.diseaseText}>
              • <strong>Phác đồ:</strong> Metformin 500mg (sau ăn sáng & tối) + Vildagliptin 50mg (sáng).
              <br />• <strong>Mục tiêu:</strong> Đường huyết lúc đói: 4.4 - 7.0 mmol/L, sau ăn 2h: &lt; 10.0 mmol/L.
            </p>
            <div className={styles.diseaseNote}>
              <strong>Lưu ý hộ lý:</strong> Cụ dễ bị hạ đường huyết lúc 10:00 sáng nếu ăn sáng ít. Nếu đường huyết &lt; 3.9 mmol/L, cho uống ngay 1/2 cốc nước đường theo quy tắc 15-15.
            </div>
          </div>

          {/* Bệnh nền 2: Tăng huyết áp */}
          <div className={styles.diseaseCard}>
            <div className={styles.diseaseHead}>
              <h3 className={styles.diseaseTitle}>
                Tăng huyết áp độ 2
              </h3>
              <span className={styles.diseaseBadgeGood}>Kiểm soát ổn định</span>
            </div>
            <p className={styles.diseaseText}>
              • <strong>Phác đồ:</strong> Amlodipine 5mg (uống 1 viên duy nhất lúc 08:00 sáng).
              <br />• <strong>Huyết áp mục tiêu:</strong> 120/75 mmHg đến 130/80 mmHg.
            </p>
            <div className={styles.diseaseNote}>
              <strong>Lưu ý hộ lý:</strong> Đo huyết áp khi cụ đã ngồi nghỉ ngơi tĩnh 15 phút. Chụp ảnh màn hình máy đo để gửi báo cáo.
            </div>
          </div>

          {/* Dinh dưỡng & Dị ứng */}
          <div className={styles.diseaseCard}>
            <div className={styles.diseaseHead}>
              <h3 className={styles.diseaseTitle}>
                Chế độ dinh dưỡng & Dị ứng
              </h3>
              <span className={styles.diseaseBadgeGood}>An toàn</span>
            </div>
            <p className={styles.diseaseText}>
              • <strong>Dinh dưỡng:</strong> Ăn nhạt giảm muối (&lt; 5g/ngày), tinh bột hấp thu chậm (yến mạch, gạo lứt), uống 1.5 - 2 lít nước ấm.
              <br />• <strong>Dị ứng:</strong> Không có tiền sử dị ứng thuốc hay thực phẩm.
            </p>
          </div>
        </div>
      </section>

      {/* KHỐI 3: LỊCH SỬ KHÁM & KẾ HOẠCH TÁI KHÁM */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Calendar size={18} color="#0284c7" />
            Lịch Sử Khám & Kế Hoạch Tái Khám
          </h2>
          <span className={styles.sectionBadge}>BV Đại học Y Dược</span>
        </div>

        {/* Lịch tái khám sắp tới */}
        <div className={styles.revisitCard}>
          <div className={styles.visitTop}>
            <h3 className={styles.revisitTitle}>
              Lịch Tái Khám Sắp Tới
            </h3>
            <span className={styles.revisitDateBadge}>25/10/2026 (Còn 12 ngày)</span>
          </div>
          <p className={styles.doctorText}>
            Phòng khám 102 - Khoa Nội tiết, Bệnh viện Đại học Y Dược TP.HCM
          </p>
          <div className={styles.diseaseNote} style={{ background: '#ffffff', borderColor: '#f59e0b' }}>
            <strong>Dặn dò Hộ lý:</strong> Cụ cần nhịn ăn sáng từ 22:00 hôm trước để làm xét nghiệm máu (HbA1c, chức năng thận). Chuẩn bị sẵn sổ y bạ và đơn thuốc cũ.
          </div>
        </div>

        {/* Đợt khám gần nhất */}
        <div className={styles.visitCard}>
          <div className={styles.visitTop}>
            <h3 className={styles.visitHospital}>Đợt Khám Gần Nhất (10/10/2026)</h3>
            <span className={styles.visitDate}>10/10/2026</span>
          </div>
          <p className={styles.doctorText}>
            Bác sĩ điều trị: <strong>BS.CK2 Trần Hữu Phước</strong>
          </p>
          <p className={styles.visitSummary}>
            <strong>Kết luận bác sĩ:</strong> Đường huyết đói 6.1 mmol/L, huyết áp 124/78 mmHg. Chỉ số đáp ứng tốt với phác đồ hiện tại. Tiếp tục duy trì đơn thuốc và kiểm tra lại sau 15 ngày.
          </p>
        </div>
      </section>
    </div>
  );
}
