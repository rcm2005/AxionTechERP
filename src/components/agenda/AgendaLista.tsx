import { useMemo } from 'react';
import { isToday, isTomorrow, parseISO } from 'date-fns';
import { Pill } from '@/components/ui/Pill/Pill';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { formatLongDate, formatTime } from '@/utils/format';
import type { AgendaEvento, AgendaEventoTipo, Tone } from '@/types';
import styles from './AgendaLista.module.scss';

const TIPO_META: Record<AgendaEventoTipo, { label: string; tone: Tone }> = {
  audiencia: { label: 'Audiência', tone: 'purple' },
  reuniao: { label: 'Reunião', tone: 'blue' },
  outro: { label: 'Outro', tone: 'neutral' },
};

function toneDoStatus(status: string): Tone {
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
  eventos: AgendaEvento[];
  loading?: boolean;
  /** Nome do responsável — não vem no payload do evento, só o id. */
  nomeResponsavel?: (usuarioId: string) => string;
  /** Rótulo do processo vinculado (número CNJ), quando houver. */
  rotuloProcesso?: (processoId: string) => string;
  emptyMessage?: string;
}

/**
 * Agenda em lista agrupada por dia.
 *
 * Uma tabela plana esconderia o que essa tela precisa comunicar (o que é hoje,
 * o que é amanhã, quanto tempo sobra entre um compromisso e outro). Um grid de
 * calendário completo seria muito mais código para o mesmo ganho neste momento.
 */
export function AgendaLista({
  eventos,
  loading,
  nomeResponsavel,
  rotuloProcesso,
  emptyMessage = 'Nenhum compromisso encontrado.',
}: Props) {
  const grupos = useMemo(() => agruparPorDia(eventos), [eventos]);

  if (loading) return <Skeleton height="320px" />;
  if (eventos.length === 0) return <EmptyState title={emptyMessage} />;

  return (
    <div className={styles.root}>
      {grupos.map(([diaIso, doDia]) => (
        <section key={diaIso} className={styles.grupo}>
          <header className={styles.grupoHead}>
            <h3>{rotuloDoDia(diaIso)}</h3>
            <span className={styles.contagem}>
              {doDia.length} {doDia.length === 1 ? 'compromisso' : 'compromissos'}
            </span>
          </header>

          <ul className={styles.lista}>
            {doDia.map((ev) => (
              <li key={ev.id} className={styles.item}>
                <div className={styles.hora}>
                  <strong>{formatTime(ev.data_hora)}</strong>
                  <small>{ev.duracao_minutos} min</small>
                </div>
                <div className={styles.corpo}>
                  <div className={styles.linhaTopo}>
                    <Pill tone={TIPO_META[ev.tipo]?.tone ?? 'neutral'}>
                      {TIPO_META[ev.tipo]?.label ?? ev.tipo}
                    </Pill>
                    <Pill tone={toneDoStatus(ev.status)}>{ev.status}</Pill>
                  </div>
                  <div className={styles.local}>{ev.local}</div>
                  <small className={styles.meta}>
                    {nomeResponsavel ? `Responsável: ${nomeResponsavel(ev.responsavel_usuario_id)}` : ''}
                    {ev.processo_id && rotuloProcesso
                      ? `${nomeResponsavel ? ' • ' : ''}Processo ${rotuloProcesso(ev.processo_id)}`
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

/** Agrupa por dia local preservando a ordem cronológica que veio do serviço. */
function agruparPorDia(eventos: AgendaEvento[]): [string, AgendaEvento[]][] {
  const mapa = new Map<string, AgendaEvento[]>();
  for (const ev of eventos) {
    const dia = chaveDoDia(ev.data_hora);
    const atual = mapa.get(dia);
    if (atual) atual.push(ev);
    else mapa.set(dia, [ev]);
  }
  return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/** "YYYY-MM-DD" no fuso do usuário (não em UTC, senão eventos noturnos pulam de dia). */
function chaveDoDia(iso: string): string {
  const d = new Date(iso);
  const mes = `${d.getMonth() + 1}`.padStart(2, '0');
  const dia = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function rotuloDoDia(diaIso: string): string {
  const data = parseISO(diaIso);
  if (isToday(data)) return `Hoje — ${formatLongDate(diaIso)}`;
  if (isTomorrow(data)) return `Amanhã — ${formatLongDate(diaIso)}`;
  return formatLongDate(diaIso);
}
