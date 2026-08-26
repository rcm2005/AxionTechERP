import { NavLink } from 'react-router';
import clsx from 'clsx';
import styles from './Tabs.module.scss';

export interface TabItem {
  key: string;
  label: string;
  to: string;
}

interface TabsProps {
  items: TabItem[];
}

export function Tabs({ items }: TabsProps) {
  return (
    <div className={styles.root}>
      {items.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end
          className={({ isActive }) => clsx(styles.tab, isActive && styles.active)}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
