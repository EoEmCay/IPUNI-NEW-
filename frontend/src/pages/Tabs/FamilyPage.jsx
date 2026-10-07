import FamilyCard from '../../components/settings/FamilyCard';
import TelegramCard from '../../components/settings/TelegramCard';
import styles from './TabPages.module.css';

// Tab Gia đình: kết nối người nhà bằng mã + nhận cảnh báo qua Telegram (trước nằm trong Cài đặt).
export default function FamilyPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Gia đình</h1>
      <p className={styles.subtitle}>Người nhà được báo khi bạn quên uống thuốc hoặc đường huyết bất thường.</p>
      <FamilyCard />
      <TelegramCard />
    </div>
  );
}
