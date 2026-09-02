import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import { formatBRLDecimal } from '@/utils/format';
import type { Processo } from '@/types';
import type { Tone } from '@/types';

/** Status is free-form text in the backend; we map known values and fall back to neutral. */
export function toneDoStatusProcesso(status: string): Tone {
  switch (status.toLowerCase()) {
    case 'ativo':
      return 'green';
    case 'suspenso':
      return 'orange';
    case 'arquivado':
      return 'neutral';
    default:
      return 'blue';
  }
}

/**
 * Case list columns. Factory function because the client name is not in the case
 * payload (only `cliente_id`) — the renderer injects the lookup.
 */
export function criarProcessosColumns(clientName: (id: string) => string): Column<Processo>[] {
  return [
    {
      key: 'numero_cnj',
      header: 'Número CNJ',
      width: '210px',
      render: (caseItem) => (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{caseItem.numero_cnj}</div>
          <small style={{ color: 'var(--color-muted)' }}>{caseItem.tribunal}</small>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (caseItem) => clientName(caseItem.cliente_id),
    },
    { key: 'vara', header: 'Vara', render: (caseItem) => caseItem.vara },
    { key: 'fase', header: 'Fase', width: '110px', render: (caseItem) => <Pill tone="blue">{caseItem.fase}</Pill> },
    {
      key: 'valor_causa',
      header: 'Valor da causa',
      width: '140px',
      align: 'right',
      render: (caseItem) => formatBRLDecimal(caseItem.valor_causa),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (caseItem) => <Pill tone={toneDoStatusProcesso(caseItem.status)}>{caseItem.status}</Pill>,
    },
  ];
}
