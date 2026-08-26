import type { ID } from './common';

/**
 * Classificação fiscal e produtiva do item:
 * - MP: Matéria-Prima (Insumos industriais para transformação)
 * - PA: Produto Acabado (Produto final fabricado ou mercadoria para revenda)
 * - Consumo: Material de Uso e Consumo / Expedição
 * - Embalagem: Insumos de acondicionamento e embalagem
 * - Servico: Mão de obra / serviços prestados
 */
export type TipoProduto = 'MP' | 'PA' | 'Consumo' | 'Embalagem' | 'Servico';

export type UnidadeMedida =
  | 'UN'
  | 'KG'
  | 'CX'
  | 'MT'
  | 'LT'
  | 'PAR'
  | 'M2'
  | 'M3'
  | 'TON'
  | 'PC'
  | 'ROLO';

export type ProdutoStatus = 'ativo' | 'inativo' | 'fora_de_linha';

/**
 * Tabela de Origem da Mercadoria (Fiscal / ICMS / IPI)
 * 0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8
 * 1 - Estrangeira - Importação direta
 * 2 - Estrangeira - Adquirida no mercado interno
 * ...
 */
export type OrigemMercadoria = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Produto {
  id: ID;
  /**
   * Identificador do Tenant proprietário deste SKU no modelo multi-tenant.
   */
  tenantId: ID;
  sku: string;
  nome: string;
  descricao?: string;
  ean?: string;
  tipo: TipoProduto;
  unidadeMedida: UnidadeMedida;
  /**
   * Nomenclatura Comum do Mercosul (8 dígitos, ex: "3902.10.20").
   */
  ncm: string;
  /**
   * Código Especificador da Substituição Tributária (7 dígitos).
   */
  cest?: string;
  cfopPadrao?: string;
  origemFiscal?: OrigemMercadoria;
  /**
   * Preço de venda sugerido ao consumidor/cliente em centavos de Real (ex: R$ 150,00 -> 15000).
   */
  precoSugerido: number;
  /**
   * Custo médio de aquisição ou custo industrial contábil por unidade em centavos de Real.
   */
  custoMedio: number;
  custoUltimaCompra?: number;
  margemLucroPercentual?: number;
  /**
   * Saldo físico atual em estoque.
   */
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo?: number;
  localizacaoAlmoxarifado?: string;
  pesoLiquidoKg?: number;
  pesoBrutoKg?: number;
  status: ProdutoStatus;
  categoria: string;
  fabricanteMarca?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface ProdutoFiltros {
  busca?: string;
  tipo?: TipoProduto | 'todos';
  status?: ProdutoStatus | 'todos';
  categoria?: string | 'todos';
  abaixoEstoqueMinimo?: boolean;
  tenantId?: ID;
}
