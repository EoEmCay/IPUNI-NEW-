import { useState } from 'react';
import { Scale, ShieldCheck, Heart, UserCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import styles from './LegalModal.module.css';

const TABS = [
  { key: 'patient', label: 'Bệnh Nhân', icon: Heart },
  { key: 'supervisor', label: 'Người Giám Hộ', icon: UserCheck },
  { key: 'privacy', label: 'Bảo Mật Y Tế & Miễn Trừ', icon: ShieldCheck },
];

export default function LegalModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('patient');

  return (
    <Modal title="Pháp Lý & Quy Định Sử Dụng" onClose={onClose}>
      <div className={styles.container}>
        {/* Thanh chọn Tab cho 2 đối tượng & Bảo mật */}
        <div className={styles.tabBar} role="tablist">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* NỘI DUNG TAB 1: QUY ĐỊNH DÀNH CHO BỆNH NHÂN */}
        {activeTab === 'patient' && (
          <div className={styles.contentWrap}>
            <div className={styles.bannerInfo}>
              <Heart size={20} color="#e11d48" />
              <div>
                <h3 className={styles.bannerTitle}>Quyền Lợi & Bảo Vệ Người Bệnh</h3>
                <p className={styles.bannerSub}>Quy chuẩn y tế bảo vệ quyền tự chủ của người cao tuổi</p>
              </div>
            </div>

            <article className={styles.legalSection}>
              <h4 className={styles.sectionHeading}>1. Quyền sở hữu dữ liệu sức khỏe cá nhân</h4>
              <p className={styles.paragraph}>
                Mọi chỉ số đường huyết, huyết áp, đơn thuốc và lịch sử uống thuốc được lưu trữ trên DIA+ là tài sản y tế thuộc quyền sở hữu độc quyền của người bệnh. Người bệnh có toàn quyền xem, xuất sổ tay y tế dạng PDF hoặc xóa dữ liệu bất kỳ lúc nào.
              </p>

              <h4 className={styles.sectionHeading}>2. Quyền cấp và hủy quyền giám hộ</h4>
              <p className={styles.paragraph}>
                Người bệnh có quyền chủ động chấp thuận hoặc thu hồi quyền kết nối của người giám sát (con cái, người thân) thông qua hệ thống mã ghép nối DIA+. Khi hủy kết nối, người giám hộ sẽ không thể tiếp tục xem chỉ số hay nhận thông báo.
              </p>

              <h4 className={styles.sectionHeading}>3. Quyền riêng tư và thông báo từ xa</h4>
              <p className={styles.paragraph}>
                Tính năng chuông nhắc thuốc từ xa và tin nhắn âm thanh của người thân chỉ được kích hoạt theo khung giờ uống thuốc đã thiết lập trên đơn, bảo đảm không làm gián đoạn giấc ngủ hay sinh hoạt của người cao tuổi.
              </p>
            </article>
          </div>
        )}

        {/* NỘI DUNG TAB 2: QUY ĐỊNH DÀNH CHO NGƯỜI GIÁM HỘ */}
        {activeTab === 'supervisor' && (
          <div className={styles.contentWrap}>
            <div className={styles.bannerInfo} style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
              <UserCheck size={20} color="#0284c7" />
              <div>
                <h3 className={styles.bannerTitle} style={{ color: '#0369a1' }}>
                  Trách Nhiệm & Giới Hạn Của Người Giám Hộ
                </h3>
                <p className={styles.bannerSub}>Quy tắc đạo đức và pháp lý dành cho con cái / người chăm sóc</p>
              </div>
            </div>

            <article className={styles.legalSection}>
              <h4 className={styles.sectionHeading}>1. Trách nhiệm bảo mật thông tin người thân</h4>
              <p className={styles.paragraph}>
                Người giám hộ cam kết không chia sẻ dữ liệu bệnh án, đơn thuốc hay thông tin định danh của người thân cho bất kỳ bên thứ ba nào khi chưa có sự đồng ý rõ ràng.
              </p>

              <h4 className={styles.sectionHeading}>2. Phạm vi can thiệp y khoa</h4>
              <p className={styles.paragraph}>
                Người giám sát đóng vai trò hỗ trợ nhắc nhở tuân thủ điều trị. Người giám sát <strong>không được tự ý thay đổi liều lượng hoặc loại thuốc</strong> trong đơn thuốc của người bệnh nếu không có sự chỉ định trực tiếp từ bác sĩ chuyên khoa phụ trách.
              </p>

              <h4 className={styles.sectionHeading}>3. Kênh cảnh báo khẩn cấp (Zalo / Telegram)</h4>
              <p className={styles.paragraph}>
                Khi nhận thông báo trễ cữ thuốc hoặc chỉ số đường huyết bất thường từ DIA+, người giám hộ có trách nhiệm liên hệ trực tiếp với người thân để kiểm tra tình trạng thực tế trước khi thực hiện các bước can thiệp y tế.
              </p>
            </article>
          </div>
        )}

        {/* NỘI DUNG TAB 3: BẢO MẬT DỮ LIỆU & MIỄN TRỪ TRÁCH NHIỆM */}
        {activeTab === 'privacy' && (
          <div className={styles.contentWrap}>
            <div className={styles.bannerInfo} style={{ background: '#fefce8', borderColor: '#fef08a' }}>
              <AlertTriangle size={20} color="#ca8a04" />
              <div>
                <h3 className={styles.bannerTitle} style={{ color: '#854d0e' }}>
                  Bảo Mật Dữ Liệu Y Tế & Tuyên Bố Y Khoa
                </h3>
                <p className={styles.bannerSub}>Tuân thủ quy định pháp luật Việt Nam & Quốc tế</p>
              </div>
            </div>

            <article className={styles.legalSection}>
              <h4 className={styles.sectionHeading}>1. Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân</h4>
              <p className={styles.paragraph}>
                DIA+ áp dụng chuẩn mã hóa bảo mật cấp cao (TLS 1.3, AES-256) cho toàn bộ dữ liệu truyền tải giữa thiết bị người bệnh, máy chủ và người giám sát. Dữ liệu sức khỏe nhạy cảm được cách ly và tuân thủ nghiêm ngặt quy định pháp luật Việt Nam.
              </p>

              <h4 className={styles.sectionHeading}>2. Tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer)</h4>
              <div className={styles.disclaimerBox}>
                <p className={styles.disclaimerText}>
                  ⚠️ <strong>Lưu ý quan trọng:</strong> Ứng dụng DIA+ là công cụ công nghệ hỗ trợ quản lý tuân thủ điều trị và nhắc nhở uống thuốc. DIA+ không đưa ra chẩn đoán, không kê đơn và không thay thế cho lời khuyên, phác đồ điều trị của bác sĩ hoặc cơ sở y tế có thẩm quyền. Trong trường hợp xảy ra biến chứng khẩn cấp, vui lòng gọi cấp cứu 115 hoặc đưa bệnh nhân đến bệnh viện gần nhất ngay lập tức.
                </p>
              </div>

              <h4 className={styles.sectionHeading}>3. Cập nhật và hiệu lực điều khoản</h4>
              <p className={styles.paragraph}>
                Quy định này có hiệu lực từ ngày 01/01/2026 và áp dụng đồng nhất cho tất cả các tài khoản Bệnh nhân và Người giám hộ trên toàn bộ hệ thống DIA+.
              </p>
            </article>
          </div>
        )}

        <button type="button" className={styles.confirmBtn} onClick={onClose}>
          Tôi đã đọc và hiểu rõ quy định
        </button>
      </div>
    </Modal>
  );
}
