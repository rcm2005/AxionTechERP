import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import type { Produto } from '@/types';
import { formatBRL } from '@/utils/format';
import { tipoProdutoMeta } from '@/utils/statusMaps';
import styles from './estoqueColumns.module.scss';

export const estoqueColumns: Column<Produto>[] = [
  {
    key: 'sku',
    header: 'SKU',
    width: '140px',
    render: (p) => <span className={styles.sku}>{p.sku}</span>,
  },
  {
    key: 'nome',
    header: 'Nome / Descrição',
    render: (p) => (
      <div className={styles.nomeWrapper}>
        <span className={styles.nome}>{p.nome}</span>
        <span className={styles.muted}>
          {p.categoria ? `${p.categoria}` : ''}
          {p.ncm ? ` • NCM ${p.ncm}` : ''}
          {p.ean ? ` • EAN ${p.ean}` : ''}
        </span>
      </div>
    ),
  },
  {
    key: 'tipo',
    header: 'Tipo',
    width: '130px',
    render: (p) => {
      const meta = tipoProdutoMeta[p.tipo] ?? { label: p.tipo, tone: 'neutral', shortLabel: p.tipo };
      return <Pill tone={meta.tone}>{meta.shortLabel}</Pill>;
    },
  },
  {
    key: 'unidade',
    header: 'Unidade',
    width: '80px',
    render: (p) => <span className={styles.unidade}>{p.unidadeMedida}</span>,
  },
  {
    key: 'custo',
    header: 'Custo Médio',
    width: '120px',
    align: 'right',
    render: (p) => (
      <span className={styles.valor}>{formatBRL(p.custoMedio)}</span>
    ),
  },
  {
    key: 'preco',
    header: 'Preço Venda',
    width: '120px',
    align: 'right',
    render: (p) => (
      <span className={styles.valor}>
        {p.precoSugerido > 0 ? formatBRL(p.precoSugerido) : '—'}
      </span>
    ),
  },
  {
    key: 'estoqueAtual',
    header: 'Estoque Atual',
    width: '140px',
    align: 'right',
    render: (p) => {
      const abaixoMinimo = p.estoqueAtual <= p.estoqueMinimo;
      return (
        <div className={styles.estoqueWrapper} style={{ justifyContent: 'flex-end' }}>
          <span className={styles.estoqueQtd}>
            {p.estoqueAtual.toLocaleString('pt-BR')} {p.unidadeMedida}
          </span>
          {abaixoMinimo && (
            <span className={styles.alertaMinimo} title={`Estoque mínimo: ${p.estoqueMinimo}`}>
              Reposição
            </span>
          )}
        </div>
      );
    },
  },
];
