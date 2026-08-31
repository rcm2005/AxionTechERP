import type { ID } from './common';

export interface Contrato {
  id: ID;
  cliente_id: ID;
  titulo: string;
  /** Texto livre: consultoria, mensal, exito, parecer, ... */
  tipo: string;
  /** Decimal serializado como string, ex: "2500.00" */
  valor?: string | null;
  /** "YYYY-MM-DD" */
  data_inicio: string;
  /** "YYYY-MM-DD" */
  data_fim?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export type ContratoInput = Omit<Contrato, 'id' | 'created_at' | 'updated_at'>;

export interface ContratoFiltros {
  cliente_id?: string;
  status?: string;
  /** Filtro apenas de UI (client-side), não enviado ao backend. */
  busca?: string;
}
