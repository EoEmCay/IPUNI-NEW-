import TopBar from './TopBar';
import BottomNav from './BottomNav';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }) {
  return (
    <div className={styles.layout}>
      <TopBar />
      <main className="page-content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
