import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { paths } from './paths';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
