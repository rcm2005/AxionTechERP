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
 * Tela do processo.
 *
 * Prazos e agenda pendem do processo (`processo_id`), então são carregados e
 * exibidos aqui como seções empilhadas. Optou-se por NÃO usar `processoTabs`
 * (de `routes/paths.ts`): daquelas sete abas, quatro (andamentos, documentos,
 * tarefas, financeiro do processo) não têm endpoint no backend hoje, e abas
 * vazias comunicam "quebrado" em vez de "em breve". Quando esses recursos
 * existirem, as seções daqui viram abas com a rota `processoTab` já pronta.
 */
export function ProcessoDetailPage() {
  const { processoId } = useParams<{ processoId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: processo, loading: loadingProcesso } = useProcesso(processoId);
  const { data: cliente } = useCliente(processo?.cliente_id);
  const { data: prazos, loading: loadingPrazos, reload: reloadPrazos } = usePrazos(
    processoId ? { processo_id: processoId } : {},
  );
  const { data: eventos, loading: loadingEventos, reload: reloadEventos } = useAgenda(
    processoId ? { processo_id: processoId } : {},
  );
  const { data: usuarios } = useUsuarios();

  const [novoPrazoOpen, setNovoPrazoOpen] = useState(false);
  const [novoEventoOpen, setNovoEventoOpen] = useState(false);
  const [salvandoPrazoId, setSalvandoPrazoId] = useState<string>();

  useDocumentTitle(processo ? `Processo ${processo.numero_cnj}` : 'Processo');

  const nomeResponsavel = useMemo(() => {
    const mapa = new Map((usuarios ?? []).map((u) => [u.id, u.nomeExibicao || u.nome]));
    return (id: string) => mapa.get(id) ?? '—';
  }, [usuarios]);

  const prazosPendentes = useMemo(
    () => (prazos ?? []).filter((p) => p.status === 'pendente'),
    [prazos],
  );
  const prazosUrgentes = useMemo(
    () =>
      prazosPendentes.filter((p) => {
        const { urgencia } = classificarPrazo(p);
        return urgencia === 'urgente' || urgencia === 'vencido';
      }),
    [prazosPendentes],
  );

  async function handleMarcarCumprido(prazo: Prazo) {
    setSalvandoPrazoId(prazo.id);
    try {
      await alterarStatusPrazo(prazo.id, 'cumprido');
      toast.show('Prazo marcado como cumprido.');
      reloadPrazos();
    } catch {
      toast.show('Não foi possível atualizar o prazo.');
    } finally {
      setSalvandoPrazoId(undefined);
    }
  }

  const prazosColumns = useMemo(
    () =>
      criarPrazosColumns({
        onMarcarCumprido: handleMarcarCumprido,
        salvandoId: salvandoPrazoId,
      }),
    // handleMarcarCumprido é recriada a cada render; as colunas só precisam
    // acompanhar o id em salvamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [salvandoPrazoId],
  );

  if (loadingProcesso) return <Skeleton height="400px" />;
  if (!processo) return <EmptyState title="Processo não encontrado." />;

  return (
    <section>
      <PageHead
        title={processo.numero_cnj}
        subtitle={`${processo.tribunal} • ${processo.vara}`}
        actions={
          <Button variant="ghost" onClick={() => navigate(paths.processos)}>
            ← Voltar aos processos
          </Button>
        }
      />

      <div className={styles.headerGrid}>
        <Card>
          <div className={styles.infoGrid}>
            <Info label="Cliente">{cliente?.razaoSocialOuNome ?? '—'}</Info>
            <Info label="Status">
              <Pill tone={toneDoStatusProcesso(processo.status)}>{processo.status}</Pill>
            </Info>
            <Info label="Fase">
              <Pill tone="blue">{processo.fase}</Pill>
            </Info>
            <Info label="Tribunal">{processo.tribunal}</Info>
            <Info label="Vara">{processo.vara}</Info>
            <Info label="Valor da causa">{formatBRLDecimal(processo.valor_causa)}</Info>
          </div>
        </Card>

        <div className={styles.kpis}>
          <KpiCard label="Prazos pendentes" value={String(prazosPendentes.length)} />
          <KpiCard
            label="Prazos fatais críticos"
            value={String(prazosUrgentes.length)}
            sub={prazosUrgentes.length > 0 ? 'Vencidos ou vencendo em até 3 dias' : 'Nenhum prazo crítico'}
            subTone={prazosUrgentes.length > 0 ? 'red' : 'green'}
          />
          <KpiCard label="Compromissos na agenda" value={String((eventos ?? []).length)} />
        </div>
      </div>

      <Card className={styles.secao}>
        <CardHead title="Partes do processo" />
        <CardBody>
          {processo.partes.length === 0 ? (
            <EmptyState title="Nenhuma parte cadastrada neste processo." />
          ) : (
            <ul className={styles.partes}>
              {processo.partes.map((parte, i) => (
                <li key={`${parte.nome}-${i}`}>
                  <strong>{parte.nome}</strong>
                  <span>
                    {parte.papel}
                    {parte.cpf_cnpj ? ` • ${parte.cpf_cnpj}` : ''}
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
            <Button variant="primary" onClick={() => setNovoPrazoOpen(true)}>
              + Novo prazo
            </Button>
          }
        />
        <DataTable
          columns={prazosColumns}
          rows={prazos ?? []}
          getRowId={(p) => p.id}
          loading={loadingPrazos}
          emptyMessage="Nenhum prazo cadastrado para este processo."
        />
      </Card>

      <Card className={styles.secao}>
        <CardHead
          title="Audiências e compromissos"
          action={
            <Button variant="primary" onClick={() => setNovoEventoOpen(true)}>
              + Novo compromisso
            </Button>
          }
        />
        <CardBody>
          <AgendaLista
            eventos={eventos ?? []}
            loading={loadingEventos}
            nomeResponsavel={nomeResponsavel}
            emptyMessage="Nenhum compromisso agendado para este processo."
          />
        </CardBody>
      </Card>

      <NovoPrazoModal
        open={novoPrazoOpen}
        onClose={() => setNovoPrazoOpen(false)}
        processoIdFixo={processoId}
        onCreated={reloadPrazos}
      />
      <NovoEventoAgendaModal
        open={novoEventoOpen}
        onClose={() => setNovoEventoOpen(false)}
        processoIdFixo={processoId}
        onCreated={reloadEventos}
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
