import { Link } from 'react-router-dom';
import LegalLayout from './LegalLayout';
import styles from './Legal.module.css';

const CONTACT_EMAIL = 'diaplus.excutives@gmail.com';

export default function DataDeletionPage() {
  return (
    <LegalLayout title="Xoá dữ liệu người dùng" updated="27/09/2026">
      <p>
        Bạn có thể yêu cầu xoá tài khoản DIA+ và toàn bộ dữ liệu của mình bất cứ lúc nào, kể cả khi bạn đăng
        nhập bằng Google hoặc Facebook.
      </p>

      <h2>Cách yêu cầu xoá</h2>
      <ol>
        <li>
          Gửi email tới <a href={`mailto:${CONTACT_EMAIL}?subject=Y%C3%AAu%20c%E1%BA%A7u%20xo%C3%A1%20d%E1%BB%AF%20li%E1%BB%87u%20DIA%2B`}>{CONTACT_EMAIL}</a> với
          tiêu đề <b>"Yêu cầu xoá dữ liệu DIA+"</b>.
        </li>
        <li>
          Ghi <b>email hoặc số điện thoại</b> bạn dùng để đăng nhập. Nếu đăng nhập bằng Facebook, ghi thêm
          <b> tên Facebook</b>; nếu biết, ghi <b>mã tài khoản DIA+</b> (Cài đặt → Gia đình → "Mã của bạn").
        </li>
        <li>Chúng tôi trả lời để xác nhận đúng chủ tài khoản, rồi xoá trong vòng <b>30 ngày</b> và báo lại cho bạn.</li>
      </ol>

      <h2>Những gì sẽ bị xoá</h2>
      <ul>
        <li>Tài khoản và hồ sơ (họ tên, email, số điện thoại, CCCD, hồ sơ sức khoẻ, bảo hiểm y tế);</li>
        <li>Thuốc, lịch uống, nhật ký uống/bỏ/quên, chỉ số đường huyết;</li>
        <li>Kết nối gia đình, liên hệ người nhà và các cảnh báo liên quan;</li>
        <li>Liên kết với tài khoản Google/Facebook.</li>
      </ul>
      <p>
        Giọng ghi âm và lịch sử quét đơn thuốc chỉ nằm trên máy của bạn: hãy xoá trong ứng dụng
        (Giọng nhắc, Lịch sử quét) hoặc xoá dữ liệu trình duyệt / gỡ ứng dụng.
      </p>

      <h2>Nếu bạn đăng nhập bằng Facebook</h2>
      <p>
        Bạn cũng có thể gỡ quyền của DIA+ trên Facebook: vào <b>Cài đặt và quyền riêng tư → Cài đặt →
        Ứng dụng và trang web</b>, chọn <b>DIA+</b> rồi bấm <b>Gỡ</b>. Việc này ngừng chia sẻ thông tin Facebook
        mới với DIA+; để xoá dữ liệu đã lưu, vui lòng gửi yêu cầu như trên.
      </p>

      <div className={styles.box}>
        <p>Xem thêm: <Link to="/chinh-sach-bao-mat">Chính sách quyền riêng tư</Link></p>
      </div>
    </LegalLayout>
  );
}
