import type { ID } from './common';

export type TipoPessoa = 'PF' | 'PJ';
export type ClienteStatus = 'ativo' | 'inativo' | 'prospect';
export type SituacaoFinanceira = 'em_dia' | 'inadimplente' | 'sem_lancamentos';

export interface Cliente {
  id: ID;
  nome: string;
  tipoPessoa: TipoPessoa;
  documento: string;
  telefone: string;
  email: string;
  responsavelId: ID;
  qtdProcessos: number;
  situacaoFinanceira: SituacaoFinanceira;
  valorEmAtrasoCentavos: number;
  status: ClienteStatus;
  criadoEm: string;
}

export interface ClienteFiltros {
  busca?: string;
  status?: ClienteStatus | 'todos';
  responsavelId?: ID | 'todos';
}
