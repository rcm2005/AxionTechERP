import type { ID } from './common';

export type TipoEvento = 'prazo' | 'audiencia' | 'reuniao' | 'tarefa';
export type PrioridadeEvento = 'urgente' | 'atencao' | 'normal';

export interface EventoAgenda {
  id: ID;
  tipo: TipoEvento;
  titulo: string;
  descricao?: string;
  inicio: string;
  fim?: string;
  diaInteiro: boolean;
  prioridade: PrioridadeEvento;
  responsavelId: ID;
  processoId?: ID;
  clienteId?: ID;
  local?: string;
  concluido: boolean;
}

export interface AgendaFiltros {
  responsavelId?: ID | 'todos';
  tipo?: TipoEvento | 'todos';
  prioridade?: PrioridadeEvento | 'todas';
}
