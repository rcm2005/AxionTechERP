import { useMemo } from 'react';
import { useOutletContext } from 'react-router';
import type { Processo, Lancamento } from '@/types';
import { useLancamentos } from '@/hooks/useFinanceiro';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { formatBRL, formatDate } from '@/utils/format';
import styles from './FinanceiroTab.module.scss';

const STATUS_MAP: Record<string, { label: string; tone: 'green' | 'orange' | 'red' | 'neutral' }> =
  {
    pago: { label: 'Pago', tone: 'green' },
    pendente: { label: 'Pendente', tone: 'orange' },
    atrasado: { label: 'Atrasado', tone: 'red' },
    cancelado: { label: 'Cancelado', tone: 'neutral' },
  };

const columns: Column<Lancamento>[] = [
  { key: 'descricao', header: 'Descrição', render: (l) => l.descricao },
  {
    key: 'tipo',
    header: 'Tipo',
    width: '90px',
    render: (l) => (
      <Pill tone={l.tipo === 'receita' ? 'green' : 'red'}>
        {l.tipo === 'receita' ? 'Receita' : 'Despesa'}
      </Pill>
    ),
  },
  { key: 'categoria', header: 'Categoria', render: (l) => l.categoria },
  {
    key: 'valor',
    header: 'Valor',
    width: '120px',
    align: 'right',
    render: (l) => formatBRL(l.valorCentavos),
  },
  {
    key: 'vencimento',
    header: 'Vencimento',
    width: '110px',
    render: (l) => formatDate(l.vencimento),
  },
  {
    key: 'status',
    header: 'Status',
    width: '100px',
    render: (l) => {
      const s = STATUS_MAP[l.status];
      return <Pill tone={s.tone}>{s.label}</Pill>;
    },
  },
];

export function FinanceiroTab() {
  const { processo } = useOutletContext<{ processo: Processo }>();
  const { data: lancamentos, loading } = useLancamentos();

  const doProcesso = useMemo(
    () => (lancamentos ?? []).filter((l) => l.processoId === processo.id),
    [lancamentos, processo.id],
  );

  const totalReceitas = useMemo(
    () =>
      doProcesso
        .filter((l) => l.tipo === 'receita')
        .reduce((s, l) => s + l.valorCentavos, 0),
    [doProcesso],
  );

  const totalDespesas = useMemo(
    () =>
      doProcesso
        .filter((l) => l.tipo === 'despesa')
        .reduce((s, l) => s + l.valorCentavos, 0),
    [doProcesso],
  );

  if (loading) return <Skeleton height="200px" />;
  if (doProcesso.length === 0)
    return <EmptyState title="Nenhum lançamento financeiro para este processo." />;

  return (
    <div className={styles.root}>
      <div className={styles.kpis}>
        <KpiCard label="Receitas" value={formatBRL(totalReceitas)} subTone="green" />
        <KpiCard label="Despesas" value={formatBRL(totalDespesas)} subTone="red" />
        <KpiCard
          label="Saldo"
          value={formatBRL(totalReceitas - totalDespesas)}
          subTone={totalReceitas >= totalDespesas ? 'green' : 'red'}
        />
      </div>
      <DataTable
        columns={columns}
        rows={doProcesso}
        getRowId={(l) => l.id}
        emptyMessage="Nenhum lançamento."
      />
    </div>
  );
}
