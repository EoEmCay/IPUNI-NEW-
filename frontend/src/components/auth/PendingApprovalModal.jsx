import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import styles from './PendingApprovalModal.module.css';

export default function PendingApprovalModal({ approval, onApprove, onReject, onDismiss }) {
  const [busyAction, setBusyAction] = useState(null); // 'approve' | 'reject' | null

  const handleApprove = async () => {
    setBusyAction('approve');
    try {
      await onApprove(approval.requestId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleReject = async () => {
    setBusyAction('reject');
    try {
      await onReject(approval.requestId);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Modal title="Phát hiện thử nghiệm đăng nhập mới" onClose={onDismiss}>
      <div className={styles.body}>
        <p className={styles.message}>
          Có một thiết bị mới đang yêu cầu truy cập vào tài khoản của bạn. Bạn có cho phép không?
        </p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            full
            disabled={busyAction !== null}
            onClick={handleApprove}
          >
            {busyAction === 'approve' ? 'Đang xử lý...' : 'Cho phép (Đúng là tôi)'}
          </Button>
          <Button
            variant="danger"
            full
            disabled={busyAction !== null}
            onClick={handleReject}
          >
            {busyAction === 'reject' ? 'Đang xử lý...' : 'Từ chối & Đổi mật khẩu (Không phải tôi)'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
