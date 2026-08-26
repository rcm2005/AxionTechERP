import type { ResumoFinanceiro } from '@/services/financeiro.service';
import { REFERENCE_DATE } from '@/config/app';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { formatBRL, formatMonthYear } from '@/utils/format';
import styles from './FluxoCaixaCard.module.scss';

interface FluxoCaixaCardProps {
  resumo: ResumoFinanceiro;
}

export function FluxoCaixaCard({ resumo }: FluxoCaixaCardProps) {
  const totalMovimentado = resumo.receitaCentavos + resumo.despesaCentavos;
  const percentReceita = totalMovimentado > 0 ? (resumo.receitaCentavos / totalMovimentado) * 100 : 0;
  const percentDespesa = totalMovimentado > 0 ? (resumo.despesaCentavos / totalMovimentado) * 100 : 0;
  const mesLabel = formatMonthYear(REFERENCE_DATE);

  return (
    <Card>
      <CardHead title="Fluxo de caixa" action={<span className={styles.mes}>{mesLabel}</span>} />
      <CardBody>
        <div className={styles.rowLabel}>Receitas realizadas</div>
        <div className={styles.rowValue}>
          <strong>{formatBRL(resumo.receitaCentavos)}</strong>
          <strong className={styles.positive}>{percentReceita.toFixed(0)}%</strong>
        </div>
        <ProgressBar percent={percentReceita} />

        <div className={styles.spacer} />

        <div className={styles.rowLabel}>Despesas</div>
        <div className={styles.rowValue}>
          <strong>{formatBRL(resumo.despesaCentavos)}</strong>
          <strong>{percentDespesa.toFixed(0)}%</strong>
        </div>
        <ProgressBar percent={percentDespesa} />

        <div className={styles.spacer} />

        <Alert
          title="Projeção do mês"
          description={`Lucro estimado de ${formatBRL(resumo.lucroCentavos)} até o fim do mês.`}
        />
      </CardBody>
    </Card>
  );
}
