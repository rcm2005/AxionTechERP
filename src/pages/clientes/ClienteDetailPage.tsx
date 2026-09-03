import { useNavigate, useParams } from 'react-router';
import { useMemo, useState } from 'react';
import { useCliente } from '@/hooks/useClientes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAsync } from '@/hooks/useAsync';
import { listEntries } from '@/services/financeiro.service';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Card } from '@/components/ui/Card/Card';
import { Pill } from '@/components/ui/Pill/Pill';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Button } from '@/components/ui/Button/Button';
import { Alert } from '@/components/ui/Alert/Alert';
import { paths } from '@/routes/paths';
import { formatBRL, formatDate } from '@/utils/format';
import { situacaoCreditoMeta, lancamentoStatusMeta } from '@/utils/statusMaps';
import type { Column } from '@/components/ui/DataTable/DataTable';
import type { Lancamento } from '@/types';
import styles from './ClienteDetailPage.module.scss';

const entriesColumns: Column<Lancamento>[] = [
  { key: 'descricao', header: 'Descrição / Doc Fiscal', render: (entry) => (
    <div>
      <div>{entry.descricao}</div>
      {entry.numeroDocumentoFiscal && <small style={{ color: 'var(--color-muted)' }}>Doc: {entry.numeroDocumentoFiscal}</small>}
    </div>
  ) },
  {
    key: 'tipo',
    header: 'Tipo',
    width: '90px',
    render: (entry) => <Pill tone={entry.tipo === 'receita' ? 'green' : 'red'}>{entry.tipo === 'receita' ? 'Receita' : 'Despesa'}</Pill>,
  },
  { key: 'valor', header: 'Valor', width: '120px', align: 'right', render: (entry) => formatBRL(entry.valorCentavos) },
  { key: 'vencimento', header: 'Vencimento', width: '110px', render: (entry) => formatDate(entry.vencimento) },
  {
    key: 'status',
    header: 'Status',
    width: '100px',
    render: (entry) => {
      const meta = lancamentoStatusMeta[entry.status] ?? { label: entry.status, tone: 'neutral' };
      return <Pill tone={meta.tone}>{meta.label}</Pill>;
    },
  },
];

const TABS = ['financeiro', 'cadastro'] as const;
type TabKey = (typeof TABS)[number];

export function ClienteDetailPage() {
  const { clienteId: clientId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const {
    data: client,
    loading: loadingClient,
    error: clientError,
    reload: reloadClient,
  } = useCliente(clientId);
  const {
    data: allEntries,
    loading: loadingEntries,
    error: entriesError,
    reload: reloadEntries,
  } = useAsync(() => listEntries(), []);
  const [tab, setTab] = useState<TabKey>('financeiro');

  useDocumentTitle(client?.razaoSocialOuNome ?? 'Parceiro Comercial');

  const entries = useMemo(
    () => (allEntries ?? []).filter((entry) => entry.pessoaId === clientId),
    [allEntries, clientId],
  );

  const totalRevenue = useMemo(
    () => entries.filter((entry) => entry.tipo === 'receita' && entry.status === 'pago').reduce((acc, entry) => acc + entry.valorCentavos, 0),
    [entries],
  );
  const totalPending = useMemo(
    () => entries.filter((entry) => entry.tipo === 'receita' && (entry.status === 'pendente' || entry.status === 'atrasado')).reduce((acc, entry) => acc + entry.valorCentavos, 0),
    [entries],
  );
  const totalOverdue = useMemo(
    () => entries.filter((entry) => entry.tipo === 'receita' && entry.status === 'atrasado').reduce((acc, entry) => acc + entry.valorCentavos, 0),
    [entries],
  );

  if (loadingClient) return <Skeleton height="400px" />;
  if (clientError) {
    return (
      <Alert
        tone="danger"
        title="Erro ao carregar dados"
        description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
        action={
          <Button variant="ghost" onClick={reloadClient}>
            Tentar novamente
          </Button>
        }
      />
    );
  }
  if (!client) return <EmptyState title="Parceiro comercial não encontrado." />;

  const creditMeta = situacaoCreditoMeta[client.situacaoCredito] ?? { label: client.situacaoCredito, tone: 'neutral' };

  return (
    <section>
      <PageHead
        title={client.razaoSocialOuNome}
        subtitle={`${client.nomeFantasia ? `${client.nomeFantasia} • ` : ''}${client.tipoPessoa} • ${client.documento}`}
        actions={
          <Button variant="ghost" onClick={() => navigate(paths.clientes)}>
            ← Voltar aos Parceiros
          </Button>
        }
      />

      {/* Header cards */}
      <div className={styles.headerGrid}>
        <Card>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Situação de Crédito</span>
              <Pill tone={creditMeta.tone}>{creditMeta.label}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Telefone</span>
              <span className={styles.infoValue}>{client.telefone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>E-mail</span>
              <span className={styles.infoValue}>{client.email}</span>
            </div>
          </div>
        </Card>

        <div className={styles.kpis}>
          {entriesError ? (
            <Alert
              tone="danger"
              title="Erro ao carregar dados"
              description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
              action={
                <Button variant="ghost" onClick={reloadEntries}>
                  Tentar novamente
                </Button>
              }
            />
          ) : (
            <>
              <KpiCard label="Receita Realizada" value={formatBRL(totalRevenue)} subTone="green" />
              <KpiCard
                label="Títulos Pendentes"
                value={formatBRL(totalPending)}
                sub={totalOverdue > 0 ? `${formatBRL(totalOverdue)} em atraso` : 'Em dia'}
                subTone={totalOverdue > 0 ? 'red' : 'green'}
              />
            </>
          )}
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
              {t === 'financeiro' ? 'Lançamentos Financeiros' : 'Dados Cadastrais & Endereço'}
            </button>
          ))}
        </div>

        <div className={styles.tabBody}>
          {tab === 'financeiro' && (
            entriesError ? (
              <Alert
                tone="danger"
                title="Erro ao carregar dados"
                description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
                action={
                  <Button variant="ghost" onClick={reloadEntries}>
                    Tentar novamente
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={entriesColumns}
                rows={entries}
                getRowId={(entry) => entry.id}
                loading={loadingEntries}
                emptyMessage="Nenhum lançamento financeiro registrado para este parceiro."
              />
            )
          )}

          {tab === 'cadastro' && (
            <EmptyState title="Nenhum dado cadastral adicional disponível para este cliente." />
          )}
        </div>
      </Card>
    </section>
  );
}
