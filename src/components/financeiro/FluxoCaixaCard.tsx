import type { FinancialSummary } from '@/services/financeiro.service';
import { REFERENCE_DATE } from '@/config/app';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { formatBRL, formatMonthYear } from '@/utils/format';
import styles from './FluxoCaixaCard.module.scss';

interface FluxoCaixaCardProps {
  summary: FinancialSummary;
}

export function FluxoCaixaCard({ summary }: FluxoCaixaCardProps) {
  const totalMoved = summary.revenueCentavos + summary.expenseCentavos;
  const percentRevenue = totalMoved > 0 ? (summary.revenueCentavos / totalMoved) * 100 : 0;
  const percentExpense = totalMoved > 0 ? (summary.expenseCentavos / totalMoved) * 100 : 0;
  const monthLabel = formatMonthYear(REFERENCE_DATE);

  return (
    <Card>
      <CardHead title="Fluxo de caixa" action={<span className={styles.mes}>{monthLabel}</span>} />
      <CardBody>
        <div className={styles.rowLabel}>Receitas realizadas</div>
        <div className={styles.rowValue}>
          <strong>{formatBRL(summary.revenueCentavos)}</strong>
          <strong className={styles.positive}>{percentRevenue.toFixed(0)}%</strong>
        </div>
        <ProgressBar percent={percentRevenue} />

        <div className={styles.spacer} />

        <div className={styles.rowLabel}>Despesas</div>
        <div className={styles.rowValue}>
          <strong>{formatBRL(summary.expenseCentavos)}</strong>
          <strong>{percentExpense.toFixed(0)}%</strong>
        </div>
        <ProgressBar percent={percentExpense} />

        <div className={styles.spacer} />

        <Alert
          title="Projeção do mês"
          description={`Lucro estimado de ${formatBRL(summary.profitCentavos)} até o fim do mês.`}
        />
      </CardBody>
    </Card>
  );
}
