import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../hooks/useAuth';
import styles from './ChangePasswordModal.module.css';

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmNewPassword);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Đổi mật khẩu" onClose={onClose}>
      <div className={styles.warning}>
        Có ai đó vừa cố đăng nhập vào tài khoản của bạn nhưng bị từ chối. Hãy đổi mật khẩu ngay để bảo vệ tài khoản.
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Mật khẩu hiện tại"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Input
          label="Mật khẩu mới"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
        <Input
          label="Nhập lại mật khẩu mới"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
        <Button type="submit" variant="primary" full disabled={loading}>
          {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
        </Button>
      </form>
    </Modal>
  );
}
