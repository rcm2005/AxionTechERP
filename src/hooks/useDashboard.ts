import { getDashboardSummary } from '@/services/dashboard.service';
import { useAsync } from './useAsync';

export function useDashboard() {
  return useAsync(() => getDashboardSummary(), []);
}
