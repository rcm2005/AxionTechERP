import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import type { Lancamento } from '@/types';
import { formatBRL, formatDayMonth } from '@/utils/format';
import { lancamentoStatusMeta } from '@/utils/statusMaps';

function getPersonName(entry: Lancamento, clientNameById: Map<string, string>): string {
  if (entry.pessoaNome) return entry.pessoaNome;
  if (!entry.pessoaId) return '—';
  return clientNameById.get(entry.pessoaId) ?? '—';
}

export function getContasReceberColumns(clientNameById: Map<string, string>): Column<Lancamento>[] {
  return [
    {
      key: 'cliente',
      header: 'Cliente / Pagador',
      render: (entry) => getPersonName(entry, clientNameById),
    },
    {
      key: 'docFiscal',
      header: 'Doc. / NF',
      render: (entry) => entry.numeroDocumentoFiscal ?? '—',
    },
    {
      key: 'descricao',
      header: 'Descrição',
      render: (entry) => entry.descricao,
    },
    {
      key: 'vencimento',
      header: 'Vencimento',
      render: (entry) => formatDayMonth(entry.vencimento),
    },
    {
      key: 'valor',
      header: 'Valor',
      align: 'right',
      render: (entry) => formatBRL(entry.valorCentavos),
    },
    {
      key: 'status',
      header: 'Status',
      render: (entry) => {
        const meta = lancamentoStatusMeta[entry.status];
        return <Pill tone={meta.tone}>{meta.label}</Pill>;
      },
    },
  ];
}
