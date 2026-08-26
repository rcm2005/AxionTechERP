import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { Tone } from '@/types';
import styles from './Pill.module.scss';

interface PillProps {
  tone?: Tone;
  children: ReactNode;
}

export function Pill({ tone = 'neutral', children }: PillProps) {
  return <span className={clsx(styles.root, styles[tone])}>{children}</span>;
}
