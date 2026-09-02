import { useNavigate, useParams } from 'react-router';
import { useMemo, useState } from 'react';
import { useCliente } from '@/hooks/useClientes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAsync } from '@/hooks/useAsync';
import { listarLancamentos } from '@/services/financeiro.service';
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
import { pessoaStatusMeta, situacaoCreditoMeta, tipoRelacaoMeta, lancamentoStatusMeta } from '@/utils/statusMaps';
import type { Column } from '@/components/ui/DataTable/DataTable';
import type { Lancamento } from '@/types';
import styles from './ClienteDetailPage.module.scss';

const lancamentosColumns: Column<Lancamento>[] = [
  { key: 'descricao', header: 'Descrição / Doc Fiscal', render: (l) => (
    <div>
      <div>{l.descricao}</div>
      {l.numeroDocumentoFiscal && <small style={{ color: 'var(--color-muted)' }}>Doc: {l.numeroDocumentoFiscal}</small>}
    </div>
  ) },
  {
    key: 'tipo',
    header: 'Tipo',
    width: '90px',
    render: (l) => <Pill tone={l.tipo === 'receita' ? 'green' : 'red'}>{l.tipo === 'receita' ? 'Receita' : 'Despesa'}</Pill>,
  },
  { key: 'valor', header: 'Valor', width: '120px', align: 'right', render: (l) => formatBRL(l.valorCentavos) },
  { key: 'vencimento', header: 'Vencimento', width: '110px', render: (l) => formatDate(l.vencimento) },
  {
    key: 'status',
    header: 'Status',
    width: '100px',
    render: (l) => {
      const meta = lancamentoStatusMeta[l.status] ?? { label: l.status, tone: 'neutral' };
      return <Pill tone={meta.tone}>{meta.label}</Pill>;
    },
  },
];

const TABS = ['financeiro', 'cadastro'] as const;
type TabKey = (typeof TABS)[number];

export function ClienteDetailPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const {
    data: cliente,
    loading: loadingCliente,
    error: erroCliente,
    reload: recarregarCliente,
  } = useCliente(clienteId);
  const {
    data: todosLancamentos,
    loading: loadingLancamentos,
    error: erroLancamentos,
    reload: recarregarLancamentos,
  } = useAsync(() => listarLancamentos(), []);
  const [tab, setTab] = useState<TabKey>('financeiro');

  useDocumentTitle(cliente?.razaoSocialOuNome ?? 'Parceiro Comercial');

  const lancamentos = useMemo(
    () => (todosLancamentos ?? []).filter((l) => l.pessoaId === clienteId),
    [todosLancamentos, clienteId],
  );

  const totalReceitas = useMemo(
    () => lancamentos.filter((l) => l.tipo === 'receita' && l.status === 'pago').reduce((s, l) => s + l.valorCentavos, 0),
    [lancamentos],
  );
  const totalPendente = useMemo(
    () => lancamentos.filter((l) => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'atrasado')).reduce((s, l) => s + l.valorCentavos, 0),
    [lancamentos],
  );
  const totalAtraso = useMemo(
    () => lancamentos.filter((l) => l.tipo === 'receita' && l.status === 'atrasado').reduce((s, l) => s + l.valorCentavos, 0),
    [lancamentos],
  );

  if (loadingCliente) return <Skeleton height="400px" />;
  if (erroCliente) {
    return (
      <Alert
        tone="danger"
        title="Erro ao carregar dados"
        description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
        action={
          <Button variant="ghost" onClick={recarregarCliente}>
            Tentar novamente
          </Button>
        }
      />
    );
  }
  if (!cliente) return <EmptyState title="Parceiro comercial não encontrado." />;

  const statusMeta = pessoaStatusMeta[cliente.status] ?? { label: cliente.status, tone: 'neutral' };
  const creditoMeta = situacaoCreditoMeta[cliente.situacaoCredito] ?? { label: cliente.situacaoCredito, tone: 'neutral' };
  const relacaoMeta = tipoRelacaoMeta[cliente.relacao] ?? { label: cliente.relacao, tone: 'neutral' };

  return (
    <section>
      <PageHead
        title={cliente.razaoSocialOuNome}
        subtitle={`${cliente.nomeFantasia ? `${cliente.nomeFantasia} • ` : ''}${cliente.tipoPessoa} • ${cliente.documento}`}
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
              <span className={styles.infoLabel}>Status Cadastral</span>
              <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Relação Comercial</span>
              <Pill tone={relacaoMeta.tone}>{relacaoMeta.label}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Situação de Crédito</span>
              <Pill tone={creditoMeta.tone}>{creditoMeta.label}</Pill>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Segmento</span>
              <span className={styles.infoValue}>{cliente.segmento ?? '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Telefone</span>
              <span className={styles.infoValue}>{cliente.telefone}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>E-mail</span>
              <span className={styles.infoValue}>{cliente.email}</span>
            </div>
          </div>
        </Card>

        <div className={styles.kpis}>
          <KpiCard
            label="Limite de Crédito"
            value={cliente.limiteCreditoCentavos ? formatBRL(cliente.limiteCreditoCentavos) : 'Ilimitado'}
          />
          {erroLancamentos ? (
            <Alert
              tone="danger"
              title="Erro ao carregar dados"
              description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
              action={
                <Button variant="ghost" onClick={recarregarLancamentos}>
                  Tentar novamente
                </Button>
              }
            />
          ) : (
            <>
              <KpiCard label="Receita Realizada" value={formatBRL(totalReceitas)} subTone="green" />
              <KpiCard
                label="Títulos Pendentes"
                value={formatBRL(totalPendente)}
                sub={totalAtraso > 0 ? `${formatBRL(totalAtraso)} em atraso` : 'Em dia'}
                subTone={totalAtraso > 0 ? 'red' : 'green'}
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
            erroLancamentos ? (
              <Alert
                tone="danger"
                title="Erro ao carregar dados"
                description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
                action={
                  <Button variant="ghost" onClick={recarregarLancamentos}>
                    Tentar novamente
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={lancamentosColumns}
                rows={lancamentos}
                getRowId={(l) => l.id}
                loading={loadingLancamentos}
                emptyMessage="Nenhum lançamento financeiro registrado para este parceiro."
              />
            )
          )}

          {tab === 'cadastro' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', padding: '16px 0' }}>
              <div>
                <strong>Inscrição Estadual:</strong> {cliente.inscricaoEstadual ?? (cliente.isentoIE ? 'Isento' : 'Não informada')}
              </div>
              {cliente.inscricaoMunicipal && (
                <div>
                  <strong>Inscrição Municipal:</strong> {cliente.inscricaoMunicipal}
                </div>
              )}
              {cliente.contatoPrincipal && (
                <div>
                  <strong>Contato Principal:</strong> {cliente.contatoPrincipal.nome} ({cliente.contatoPrincipal.cargo ?? 'Contato'})
                </div>
              )}
              <div>
                <strong>Endereço:</strong> {cliente.endereco.logradouro}, {cliente.endereco.numero} {cliente.endereco.complemento ?? ''}
              </div>
              <div>
                <strong>Bairro / Cidade:</strong> {cliente.endereco.bairro} - {cliente.endereco.cidade}/{cliente.endereco.uf}
              </div>
              <div>
                <strong>CEP:</strong> {cliente.endereco.cep}
              </div>
              {cliente.observacoes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Observações:</strong> {cliente.observacoes}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
