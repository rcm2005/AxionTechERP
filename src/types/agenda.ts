import type { ID } from './common';

export type AgendaEventoTipo = 'audiencia' | 'reuniao' | 'outro';

export interface AgendaEvento {
  id: ID;
  processo_id?: ID | null;
  responsavel_usuario_id: ID;
  tipo: AgendaEventoTipo;
  /** ISO datetime, ex: "2026-09-18T14:00:00Z" */
  data_hora: string;
  duracao_minutos: number;
  local: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export type AgendaEventoInput = Omit<AgendaEvento, 'id' | 'created_at' | 'updated_at'>;

export interface AgendaFiltros {
  processo_id?: string;
  responsavel_usuario_id?: string;
  tipo?: AgendaEventoTipo | 'todos';
  status?: string;
}
