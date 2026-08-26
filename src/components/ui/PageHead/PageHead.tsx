import type { ReactNode } from 'react';
import styles from './PageHead.module.scss';

interface PageHeadProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHead({ title, subtitle, actions }: PageHeadProps) {
  return (
    <div className={styles.root}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
