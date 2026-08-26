import { useMemo, useState } from 'react';
import { calcularResumoFinanceiro } from '@/services/financeiro.service';
import { useLancamentos } from '@/hooks/useFinanceiro';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/contexts/ToastContext';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { Card, CardHead } from '@/components/ui/Card/Card';
import { DataTable, Column } from '@/components/ui/DataTable/DataTable';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { contasReceberColumns } from '@/components/financeiro/contasReceberColumns';
import { FluxoCaixaCard } from '@/components/financeiro/FluxoCaixaCard';
import { formatBRL } from '@/utils/format';
import { BarChart } from '@/components/ui/BarChart/BarChart';
import type { Lancamento } from '@/types';
import styles from './FinanceiroPage.module.scss';

const REFERENCE_DATE = new Date('2026-08-18');

type BreakdownRow = { id: string; categoria: string; receita: number; despesa: number; saldo: number };

const breakdownColumns: Column<BreakdownRow>[] = [
  { key: 'categoria', header: 'Categoria', render: (r) => r.categoria },
  { key: 'receita', header: 'Receitas', width: '120px', align: 'right', render: (r) => formatBRL(r.receita) },
  { key: 'despesa', header: 'Despesas', width: '120px', align: 'right', render: (r) => formatBRL(r.despesa) },
  { key: 'saldo', header: 'Saldo', width: '120px', align: 'right', render: (r) => <span style={{ color: r.saldo >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>{formatBRL(r.saldo)}</span> },
];

export function FinanceiroPage() {
  useDocumentTitle('Financeiro');
  const toast = useToast();
  const { data: lancamentos, loading } = useLancamentos();
  
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'todos'>('mes');

  const lancamentosFiltrados = useMemo(() => {
    const todos = lancamentos ?? [];
    if (periodo === 'todos') return todos;
    const refMs = REFERENCE_DATE.getTime();
    const dias = periodo === 'mes' ? 31 : 92;
    const inicio = new Date(refMs - dias * 24 * 60 * 60 * 1000);
    return todos.filter((l) => {
      const d = new Date(l.vencimento);
      return d >= inicio && d <= REFERENCE_DATE;
    });
  }, [lancamentos, periodo]);

  const resumo = useMemo(() => calcularResumoFinanceiro(lancamentosFiltrados), [lancamentosFiltrados]);
  const contasAReceber = useMemo(
    () => lancamentosFiltrados.filter((l) => l.tipo === 'receita' && l.status !== 'cancelado'),
    [lancamentosFiltrados],
  );

  const dadosGrafico = useMemo(() => {
    const categorias = new Map<string, number>();
    (lancamentosFiltrados ?? []).forEach((l) => {
      const key = l.categoria;
      categorias.set(key, (categorias.get(key) ?? 0) + l.valorCentavos);
    });
    return Array.from(categorias.entries())
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
  }, [lancamentosFiltrados]);

  const breakdown = useMemo(() => {
    const map = new Map<string, { receita: number; despesa: number }>();
    (lancamentosFiltrados ?? []).forEach((l) => {
      const cur = map.get(l.categoria) ?? { receita: 0, despesa: 0 };
      if (l.tipo === 'receita') cur.receita += l.valorCentavos;
      else cur.despesa += l.valorCentavos;
      map.set(l.categoria, cur);
    });
    return Array.from(map.entries()).map(([categoria, vals]) => ({
      id: categoria,
      categoria,
      receita: vals.receita,
      despesa: vals.despesa,
      saldo: vals.receita - vals.despesa,
    }));
  }, [lancamentosFiltrados]);


  return (
    <section>
      <PageHead
        title="Financeiro"
        subtitle="Contas a receber, despesas e visão do fluxo de caixa."
        actions={
          <>
            <Button onClick={() => toast.show('Nova despesa iniciada')}>+ Despesa</Button>
            <Button variant="primary" onClick={() => toast.show('Nova cobrança iniciada')}>
              + Cobrança
            </Button>
          </>
        }
      />

      {/* Filtro de período */}
      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Período:</span>
        <div className={styles.filterBtns}>
          {(['mes', 'trimestre', 'todos'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.filterBtn} ${periodo === p ? styles.filterBtnActive : ''}`}
              onClick={() => setPeriodo(p)}
            >
              {p === 'mes' ? 'Mês atual' : p === 'trimestre' ? 'Últimos 3 meses' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.kpis}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="90px" />)
        ) : (
          <>
            <KpiCard label="Receita do mês" value={formatBRL(resumo.receitaCentavos)} />
            <KpiCard
              label="Despesas"
              value={formatBRL(resumo.despesaCentavos)}
              sub={
                resumo.receitaCentavos > 0
                  ? `${((resumo.despesaCentavos / resumo.receitaCentavos) * 100).toFixed(0)}% da receita`
                  : undefined
              }
            />
            <KpiCard
              label="A receber"
              value={formatBRL(resumo.aReceberCentavos)}
              sub={`${resumo.qtdTitulosAReceber} títulos`}
            />
            <KpiCard
              label="Em atraso"
              value={formatBRL(resumo.emAtrasoCentavos)}
              subTone="red"
              sub={`${resumo.qtdClientesEmAtraso} cliente(s)`}
            />
            <KpiCard
              label="Lucro estimado"
              value={formatBRL(resumo.lucroCentavos)}
              subTone="green"
              sub={
                resumo.receitaCentavos > 0
                  ? `${((resumo.lucroCentavos / resumo.receitaCentavos) * 100).toFixed(0)}% margem`
                  : undefined
              }
            />
          </>
        )}
      </div>

      <div className={styles.grid}>
        <Card>
          <CardHead title="Contas a receber" action={<Button variant="ghost">Ver tudo</Button>} />
          <DataTable
            columns={contasReceberColumns}
            rows={contasAReceber}
            getRowId={(l) => l.id}
            loading={loading}
            emptyMessage="Nenhuma conta a receber cadastrada."
          />
        </Card>

        {loading ? (
          <Skeleton height="320px" />
        ) : (
          <FluxoCaixaCard resumo={resumo} />
        )}
      </div>

      {/* Gráfico por categoria */}
      {!loading && dadosGrafico.length > 0 && (
        <Card>
          <CardHead title="Distribuição por categoria" />
          <div style={{ padding: 'var(--space-5)' }}>
            <BarChart
              data={dadosGrafico}
              height={200}
              formatValue={(v) => formatBRL(v)}
            />
          </div>
        </Card>
      )}

      {/* Breakdown tabela */}
      {!loading && breakdown.length > 0 && (
        <Card>
          <CardHead title="Breakdown por categoria" />
          <DataTable
            columns={breakdownColumns}
            rows={breakdown}
            getRowId={(r) => r.id}
            emptyMessage="Sem dados."
          />
        </Card>
      )}
    </section>
  );
}
