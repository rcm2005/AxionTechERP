import { useMemo, useState } from 'react';
import { calculateFinancialSummary } from '@/services/financeiro.service';
import { useLancamentos } from '@/hooks/useFinanceiro';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/contexts/ToastContext';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Alert } from '@/components/ui/Alert/Alert';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import type { Column } from '@/components/ui/DataTable/DataTable';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { contasReceberColumns } from '@/components/financeiro/contasReceberColumns';
import { FluxoCaixaCard } from '@/components/financeiro/FluxoCaixaCard';
import { formatBRL } from '@/utils/format';
import { BarChart } from '@/components/ui/BarChart/BarChart';
import { NovaCobrancaModal } from '@/components/modais/NovaCobrancaModal';

import styles from './FinanceiroPage.module.scss';

const REFERENCE_DATE = new Date('2026-08-18');

type BreakdownRow = { id: string; category: string; revenue: number; expense: number; balance: number };

const breakdownColumns: Column<BreakdownRow>[] = [
  { key: 'category', header: 'Categoria', render: (row) => row.category },
  { key: 'revenue', header: 'Receitas', width: '120px', align: 'right', render: (row) => formatBRL(row.revenue) },
  { key: 'expense', header: 'Despesas', width: '120px', align: 'right', render: (row) => formatBRL(row.expense) },
  { key: 'balance', header: 'Saldo', width: '120px', align: 'right', render: (row) => <span style={{ color: row.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>{formatBRL(row.balance)}</span> },
];

export function FinanceiroPage() {
  useDocumentTitle('Financeiro');
  const toast = useToast();
  const { data: entries, loading, error, reload } = useLancamentos();

  const [period, setPeriod] = useState<'mes' | 'trimestre' | 'todos'>('mes');
  const [newChargeOpen, setNewChargeOpen] = useState(false);

  const filteredEntries = useMemo(() => {
    const all = entries ?? [];
    if (period === 'todos') return all;
    const refMs = REFERENCE_DATE.getTime();
    const days = period === 'mes' ? 31 : 92;
    const start = new Date(refMs - days * 24 * 60 * 60 * 1000);
    return all.filter((entry) => {
      const date = new Date(entry.vencimento);
      return date >= start && date <= REFERENCE_DATE;
    });
  }, [entries, period]);

  const summary = useMemo(() => {
    if (!entries || error) return null;
    return calculateFinancialSummary(filteredEntries);
  }, [entries, filteredEntries, error]);

  const receivables = useMemo(
    () => (entries ?? []).filter((entry) => entry.tipo === 'receita' && entry.status !== 'cancelado'),
    [entries],
  );

  const chartData = useMemo(() => {
    if (!entries || error) return [];
    const categories = new Map<string, number>();
    (filteredEntries ?? []).forEach((entry) => {
      const key = entry.categoria;
      categories.set(key, (categories.get(key) ?? 0) + entry.valorCentavos);
    });
    return Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // top 8
      .map(([label, value]) => ({
        label,
        value,
        color: label.toLowerCase().includes('honor') || label.toLowerCase().includes('retainer')
          ? 'var(--color-accent)'
          : label.toLowerCase().includes('folha') || label.toLowerCase().includes('aluguel')
          ? 'var(--color-danger)'
          : 'var(--tone-orange-fg)',
      }));
  }, [entries, filteredEntries, error]);

  const breakdown = useMemo(() => {
    if (!entries || error) return [];
    const map = new Map<string, { revenue: number; expense: number }>();
    (filteredEntries ?? []).forEach((entry) => {
      const cur = map.get(entry.categoria) ?? { revenue: 0, expense: 0 };
      if (entry.tipo === 'receita') cur.revenue += entry.valorCentavos;
      else cur.expense += entry.valorCentavos;
      map.set(entry.categoria, cur);
    });
    return Array.from(map.entries()).map(([category, vals]) => ({
      id: category,
      category,
      revenue: vals.revenue,
      expense: vals.expense,
      balance: vals.revenue - vals.expense,
    }));
  }, [entries, filteredEntries, error]);


  return (
    <section>
      <PageHead
        title="Financeiro"
        subtitle="Contas a receber, despesas e visão do fluxo de caixa."
        actions={
          <>
            <Button onClick={() => toast.show('Nova despesa iniciada')}>+ Despesa</Button>
            <Button variant="primary" onClick={() => setNewChargeOpen(true)}>
              + Cobrança
            </Button>
          </>
        }
      />

      {/* Period filter */}
      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Período:</span>
        <div className={styles.filterBtns}>
          {(['mes', 'trimestre', 'todos'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.filterBtn} ${period === p ? styles.filterBtnActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'mes' ? 'Mês atual' : p === 'trimestre' ? 'Últimos 3 meses' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div style={{ marginBottom: 16 }}>
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
        </div>
      ) : (
        <div className={styles.kpis}>
          {loading || !summary ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="90px" />)
          ) : (
            <>
              <KpiCard label="Receita do mês" value={formatBRL(summary.revenueCentavos)} />
              <KpiCard
                label="Despesas"
                value={formatBRL(summary.expenseCentavos)}
                sub={
                  summary.revenueCentavos > 0
                    ? `${((summary.expenseCentavos / summary.revenueCentavos) * 100).toFixed(0)}% da receita`
                    : undefined
                }
              />
              <KpiCard
                label="A receber"
                value={formatBRL(summary.receivableCentavos)}
                sub={`${summary.receivableCount} títulos`}
              />
              <KpiCard
                label="Em atraso"
                value={formatBRL(summary.overdueCentavos)}
                subTone="red"
                sub={`${summary.overdueClientCount} cliente(s)`}
              />
              <KpiCard
                label="Lucro estimado"
                value={formatBRL(summary.profitCentavos)}
                subTone="green"
                sub={
                  summary.revenueCentavos > 0
                    ? `${((summary.profitCentavos / summary.revenueCentavos) * 100).toFixed(0)}% margem`
                    : undefined
                }
              />
            </>
          )}
        </div>
      )}

      <div className={styles.grid}>
        <Card>
          <CardHead title="Contas a receber" action={<Button variant="ghost">Ver tudo</Button>} />
          {error ? (
            <CardBody>
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
            </CardBody>
          ) : (
            <DataTable
              columns={contasReceberColumns}
              rows={receivables}
              getRowId={(entry) => entry.id}
              loading={loading}
              emptyMessage="Nenhuma conta a receber cadastrada."
            />
          )}
        </Card>

        {loading ? (
          <Skeleton height="320px" />
        ) : summary ? (
          <FluxoCaixaCard summary={summary} />
        ) : null}
      </div>

      {/* Category chart */}
      {!loading && !error && chartData.length > 0 && (
        <Card>
          <CardHead title={`Distribuição por categoria — ${period === 'mes' ? 'mês atual' : period === 'trimestre' ? 'últimos 3 meses' : 'todos'}`} />
          <div style={{ padding: 'var(--space-5)' }}>
            <BarChart
              data={chartData}
              height={200}
              formatValue={(value) => formatBRL(value)}
            />
          </div>
        </Card>
      )}

      {/* Breakdown table */}
      {!loading && !error && breakdown.length > 0 && (
        <Card>
          <CardHead title="Breakdown por categoria" />
          <DataTable
            columns={breakdownColumns}
            rows={breakdown}
            getRowId={(row) => row.id}
            emptyMessage="Sem dados."
          />
        </Card>
      )}

      <NovaCobrancaModal open={newChargeOpen} onClose={() => setNewChargeOpen(false)} />
    </section>
  );
}
