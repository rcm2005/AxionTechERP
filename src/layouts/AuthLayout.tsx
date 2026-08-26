import { Outlet } from 'react-router';
import styles from './AuthLayout.module.scss';

export function AuthLayout() {
  return (
    <div className={`theme-editorial ${styles.root}`}>
      <Outlet />
    </div>
  );
}
