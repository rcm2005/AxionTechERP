import { Navigate, useParams } from 'react-router';
import { paths } from '@/routes/paths';

export function ProcessoTabIndexRedirect() {
  const { processoId } = useParams<{ processoId: string }>();
  return <Navigate to={paths.processoTab(processoId ?? '', 'resumo')} replace />;
}
