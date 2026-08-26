import { buscarProcesso, listarAndamentos, listarProcessos } from '@/services/processos.service';
import { useAsync } from './useAsync';

export function useProcessos() {
  return useAsync(() => listarProcessos(), []);
}

export function useProcesso(id: string | undefined) {
  return useAsync(() => (id ? buscarProcesso(id) : Promise.resolve(undefined)), [id]);
}

export function useAndamentos(processoId: string | undefined) {
  return useAsync(() => (processoId ? listarAndamentos(processoId) : Promise.resolve([])), [processoId]);
}
