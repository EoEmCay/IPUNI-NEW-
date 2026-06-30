import { useState } from 'react';
import { Crown, Check, Sparkles, Zap, Lock, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { usePlan } from '../../hooks/usePlan';
import useAuthStore from '../../store/authStore';
import styles from './UpgradeModal.module.css';

const PLANS = [
  {
    key: 'free',
    name: 'Miễn phí',
    price: '0đ',
    period: 'mãi mãi',
    current: true,
    color: 'free',
    features: [
      'Theo dõi chỉ số đường huyết',
      'Quản lý thuốc cơ bản',
      'Lịch hẹn bác sĩ',
      'Lời khuyên sức khỏe',
      'Cute Mode',
    ],
    locked: [],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '49.000đ',
    amount: 49000,
    period: 'tháng',
    current: false,
    color: 'pro',
    badge: 'Phổ biến',
    features: [
      'Tất cả tính năng Free',
      'Quét đơn thuốc bằng AI (không giới hạn)',
      'Biểu đồ HbA1c & xu hướng',
      'Nhắc uống thuốc thông minh',
      'Tư vấn dinh dưỡng AI',
      'Đồng bộ thiết bị đo',
      'Chia sẻ với bác sĩ',
      'Hỗ trợ ưu tiên 24/7',
      'Mở khóa tất cả A-Styles (100+ giao diện & avatar)',
    ],
    locked: [],
  },
];

const BANK_STK = '30068889999';
const BANK_NAME = 'Techcombank';
const ACCOUNT_NAME = 'DIA PLUS';

function PaymentQR({ plan, userCode, onBack }) {
  const [copied, setCopied] = useState(false);
  const [copiedStk, setCopiedStk] = useState(false);

  const transferContent = `${userCode} - NANG CAP DIA+ ${plan.name.toUpperCase()}`;
  const qrUrl = `https://img.vietqr.io/image/TCB-${BANK_STK}-compact2.png?amount=${plan.amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const handleCopyStk = () => {
    navigator.clipboard.writeText(BANK_STK);
    setCopiedStk(true);
    setTimeout(() => setCopiedStk(false), 2000);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.qrContainer}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Quay lại</span>
      </button>

      <div className={styles.qrHero}>
        <div className={styles.qrBankLogo}>
          <span className={styles.qrBankText}>TCB</span>
        </div>
        <h3 className={styles.qrTitle}>Thanh toán {BANK_NAME}</h3>
        <p className={styles.qrSub}>Nâng cấp lên gói <strong>{plan.name}</strong> — {plan.price}/{plan.period}</p>
      </div>

      <div className={styles.qrImageWrap}>
        <img
          src={qrUrl}
          alt="QR Thanh toán"
          className={styles.qrImage}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      <div className={styles.bankInfo}>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>Ngân hàng</span>
          <span className={styles.bankValue}>{BANK_NAME}</span>
        </div>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>Số tài khoản</span>
          <div className={styles.stkWrap}>
            <span className={styles.stkValue}>{BANK_STK}</span>
            <button className={`${styles.copyBtn} ${copiedStk ? styles.copyBtnDone : ''}`} onClick={handleCopyStk}>
              {copiedStk ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copiedStk ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
        </div>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>Chủ tài khoản</span>
          <span className={styles.bankValue}>{ACCOUNT_NAME}</span>
        </div>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>Số tiền</span>
          <span className={`${styles.bankValue} ${styles.bankAmount}`}>{plan.price}</span>
        </div>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>Nội dung CK</span>
          <div className={styles.stkWrap}>
            <span className={`${styles.bankValue} ${styles.contentValue}`}>{transferContent}</span>
            <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopyContent}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
        </div>
      </div>

      <p className={styles.qrNote}>
        Sau khi chuyển khoản thành công, tài khoản sẽ được nâng cấp trong vòng <strong>24 giờ</strong>.
      </p>
    </div>
  );
}

export default function UpgradeModal({ onClose }) {
  const { plan } = usePlan();
  const user = useAuthStore(s => s.user);
  const [payingPlan, setPayingPlan] = useState(null);

  const activePlans = PLANS.map(p => ({
    ...p,
    current: p.key === plan,
  }));

  if (payingPlan) {
    return (
      <Modal title="" onClose={onClose} noPadding>
        <PaymentQR plan={payingPlan} userCode={user?.user_code || 'DIA??????'} onBack={() => setPayingPlan(null)} />
      </Modal>
    );
  }

  return (
    <Modal title="" onClose={onClose} noPadding>
      <div className={styles.container}>

        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Crown size={28} fill="currentColor" />
          </div>
          <h2 className={styles.heroTitle}>Nâng cấp tài khoản</h2>
          <p className={styles.heroSub}>Mở khóa đầy đủ tính năng để chăm sóc sức khỏe tốt hơn</p>
        </div>

        <div className={styles.plans}>
          {activePlans.map((p) => (
            <div
              key={p.key}
              className={`${styles.planCard} ${styles[`plan_${p.color}`]} ${p.current ? styles.planCurrent : ''}`}
            >
              {p.badge && (
                <span className={`${styles.badge} ${p.key === 'premium' ? styles.badgeComing : styles.badgeHot}`}>
                  {p.key === 'pro' && <Zap size={10} />}
                  {p.key === 'premium' && <Sparkles size={10} />}
                  {p.badge}
                </span>
              )}
              {p.current && <span className={styles.badgeCurrent}>Đang dùng</span>}

              <div className={styles.planHeader}>
                <span className={styles.planName}>{p.name}</span>
                <div className={styles.planPrice}>
                  <span className={styles.price}>{p.price}</span>
                  <span className={styles.period}>/{p.period}</span>
                </div>
              </div>

              <ul className={styles.featureList}>
                {p.features.map((f) => (
                  <li key={f} className={styles.feature}>
                    <Check size={13} className={styles.featureCheck} />
                    {f}
                  </li>
                ))}
                {p.locked.map((f) => (
                  <li key={f} className={`${styles.feature} ${styles.featureLocked}`}>
                    <Lock size={12} className={styles.lockIcon} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.planBtn} ${p.current ? styles.planBtnCurrent : styles[`planBtn_${p.color}`]}`}
                disabled={p.current}
                onClick={() => !p.current && setPayingPlan(p)}
              >
                {p.current ? 'Gói hiện tại' : 'Nâng cấp ngay'}
              </button>
            </div>
          ))}
        </div>

        <p className={styles.footer}>
          Thanh toán an toàn · Hủy bất kỳ lúc nào · Không tự gia hạn
        </p>
      </div>
    </Modal>
  );
}
