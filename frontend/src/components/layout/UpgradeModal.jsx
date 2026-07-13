import { useState } from 'react';
import { Crown, Check, Sparkles, Zap, Lock, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { usePlan } from '../../hooks/usePlan';
import useAuthStore from '../../store/authStore';
import { useT } from '../../hooks/useT';
import styles from './UpgradeModal.module.css';

const getPlans = (t) => [
  {
    key: 'free',
    name: t.upgrade.freePlan,
    price: '0đ',
    period: t.upgrade.forever,
    current: true,
    color: 'free',
    features: [
      t.upgrade.fFree1,
      t.upgrade.fFree2,
      t.upgrade.fFree3,
      t.upgrade.fFree4,
      t.upgrade.fFree5,
    ],
    locked: [],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '49.000đ',
    amount: 49000,
    period: t.upgrade.month,
    current: false,
    color: 'pro',
    badge: t.upgrade.popular,
    features: [
      t.upgrade.fPro1,
      t.upgrade.fPro2,
      t.upgrade.fPro3,
      t.upgrade.fPro4,
      t.upgrade.fPro5,
      t.upgrade.fPro6,
      t.upgrade.fPro7,
      t.upgrade.fPro8,
      t.upgrade.fPro9,
    ],
    locked: [],
  },
];

const BANK_STK = '30068889999';
const BANK_NAME = 'Techcombank';
const ACCOUNT_NAME = 'DIA PLUS';

function PaymentQR({ plan, userCode, onBack, t }) {
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
        <span>{t.upgrade.back}</span>
      </button>

      <div className={styles.qrHero}>
        <div className={styles.qrBankLogo}>
          <span className={styles.qrBankText}>TCB</span>
        </div>
        <h3 className={styles.qrTitle}>{t.upgrade.payTitle} {BANK_NAME}</h3>
        <p className={styles.qrSub}>{t.upgrade.paySubtitle} <strong>{plan.name}</strong> — {plan.price}/{plan.period}</p>
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
          <span className={styles.bankLabel}>{t.upgrade.bankLabel}</span>
          <span className={styles.bankValue}>{BANK_NAME}</span>
        </div>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>{t.upgrade.accountLabel}</span>
          <div className={styles.stkWrap}>
            <span className={styles.stkValue}>{BANK_STK}</span>
            <button className={`${styles.copyBtn} ${copiedStk ? styles.copyBtnDone : ''}`} onClick={handleCopyStk}>
              {copiedStk ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copiedStk ? t.upgrade.copied : t.upgrade.copy}
            </button>
          </div>
        </div>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>{t.upgrade.ownerLabel}</span>
          <span className={styles.bankValue}>{ACCOUNT_NAME}</span>
        </div>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>{t.upgrade.amountLabel}</span>
          <span className={`${styles.bankValue} ${styles.bankAmount}`}>{plan.price}</span>
        </div>
        <div className={styles.bankRow}>
          <span className={styles.bankLabel}>{t.upgrade.contentLabel}</span>
          <div className={styles.stkWrap}>
            <span className={`${styles.bankValue} ${styles.contentValue}`}>{transferContent}</span>
            <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopyContent}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? t.upgrade.copied : t.upgrade.copy}
            </button>
          </div>
        </div>
      </div>

      <p className={styles.qrNote}>
        {t.upgrade.payNote} <strong>{t.upgrade.hours24}</strong>.
      </p>
    </div>
  );
}

export default function UpgradeModal({ onClose }) {
  const { plan } = usePlan();
  const user = useAuthStore(s => s.user);
  const t = useT();
  const [payingPlan, setPayingPlan] = useState(null);

  const activePlans = getPlans(t).map(p => ({
    ...p,
    current: p.key === plan,
  }));

  if (payingPlan) {
    return (
      <Modal title="" onClose={onClose} noPadding>
        <PaymentQR plan={payingPlan} userCode={user?.user_code || 'DIA??????'} onBack={() => setPayingPlan(null)} t={t} />
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
          <h2 className={styles.heroTitle}>{t.upgrade.title}</h2>
          <p className={styles.heroSub}>{t.upgrade.subtitle}</p>
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
              {p.current && <span className={styles.badgeCurrent}>{t.upgrade.currentPlan}</span>}

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
                {p.current ? t.upgrade.btnCurrent : t.upgrade.btnUpgrade}
              </button>
            </div>
          ))}
        </div>

        <p className={styles.footer}>
          {t.upgrade.securePayment}
        </p>
      </div>
    </Modal>
  );
}
