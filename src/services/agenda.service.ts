import type { AgendaFiltros, EventoAgenda } from '@/types';
import { db } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export function filtrarEventos(eventos: EventoAgenda[], filtros: AgendaFiltros): EventoAgenda[] {
  return eventos.filter((e) => {
    if (
      filtros.responsavelId &&
      filtros.responsavelId !== 'todos' &&
      e.responsavelId !== filtros.responsavelId
    ) {
      return false;
    }
    if (filtros.tipo && filtros.tipo !== 'todos' && e.tipo !== filtros.tipo) return false;
    if (filtros.prioridade && filtros.prioridade !== 'todas' && e.prioridade !== filtros.prioridade) {
      return false;
    }
    return true;
  });
}

export async function listarEventos(filtros: AgendaFiltros = {}): Promise<EventoAgenda[]> {
  if (USE_MOCKS) {
    await delay();
    return filtrarEventos(db.eventos, filtros);
  }
  const { data } = await http.get<EventoAgenda[]>('/agenda', { params: filtros });
  return data;
}

export async function criarEvento(
  dados: Omit<EventoAgenda, 'id' | 'concluido'>,
): Promise<EventoAgenda> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: EventoAgenda = {
      ...dados,
      id: `e${Date.now()}`,
      concluido: false,
    };
    db.eventos.push(novo);
    return novo;
  }
  const { data } = await http.post<EventoAgenda>('/agenda', dados);
  return data;
}
