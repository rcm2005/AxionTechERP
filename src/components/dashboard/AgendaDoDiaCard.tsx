import { isSameDay, parseISO } from 'date-fns';
import type { EventoAgenda } from '@/types';
import { REFERENCE_DATE } from '@/config/app';
import { paths } from '@/routes/paths';
import { formatTime } from '@/utils/format';
import { prioridadeEventoMeta } from '@/utils/statusMaps';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Pill } from '@/components/ui/Pill/Pill';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import styles from './AgendaDoDiaCard.module.scss';

interface AgendaDoDiaCardProps {
  eventos: EventoAgenda[];
  loading?: boolean;
}

export function AgendaDoDiaCard({ eventos, loading }: AgendaDoDiaCardProps) {
  const hoje = parseISO(REFERENCE_DATE);
  const eventosHoje = eventos
    .filter((e) => isSameDay(parseISO(e.inicio), hoje))
    .sort((a, b) => (a.inicio < b.inicio ? -1 : 1));

  return (
    <Card>
      <CardHead
        title="Agenda de hoje"
        action={
          <Button variant="ghost" to={paths.agenda}>
            Ver agenda
          </Button>
        }
      />
      <CardBody>
        {!loading && eventosHoje.length === 0 && <EmptyState title="Nada agendado para hoje." />}
        <div className={styles.list}>
          {eventosHoje.map((evento) => {
            const meta = prioridadeEventoMeta[evento.prioridade];
            return (
              <div key={evento.id} className={styles.item}>
                <div className={styles.left}>
                  <div className={styles.time}>{evento.diaInteiro ? '—' : formatTime(evento.inicio)}</div>
                  <div>
                    <div className={styles.title}>{evento.titulo}</div>
                    {evento.local && <div className={styles.sub}>{evento.local}</div>}
                    {evento.descricao && <div className={styles.sub}>{evento.descricao}</div>}
                  </div>
                </div>
                <Pill tone={meta.tone}>{meta.label}</Pill>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
