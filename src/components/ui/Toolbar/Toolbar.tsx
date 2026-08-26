import type { ReactNode } from 'react';
import styles from './Toolbar.module.scss';

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}
