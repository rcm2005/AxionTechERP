import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import { Button } from '@/components/ui/Button/Button';
import { formatDate } from '@/utils/format';
import { classifyDeadline, deadlineStatusMeta } from '@/utils/prazos';
import type { Prazo } from '@/types';
import styles from './prazosColumns.module.scss';

interface Options {
  /** Case label (CNJ number). Omitted inside the case screen itself. */
  rotuloProcesso?: (processoId: string) => string;
  /** If provided, displays the "Cumprir" quick action for pending deadlines. */
  onMarcarCumprido?: (deadline: Prazo) => void;
  /** ID being saved, to disable the button during saving. */
  salvandoId?: string;
}

/**
 * Deadline columns. The FATAL DEADLINE column is deliberately the heaviest
 * element of the row: missing this date forfeits procedural rights — it differs
 * from an internal reminder, and this screen exists precisely to make that obvious.
 */
export function criarPrazosColumns({
  rotuloProcesso,
  onMarcarCumprido,
  salvandoId,
}: Options = {}): Column<Prazo>[] {
  const columns: Column<Prazo>[] = [
    {
      key: 'prazo_fatal',
      header: 'Prazo fatal',
      width: '170px',
      render: (deadline) => {
        const { urgencyLevel, tone, label } = classifyDeadline(deadline);
        return (
          <div className={styles.fatal} data-urgency={urgencyLevel}>
            <span className={styles.fatalData}>{formatDate(deadline.prazo_fatal)}</span>
            <Pill tone={tone}>{label}</Pill>
          </div>
        );
      },
    },
    {
      key: 'descricao',
      header: 'Ato / descrição',
      render: (deadline) => (
        <div>
          <div>{deadline.descricao}</div>
          <small style={{ color: 'var(--color-muted)' }}>
            {deadline.data_intimacao ? `Intimação em ${formatDate(deadline.data_intimacao)}` : 'Sem data de intimação'}
            {deadline.dias_uteis ? ` • ${deadline.dias_uteis} dias úteis` : ''}
            {deadline.origem === 'automatico' ? ' • capturado automaticamente' : ''}
          </small>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (deadline) => {
        const meta = deadlineStatusMeta[deadline.status] ?? { label: deadline.status, tone: 'neutral' as const };
        return <Pill tone={meta.tone}>{meta.label}</Pill>;
      },
    },
  ];

  if (rotuloProcesso) {
    columns.splice(1, 0, {
      key: 'processo',
      header: 'Processo',
      width: '190px',
      render: (deadline) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
          {rotuloProcesso(deadline.processo_id)}
        </span>
      ),
    });
  }

  if (onMarcarCumprido) {
    columns.push({
      key: 'acoes',
      header: '',
      width: '110px',
      align: 'right',
      render: (deadline) =>
        deadline.status === 'pendente' ? (
          <Button
            variant="ghost"
            type="button"
            disabled={salvandoId === deadline.id}
            onClick={(e) => {
              // The whole row may be clickable; the quick action must not navigate.
              e.stopPropagation();
              onMarcarCumprido(deadline);
            }}
          >
            {salvandoId === deadline.id ? 'Salvando…' : 'Cumprir'}
          </Button>
        ) : null,
    });
  }

  return columns;
}
