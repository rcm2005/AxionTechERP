import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import type { Pessoa } from '@/types';
import { pessoaStatusMeta, situacaoCreditoMeta, tipoRelacaoMeta } from '@/utils/statusMaps';
import styles from './clientesColumns.module.scss';

export const clientesColumns: Column<Pessoa>[] = [
  {
    key: 'cliente',
    header: 'Parceiro / Razão Social',
    render: (c) => (
      <div>
        <div className={styles.nome}>{c.razaoSocialOuNome}</div>
        <div className={styles.muted}>
          {c.nomeFantasia ? `${c.nomeFantasia} • ` : ''}
          {c.documento}
        </div>
      </div>
    ),
  },
  {
    key: 'relacao',
    header: 'Relação',
    render: (c) => {
      const meta = tipoRelacaoMeta[c.relacao] ?? { label: c.relacao, tone: 'neutral' };
      return <Pill tone={meta.tone}>{meta.label}</Pill>;
    },
  },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (c) => (c.tipoPessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'),
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
    key: 'credito',
    header: 'Situação Crédito',
    render: (c) => {
      const meta = situacaoCreditoMeta[c.situacaoCredito] ?? { label: c.situacaoCredito, tone: 'neutral' };
      return <span className={styles[`tone-${meta.tone}`]}>{meta.label}</span>;
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (c) => {
      const meta = pessoaStatusMeta[c.status] ?? { label: c.status, tone: 'neutral' };
      return <Pill tone={meta.tone}>{meta.label}</Pill>;
    },
  },
];
