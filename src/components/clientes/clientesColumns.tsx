import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import type { Cliente } from '@/types';
import { db } from '@/mocks';
import { clienteStatusMeta, situacaoFinanceiraMeta } from '@/utils/statusMaps';
import styles from './clientesColumns.module.scss';

function nomeResponsavel(id: string): string {
  return db.usuarios.find((u) => u.id === id)?.nomeExibicao ?? '—';
}

export const clientesColumns: Column<Cliente>[] = [
  {
    key: 'cliente',
    header: 'Cliente',
    render: (c) => (
      <div>
        <div className={styles.nome}>{c.nome}</div>
        <div className={styles.muted}>{c.documento}</div>
      </div>
    ),
  },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (c) => (c.tipoPessoa === 'PF' ? 'Pessoa física' : 'Pessoa jurídica'),
  },
  {
    key: 'contato',
    header: 'Contato',
    render: (c) => (
      <div>
        {c.telefone}
        <br />
        <span className={styles.muted}>{c.email}</span>
      </div>
    ),
  },
  {
    key: 'responsavel',
    header: 'Responsável',
    render: (c) => nomeResponsavel(c.responsavelId),
  },
  {
    key: 'processos',
    header: 'Processos',
    align: 'right',
    render: (c) => c.qtdProcessos,
  },
  {
    key: 'financeiro',
    header: 'Financeiro',
    render: (c) => {
      const meta = situacaoFinanceiraMeta[c.situacaoFinanceira];
      return <span className={styles[`tone-${meta.tone}`]}>{meta.label}</span>;
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (c) => {
      const meta = clienteStatusMeta[c.status];
      return <Pill tone={meta.tone}>{meta.label}</Pill>;
    },
  },
];
