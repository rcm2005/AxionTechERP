import clsx from 'clsx';
import styles from './Avatar.module.scss';

interface AvatarProps {
  iniciais: string;
  size?: 'md' | 'sm';
}

export function Avatar({ iniciais, size = 'md' }: AvatarProps) {
  return <div className={clsx(styles.root, size === 'sm' && styles.sm)}>{iniciais}</div>;
}
