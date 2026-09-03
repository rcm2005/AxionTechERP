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

/**
 * Mirrors `CnjDecomposicao` in the backend's `apps/api/src/utils/cnj.ts`
 * exactly (field names included) — that file owns the real CNJ
 * segment/tribunal lookup table and is the only place that ever resolves a
 * tribunal code to a name. This type only describes the shape of the value
 * the backend already computed and sent; do not add a lookup table here.
 */
export interface CnjDecomposicao {
  numeroCnj: string;
  segmentoJustica: string;
  codigoTribunal: string;
  codigoOrigem: string;
  ano: string;
  tribunal: string | null;
}

export interface Processo {
  id: ID;
  cliente_id: ID;
  /** Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO */
  numero_cnj: string;
  /**
   * Present only on the response from `GET /processos/:id` (not the list
   * endpoint), and only when `numero_cnj` matched the CNJ shape server-side —
   * `null` if the backend couldn't parse it, `undefined` in mock mode (no
   * local mock for this, see `processos.service.ts`) or when this Processo
   * came from the list endpoint. Always guard with optional chaining before
   * reading into it, never assume presence.
   */
  cnj_decomposicao?: CnjDecomposicao | null;
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
