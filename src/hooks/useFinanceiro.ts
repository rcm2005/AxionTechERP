import { listEntries } from '@/services/financeiro.service';
import { useAsync } from './useAsync';

export function useLancamentos() {
  return useAsync(() => listEntries(), []);
}
