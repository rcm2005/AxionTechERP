import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Alert.module.scss';

interface AlertProps {
  tone?: 'warning' | 'danger';
  title: string;
  description: string;
  action?: ReactNode;
}

export function Alert({ tone = 'warning', title, description, action }: AlertProps) {
  return (
    <div className={clsx(styles.root, tone === 'danger' && styles.danger)}>
      <strong>{title}</strong>
      <br />
      <span className={styles.description}>{description}</span>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
