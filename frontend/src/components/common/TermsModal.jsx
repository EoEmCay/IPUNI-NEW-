import { useState, useRef } from 'react';
import styles from './TermsModal.module.css';

const LOREM_IPSUM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc. Nullam arcu. Aliquam consequat. Curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Aenean magna nisl, mollis quis, molestie eu, feugiat in, nisi. Aenean dictum pellentesque lectus. Suspendisse aw. 

Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.`;

export default function TermsModal({ onComplete }) {
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
            {step === 1 ? 'Điều khoản sử dụng' : 'Quyền riêng tư'}
          </h2>
        </div>
        
        <div className={styles.content} onScroll={step === 1 ? handleScroll : undefined}>
          <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>
            {step === 1 ? 'Vui lòng đọc kỹ Điều khoản sử dụng. Cuộn xuống dưới cùng để tiếp tục.' : 'Chính sách Quyền riêng tư của Nền tảng Y tế DIA+'}
          </p>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {LOREM_IPSUM}
            {LOREM_IPSUM}
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
                Tôi đã đọc và đồng ý với các Điều khoản sử dụng và Quyền riêng tư của ứng dụng.
              </span>
            </label>
          )}
          
          <button 
            className={styles.btn} 
            disabled={step === 1 ? !canProceed : !agreed}
            onClick={nextStep}
          >
            {step === 1 ? 'Tiếp tục' : 'Hoàn tất & Sử dụng'}
          </button>
        </div>
      </div>
    </div>
  );
}
