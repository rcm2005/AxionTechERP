import clsx from 'clsx';
import type { Tone } from '@/types';
import styles from './KpiCard.module.scss';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  subTone?: Tone;
  showDot?: boolean;
  size?: 'md' | 'sm';
}

export function KpiCard({ label, value, sub, subTone, showDot, size = 'md' }: KpiCardProps) {
  return (
    <div className={clsx(styles.root, size === 'sm' && styles.sm)}>
      <div className={styles.top}>
        {label}
        {showDot && <span className={styles.dot} />}
      </div>
      <div className={styles.value}>{value}</div>
      {sub && <div className={clsx(styles.sub, subTone && styles[`tone-${subTone}`])}>{sub}</div>}
    </div>
  );
}
