import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { addMonths, format, parse, startOfMonth, subMonths } from 'date-fns';
import { db } from '@/mocks';
import { REFERENCE_DATE } from '@/config/app';
import { useAgenda } from '@/hooks/useAgenda';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { AgendaFiltros, PrioridadeEvento, TipoEvento } from '@/types';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Toolbar } from '@/components/ui/Toolbar/Toolbar';
import { SelectField } from '@/components/ui/SelectField/SelectField';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { CalendarNav } from '@/components/agenda/CalendarNav';
import { MonthCalendar } from '@/components/agenda/MonthCalendar';
import { UpcomingEventsList } from '@/components/agenda/UpcomingEventsList';
import { NovaTarefaModal } from '@/components/modais/NovaTarefaModal';
import styles from './AgendaPage.module.scss';

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'prazo', label: 'Prazo' },
  { value: 'audiencia', label: 'Audiência' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'tarefa', label: 'Tarefa' },
];

const PRIORIDADE_OPTIONS = [
  { value: 'todas', label: 'Todas as prioridades' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'atencao', label: 'Atenção' },
  { value: 'normal', label: 'Normal' },
];

const MES_PARAM = 'mes';

export function AgendaPage() {
  useDocumentTitle('Agenda & Prazos');
  const [searchParams, setSearchParams] = useSearchParams();
  const [responsavelId, setResponsavelId] = useState('todos');
  const [tipo, setTipo] = useState<TipoEvento | 'todos'>('todos');
  const [prioridade, setPrioridade] = useState<PrioridadeEvento | 'todas'>('todas');
  const [novaTarefaOpen, setNovaTarefaOpen] = useState(false);

  const mesParam = searchParams.get(MES_PARAM);
  const mes = useMemo(() => {
    if (mesParam) {
      const parsed = parse(mesParam, 'yyyy-MM', new Date());
      if (!Number.isNaN(parsed.getTime())) return startOfMonth(parsed);
    }
    return startOfMonth(new Date(REFERENCE_DATE));
  }, [mesParam]);

  function irParaMes(novoMes: Date) {
    setSearchParams({ [MES_PARAM]: format(novoMes, 'yyyy-MM') });
  }

  const filtros: AgendaFiltros = { responsavelId, tipo, prioridade };
  const { data: eventos, loading } = useAgenda(filtros);

  const responsavelOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos os advogados' },
      ...db.usuarios.filter((u) => u.role !== 'financeiro').map((u) => ({ value: u.id, label: u.nomeExibicao })),
    ],
    [],
  );

  return (
    <section>
      <PageHead
        title="Agenda & Prazos"
        subtitle="Calendário operacional para compromissos, audiências e prazos."
        actions={
          <Button variant="primary" onClick={() => setNovaTarefaOpen(true)}>
            + Novo evento
          </Button>
        }
      />

      <Toolbar>
        <SelectField
          options={responsavelOptions}
          value={responsavelId}
          onChange={(e) => setResponsavelId(e.target.value)}
        />
        <SelectField options={TIPO_OPTIONS} value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} />
        <SelectField
          options={PRIORIDADE_OPTIONS}
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value as typeof prioridade)}
        />
      </Toolbar>

      <div className={styles.grid}>
        <Card padded>
          <CalendarNav mes={mes} onPrev={() => irParaMes(subMonths(mes, 1))} onNext={() => irParaMes(addMonths(mes, 1))} />
          {loading ? <Skeleton height="520px" /> : <MonthCalendar mes={mes} eventos={eventos ?? []} />}
        </Card>

        <Card>
          <CardHead title="Próximos eventos" />
          <CardBody>
            {loading ? (
              <Skeleton height="240px" />
            ) : (
              <UpcomingEventsList eventos={eventos ?? []} fromDate={new Date(REFERENCE_DATE)} />
            )}
          </CardBody>
        </Card>
      </div>

      <NovaTarefaModal open={novaTarefaOpen} onClose={() => setNovaTarefaOpen(false)} />
    </section>
  );
}
