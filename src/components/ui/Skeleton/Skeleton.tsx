import clsx from 'clsx';
import styles from './Skeleton.module.scss';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '14px', className }: SkeletonProps) {
  return <span className={clsx(styles.root, className)} style={{ width, height }} />;
}
