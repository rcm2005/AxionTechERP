import styles from './Timeline.module.scss';

export interface TimelineItem {
  id: string;
  dateLabel: string;
  title: string;
  description: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className={styles.root}>
      {items.map((item) => (
        <div key={item.id} className={styles.event}>
          <div className={styles.date}>{item.dateLabel}</div>
          <div className={styles.body}>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
