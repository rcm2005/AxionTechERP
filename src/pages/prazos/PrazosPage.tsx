import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePrazos } from '@/hooks/usePrazos';
import { useProcessos } from '@/hooks/useProcessos';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/contexts/ToastContext';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Toolbar } from '@/components/ui/Toolbar/Toolbar';
import { SelectField } from '@/components/ui/SelectField/SelectField';
import { Card } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { criarPrazosColumns } from '@/components/prazos/prazosColumns';
import { NovoPrazoModal } from '@/components/modais/NovoPrazoModal';
import { changeDeadlineStatus } from '@/services/prazos.service';
import { classifyDeadline } from '@/utils/prazos';
import { paths } from '@/routes/paths';
import type { Prazo, PrazoStatus } from '@/types';
import styles from './PrazosPage.module.scss';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'cumprido', label: 'Cumpridos' },
  { value: 'perdido', label: 'Perdidos' },
];

const URGENCY_OPTIONS = [
  { value: 'todos', label: 'Todos os prazos' },
  { value: 'criticos', label: 'Somente críticos (vencidos ou até 3 dias)' },
];

export function PrazosPage() {
  useDocumentTitle('Prazos');
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState<PrazoStatus | 'todos'>('pendente');
  const [urgency, setUrgency] = useState('todos');
  const [newOpen, setNewOpen] = useState(false);
  const [savingId, setSavingId] = useState<string>();

  const { data: deadlines, loading, error, reload } = usePrazos({ status });
  const { data: cases } = useProcessos();

  const caseLabel = useMemo(() => {
    const map = new Map((cases ?? []).map((c) => [c.id, c.numero_cnj]));
    return (id: string) => map.get(id) ?? '—';
  }, [cases]);

  /** Urgency depends on today's date, not the backend — that's why it is a local filter. */
  const rows = useMemo(() => {
    const all = deadlines ?? [];
    if (urgency !== 'criticos') return all;
    return all.filter((deadline) => {
      const c = classifyDeadline(deadline);
      return c.urgencyLevel === 'vencido' || c.urgencyLevel === 'urgente';
    });
  }, [deadlines, urgency]);

  const summary = useMemo(() => {
    const pending = (deadlines ?? []).filter((d) => d.status === 'pendente');
    let overdue = 0;
    let critical = 0;
    for (const deadline of pending) {
      const { urgencyLevel: u } = classifyDeadline(deadline);
      if (u === 'vencido') overdue += 1;
      else if (u === 'urgente') critical += 1;
    }
    return { pending: pending.length, overdue, critical };
  }, [deadlines]);

  async function handleMarkCompleted(deadline: Prazo) {
    setSavingId(deadline.id);
    try {
      await changeDeadlineStatus(deadline.id, 'cumprido');
      toast.show('Prazo marcado como cumprido.');
      reload();
    } catch {
      toast.show('Não foi possível atualizar o prazo.');
    } finally {
      setSavingId(undefined);
    }
  }

  const columns = useMemo(
    () => criarPrazosColumns({ rotuloProcesso: caseLabel, onMarcarCumprido: handleMarkCompleted, salvandoId: savingId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseLabel, savingId],
  );

  return (
    <section>
      <PageHead
        title="Prazos"
        subtitle="Prazos fatais do escritório. Perder um prazo fatal extingue o direito processual — o painel prioriza o que vence primeiro."
        actions={
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            + Novo prazo
          </Button>
        }
      />

      {error ? (
        <Alert
          tone="danger"
          title="Erro ao carregar dados"
          description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
          action={
            <Button variant="ghost" onClick={reload}>
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <>
          <div className={styles.kpis}>
            <KpiCard label="Prazos pendentes" value={String(summary.pending)} />
            <KpiCard
              label="Vencendo em até 3 dias"
              value={String(summary.critical)}
              sub={summary.critical > 0 ? 'Exigem ação imediata' : 'Nada crítico agora'}
              subTone={summary.critical > 0 ? 'red' : 'green'}
            />
            <KpiCard
              label="Já vencidos e pendentes"
              value={String(summary.overdue)}
              sub={summary.overdue > 0 ? 'Verificar perda de prazo' : 'Nenhum em atraso'}
              subTone={summary.overdue > 0 ? 'red' : 'green'}
            />
          </div>

          <Toolbar>
            <SelectField
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value as PrazoStatus | 'todos')}
            />
            <SelectField
              options={URGENCY_OPTIONS}
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            />
          </Toolbar>

          <Card>
            <DataTable
              columns={columns}
              rows={rows}
              getRowId={(d) => d.id}
              loading={loading}
              emptyMessage="Nenhum prazo encontrado para os filtros selecionados."
              onRowClick={(d) => navigate(paths.processo(d.processo_id))}
            />
          </Card>
        </>
      )}

      <NovoPrazoModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={reload} />
    </section>
  );
}
