import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { paths } from './paths';

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={paths.comecarProjetos} replace />;
  }

  return <Outlet />;
}
