import { Navigate } from 'react-router';
import { useProcessos } from '@/hooks/useProcessos';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { paths } from '@/routes/paths';

export function ProcessosIndexRedirect() {
  const { data: processos, loading } = useProcessos();

  if (loading) return <Skeleton height="200px" />;
  if (!processos || processos.length === 0) {
    return <EmptyState title="Nenhum processo cadastrado ainda." />;
  }

  return <Navigate to={paths.processoTab(processos[0].id, 'resumo')} replace />;
}
