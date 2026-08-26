import { useNavigate, useParams } from 'react-router';
import { useMemo, useState } from 'react';
import { useCliente } from '@/hooks/useClientes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAsync } from '@/hooks/useAsync';
import { listarProcessos } from '@/services/processos.service';
import { listarEventos } from '@/services/agenda.service';
import { listarLancamentos } from '@/services/financeiro.service';
import { db } from '@/mocks';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Card } from '@/components/ui/Card/Card';
import { Pill } from '@/components/ui/Pill/Pill';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Timeline } from '@/components/ui/Timeline/Timeline';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Button } from '@/components/ui/Button/Button';
import { paths } from '@/routes/paths';
import { formatBRL, formatDate, formatDateTime } from '@/utils/format';
import type { Column } from '@/components/ui/DataTable/DataTable';
import type { Processo, Lancamento } from '@/types';
import styles from './ClienteDetailPage.module.scss';

const STATUS_CLIENTE_MAP: Record<string, { label: string; tone: 'green' | 'orange' | 'neutral' }> = {
  ativo: { label: 'Ativo', tone: 'green' },
  inativo: { label: 'Inativo', tone: 'neutral' },
  prospect: { label: 'Prospect', tone: 'orange' },
};

const SITUACAO_MAP: Record<string, { label: string; tone: 'green' | 'red' | 'neutral' }> = {
  em_dia: { label: 'Em dia', tone: 'green' },
  inadimplente: { label: 'Inadimplente', tone: 'red' },
  sem_lancamentos: { label: 'Sem lançamentos', tone: 'neutral' },
};

const STATUS_LAN_MAP: Record<string, { label: string; tone: 'green' | 'orange' | 'red' | 'neutral' }> = {
  pago: { label: 'Pago', tone: 'green' },
  pendente: { label: 'Pendente', tone: 'orange' },
  atrasado: { label: 'Atrasado', tone: 'red' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
};

const processosColumns: Column<Processo>[] = [
  { key: 'numeroCurto', header: 'Nº', width: '80px', render: (p) => p.numeroCurto },
  { key: 'titulo', header: 'Processo', render: (p) => p.titulo },
  { key: 'area', header: 'Área', width: '110px', render: (p) => p.area },
  { key: 'faseProcessual', header: 'Fase', render: (p) => p.faseProcessual },
  {
    key: 'status',
    header: 'Status',
    width: '110px',
    render: (p) => (
      <Pill tone={p.status === 'em_andamento' ? 'blue' : p.status === 'encerrado' ? 'neutral' : 'orange'}>
        {p.status.replace('_', ' ')}
      </Pill>
    ),
  },
];

const lancamentosColumns: Column<Lancamento>[] = [
  { key: 'descricao', header: 'Descrição', render: (l) => l.descricao },
  {
    key: 'tipo',
    header: 'Tipo',
    width: '90px',
    render: (l) => <Pill tone={l.tipo === 'receita' ? 'green' : 'red'}>{l.tipo === 'receita' ? 'Receita' : 'Despesa'}</Pill>,
  },
  { key: 'valor', header: 'Valor', width: '110px', align: 'right', render: (l) => formatBRL(l.valorCentavos) },
  { key: 'vencimento', header: 'Vencimento', width: '110px', render: (l) => formatDate(l.vencimento) },
  {
    key: 'status',
    header: 'Status',
    width: '100px',
    render: (l) => { const s = STATUS_LAN_MAP[l.status]; return <Pill tone={s.tone}>{s.label}</Pill>; },
  },
];

const TABS = ['processos', 'financeiro', 'historico'] as const;
type TabKey = (typeof TABS)[number];

export function ClienteDetailPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const { data: cliente, loading: loadingCliente } = useCliente(clienteId);
  const { data: todosProcessos, loading: loadingProcessos } = useAsync(() => listarProcessos(), []);
  const { data: todosEventos, loading: loadingEventos } = useAsync(() => listarEventos(), []);
  const { data: todosLancamentos, loading: loadingLancamentos } = useAsync(() => listarLancamentos(), []);
  const [tab, setTab] = useState<TabKey>('processos');

  useDocumentTitle(cliente?.nome ?? 'Cliente');

  const processos = useMemo(
    () => (todosProcessos ?? []).filter((p) => p.clienteId === clienteId),
    [todosProcessos, clienteId],
  );
  const lancamentos = useMemo(
    () => (todosLancamentos ?? []).filter((l) => l.clienteId === clienteId),
    [todosLancamentos, clienteId],
  );
  const eventos = useMemo(
    () => (todosEventos ?? []).filter((e) => e.clienteId === clienteId),
    [todosEventos, clienteId],
  );

  const responsavel = useMemo(
    () => db.usuarios.find((u) => u.id === cliente?.responsavelId),
    [cliente],
  );

  const totalReceitas = useMemo(
    () => lancamentos.filter((l) => l.tipo === 'receita' && l.status === 'pago').reduce((s, l) => s + l.valorCentavos, 0),
    [lancamentos],
  );
  const totalPendente = useMemo(
    () => lancamentos.filter((l) => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'atrasado')).reduce((s, l) => s + l.valorCentavos, 0),
    [lancamentos],
  );

  if (loadingCliente) return <Skeleton height="400px" />;
  if (!cliente) return <EmptyState title="Cliente não encontrado." />;

  const { label: statusLabel, tone: statusTone } = STATUS_CLIENTE_MAP[cliente.status];
  const { label: situacaoLabel, tone: situacaoTone } = SITUACAO_MAP[cliente.situacaoFinanceira];

  return (
    <section>
      <PageHead
        title={cliente.nome}
        subtitle={`${cliente.tipoPessoa} • ${cliente.documento}`}
        actions={
          <Button variant="ghost" onClick={() => navigate(paths.clientes)}>
            ← Voltar aos Clientes
          </Button>
        }
      />

      {/* Header cards */}
      <div className={styles.headerGrid}>
        <Card>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Status</span>
              <Pill tone={statusTone}>{statusLabel}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Situação financeira</span>
              <Pill tone={situacaoTone}>{situacaoLabel}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Responsável</span>
              <span className={styles.infoValue}>{responsavel?.nomeExibicao ?? '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Telefone</span>
              <span className={styles.infoValue}>{cliente.telefone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>E-mail</span>
              <span className={styles.infoValue}>{cliente.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Cliente desde</span>
              <span className={styles.infoValue}>{formatDate(cliente.criadoEm)}</span>
            </div>
          </div>
        </Card>

        <div className={styles.kpis}>
          <KpiCard label="Processos" value={String(processos.length)} />
          <KpiCard label="Receita recebida" value={formatBRL(totalReceitas)} subTone="green" />
          <KpiCard label="A receber" value={formatBRL(totalPendente)} subTone="orange" />
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <div className={styles.tabsRow}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'processos' ? 'Processos' : t === 'financeiro' ? 'Financeiro' : 'Histórico'}
            </button>
          ))}
        </div>

        <div className={styles.tabBody}>
          {tab === 'processos' && (
            <DataTable
              columns={processosColumns}
              rows={processos}
              getRowId={(p) => p.id}
              loading={loadingProcessos}
              emptyMessage="Nenhum processo vinculado a este cliente."
              onRowClick={(p) => navigate(paths.processoTab(p.id, 'resumo'))}
            />
          )}

          {tab === 'financeiro' && (
            <DataTable
              columns={lancamentosColumns}
              rows={lancamentos}
              getRowId={(l) => l.id}
              loading={loadingLancamentos}
              emptyMessage="Nenhum lançamento financeiro para este cliente."
            />
          )}

          {tab === 'historico' && (
            <>
              {loadingEventos && <Skeleton height="120px" />}
              {!loadingEventos && eventos.length === 0 && <EmptyState title="Nenhum evento registrado." />}
              {!loadingEventos && eventos.length > 0 && (
                <Timeline
                  items={eventos
                    .sort((a, b) => a.inicio < b.inicio ? 1 : -1)
                    .map((e) => ({
                      id: e.id,
                      dateLabel: e.diaInteiro
                        ? formatDate(e.inicio.slice(0, 10)).toUpperCase()
                        : formatDateTime(e.inicio).toUpperCase(),
                      title: e.titulo,
                      description: e.descricao ?? e.local ?? '',
                    }))}
                />
              )}
            </>
          )}
        </div>
      </Card>
    </section>
  );
}
