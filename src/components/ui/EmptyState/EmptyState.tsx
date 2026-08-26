import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

export function EmptyState({ title, description, icon = '—' }: EmptyStateProps) {
  return (
    <div className={styles.root}>
      <div className={styles.icon}>{icon}</div>
      <strong>{title}</strong>
      {description && <span className={styles.description}>{description}</span>}
    </div>
  );
}
