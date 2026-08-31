import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import { Button } from '@/components/ui/Button/Button';
import { formatDate } from '@/utils/format';
import { classificarPrazo, prazoStatusMeta } from '@/utils/prazos';
import type { Prazo } from '@/types';
import styles from './prazosColumns.module.scss';

interface Opcoes {
  /** Rótulo do processo (número CNJ). Omitido dentro da própria tela do processo. */
  rotuloProcesso?: (processoId: string) => string;
  /** Se fornecido, exibe a ação rápida "Cumprir" para prazos pendentes. */
  onMarcarCumprido?: (prazo: Prazo) => void;
  /** Id em processamento, para desabilitar o botão durante o salvamento. */
  salvandoId?: string;
}

/**
 * Colunas de prazos. A coluna de PRAZO FATAL é deliberadamente o elemento mais
 * pesado da linha: perder essa data extingue o direito processual — é diferente
 * de um lembrete interno, e a tela existe justamente para tornar isso óbvio.
 */
export function criarPrazosColumns({
  rotuloProcesso,
  onMarcarCumprido,
  salvandoId,
}: Opcoes = {}): Column<Prazo>[] {
  const colunas: Column<Prazo>[] = [
    {
      key: 'prazo_fatal',
      header: 'Prazo fatal',
      width: '170px',
      render: (p) => {
        const { urgencia, tone, label } = classificarPrazo(p);
        return (
          <div className={styles.fatal} data-urgencia={urgencia}>
            <span className={styles.fatalData}>{formatDate(p.prazo_fatal)}</span>
            <Pill tone={tone}>{label}</Pill>
          </div>
        );
      },
    },
    {
      key: 'descricao',
      header: 'Ato / descrição',
      render: (p) => (
        <div>
          <div>{p.descricao}</div>
          <small style={{ color: 'var(--color-muted)' }}>
            {p.data_intimacao ? `Intimação em ${formatDate(p.data_intimacao)}` : 'Sem data de intimação'}
            {p.dias_uteis ? ` • ${p.dias_uteis} dias úteis` : ''}
            {p.origem === 'automatico' ? ' • capturado automaticamente' : ''}
          </small>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (p) => {
        const meta = prazoStatusMeta[p.status] ?? { label: p.status, tone: 'neutral' as const };
        return <Pill tone={meta.tone}>{meta.label}</Pill>;
      },
    },
  ];

  if (rotuloProcesso) {
    colunas.splice(1, 0, {
      key: 'processo',
      header: 'Processo',
      width: '190px',
      render: (p) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
          {rotuloProcesso(p.processo_id)}
        </span>
      ),
    });
  }

  if (onMarcarCumprido) {
    colunas.push({
      key: 'acoes',
      header: '',
      width: '110px',
      align: 'right',
      render: (p) =>
        p.status === 'pendente' ? (
          <Button
            variant="ghost"
            type="button"
            disabled={salvandoId === p.id}
            onClick={(e) => {
              // A linha inteira pode ser clicável; a ação rápida não deve navegar.
              e.stopPropagation();
              onMarcarCumprido(p);
            }}
          >
            {salvandoId === p.id ? 'Salvando…' : 'Cumprir'}
          </Button>
        ) : null,
    });
  }

  return colunas;
}
