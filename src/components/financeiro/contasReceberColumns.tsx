import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import type { Lancamento } from '@/types';
import { db } from '@/mocks';
import { formatBRL, formatDayMonth } from '@/utils/format';
import { lancamentoStatusMeta } from '@/utils/statusMaps';

function nomeCliente(id?: string): string {
  if (!id) return '—';
  return db.clientes.find((c) => c.id === id)?.nome ?? '—';
}

function numeroProcesso(id?: string): string | null {
  if (!id) return null;
  return db.processos.find((p) => p.id === id)?.numeroCurto ?? null;
}

export const contasReceberColumns: Column<Lancamento>[] = [
  {
    key: 'cliente',
    header: 'Cliente',
    render: (l) => nomeCliente(l.clienteId),
  },
  {
    key: 'processo',
    header: 'Processo',
    render: (l) => numeroProcesso(l.processoId) ?? '—',
  },
  {
    key: 'descricao',
    header: 'Descrição',
    render: (l) => l.descricao,
  },
  {
    key: 'vencimento',
    header: 'Vencimento',
    render: (l) => formatDayMonth(l.vencimento),
  },
  {
    key: 'valor',
    header: 'Valor',
    align: 'right',
    render: (l) => formatBRL(l.valorCentavos),
  },
  {
    key: 'status',
    header: 'Status',
    render: (l) => {
      const meta = lancamentoStatusMeta[l.status];
      return <Pill tone={meta.tone}>{meta.label}</Pill>;
    },
  },
];
