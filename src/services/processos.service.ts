import type { Andamento, Processo } from '@/types';
import { db, saveDB } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export async function listarProcessos(): Promise<Processo[]> {
  if (USE_MOCKS) {
    await delay();
    return db.processos;
  }
  const { data } = await http.get<Processo[]>('/processos');
  return data;
}

export async function buscarProcesso(id: string): Promise<Processo | undefined> {
  if (USE_MOCKS) {
    await delay();
    return db.processos.find((p) => p.id === id);
  }
  const { data } = await http.get<Processo>(`/processos/${id}`);
  return data;
}

export async function listarAndamentos(processoId: string): Promise<Andamento[]> {
  if (USE_MOCKS) {
    await delay();
    return db.andamentos
      .filter((a) => a.processoId === processoId)
      .sort((a, b) => (a.data < b.data ? 1 : -1));
  }
  const { data } = await http.get<Andamento[]>(`/processos/${processoId}/andamentos`);
  return data;
}

export async function criarProcesso(
  dados: Omit<Processo, 'id' | 'distribuidoEm' | 'qtdDocumentos' | 'qtdDocumentosPendentes'>,
): Promise<Processo> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: Processo = {
      ...dados,
      id: `p${Date.now()}`,
      distribuidoEm: new Date().toISOString().slice(0, 10),
      qtdDocumentos: 0,
      qtdDocumentosPendentes: 0,
    };
    db.processos.push(novo);
    saveDB();
    return novo;
  }
  const { data } = await http.post<Processo>('/processos', dados);
  return data;
}
