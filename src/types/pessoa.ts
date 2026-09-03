import type { ID, Endereco, Contato } from './common';

export type TipoPessoa = 'PF' | 'PJ';

export type TipoRelacao = 'cliente' | 'fornecedor' | 'ambos' | 'transportadora';

export type PessoaStatus = 'ativo' | 'inativo' | 'bloqueado' | 'prospect';

export type SituacaoCredito = 'aprovado' | 'em_analise' | 'bloqueado' | 'inadimplente' | 'sem_limite';

export interface Pessoa {
  id: ID;
  /**
   * Identificador do Tenant proprietário deste parceiro de negócios no modelo multi-tenant.
   */
  tenantId: ID;
  tipoPessoa: TipoPessoa;
  relacao?: TipoRelacao;
  razaoSocialOuNome: string;
  nomeFantasia?: string;
  documento: string; // CPF ou CNPJ formatado
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  isentoIE?: boolean;
  email: string;
  telefone: string;
  whatsapp?: string;
  endereco?: Endereco;
  contatoPrincipal?: Contato;
  situacaoCredito: SituacaoCredito;
  limiteCreditoCentavos?: number;
  valorEmAtrasoCentavos: number;
  status?: PessoaStatus;
  segmento?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface PessoaFiltros {
  busca?: string;
  relacao?: TipoRelacao | 'todos';
  tipoPessoa?: TipoPessoa | 'todos';
  status?: PessoaStatus | 'todos';
  situacaoCredito?: SituacaoCredito | 'todos';
  tenantId?: ID;
}

/** Aliases para compatibilidade e flexibilidade */
export type Cliente = Pessoa;
export type ClienteFiltros = PessoaFiltros;
export type ClienteStatus = PessoaStatus;
export type SituacaoFinanceira = SituacaoCredito;
