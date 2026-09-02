import { useMemo } from 'react';
import { isToday, isTomorrow, parseISO } from 'date-fns';
import { Pill } from '@/components/ui/Pill/Pill';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { formatLongDate, formatTime } from '@/utils/format';
import type { AgendaEvento, AgendaEventoTipo, Tone } from '@/types';
import styles from './AgendaLista.module.scss';

const TYPE_META: Record<AgendaEventoTipo, { label: string; tone: Tone }> = {
  audiencia: { label: 'Audiência', tone: 'purple' },
  reuniao: { label: 'Reunião', tone: 'blue' },
  outro: { label: 'Outro', tone: 'neutral' },
};

function getStatusTone(status: string): Tone {
  switch (status.toLowerCase()) {
    case 'realizado':
      return 'green';
    case 'cancelado':
      return 'red';
    default:
      return 'blue';
  }
}

interface Props {
  events: AgendaEvento[];
  loading?: boolean;
  /** Assignee name — not in the event payload, only the id. */
  nomeResponsavel?: (usuarioId: string) => string;
  /** Linked case label (CNJ number), if any. */
  rotuloProcesso?: (processoId: string) => string;
  emptyMessage?: string;
}

/**
 * Schedule list grouped by day.
 *
 * A flat table would hide what this screen needs to communicate (what is today,
 * what is tomorrow, how much time is left between appointments). A full calendar
 * grid would be much more code for the same benefit at this point.
 */
export function AgendaLista({
  events,
  loading,
  nomeResponsavel,
  rotuloProcesso,
  emptyMessage = 'Nenhum compromisso encontrado.',
}: Props) {
  const groups = useMemo(() => groupByDay(events), [events]);

  if (loading) return <Skeleton height="320px" />;
  if (events.length === 0) return <EmptyState title={emptyMessage} />;

  return (
    <div className={styles.root}>
      {groups.map(([dayIso, dayEvents]) => (
        <section key={dayIso} className={styles.grupo}>
          <header className={styles.grupoHead}>
            <h3>{getDayLabel(dayIso)}</h3>
            <span className={styles.contagem}>
              {dayEvents.length} {dayEvents.length === 1 ? 'compromisso' : 'compromissos'}
            </span>
          </header>

          <ul className={styles.lista}>
            {dayEvents.map((event) => (
              <li key={event.id} className={styles.item}>
                <div className={styles.hora}>
                  <strong>{formatTime(event.data_hora)}</strong>
                  <small>{event.duracao_minutos} min</small>
                </div>
                <div className={styles.corpo}>
                  <div className={styles.linhaTopo}>
                    <Pill tone={TYPE_META[event.tipo]?.tone ?? 'neutral'}>
                      {TYPE_META[event.tipo]?.label ?? event.tipo}
                    </Pill>
                    <Pill tone={getStatusTone(event.status)}>{event.status}</Pill>
                  </div>
                  <div className={styles.local}>{event.local}</div>
                  <small className={styles.meta}>
                    {nomeResponsavel ? `Responsável: ${nomeResponsavel(event.responsavel_usuario_id)}` : ''}
                    {event.processo_id && rotuloProcesso
                      ? `${nomeResponsavel ? ' • ' : ''}Processo ${rotuloProcesso(event.processo_id)}`
                      : ''}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Groups by local day preserving chronological order from the service. */
function groupByDay(events: AgendaEvento[]): [string, AgendaEvento[]][] {
  const map = new Map<string, AgendaEvento[]>();
  for (const event of events) {
    const day = getDayKey(event.data_hora);
    const current = map.get(day);
    if (current) current.push(event);
    else map.set(day, [event]);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/** "YYYY-MM-DD" in user's timezone (not in UTC, otherwise night events jump to next day). */
function getDayKey(iso: string): string {
  const d = new Date(iso);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function getDayLabel(dayIso: string): string {
  const date = parseISO(dayIso);
  if (isToday(date)) return `Hoje — ${formatLongDate(dayIso)}`;
  if (isTomorrow(date)) return `Amanhã — ${formatLongDate(dayIso)}`;
  return formatLongDate(dayIso);
}
