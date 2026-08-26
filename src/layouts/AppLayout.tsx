import { Outlet } from 'react-router';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Topbar } from '@/components/layout/Topbar/Topbar';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import styles from './AppLayout.module.scss';

export function AppLayout() {
  return (
    <div>
      <ScrollToTop />
      <Sidebar />
      <main className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
