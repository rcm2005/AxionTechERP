import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import type { Lancamento } from '@/types';
import { db } from '@/mocks';
import { formatBRL, formatDayMonth } from '@/utils/format';
import { lancamentoStatusMeta } from '@/utils/statusMaps';

function getPersonName(entry: Lancamento): string {
  if (entry.pessoaNome) return entry.pessoaNome;
  if (!entry.pessoaId) return '—';
  const person = db.pessoas.find((item) => item.id === entry.pessoaId);
  return person ? (person.nomeFantasia || person.razaoSocialOuNome) : '—';
}

export const contasReceberColumns: Column<Lancamento>[] = [
  {
    key: 'cliente',
    header: 'Cliente / Pagador',
    render: (entry) => getPersonName(entry),
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
