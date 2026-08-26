import type { ID } from './common';

export type TipoLancamento = 'receita' | 'despesa';

export type StatusLancamento = 'pago' | 'pendente' | 'atrasado' | 'cancelado' | 'parcial';

export type FormaPagamento =
  | 'boleto'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'transferencia'
  | 'dinheiro'
  | 'duplicata'
  | 'cheque';

export type NaturezaFinanceira =
  | 'operacional'
  | 'nao_operacional'
  | 'investimento'
  | 'financiamento'
  | 'tributario';

export interface LancamentoFinanceiro {
  id: ID;
  /**
   * Identificador do Tenant ao qual este lançamento financeiro pertence (Multi-tenant).
   */
  tenantId: ID;
  tipo: TipoLancamento;
  descricao: string;
  categoria: string;
  natureza?: NaturezaFinanceira;
  centroCusto?: string;
  /**
   * ID da Pessoa associada (Cliente para receitas, Fornecedor para despesas).
   */
  pessoaId?: ID;
  pessoaNome?: string;
  /**
   * Valor total do lançamento em centavos (ex: R$ 1.500,00 -> 150000).
   */
  valorCentavos: number;
  valorPagoCentavos?: number;
  descontoCentavos?: number;
  jurosMultaCentavos?: number;
  emissaoEm: string;
  vencimento: string;
  pagoEm?: string;
  status: StatusLancamento;
  formaPagamento?: FormaPagamento;
  /**
   * Identificadores de documento fiscal vinculado (NF-e, NFS-e, Duplicata Mercantil).
   */
  numeroDocumentoFiscal?: string;
  chaveNfe?: string;
  parcela?: {
    numero: number;
    total: number;
  };
  contaBancaria?: string;
  observacoes?: string;
  comprovanteUrl?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

/**
 * Alias para manter compatibilidade e facilitar uso conciso
 */
export type Lancamento = LancamentoFinanceiro;

export interface LancamentoFiltros {
  busca?: string;
  tipo?: TipoLancamento | 'todos';
  status?: StatusLancamento | 'todos';
  categoria?: string | 'todos';
  pessoaId?: ID;
  tenantId?: ID;
  dataInicio?: string;
  dataFim?: string;
}
