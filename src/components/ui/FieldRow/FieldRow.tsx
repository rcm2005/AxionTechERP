import type { ReactNode } from 'react';
import styles from './FieldRow.module.scss';

interface FieldRowProps {
  label: string;
  children: ReactNode;
}

export function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className={styles.root}>
      <label>{label}</label>
      <strong>{children}</strong>
    </div>
  );
}
