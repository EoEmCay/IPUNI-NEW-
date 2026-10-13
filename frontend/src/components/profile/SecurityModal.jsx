import { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, Smartphone, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../hooks/useAuth';
import styles from './SecurityModal.module.css';

export default function SecurityModal({ onClose }) {
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Bảo Mật & Tài Khoản" onClose={onClose}>
      <div className={styles.container}>
        {toastMsg && (
          <div className={styles.toast}>
            <CheckCircle2 size={16} color="#10b981" /> {toastMsg}
          </div>
        )}

        {/* 1. Phần Đổi Mật Khẩu */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap}>
              <KeyRound size={20} color="#0284c7" />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Đổi Mật Khẩu</h2>
              <p className={styles.cardDesc}>Bảo vệ tài khoản giám hộ bằng mật khẩu mạnh</p>
            </div>
          </div>

          {error && (
            <div className={styles.alertError}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div className={styles.alertSuccess}>
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Mật khẩu hiện tại</label>
              <div className={styles.inputWrap}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Nhập mật khẩu đang dùng"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Mật khẩu mới (tối thiểu 6 ký tự)</label>
              <div className={styles.inputWrap}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Xác nhận mật khẩu mới</label>
              <div className={styles.inputWrap}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </section>

        {/* 2. Xác Thực 2 Lớp (2FA) */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 className={styles.cardTitle}>Xác Thực 2 Lớp (2FA)</h2>
              <p className={styles.cardDesc}>
                Bảo vệ đăng nhập qua mã OTP gửi về {user?.phone || user?.email || 'SĐT đăng ký'}
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => {
                  setTwoFactorEnabled(e.target.checked);
                  showToast(e.target.checked ? 'Đã bật xác thực 2 lớp qua OTP' : 'Đã tạm tắt xác thực 2 lớp');
                }}
              />
              <span className={styles.slider} />
            </label>
          </div>
        </section>

        {/* 3. Khóa Ứng Dụng Bằng Mã PIN Nhanh */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: '#fef3c7', color: '#d97706' }}>
              <Lock size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 className={styles.cardTitle}>Mã PIN Mở Khóa Nhanh (4 số)</h2>
              <p className={styles.cardDesc}>Yêu cầu nhập mã PIN khi mở lại ứng dụng</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => {
                  setPinEnabled(e.target.checked);
                  showToast(e.target.checked ? 'Đã kích hoạt mã PIN 4 số' : 'Đã tắt mã PIN');
                }}
              />
              <span className={styles.slider} />
            </label>
          </div>
        </section>

        {/* 4. Phiên Đăng Nhập & Thiết Bị */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap} style={{ background: '#f1f5f9', color: '#475569' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Thiết Bị Đang Đăng Nhập</h2>
              <p className={styles.cardDesc}>Quản lý các phiên đăng nhập của tài khoản</p>
            </div>
          </div>
          <div className={styles.deviceRow}>
            <div className={styles.deviceInfo}>
              <div className={styles.deviceName}>
                Thiết bị hiện tại · Windows / Chrome <span className={styles.onlineBadge}>Trực tuyến</span>
              </div>
              <div className={styles.deviceMeta}>Đăng nhập gần nhất: Vừa xong · IP Việt Nam</div>
            </div>
          </div>
          <button
            type="button"
            className={styles.logoutOthersBtn}
            onClick={() => showToast('Đã đăng xuất khỏi tất cả thiết bị khác')}
          >
            Đăng xuất khỏi các thiết bị khác
          </button>
        </section>
      </div>
    </Modal>
  );
}
