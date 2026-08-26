import { buscarResumoDashboard } from '@/services/dashboard.service';
import { useAsync } from './useAsync';

export function useDashboard() {
  return useAsync(() => buscarResumoDashboard(), []);
}
