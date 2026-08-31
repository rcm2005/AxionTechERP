import type { ID } from './common';

/**
 * Entidades do núcleo jurídico (processos, prazos, agenda, contratos).
 *
 * ATENÇÃO — divergência consciente de convenção: estes tipos usam `snake_case`
 * porque espelham 1:1 o contrato REST do backend (que é snake_case), diferente
 * dos tipos legados mockados (`Pessoa`, `Produto`, ...) que são camelCase.
 * Optou-se por não introduzir uma camada de mapeamento para evitar drift entre
 * o contrato real e o front — o payload que sai daqui é o payload que o backend
 * recebe.
 */

export interface ParteProcesso {
  nome: string;
  papel: string;
  cpf_cnpj?: string;
}

export interface Processo {
  id: ID;
  cliente_id: ID;
  /** Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO */
  numero_cnj: string;
  tribunal: string;
  vara: string;
  partes: ParteProcesso[];
  /** Decimal serializado como string, ex: "15000.00" */
  valor_causa: string;
  fase: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/** Corpo aceito por POST /processos e PUT /processos/:id */
export type ProcessoInput = Omit<Processo, 'id' | 'created_at' | 'updated_at'>;

export interface ProcessoFiltros {
  cliente_id?: string;
  status?: string;
  /** Filtro apenas de UI (client-side), não enviado ao backend. */
  busca?: string;
}
