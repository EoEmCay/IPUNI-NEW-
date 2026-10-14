import { useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  Activity,
  Heart,
  Pill,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import styles from './DoctorA4ReportModal.module.css';

export default function DoctorA4ReportModal({ isOpen, onClose, user, medications = [] }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const patientName = (user?.name || 'NGUYỄN VĂN AN').toUpperCase();
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Thanh điều khiển trên cùng (Ẩn khi in ấn) */}
      <div className={styles.topBar}>
        <div className={styles.topBarTitle}>
          <span className={styles.topBarIcon}>
            <Stethoscope size={22} />
          </span>
          <span>Bản in A4 Báo cáo Y khoa cho Bác sĩ (Kèm thông số kỹ thuật)</span>
        </div>
        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.printBtn}
            onClick={() => window.print()}
            title="In ra giấy A4 hoặc lưu file PDF (Ctrl + P)"
          >
            <Printer size={16} />
            <span>In tờ A4 ngay (Ctrl + P)</span>
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Đóng bản xem trước"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* TỜ GIẤY A4 CHUẨN Y KHOA LÂM SÀNG */}
      <div className={styles.a4Sheet} id="medical-a4-sheet">
        {/* HEADER HÀNH CHÍNH */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.brandWrap}>
              <div className={styles.brandLogo}>
                <span>DIAPLUS.VN</span>
                <span className={styles.brandBadge}>HỆ THỐNG Y TẾ SỐ</span>
              </div>
              <span className={styles.brandSub}>
                Nền tảng Giám sát Điều trị Đái tháo đường & Tim mạch tại nhà
              </span>
            </div>
            <div className={styles.docMeta}>
              <div>Mã hồ sơ (PID): <strong className={styles.docId}>DP-2026-8892</strong></div>
              <div>Ngày xuất báo cáo: <strong>{currentDate}</strong></div>
              <div>Khoảng thời gian: <strong>30 ngày gần nhất</strong></div>
            </div>
          </div>

          <div className={styles.reportTitle}>
            <h1>BẢNG TỔNG HỢP THEO DÕI ĐIỀU TRỊ ĐÁI THÁO ĐƯỜNG TẠI NHÀ</h1>
            <p className={styles.reportTitleSub}>
              (AMBULATORY GLUCOSE PROFILE & MEDICATION ADHERENCE CLINICAL REPORT)
            </p>
          </div>
        </header>

        {/* THÔNG TIN HÀNH CHÍNH BỆNH NHÂN */}
        <div className={styles.patientInfoBox}>
          <div className={styles.patientGrid}>
            <div className={styles.patientItem}>
              <label>Họ và tên:</label>
              <strong>{patientName}</strong>
            </div>
            <div className={styles.patientItem}>
              <label>Năm sinh / Tuổi:</label>
              <span>1954 (72 tuổi)</span>
            </div>
            <div className={styles.patientItem}>
              <label>Giới tính:</label>
              <span>Nam</span>
            </div>

            <div className={styles.patientItem}>
              <label>SĐT Bệnh nhân:</label>
              <span>0912 345 678</span>
            </div>
            <div className={styles.patientItem}>
              <label>Người giám sát (Con):</label>
              <span>Nguyễn Thị Trinh (0908 123 456)</span>
            </div>
            <div className={styles.patientItem}>
              <label>Bác sĩ theo dõi:</label>
              <span>BS.CKII Trần Hoài Nam</span>
            </div>

            <div className={styles.diagnosisRow}>
              <div className={styles.patientItem}>
                <label>Chẩn đoán xác định:</label>
                <strong>
                  Đái tháo đường Type 2 (E11.9) - Tăng huyết áp nguyên phát (I10) - Rối loạn lipid máu hỗn hợp (E78.2)
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* KHỐI 1: MỨC ĐỘ TUÂN THỦ UỐNG THUỐC TẠI NHÀ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Pill size={15} color="#0284c7" />
            <h2 className={styles.sectionTitle}>
              1. Mức độ tuân thủ uống thuốc tại nhà (Medication Adherence - PDC)
            </h2>
            <span className={styles.sectionBadge}>Chỉ tiêu ADA: ≥ 80%</span>
          </div>

          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>TỈ LỆ TUÂN THỦ TỔNG</div>
              <div className={styles.kpiValue}>94.2%</div>
              <div className={styles.kpiSub}>Xếp loại: Rất tốt (Đạt chuẩn)</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
              <div className={styles.kpiLabel}>CỮ UỐNG ĐÚNG GIỜ</div>
              <div className={styles.kpiValue}>108 / 120</div>
              <div className={styles.kpiSub}>Đạt 90.0% tổng cữ chỉ định</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiWarning}`}>
              <div className={styles.kpiLabel}>CỮ UỐNG TRỄ (&gt;1H)</div>
              <div className={styles.kpiValue}>5 cữ</div>
              <div className={styles.kpiSub}>Chiếm 4.2% (Đã bù liều)</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiDanger}`}>
              <div className={styles.kpiLabel}>SỐ CỮ BỎ QUÊN THUỐC</div>
              <div className={styles.kpiValue}>7 cữ</div>
              <div className={styles.kpiSub}>Chiếm 5.8% (Cần nhắc nhở)</div>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Thời gian</th>
                <th style={{ width: '22%' }}>Loại thuốc & Cữ</th>
                <th style={{ width: '18%' }}>Tình trạng ghi nhận</th>
                <th>Lý do & Ghi chú từ người nhà / Hộ lý</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>11/10/2026 (11:30)</td>
                <td>Diamicron MR 30mg (Cữ trưa)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillDanger}`}>Bỏ cữ</span></td>
                <td>Đi khám mắt tại bệnh viện, quên mang theo thuốc vỉ trong túi xách.</td>
              </tr>
              <tr>
                <td>05/10/2026 (20:00)</td>
                <td>Glucophage XR 1000mg (Cữ tối)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillWarning}`}>Uống trễ</span></td>
                <td>Cụ ngủ quên sau bữa tối, con gái gọi chuông gia đình, đã uống bù lúc 22:30.</td>
              </tr>
              <tr>
                <td>28/09/2026 (07:30)</td>
                <td>Amlor 5mg + Diamicron 30mg</td>
                <td><span className={`${styles.pillBadge} ${styles.pillWarning}`}>Uống trễ</span></td>
                <td>Cụ đi tập thể dục buổi sáng về trễ, uống sau ăn sáng 2 tiếng.</td>
              </tr>
              <tr>
                <td>22/09/2026 (19:30)</td>
                <td>Glucophage XR 1000mg (Cữ tối)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillDanger}`}>Bỏ cữ</span></td>
                <td>Đi ăn tiệc đầy tháng họ hàng về muộn, không uống cữ tối.</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* KHỐI 2: KIỂM SOÁT ĐƯỜNG HUYẾT & PHÂN TÍCH AGP */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Activity size={15} color="#0284c7" />
            <h2 className={styles.sectionTitle}>
              2. Kiểm soát đường huyết &amp; Phân tích AGP (Ambulatory Glucose Profile)
            </h2>
            <span className={styles.sectionBadge}>Tổng số 96 lần đo / 30 ngày</span>
          </div>

          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>ĐƯỜNG HUYẾT TRUNG BÌNH (eAG)</div>
              <div className={styles.kpiValue}>7.1 <small style={{ fontSize: '11px' }}>mmol/L</small></div>
              <div className={styles.kpiSub}>Tương đương 128 mg/dL</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>ƯỚC TÍNH HbA1c (eA1c)</div>
              <div className={styles.kpiValue}>6.2%</div>
              <div className={styles.kpiSub}>Mục tiêu: &lt; 7.0% (ĐẠT)</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiDanger}`}>
              <div className={styles.kpiLabel}>SỐ LẦN HẠ ĐƯỜNG HUYẾT</div>
              <div className={styles.kpiValue}>2 lần</div>
              <div className={styles.kpiSub}>Mức &lt; 3.9 mmol/L (1.7%)</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiWarning}`}>
              <div className={styles.kpiLabel}>SỐ LẦN TĂNG ĐƯỜNG HUYẾT</div>
              <div className={styles.kpiValue}>4 lần</div>
              <div className={styles.kpiSub}>Mức &gt; 10.0 mmol/L (3.3%)</div>
            </div>
          </div>

          {/* Thanh phân bố TIR */}
          <div className={styles.tirBarWrap}>
            <div className={styles.tirBarLabelRow}>
              <span>Phân bố trong mục tiêu (Time in Range - TIR):</span>
              <span style={{ color: '#15803d' }}>85.0% trong mục tiêu (Mục tiêu ADA: &gt; 70%)</span>
            </div>
            <div className={styles.tirBar}>
              <div className={styles.tirLow} style={{ width: '1.7%' }} title="Hạ đường huyết: 1.7%"></div>
              <div className={styles.tirNormal} style={{ width: '85.0%' }} title="Trong mục tiêu: 85.0%">85.0% Trong mục tiêu (3.9 - 10.0 mmol/L)</div>
              <div className={styles.tirHigh} style={{ width: '13.3%' }} title="Tăng đường huyết: 13.3%">13.3%</div>
            </div>
          </div>

          {/* Bảng chi tiết hạ & tăng đường huyết */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Thời điểm</th>
                <th style={{ width: '15%' }}>Chỉ số đo</th>
                <th style={{ width: '20%' }}>Phân loại biến cố</th>
                <th>Triệu chứng lâm sàng &amp; Cách đã xử trí tại nhà</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>04/10/2026 (15:30)</td>
                <td><strong style={{ color: '#b91c1c' }}>3.4 mmol/L</strong></td>
                <td><span className={`${styles.pillBadge} ${styles.pillDanger}`}>Hạ đường huyết Độ 1</span></td>
                <td>Cụ run tay nhẹ, vã mồ hôi xế chiều. Đã uống 150ml nước đường + 1 bánh quy (quy tắc 15-15). Đo lại sau 15p: 5.2 mmol/L.</td>
              </tr>
              <tr>
                <td>11/10/2026 (22:15)</td>
                <td><strong style={{ color: '#b91c1c' }}>3.6 mmol/L</strong></td>
                <td><span className={`${styles.pillBadge} ${styles.pillDanger}`}>Hạ đường huyết Độ 1</span></td>
                <td>Bữa tối ăn ít cơm, đói cồn cào trước ngủ. Đã uống 1 ly sữa chuyên biệt cho người tiểu đường.</td>
              </tr>
              <tr>
                <td>29/09/2026 (20:45)</td>
                <td><strong style={{ color: '#a16207' }}>11.8 mmol/L</strong></td>
                <td><span className={`${styles.pillBadge} ${styles.pillWarning}`}>Tăng đường huyết sau ăn</span></td>
                <td>Đo sau bữa cỗ gia đình nhiều xôi và chè ngọt. Đã uống nhiều nước lọc và đi bộ nhẹ nhàng 20 phút.</td>
              </tr>
              <tr>
                <td>06/10/2026 (13:15)</td>
                <td><strong style={{ color: '#a16207' }}>10.8 mmol/L</strong></td>
                <td><span className={`${styles.pillBadge} ${styles.pillWarning}`}>Tăng đường huyết sau ăn</span></td>
                <td>Ăn bún bò và nước ngọt có gas. Chiều cùng ngày đường huyết trở về 6.8 mmol/L.</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* KHỐI 3: KIỂM SOÁT HUYẾT ÁP & TIM MẠCH */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Heart size={15} color="#0284c7" />
            <h2 className={styles.sectionTitle}>
              3. Kiểm soát huyết áp &amp; Nhịp tim (Blood Pressure &amp; Cardiovascular Stability)
            </h2>
            <span className={styles.sectionBadge}>Chỉ tiêu ĐTĐ: &lt; 130/80 mmHg</span>
          </div>

          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>HUYẾT ÁP TRUNG BÌNH</div>
              <div className={styles.kpiValue}>124 / 78 <small style={{ fontSize: '11px' }}>mmHg</small></div>
              <div className={styles.kpiSub}>Mục tiêu: &lt; 130/80 (ĐẠT)</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>TỈ LỆ ỔN ĐỊNH TRONG MỤC TIÊU</div>
              <div className={styles.kpiValue}>93.3%</div>
              <div className={styles.kpiSub}>56/60 lần đo trong ngưỡng an toàn</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
              <div className={styles.kpiLabel}>NHỊP TIM TRUNG BÌNH</div>
              <div className={styles.kpiValue}>74 <small style={{ fontSize: '11px' }}>bpm</small></div>
              <div className={styles.kpiSub}>Nhịp xoang đều (68 - 82 bpm)</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>ĐÁNH GIÁ ĐỘ ỔN ĐỊNH</div>
              <div className={styles.kpiValue} style={{ fontSize: '15px', color: '#15803d' }}>RẤT ỔN ĐỊNH</div>
              <div className={styles.kpiSub}>0 cơn tăng kịch phát (&gt;160/100)</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', margin: '2px 0 6px 4px' }}>
            * Dao động huyết áp ghi nhận: Huyết áp tâm thu thấp nhất 115 mmHg (ngày 04/10), cao nhất 138 mmHg (ngày 24/09). Không ghi nhận biến cố hạ huyết áp tư thế đứng.
          </div>
        </section>

        {/* KHỐI 4: DANH MỤC THUỐC BỆNH NHÂN ĐANG SỬ DỤNG */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FileText size={15} color="#0284c7" />
            <h2 className={styles.sectionTitle}>
              4. Danh mục thuốc bệnh nhân đang điều trị tại nhà
            </h2>
            <span className={styles.sectionBadge}>Đơn thuốc ngoại trú</span>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '4%' }}>STT</th>
                <th style={{ width: '26%' }}>Tên biệt dược &amp; Hàm lượng</th>
                <th style={{ width: '22%' }}>Hoạt chất chính</th>
                <th style={{ width: '28%' }}>Liều dùng &amp; Thời điểm uống</th>
                <th style={{ width: '20%' }}>Mức độ tuân thủ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><strong>Glucophage XR 1000mg</strong></td>
                <td>Metformin HCl (Kéo dài)</td>
                <td>Uống 1 viên sau ăn tối (19:30)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillSuccess}`}>96.7% (29/30 cữ)</span></td>
              </tr>
              <tr>
                <td>2</td>
                <td><strong>Diamicron MR 30mg</strong></td>
                <td>Gliclazide phóng thích biến đổi</td>
                <td>Uống 1 viên trước ăn sáng 15 phút (07:00)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillSuccess}`}>93.3% (28/30 cữ)</span></td>
              </tr>
              <tr>
                <td>3</td>
                <td><strong>Amlor 5mg</strong></td>
                <td>Amlodipine besylate</td>
                <td>Uống 1 viên vào buổi sáng (08:00)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillSuccess}`}>96.7% (29/30 cữ)</span></td>
              </tr>
              <tr>
                <td>4</td>
                <td><strong>Lipitor 10mg</strong></td>
                <td>Atorvastatin calcium</td>
                <td>Uống 1 viên buổi tối trước khi đi ngủ (21:00)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillSuccess}`}>90.0% (27/30 cữ)</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* KHỐI 5: TỔNG KẾT & NHẬN XÉT CỦA BÁC SĨ ĐIỀU TRỊ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <ShieldCheck size={15} color="#0284c7" />
            <h2 className={styles.sectionTitle}>
              5. Đánh giá sơ bộ từ hệ thống &amp; Nhận xét của Bác sĩ khám lâm sàng
            </h2>
          </div>

          <div className={styles.clinicalNoteBox}>
            <strong>Gợi ý lâm sàng từ hệ thống DIA+:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
              <li>
                <strong>Tuân thủ điều trị:</strong> Rất tốt (94.2%). Đường huyết trung bình 7.1 mmol/L và ước tính HbA1c 6.2% đạt mục tiêu điều trị cá thể hóa của người cao tuổi theo ADA.
              </li>
              <li>
                <strong>Cảnh báo an toàn:</strong> Ghi nhận 2 đợt hạ đường huyết nhẹ lúc xế chiều (15:30) và đêm muộn (22:15). Đề xuất bác sĩ xem xét: (1) Cân nhắc giảm liều Diamicron MR 30mg xuống 1/2 viên hoặc chuyển thời điểm; (2) Dặn dò bệnh nhân ăn bổ sung bữa phụ xế chiều.
              </li>
              <li>
                <strong>Tim mạch:</strong> Huyết áp 124/78 mmHg kiểm soát rất ổn định, không có biến cố nguy cơ.
              </li>
            </ul>
          </div>

          {/* Ô dành riêng cho bác sĩ ghi tay */}
          <div className={styles.doctorNoteBlank}>
            <strong>Ghi chú &amp; Chỉ định của Bác sĩ khám lâm sàng:</strong>
            <div style={{ height: '32px' }}></div>
          </div>

          {/* Chữ ký 2 bên */}
          <div className={styles.signatureRow}>
            <div className={styles.signBox}>
              <div className={styles.signRole}>ĐẠI DIỆN GIA ĐÌNH / NGƯỜI CHĂM SÓC</div>
              <div className={styles.signSub}>(Ký và ghi rõ họ tên)</div>
              <div className={styles.signSpace}></div>
              <div className={styles.signName}>Nguyễn Thị Trinh</div>
            </div>
            <div className={styles.signBox}>
              <div className={styles.signRole}>BÁC SĨ ĐIỀU TRỊ PHỤ TRÁCH</div>
              <div className={styles.signSub}>(Ký tên, ghi rõ họ tên &amp; đóng dấu)</div>
              <div className={styles.signSpace}></div>
              <div className={styles.signName}>BS.CKII Trần Hoài Nam</div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <div>
            <span>Nền tảng Quản lý Đái tháo đường <strong>DIAPLUS.VN</strong></span> | Hotline: 1900 888 999 | Email: contact@diaplus.vn
          </div>
          <div>
            <span>Mã bảo mật điện tử: <strong>SHA256: 8F2A-99B1-E37C</strong></span> | Bản in y bạ hợp lệ
          </div>
        </footer>
      </div>
    </div>
  );
}
