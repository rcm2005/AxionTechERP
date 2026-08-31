import axios from 'axios';
import type { AgendaEvento, AgendaEventoInput, AgendaFiltros } from '@/types';
import { agendaEventosMock } from '@/mocks/juridico.mock';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/** Ver nota sobre persistência em `processos.service.ts`. */
const store: AgendaEvento[] = [...agendaEventosMock];

/**
 * Erro de agendamento em conflito.
 *
 * O backend impede double-booking do mesmo responsável no nível do banco e
 * responde HTTP 409 `{ error: 'Conflict', message }`. Isso é uma validação de
 * negócio legítima, não uma falha — a UI precisa mostrar a mensagem do servidor
 * ao lado do campo, e não um "erro ao salvar" genérico.
 */
export class ConflitoAgendaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflitoAgendaError';
  }
}

const MENSAGEM_CONFLITO_PADRAO =
  'Já existe um compromisso para este responsável nesse horário.';

/**
 * Converte o 409 do backend em `ConflitoAgendaError`; qualquer outro erro é
 * repassado intacto para não mascarar falhas reais (401, 500, rede).
 */
function traduzirErro(erro: unknown): never {
  if (axios.isAxiosError(erro) && erro.response?.status === 409) {
    const corpo = erro.response.data as { message?: string } | undefined;
    throw new ConflitoAgendaError(corpo?.message?.trim() || MENSAGEM_CONFLITO_PADRAO);
  }
  throw erro;
}

function fimEm(inicioIso: string, duracaoMinutos: number): number {
  return new Date(inicioIso).getTime() + duracaoMinutos * 60_000;
}

/**
 * Reproduz a checagem de sobreposição do backend no modo mock, para que o
 * caminho de erro 409 seja exercitável sem servidor.
 */
function assegurarSemConflito(candidato: AgendaEventoInput, ignorarId?: string): void {
  const inicio = new Date(candidato.data_hora).getTime();
  const fim = fimEm(candidato.data_hora, candidato.duracao_minutos);

  const colide = store.some((e) => {
    if (e.id === ignorarId) return false;
    if (e.responsavel_usuario_id !== candidato.responsavel_usuario_id) return false;
    const eInicio = new Date(e.data_hora).getTime();
    return inicio < fimEm(e.data_hora, e.duracao_minutos) && eInicio < fim;
  });

  if (colide) throw new ConflitoAgendaError(MENSAGEM_CONFLITO_PADRAO);
}

function aplicarFiltros(eventos: AgendaEvento[], filtros: AgendaFiltros): AgendaEvento[] {
  return eventos.filter((e) => {
    if (filtros.processo_id && e.processo_id !== filtros.processo_id) return false;
    if (filtros.responsavel_usuario_id && e.responsavel_usuario_id !== filtros.responsavel_usuario_id)
      return false;
    if (filtros.tipo && filtros.tipo !== 'todos' && e.tipo !== filtros.tipo) return false;
    if (filtros.status && filtros.status !== 'todos' && e.status !== filtros.status) return false;
    return true;
  });
}

function paramsDeFiltro(filtros: AgendaFiltros) {
  const { processo_id, responsavel_usuario_id, tipo, status } = filtros;
  return {
    ...(processo_id ? { processo_id } : {}),
    ...(responsavel_usuario_id ? { responsavel_usuario_id } : {}),
    ...(tipo && tipo !== 'todos' ? { tipo } : {}),
    ...(status && status !== 'todos' ? { status } : {}),
  };
}

function ordenarCronologicamente(eventos: AgendaEvento[]): AgendaEvento[] {
  return [...eventos].sort((a, b) => a.data_hora.localeCompare(b.data_hora));
}

export async function listarAgendaEventos(filtros: AgendaFiltros = {}): Promise<AgendaEvento[]> {
  if (USE_MOCKS) {
    await delay();
    return ordenarCronologicamente(aplicarFiltros(store, filtros));
  }
  const { data } = await http.get<AgendaEvento[]>('/agenda-eventos', {
    params: paramsDeFiltro(filtros),
  });
  return ordenarCronologicamente(data);
}

export async function buscarAgendaEvento(id: string): Promise<AgendaEvento | undefined> {
  if (USE_MOCKS) {
    await delay();
    return store.find((e) => e.id === id);
  }
  const { data } = await http.get<AgendaEvento>(`/agenda-eventos/${id}`);
  return data;
}

/** @throws {ConflitoAgendaError} quando o horário do responsável já está ocupado. */
export async function criarAgendaEvento(dados: AgendaEventoInput): Promise<AgendaEvento> {
  if (USE_MOCKS) {
    await delay(300);
    assegurarSemConflito(dados);
    const novo: AgendaEvento = { ...dados, id: `agev-${Date.now()}`, created_at: new Date().toISOString() };
    store.push(novo);
    return novo;
  }
  try {
    const { data } = await http.post<AgendaEvento>('/agenda-eventos', dados);
    return data;
  } catch (erro) {
    traduzirErro(erro);
  }
}

/** @throws {ConflitoAgendaError} quando o horário do responsável já está ocupado. */
export async function atualizarAgendaEvento(
  id: string,
  dados: Partial<AgendaEventoInput>,
): Promise<AgendaEvento> {
  if (USE_MOCKS) {
    await delay(300);
    const i = store.findIndex((e) => e.id === id);
    if (i < 0) throw new Error('Evento não encontrado.');
    const atualizado = { ...store[i], ...dados };
    assegurarSemConflito(atualizado, id);
    store[i] = { ...atualizado, updated_at: new Date().toISOString() };
    return store[i];
  }
  try {
    const { data } = await http.put<AgendaEvento>(`/agenda-eventos/${id}`, dados);
    return data;
  } catch (erro) {
    traduzirErro(erro);
  }
}

export async function excluirAgendaEvento(id: string): Promise<void> {
  if (USE_MOCKS) {
    await delay(300);
    const i = store.findIndex((e) => e.id === id);
    if (i >= 0) store.splice(i, 1);
    return;
  }
  await http.delete(`/agenda-eventos/${id}`);
}
