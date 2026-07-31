import { useState, useRef } from 'react';
import { useT } from '../../hooks/useT';
import styles from './TermsModal.module.css';

const TERMS_CONTENT = `CHÀO MỪNG BẠN ĐẾN VỚI DIA+
Bằng việc sử dụng ứng dụng giải pháp y tế thông minh DIA+, bạn đồng ý với các điều khoản sau:

1. MỤC ĐÍCH SỬ DỤNG
DIA+ cung cấp công cụ quản lý hồ sơ y tế, nhắc nhở uống thuốc và gợi ý dinh dưỡng/vận động dựa trên Trí tuệ nhân tạo (AI). Mọi thông tin từ DIA+ chỉ mang tính chất tham khảo, hỗ trợ quá trình điều trị và KHÔNG thay thế cho các chẩn đoán, quyết định điều trị trực tiếp từ bác sĩ chuyên khoa.

2. TRÁCH NHIỆM CỦA NGƯỜI DÙNG
Bạn chịu trách nhiệm về tính chính xác của các thông tin cá nhân và hồ sơ bệnh án, toa thuốc được tải lên hệ thống. Không sử dụng ứng dụng vào mục đích vi phạm pháp luật.

3. QUYỀN VÀ NGHĨA VỤ CỦA DIA+
DIA+ cam kết duy trì hệ thống hoạt động ổn định. Chúng tôi có quyền ngừng cung cấp dịch vụ hoặc khóa tài khoản nếu phát hiện hành vi gian lận, phá hoại hoặc vi phạm điều khoản sử dụng.

4. THANH TOÁN
Việc thanh toán cho gói dịch vụ Pro hoặc các dịch vụ trả phí khác sẽ tuân thủ nghiêm ngặt theo quy định của nhà cung cấp cổng thanh toán đối tác.`;

const PRIVACY_CONTENT = `CHÍNH SÁCH BẢO MẬT TẠI DIA+
Chúng tôi coi trọng và cam kết bảo vệ tuyệt đối quyền riêng tư và dữ liệu y tế của bạn.

1. THU THẬP DỮ LIỆU
DIA+ chỉ thu thập các thông tin thực sự cần thiết (Họ tên, Email, Số điện thoại, Hồ sơ y tế, toa thuốc, chỉ số sức khỏe) để phục vụ cho các tính năng cốt lõi và cá nhân hóa trải nghiệm chăm sóc sức khỏe của riêng bạn.

2. BẢO MẬT & MÃ HÓA
Dữ liệu của bạn được mã hóa an toàn trên hệ thống máy chủ đám mây với tiêu chuẩn bảo mật cao. Chỉ có bạn và những bác sĩ/phòng khám được bạn ủy quyền mới có quyền truy cập vào chi tiết hồ sơ bệnh án.

3. KHÔNG CHIA SẺ DỮ LIỆU
DIA+ tuyệt đối KHÔNG BÁN, trao đổi hoặc cung cấp thông tin cá nhân, tình trạng bệnh lý của bạn cho bất kỳ bên thứ ba hay tổ chức quảng cáo nào nếu không có sự đồng thuận rõ ràng bằng văn bản/xác nhận điện tử từ bạn.

4. QUYỀN KIỂM SOÁT CỦA BẠN
Bạn có toàn quyền yêu cầu trích xuất, chỉnh sửa hoặc xóa vĩnh viễn toàn bộ dữ liệu cá nhân của mình khỏi hệ thống máy chủ của DIA+ bất cứ lúc nào.`;

export default function TermsModal({ onComplete }) {
  const t = useT();
  const [step, setStep] = useState(1); // 1: Terms, 2: Privacy
  const [canProceed, setCanProceed] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 5;
    if (bottom && !canProceed) {
      setCanProceed(true);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
      setCanProceed(false); // Reset cho phần 2 (không bắt cuộn hết phần 2, chỉ bắt tick)
    } else {
      onComplete();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {step === 1 ? t.terms.titleTerms : t.terms.titlePrivacy}
          </h2>
        </div>
        
        <div className={styles.content} onScroll={step === 1 ? handleScroll : undefined}>
          <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>
            {step === 1 ? t.terms.descTerms : t.terms.descPrivacy}
          </p>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {step === 1 ? TERMS_CONTENT : PRIVACY_CONTENT}
          </div>
        </div>
        
        <div className={styles.footer}>
          {step === 2 && (
            <label className={styles.checkboxWrap}>
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className={styles.checkboxText}>
                {t.terms.agreeText}
              </span>
            </label>
          )}
          
          <button 
            className={styles.btn} 
            disabled={step === 1 ? !canProceed : !agreed}
            onClick={nextStep}
          >
            {step === 1 ? t.terms.continue : t.terms.complete}
          </button>
        </div>
      </div>
    </div>
  );
}
