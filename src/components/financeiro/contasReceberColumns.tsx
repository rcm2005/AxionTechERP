import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import type { Lancamento } from '@/types';
import { db } from '@/mocks';
import { formatBRL, formatDayMonth } from '@/utils/format';
import { lancamentoStatusMeta } from '@/utils/statusMaps';

function nomePessoa(l: Lancamento): string {
  if (l.pessoaNome) return l.pessoaNome;
  if (!l.pessoaId) return '—';
  const p = db.pessoas.find((item) => item.id === l.pessoaId);
  return p ? (p.nomeFantasia || p.razaoSocialOuNome) : '—';
}

export const contasReceberColumns: Column<Lancamento>[] = [
  {
    key: 'cliente',
    header: 'Cliente / Pagador',
    render: (l) => nomePessoa(l),
  },
  {
    key: 'docFiscal',
    header: 'Doc. / NF',
    render: (l) => l.numeroDocumentoFiscal ?? '—',
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
