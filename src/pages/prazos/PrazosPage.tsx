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
import { alterarStatusPrazo } from '@/services/prazos.service';
import { classificarPrazo } from '@/utils/prazos';
import { paths } from '@/routes/paths';
import type { Prazo, PrazoStatus } from '@/types';
import styles from './PrazosPage.module.scss';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'cumprido', label: 'Cumpridos' },
  { value: 'perdido', label: 'Perdidos' },
];

const URGENCIA_OPTIONS = [
  { value: 'todos', label: 'Todos os prazos' },
  { value: 'criticos', label: 'Somente críticos (vencidos ou até 3 dias)' },
];

export function PrazosPage() {
  useDocumentTitle('Prazos');
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState<PrazoStatus | 'todos'>('pendente');
  const [urgencia, setUrgencia] = useState('todos');
  const [novoOpen, setNovoOpen] = useState(false);
  const [salvandoId, setSalvandoId] = useState<string>();

  const { data: prazos, loading, error, reload } = usePrazos({ status });
  const { data: processos } = useProcessos();

  const rotuloProcesso = useMemo(() => {
    const mapa = new Map((processos ?? []).map((p) => [p.id, p.numero_cnj]));
    return (id: string) => mapa.get(id) ?? '—';
  }, [processos]);

  /** Urgência depende da data de hoje, não do backend — por isso é filtro local. */
  const linhas = useMemo(() => {
    const todos = prazos ?? [];
    if (urgencia !== 'criticos') return todos;
    return todos.filter((p) => {
      const c = classificarPrazo(p);
      return c.urgencia === 'vencido' || c.urgencia === 'urgente';
    });
  }, [prazos, urgencia]);

  const resumo = useMemo(() => {
    const pendentes = (prazos ?? []).filter((p) => p.status === 'pendente');
    let vencidos = 0;
    let criticos = 0;
    for (const p of pendentes) {
      const { urgencia: u } = classificarPrazo(p);
      if (u === 'vencido') vencidos += 1;
      else if (u === 'urgente') criticos += 1;
    }
    return { pendentes: pendentes.length, vencidos, criticos };
  }, [prazos]);

  async function handleMarcarCumprido(prazo: Prazo) {
    setSalvandoId(prazo.id);
    try {
      await alterarStatusPrazo(prazo.id, 'cumprido');
      toast.show('Prazo marcado como cumprido.');
      reload();
    } catch {
      toast.show('Não foi possível atualizar o prazo.');
    } finally {
      setSalvandoId(undefined);
    }
  }

  const columns = useMemo(
    () => criarPrazosColumns({ rotuloProcesso, onMarcarCumprido: handleMarcarCumprido, salvandoId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotuloProcesso, salvandoId],
  );

  return (
    <section>
      <PageHead
        title="Prazos"
        subtitle="Prazos fatais do escritório. Perder um prazo fatal extingue o direito processual — o painel prioriza o que vence primeiro."
        actions={
          <Button variant="primary" onClick={() => setNovoOpen(true)}>
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
            <KpiCard label="Prazos pendentes" value={String(resumo.pendentes)} />
            <KpiCard
              label="Vencendo em até 3 dias"
              value={String(resumo.criticos)}
              sub={resumo.criticos > 0 ? 'Exigem ação imediata' : 'Nada crítico agora'}
              subTone={resumo.criticos > 0 ? 'red' : 'green'}
            />
            <KpiCard
              label="Já vencidos e pendentes"
              value={String(resumo.vencidos)}
              sub={resumo.vencidos > 0 ? 'Verificar perda de prazo' : 'Nenhum em atraso'}
              subTone={resumo.vencidos > 0 ? 'red' : 'green'}
            />
          </div>

          <Toolbar>
            <SelectField
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value as PrazoStatus | 'todos')}
            />
            <SelectField
              options={URGENCIA_OPTIONS}
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value)}
            />
          </Toolbar>

          <Card>
            <DataTable
              columns={columns}
              rows={linhas}
              getRowId={(p) => p.id}
              loading={loading}
              emptyMessage="Nenhum prazo encontrado para os filtros selecionados."
              onRowClick={(p) => navigate(paths.processo(p.processo_id))}
            />
          </Card>
        </>
      )}

      <NovoPrazoModal open={novoOpen} onClose={() => setNovoOpen(false)} onCreated={reload} />
    </section>
  );
}
