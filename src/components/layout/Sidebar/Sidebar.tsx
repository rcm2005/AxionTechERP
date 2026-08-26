import { NavLink } from 'react-router';
import clsx from 'clsx';
import { APP_NAME, APP_TAGLINE, NAV_ITEMS, OFFICE_NAME } from '@/config/app';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  return (
    <aside className={styles.root}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>⚖</div>
        <div>
          <span className={styles.brandName}>{APP_NAME}</span>
          <small className={styles.brandTagline}>{APP_TAGLINE}</small>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(styles.navButton, isActive && styles.active)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        {OFFICE_NAME}
        <br />
        Demo MVP • 2026
      </div>
    </aside>
  );
}
