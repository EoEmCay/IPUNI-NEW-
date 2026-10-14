import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  FileText,
  Activity,
  Heart,
  Pill,
  Stethoscope,
} from 'lucide-react';
import styles from './DoctorA4ReportModal.module.css';

export default function DoctorA4ReportModal({ isOpen, onClose, user }) {
  const handlePrint = () => {
    const sheet = document.getElementById('medical-a4-sheet');
    if (!sheet) {
      window.print();
      return;
    }

    // Xóa iframe in cũ nếu có
    const oldIframe = document.getElementById('dia-print-frame');
    if (oldIframe) oldIframe.remove();

    // Tạo iframe in chuyên dụng độc lập để cách ly 100% khỏi CSS/overflow của màn hình chính
    const iframe = document.createElement('iframe');
    iframe.id = 'dia-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // Sao chép toàn bộ stylesheets (CSS Modules, Fonts, Global styles) sang iframe
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Bản in A4 Báo cáo Y khoa - DIAPLUS.VN</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 4mm 6mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            #medical-a4-sheet {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 4mm 6mm !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${sheet.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Đợi 250ms cho font và style render hoàn tất rồi in trực tiếp từ iframe
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 250);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
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

  return createPortal(
    <div
      id="doctor-a4-portal"
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* THANH ĐIỀU KHIỂN TRÊN CÙNG (TỰ ĐỘNG ẨN KHI IN ẤN) */}
      <div className={styles.topBar}>
        <div className={styles.topBarTitle}>
          <span className={styles.topBarIcon}>
            <Stethoscope size={20} />
          </span>
          <span>Bản in A4 Báo cáo Y khoa cho Bác sĩ (Khóa vừa khít 1 trang A4)</span>
        </div>
        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.printBtn}
            onClick={handlePrint}
            title="In ra giấy A4 hoặc Lưu file PDF (Ctrl + P)"
          >
            <Printer size={15} />
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

      {/* TỜ GIẤY A4 CHUẨN LÂM SÀNG: VỪA VẶN 1 TRANG DUY NHẤT */}
      <div className={styles.a4Sheet} id="medical-a4-sheet">
        {/* HEADER HÀNH CHÍNH */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.brandLogo}>
                <span>DIAPLUS.VN</span>
                <span className={styles.brandBadge}>HỆ THỐNG Y TẾ SỐ</span>
              </div>
              <span className={styles.brandSub}>
                Nền tảng Giám sát Điều trị Đái tháo đường &amp; Tim mạch tại nhà
              </span>
            </div>
            <div className={styles.docMeta}>
              <div>Mã hồ sơ: <strong className={styles.docId}>DP-2026-8892</strong></div>
              <div>Ngày xuất: <strong>{currentDate}</strong> | <strong>30 ngày gần nhất</strong></div>
            </div>
          </div>

          <div className={styles.reportTitle}>
            <h1>BẢNG TỔNG HỢP THEO DÕI ĐIỀU TRỊ ĐÁI THÁO ĐƯỜNG TẠI NHÀ</h1>
            <p className={styles.reportTitleSub}>
              (AMBULATORY GLUCOSE PROFILE &amp; MEDICATION ADHERENCE CLINICAL REPORT - 1 PAGE A4)
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
              <label>Tuổi / Giới:</label>
              <span>72 tuổi (Sinh 1954) — Nam</span>
            </div>
            <div className={styles.patientItem}>
              <label>SĐT Bệnh nhân:</label>
              <span>0912 345 678</span>
            </div>

            <div className={styles.patientItem}>
              <label>Người giám sát (Con):</label>
              <span>Nguyễn Thị Trinh (0908 123 456)</span>
            </div>
            <div className={styles.patientItem} style={{ gridColumn: 'span 2' }}>
              <label>Bác sĩ điều trị phụ trách:</label>
              <span>BS.CKII Trần Hoài Nam (Phòng khám Nội tiết - ĐTĐ)</span>
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

        {/* BỐ CỤC 2 CỘT SONG SONG: 1. TUÂN THỦ THUỐC + 2. ĐƯỜNG HUYẾT */}
        <div className={styles.twoColGrid}>
          {/* CỘT TRÁI: 1. TUÂN THỦ UỐNG THUỐC */}
          <div className={styles.colCard}>
            <div className={styles.sectionHeader}>
              <Pill size={14} color="#0284c7" />
              <h2 className={styles.sectionTitle}>1. Tuân thủ uống thuốc (PDC)</h2>
              <span className={styles.sectionBadge}>Chỉ tiêu: ≥ 80%</span>
            </div>

            <div className={styles.kpiMiniGrid}>
              <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
                <div className={styles.kpiLabel}>TỈ LỆ TUÂN THỦ</div>
                <div className={styles.kpiValue}>94.2%</div>
                <div className={styles.kpiSub}>Xếp loại: Tốt</div>
              </div>
              <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
                <div className={styles.kpiLabel}>ĐÃ UỐNG ĐÚNG GIỜ</div>
                <div className={styles.kpiValue}>108/120</div>
                <div className={styles.kpiSub}>90.0% tổng cữ</div>
              </div>
              <div className={`${styles.kpiCard} ${styles.kpiDanger}`}>
                <div className={styles.kpiLabel}>CỮ BỎ QUÊN THUỐC</div>
                <div className={styles.kpiValue}>7 cữ</div>
                <div className={styles.kpiSub}>Chiếm 5.8%</div>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Thời điểm</th>
                  <th style={{ width: '45%' }}>Thuốc &amp; Cữ</th>
                  <th style={{ width: '30%' }}>Trạng thái &amp; Lý do</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>11/10 (11:30)</td>
                  <td>Diamicron 30mg (Trưa)</td>
                  <td><span className={`${styles.pillBadge} ${styles.pillDanger}`}>Bỏ cữ</span> — Khám mắt quên mang</td>
                </tr>
                <tr>
                  <td>05/10 (20:00)</td>
                  <td>Glucophage 1000mg (Tối)</td>
                  <td><span className={`${styles.pillBadge} ${styles.pillWarning}`}>Trễ</span> — Ngủ quên, uống bù 22:30</td>
                </tr>
                <tr>
                  <td>22/09 (19:30)</td>
                  <td>Glucophage 1000mg (Tối)</td>
                  <td><span className={`${styles.pillBadge} ${styles.pillDanger}`}>Bỏ cữ</span> — Đi tiệc họ hàng về muộn</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CỘT PHẢI: 2. KIỂM SOÁT ĐƯỜNG HUYẾT */}
          <div className={styles.colCard}>
            <div className={styles.sectionHeader}>
              <Activity size={14} color="#0284c7" />
              <h2 className={styles.sectionTitle}>2. Đường huyết &amp; AGP Profile</h2>
              <span className={styles.sectionBadge}>96 lần đo / 30 ngày</span>
            </div>

            <div className={styles.kpiMiniGrid}>
              <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
                <div className={styles.kpiLabel}>ĐƯỜNG HUYẾT TB</div>
                <div className={styles.kpiValue}>7.1 <small style={{ fontSize: '10px' }}>mmol/L</small></div>
                <div className={styles.kpiSub}>eAG: 128 mg/dL</div>
              </div>
              <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
                <div className={styles.kpiLabel}>ƯỚC TÍNH HbA1c</div>
                <div className={styles.kpiValue}>6.2%</div>
                <div className={styles.kpiSub}>Mục tiêu: &lt; 7.0%</div>
              </div>
              <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
                <div className={styles.kpiLabel}>TRONG MỤC TIÊU</div>
                <div className={styles.kpiValue}>85.0%</div>
                <div className={styles.kpiSub}>TIR (3.9 - 10.0)</div>
              </div>
            </div>

            {/* Thanh phân bố TIR */}
            <div className={styles.tirBarWrap}>
              <div className={styles.tirBarLabelRow}>
                <span>Phân bố TIR:</span>
                <span style={{ color: '#15803d' }}>85.0% Đạt chuẩn ADA (&gt; 70%)</span>
              </div>
              <div className={styles.tirBar}>
                <div className={styles.tirLow} style={{ width: '2%' }}></div>
                <div className={styles.tirNormal} style={{ width: '85%' }}>85% Bình thường</div>
                <div className={styles.tirHigh} style={{ width: '13%' }}>13%</div>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Biến cố đường huyết</th>
                  <th style={{ width: '22%' }}>Số lần đo</th>
                  <th style={{ width: '46%' }}>Chi tiết đo &amp; Cách xử trí</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className={`${styles.pillBadge} ${styles.pillDanger}`}>Hạ đường huyết</span></td>
                  <td><strong>2 lần (1.7%)</strong></td>
                  <td><strong>3.4 &amp; 3.6 mmol/L</strong> (Xế chiều 04/10 &amp; đêm 11/10; uống nước đường/sữa)</td>
                </tr>
                <tr>
                  <td><span className={`${styles.pillBadge} ${styles.pillWarning}`}>Tăng đường huyết</span></td>
                  <td><strong>4 lần (3.3%)</strong></td>
                  <td>Đỉnh <strong>11.8 mmol/L</strong> sau bữa cỗ; các lần khác 10.2 - 10.8 mmol/L</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* HÀNG 2: 3. KIỂM SOÁT HUYẾT ÁP & TIM MẠCH (FULL WIDTH) */}
        <section className={styles.fullSection}>
          <div className={styles.sectionHeader}>
            <Heart size={14} color="#0284c7" />
            <h2 className={styles.sectionTitle}>
              3. Kiểm soát huyết áp &amp; Tim mạch (Cardiovascular Stability)
            </h2>
            <span className={styles.sectionBadge}>Mục tiêu ĐTĐ: &lt; 130/80 mmHg</span>
          </div>

          <div className={styles.bpGrid}>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>HUYẾT ÁP TRUNG BÌNH</div>
              <div className={styles.kpiValue}>124 / 78 <small style={{ fontSize: '10px' }}>mmHg</small></div>
              <div className={styles.kpiSub}>Mục tiêu: &lt; 130/80 (ĐẠT)</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>ỔN ĐỊNH TRONG MỤC TIÊU</div>
              <div className={styles.kpiValue}>93.3%</div>
              <div className={styles.kpiSub}>56/60 lần đo an toàn</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
              <div className={styles.kpiLabel}>NHỊP TIM TRUNG BÌNH</div>
              <div className={styles.kpiValue}>74 <small style={{ fontSize: '10px' }}>bpm</small></div>
              <div className={styles.kpiSub}>Nhịp xoang đều (68 - 82 bpm)</div>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiLabel}>ĐÁNH GIÁ ĐỘ ỔN ĐỊNH</div>
              <div className={styles.kpiValue} style={{ fontSize: '13px', color: '#15803d' }}>RẤT ỔN ĐỊNH</div>
              <div className={styles.kpiSub}>0 cơn tăng kịch phát (&gt;160/100)</div>
            </div>
          </div>
        </section>

        {/* HÀNG 3: 4. DANH MỤC THUỐC BỆNH NHÂN ĐANG SỬ DỤNG (FULL WIDTH) */}
        <section className={styles.medSection}>
          <div className={styles.sectionHeader}>
            <FileText size={14} color="#0284c7" />
            <h2 className={styles.sectionTitle}>
              4. Danh mục thuốc bệnh nhân đang điều trị tại nhà
            </h2>
            <span className={styles.sectionBadge}>Đơn thuốc ngoại trú</span>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '4%' }}>STT</th>
                <th style={{ width: '28%' }}>Tên biệt dược &amp; Hàm lượng</th>
                <th style={{ width: '24%' }}>Hoạt chất chính</th>
                <th style={{ width: '26%' }}>Liều dùng &amp; Thời điểm</th>
                <th style={{ width: '18%' }}>Mức độ tuân thủ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><strong>Glucophage XR 1000mg</strong></td>
                <td>Metformin HCl kéo dài</td>
                <td>1 viên sau ăn tối (19:30)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillSuccess}`}>96.7% (29/30 cữ)</span></td>
              </tr>
              <tr>
                <td>2</td>
                <td><strong>Diamicron MR 30mg</strong></td>
                <td>Gliclazide phóng thích biến đổi</td>
                <td>1 viên trước ăn sáng 15p (07:00)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillSuccess}`}>93.3% (28/30 cữ)</span></td>
              </tr>
              <tr>
                <td>3</td>
                <td><strong>Amlor 5mg</strong></td>
                <td>Amlodipine besylate</td>
                <td>1 viên vào buổi sáng (08:00)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillSuccess}`}>96.7% (29/30 cữ)</span></td>
              </tr>
              <tr>
                <td>4</td>
                <td><strong>Lipitor 10mg</strong></td>
                <td>Atorvastatin calcium</td>
                <td>1 viên tối trước ngủ (21:00)</td>
                <td><span className={`${styles.pillBadge} ${styles.pillSuccess}`}>90.0% (27/30 cữ)</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <div>
            Nền tảng Giám sát Điều trị Đái tháo đường &amp; Tim mạch <strong>DIAPLUS.VN</strong> | Hotline: 1900 888 999 | Email: contact@diaplus.vn
          </div>
          <div>
            Mã bảo mật: <strong>SHA256: 8F2A-99B1-E37C</strong> | Báo cáo theo dõi tự động
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
