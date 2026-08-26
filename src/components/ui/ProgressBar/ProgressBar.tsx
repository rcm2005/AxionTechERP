import styles from './ProgressBar.module.scss';

interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className={styles.root}>
      <span style={{ width: `${clamped}%` }} />
    </div>
  );
}
