import { Link } from 'react-router-dom';
import LegalLayout from './LegalLayout';
import styles from './Legal.module.css';

const CONTACT_EMAIL = 'diaplus.excutives@gmail.com';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Chính sách quyền riêng tư" updated="27/09/2026">
      <p>
        DIA+ là ứng dụng giúp người bệnh tiểu đường nhắc uống thuốc, quét đơn thuốc và theo dõi đường huyết.
        Trang này giải thích DIA+ thu thập dữ liệu gì, dùng để làm gì, chia sẻ với ai và bạn có quyền gì với
        dữ liệu của mình, theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
      </p>

      <h2>1. Dữ liệu chúng tôi thu thập</h2>
      <ul>
        <li><b>Thông tin tài khoản:</b> họ tên, email, số điện thoại hoặc số CCCD, mật khẩu (chỉ lưu dạng mã hoá, không ai đọc được).</li>
        <li><b>Khi đăng nhập bằng Google hoặc Facebook:</b> họ tên, email và mã định danh tài khoản Google/Facebook. Chúng tôi không nhận mật khẩu Google/Facebook của bạn.</li>
        <li><b>Hồ sơ sức khoẻ (dữ liệu nhạy cảm):</b> chẩn đoán tiểu đường, nhóm máu, dị ứng, số và hạn thẻ bảo hiểm y tế, ngày sinh, địa chỉ — chỉ khi bạn tự nhập.</li>
        <li><b>Thuốc và lịch uống:</b> tên thuốc, liều, giờ uống, bác sĩ kê đơn, lịch tái khám; nhật ký đã uống / bỏ qua / quên cùng lý do bạn chọn.</li>
        <li><b>Chỉ số:</b> đường huyết và các chỉ số bạn nhập.</li>
        <li><b>Gia đình và người nhà:</b> mã tài khoản của người trong gia đình bạn kết nối; tên, email, số điện thoại người nhà bạn nhập để nhận cảnh báo.</li>
        <li><b>Thông tin kỹ thuật:</b> trang đã xem trong ứng dụng, loại trình duyệt/thiết bị, thời điểm hoạt động — để giữ ứng dụng chạy ổn định và bảo mật.</li>
      </ul>

      <h2>2. Dữ liệu chỉ nằm trên máy của bạn</h2>
      <ul>
        <li><b>Giọng nói người thân bạn ghi âm</b> để làm âm báo: lưu trên điện thoại/trình duyệt của bạn, không tải lên máy chủ DIA+.</li>
        <li><b>Lịch sử quét đơn thuốc</b> (kèm ảnh): lưu trên máy của bạn; bạn có thể xoá trong mục Lịch sử quét.</li>
      </ul>

      <h2>3. Chúng tôi dùng dữ liệu để làm gì</h2>
      <ul>
        <li>Tạo lịch và nhắc bạn uống thuốc đúng giờ, bằng âm thanh, rung và đèn.</li>
        <li>Đọc đơn thuốc từ ảnh bạn chụp để tự điền tên thuốc và giờ uống.</li>
        <li>Hiển thị chỉ số, biểu đồ đường huyết và báo cáo để bạn mang đi khám.</li>
        <li>Báo cho người trong gia đình / người nhà khi bạn quên hoặc bỏ qua cữ thuốc, nếu bạn đã kết nối.</li>
        <li>Bảo vệ tài khoản (phát hiện đăng nhập lạ, chống dò mật khẩu) và khắc phục lỗi.</li>
      </ul>
      <p>DIA+ <b>không bán</b> dữ liệu của bạn và <b>không dùng</b> dữ liệu sức khoẻ để quảng cáo.</p>

      <h2>4. Chia sẻ dữ liệu với ai</h2>
      <ul>
        <li><b>Người trong gia đình bạn kết nối</b> bằng mã tài khoản: nhận cảnh báo khi bạn bỏ qua hoặc quên cữ thuốc (tên thuốc, giờ, lý do). Bạn có thể gỡ kết nối bất cứ lúc nào trong Cài đặt → Gia đình.</li>
        <li><b>Dịch vụ AI đọc đơn thuốc</b> (Google Gemini; dự phòng Anthropic Claude): nhận ảnh đơn thuốc để đọc chữ. Ảnh được xoá khỏi máy chủ DIA+ ngay sau khi đọc xong.</li>
        <li><b>Dịch vụ giọng đọc</b> (Google): nhận câu nhắc cần đọc (ví dụ tên thuốc) khi bạn chưa ghi âm giọng người thân.</li>
        <li><b>Dịch vụ gửi email và SMS</b>: nhận nội dung cảnh báo và email/số điện thoại người nhận.</li>
        <li><b>Hạ tầng lưu trữ</b>: máy chủ và cơ sở dữ liệu của DIA+ được thuê từ nhà cung cấp đám mây (Render, Supabase, Vercel), có thể đặt ở nước ngoài, ví dụ Hoa Kỳ.</li>
        <li><b>Cơ quan nhà nước</b>: chỉ khi pháp luật yêu cầu.</li>
      </ul>

      <h2>5. Lưu trữ và bảo mật</h2>
      <p>
        Dữ liệu được truyền qua kết nối mã hoá (HTTPS). Mật khẩu được mã hoá một chiều. Mỗi người chỉ xem và sửa
        được dữ liệu của chính mình; người trong gia đình chỉ nhận cảnh báo bỏ/quên thuốc, không xem được toàn bộ
        hồ sơ. Chúng tôi giữ dữ liệu trong thời gian bạn còn dùng tài khoản và xoá theo yêu cầu của bạn
        (xem mục 7).
      </p>

      <h2>6. Quyền của bạn</h2>
      <p>Theo Nghị định 13/2023/NĐ-CP, bạn có quyền:</p>
      <ul>
        <li>Được biết và đồng ý (hoặc rút lại sự đồng ý) về việc xử lý dữ liệu của mình;</li>
        <li>Xem, sửa dữ liệu (trong ứng dụng hoặc yêu cầu qua email);</li>
        <li>Yêu cầu xoá dữ liệu, hạn chế hoặc phản đối việc xử lý dữ liệu;</li>
        <li>Yêu cầu nhận bản sao dữ liệu (ứng dụng có nút xuất báo cáo PDF);</li>
        <li>Khiếu nại nếu dữ liệu bị xử lý sai quy định.</li>
      </ul>

      <h2>7. Xoá tài khoản và dữ liệu</h2>
      <p>
        Làm theo hướng dẫn tại trang <Link to="/xoa-du-lieu">Xoá dữ liệu người dùng</Link>.
        Chúng tôi xoá trong vòng 30 ngày kể từ khi xác nhận yêu cầu.
      </p>

      <h2>8. Trẻ em</h2>
      <p>DIA+ dành cho người trưởng thành. Người dưới 16 tuổi cần có cha mẹ hoặc người giám hộ đồng ý và hỗ trợ khi sử dụng.</p>

      <h2>9. Thay đổi chính sách</h2>
      <p>Khi thay đổi nội dung quan trọng, chúng tôi sẽ cập nhật ngày ở đầu trang và thông báo trong ứng dụng.</p>

      <h2>10. Liên hệ</h2>
      <div className={styles.box}>
        <p>Mọi câu hỏi về quyền riêng tư và dữ liệu của bạn, vui lòng gửi email tới:</p>
        <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </div>
    </LegalLayout>
  );
}
