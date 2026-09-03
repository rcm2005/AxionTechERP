import type { Column } from '@/components/ui/DataTable/DataTable';
import type { Pessoa } from '@/types';
import { situacaoCreditoMeta } from '@/utils/statusMaps';
import styles from './clientesColumns.module.scss';

export const clientesColumns: Column<Pessoa>[] = [
  {
    key: 'cliente',
    header: 'Parceiro / Razão Social',
    render: (client) => (
      <div>
        <div className={styles.nome}>{client.razaoSocialOuNome}</div>
        <div className={styles.muted}>
          {client.nomeFantasia ? `${client.nomeFantasia} • ` : ''}
          {client.documento}
        </div>
      </div>
    ),
  },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (client) => (client.tipoPessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'),
  },
  {
    key: 'contato',
    header: 'Contato',
    render: (client) => (
      <div>
        {client.telefone}
        <br />
        <span className={styles.muted}>{client.email}</span>
      </div>
    ),
  },
  {
    key: 'credito',
    header: 'Situação Crédito',
    render: (client) => {
      const meta = situacaoCreditoMeta[client.situacaoCredito] ?? { label: client.situacaoCredito, tone: 'neutral' };
      return <span className={styles[`tone-${meta.tone}`]}>{meta.label}</span>;
    },
  },
];
