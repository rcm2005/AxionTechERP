import { useMemo } from 'react';
import { NavLink } from 'react-router';
import clsx from 'clsx';
import { APP_NAME, APP_TAGLINE, NAV_ITEMS, OFFICE_NAME } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/mocks';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const { usuario } = useAuth();
  const REFERENCE_DATE = new Date('2026-08-18');
  const urgentes = useMemo(
    () => db.processos.filter((p) => p.proximoPrazo && new Date(p.proximoPrazo) <= REFERENCE_DATE).length,
    [],
  );

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
            title={item.label}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {item.path.includes('processos') && urgentes > 0 && (
              <span className={styles.navBadge}>{urgentes}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userFooter}>
          <Avatar iniciais={usuario?.iniciais ?? 'YS'} />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{usuario?.nomeExibicao ?? 'Dra. Yasmin Santos'}</span>
            <span className={styles.userRole}>{OFFICE_NAME}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
