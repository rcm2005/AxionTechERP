import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Card.module.scss';

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function Card({ children, className, padded }: CardProps) {
  return <div className={clsx(styles.root, padded && styles.padded, className)}>{children}</div>;
}

interface CardHeadProps {
  title: ReactNode;
  action?: ReactNode;
}

export function CardHead({ title, action }: CardHeadProps) {
  return (
    <div className={styles.head}>
      <h3>{title}</h3>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(styles.body, className)}>{children}</div>;
}
