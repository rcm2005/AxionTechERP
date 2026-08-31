import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import { formatBRLDecimal } from '@/utils/format';
import type { Processo } from '@/types';
import type { Tone } from '@/types';

/** Status é texto livre no backend; mapeamos os valores conhecidos e caímos em neutro. */
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
 * Colunas da lista de processos. É uma factory porque o nome do cliente não vem
 * no payload do processo (só `cliente_id`) — quem renderiza injeta o lookup.
 */
export function criarProcessosColumns(nomeCliente: (id: string) => string): Column<Processo>[] {
  return [
    {
      key: 'numero_cnj',
      header: 'Número CNJ',
      width: '210px',
      render: (p) => (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{p.numero_cnj}</div>
          <small style={{ color: 'var(--color-muted)' }}>{p.tribunal}</small>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (p) => nomeCliente(p.cliente_id),
    },
    { key: 'vara', header: 'Vara', render: (p) => p.vara },
    { key: 'fase', header: 'Fase', width: '110px', render: (p) => <Pill tone="blue">{p.fase}</Pill> },
    {
      key: 'valor_causa',
      header: 'Valor da causa',
      width: '140px',
      align: 'right',
      render: (p) => formatBRLDecimal(p.valor_causa),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (p) => <Pill tone={toneDoStatusProcesso(p.status)}>{p.status}</Pill>,
    },
  ];
}
