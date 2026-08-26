import { parseISO } from 'date-fns';
import type { EventoAgenda } from '@/types';
import { formatDayMonth, formatTime } from '@/utils/format';
import { prioridadeEventoMeta, tipoEventoMeta } from '@/utils/statusMaps';
import { Pill } from '@/components/ui/Pill/Pill';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import styles from './UpcomingEventsList.module.scss';

interface UpcomingEventsListProps {
  eventos: EventoAgenda[];
  fromDate: Date;
  limit?: number;
}

export function UpcomingEventsList({ eventos, fromDate, limit = 8 }: UpcomingEventsListProps) {
  const proximos = eventos
    .filter((e) => parseISO(e.inicio) >= fromDate)
    .sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
    .slice(0, limit);

  if (proximos.length === 0) {
    return <EmptyState title="Nenhum evento futuro para os filtros selecionados." />;
  }

  return (
    <div className={styles.list}>
      {proximos.map((evento) => {
        const tipoMeta = tipoEventoMeta[evento.tipo];
        const prioridadeMeta = prioridadeEventoMeta[evento.prioridade];
        return (
          <div key={evento.id} className={styles.item}>
            <div>
              <div className={styles.title}>
                {tipoMeta.emoji} {evento.titulo}
              </div>
              <div className={styles.sub}>
                {formatDayMonth(evento.inicio)}
                {!evento.diaInteiro && ` • ${formatTime(evento.inicio)}`}
              </div>
            </div>
            <Pill tone={prioridadeMeta.tone}>{prioridadeMeta.label}</Pill>
          </div>
        );
      })}
    </div>
  );
}
