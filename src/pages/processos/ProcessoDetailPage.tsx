import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useProcesso } from '@/hooks/useProcessos';
import { usePrazos } from '@/hooks/usePrazos';
import { useAgenda, useUsuarios } from '@/hooks/useAgenda';
import { useCliente } from '@/hooks/useClientes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/contexts/ToastContext';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { Pill } from '@/components/ui/Pill/Pill';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Button } from '@/components/ui/Button/Button';
import { Alert } from '@/components/ui/Alert/Alert';
import { AgendaLista } from '@/components/agenda/AgendaLista';
import { criarPrazosColumns } from '@/components/prazos/prazosColumns';
import { toneDoStatusProcesso } from '@/components/processos/processosColumns';
import { NovoPrazoModal } from '@/components/modais/NovoPrazoModal';
import { NovoEventoAgendaModal } from '@/components/modais/NovoEventoAgendaModal';
import { alterarStatusPrazo } from '@/services/prazos.service';
import { paths } from '@/routes/paths';
import { formatBRLDecimal } from '@/utils/format';
import { classificarPrazo } from '@/utils/prazos';
import type { Prazo } from '@/types';
import styles from './ProcessoDetailPage.module.scss';

/**
 * Case details page.
 *
 * Deadlines and schedule depend on the case (`processo_id`), so they are loaded and
 * displayed here as stacked sections. We opted NOT to use `processoTabs`
 * (from `routes/paths.ts`): out of those seven tabs, four (procedural steps, documents,
 * tasks, case financials) currently have no backend endpoint, and empty tabs
 * communicate "broken" rather than "coming soon". Once those features
 * exist, the sections here can become tabs using the already-prepared `processoTab` route.
 */
export function ProcessoDetailPage() {
  const { processoId: caseId } = useParams<{ processoId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    data: caseItem,
    loading: loadingCase,
    error: caseError,
    reload: reloadCase,
  } = useProcesso(caseId);
  const { data: client } = useCliente(caseItem?.cliente_id);
  const {
    data: deadlines,
    loading: loadingDeadlines,
    error: deadlinesError,
    reload: reloadDeadlines,
  } = usePrazos(caseId ? { processo_id: caseId } : {});
  const {
    data: events,
    loading: loadingEvents,
    error: eventsError,
    reload: reloadEvents,
  } = useAgenda(caseId ? { processo_id: caseId } : {});
  const { data: users } = useUsuarios();

  const [newDeadlineOpen, setNewDeadlineOpen] = useState(false);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [savingDeadlineId, setSavingDeadlineId] = useState<string>();

  useDocumentTitle(caseItem ? `Processo ${caseItem.numero_cnj}` : 'Processo');

  const responsibleName = useMemo(() => {
    const userMap = new Map((users ?? []).map((user) => [user.id, user.nome]));
    return (id: string) => userMap.get(id) ?? '—';
  }, [users]);

  const pendingDeadlines = useMemo(
    () => (deadlines ?? []).filter((deadline) => deadline.status === 'pendente'),
    [deadlines],
  );
  const urgentDeadlines = useMemo(
    () =>
      pendingDeadlines.filter((deadline) => {
        const { urgencia } = classificarPrazo(deadline);
        return urgencia === 'urgente' || urgencia === 'vencido';
      }),
    [pendingDeadlines],
  );

  async function handleMarcarCumprido(deadline: Prazo) {
    setSavingDeadlineId(deadline.id);
    try {
      await alterarStatusPrazo(deadline.id, 'cumprido');
      toast.show('Prazo marcado como cumprido.');
      reloadDeadlines();
    } catch {
      toast.show('Não foi possível atualizar o prazo.');
    } finally {
      setSavingDeadlineId(undefined);
    }
  }

  const deadlinesColumns = useMemo(
    () =>
      criarPrazosColumns({
        onMarcarCumprido: handleMarcarCumprido,
        salvandoId: savingDeadlineId,
      }),
    // handleMarcarCumprido is recreated on each render; columns only need
    // to track the id being saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savingDeadlineId],
  );

  if (loadingCase) return <Skeleton height="400px" />;
  if (caseError) {
    return (
      <Alert
        tone="danger"
        title="Erro ao carregar dados"
        description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
        action={
          <Button variant="ghost" onClick={reloadCase}>
            Tentar novamente
          </Button>
        }
      />
    );
  }
  if (!caseItem) return <EmptyState title="Processo não encontrado." />;

  return (
    <section>
      <PageHead
        title={caseItem.numero_cnj}
        subtitle={`${caseItem.tribunal} • ${caseItem.vara}`}
        actions={
          <Button variant="ghost" onClick={() => navigate(paths.processos)}>
            ← Voltar aos processos
          </Button>
        }
      />

      <div className={styles.headerGrid}>
        <Card>
          <div className={styles.infoGrid}>
            <Info label="Cliente">{client?.razaoSocialOuNome ?? '—'}</Info>
            <Info label="Status">
              <Pill tone={toneDoStatusProcesso(caseItem.status)}>{caseItem.status}</Pill>
            </Info>
            <Info label="Fase">
              <Pill tone="blue">{caseItem.fase}</Pill>
            </Info>
            <Info label="Tribunal">{caseItem.tribunal}</Info>
            <Info label="Vara">{caseItem.vara}</Info>
            <Info label="Valor da causa">{formatBRLDecimal(caseItem.valor_causa)}</Info>
          </div>
        </Card>

        <div className={styles.kpis}>
          <KpiCard label="Prazos pendentes" value={String(pendingDeadlines.length)} />
          <KpiCard
            label="Prazos fatais críticos"
            value={String(urgentDeadlines.length)}
            sub={urgentDeadlines.length > 0 ? 'Vencidos ou vencendo em até 3 dias' : 'Nenhum prazo crítico'}
            subTone={urgentDeadlines.length > 0 ? 'red' : 'green'}
          />
          <KpiCard label="Compromissos na agenda" value={String((events ?? []).length)} />
        </div>
      </div>

      <Card className={styles.secao}>
        <CardHead title="Partes do processo" />
        <CardBody>
          {caseItem.partes.length === 0 ? (
            <EmptyState title="Nenhuma parte cadastrada neste processo." />
          ) : (
            <ul className={styles.partes}>
              {caseItem.partes.map((party, index) => (
                <li key={`${party.nome}-${index}`}>
                  <strong>{party.nome}</strong>
                  <span>
                    {party.papel}
                    {party.cpf_cnpj ? ` • ${party.cpf_cnpj}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className={styles.secao}>
        <CardHead
          title="Prazos"
          action={
            <Button variant="primary" onClick={() => setNewDeadlineOpen(true)}>
              + Novo prazo
            </Button>
          }
        />
        {deadlinesError ? (
          <CardBody>
            <Alert
              tone="danger"
              title="Erro ao carregar dados"
              description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
              action={
                <Button variant="ghost" onClick={reloadDeadlines}>
                  Tentar novamente
                </Button>
              }
            />
          </CardBody>
        ) : (
          <DataTable
            columns={deadlinesColumns}
            rows={deadlines ?? []}
            getRowId={(deadline) => deadline.id}
            loading={loadingDeadlines}
            emptyMessage="Nenhum prazo cadastrado para este processo."
          />
        )}
      </Card>

      <Card className={styles.secao}>
        <CardHead
          title="Audiências e compromissos"
          action={
            <Button variant="primary" onClick={() => setNewEventOpen(true)}>
              + Novo compromisso
            </Button>
          }
        />
        <CardBody>
          {eventsError ? (
            <Alert
              tone="danger"
              title="Erro ao carregar dados"
              description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
              action={
                <Button variant="ghost" onClick={reloadEvents}>
                  Tentar novamente
                </Button>
              }
            />
          ) : (
            <AgendaLista
              eventos={events ?? []}
              loading={loadingEvents}
              nomeResponsavel={responsibleName}
              emptyMessage="Nenhum compromisso agendado para este processo."
            />
          )}
        </CardBody>
      </Card>

      <NovoPrazoModal
        open={newDeadlineOpen}
        onClose={() => setNewDeadlineOpen(false)}
        processoIdFixo={caseId}
        onCreated={reloadDeadlines}
      />
      <NovoEventoAgendaModal
        open={newEventOpen}
        onClose={() => setNewEventOpen(false)}
        processoIdFixo={caseId}
        onCreated={reloadEvents}
      />
    </section>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{children}</span>
    </div>
  );
}
