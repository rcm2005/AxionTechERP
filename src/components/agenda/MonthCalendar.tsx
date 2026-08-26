import { eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import clsx from 'clsx';
import type { EventoAgenda } from '@/types';
import { REFERENCE_DATE } from '@/config/app';
import { EventChip } from './EventChip';
import styles from './MonthCalendar.module.scss';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MAX_CHIPS_PER_DAY = 3;

interface MonthCalendarProps {
  mes: Date;
  eventos: EventoAgenda[];
}

export function MonthCalendar({ mes, eventos }: MonthCalendarProps) {
  const hoje = parseISO(REFERENCE_DATE);
  const inicio = startOfWeek(startOfMonth(mes), { weekStartsOn: 0 });
  const fim = endOfWeek(endOfMonth(mes), { weekStartsOn: 0 });
  const dias = eachDayOfInterval({ start: inicio, end: fim });

  return (
    <div className={styles.grid}>
      {WEEKDAYS.map((d) => (
        <div key={d} className={styles.weekday}>
          {d}
        </div>
      ))}

      {dias.map((dia) => {
        const eventosDoDia = eventos
          .filter((e) => isSameDay(parseISO(e.inicio), dia))
          .sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
        const visiveis = eventosDoDia.slice(0, MAX_CHIPS_PER_DAY);
        const restantes = eventosDoDia.length - visiveis.length;

        return (
          <div
            key={dia.toISOString()}
            className={clsx(
              styles.day,
              isSameDay(dia, hoje) && styles.today,
              !isSameMonth(dia, mes) && styles.outside,
            )}
          >
            <div className={styles.num}>{dia.getDate()}</div>
            {visiveis.map((evento) => (
              <EventChip key={evento.id} evento={evento} />
            ))}
            {restantes > 0 && <div className={styles.more}>+{restantes}</div>}
          </div>
        );
      })}
    </div>
  );
}
