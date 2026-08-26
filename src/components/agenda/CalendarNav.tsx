import { Button } from '@/components/ui/Button/Button';
import { formatMonthYear } from '@/utils/format';
import styles from './CalendarNav.module.scss';

interface CalendarNavProps {
  mes: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarNav({ mes, onPrev, onNext }: CalendarNavProps) {
  const titulo = formatMonthYear(mes.toISOString());

  return (
    <div className={styles.root}>
      <Button aria-label="Mês anterior" onClick={onPrev}>
        ‹
      </Button>
      <div className={styles.title}>{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</div>
      <Button aria-label="Próximo mês" onClick={onNext}>
        ›
      </Button>
    </div>
  );
}
