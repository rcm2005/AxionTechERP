import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginPage } from '@/pages/login/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ClientesPage } from '@/pages/clientes/ClientesPage';
import { ClienteDetailPage } from '@/pages/clientes/ClienteDetailPage';
import { FinanceiroPage } from '@/pages/financeiro/FinanceiroPage';
import { PlaceholderPage } from '@/pages/placeholder/PlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { paths } from './paths';

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: paths.login, element: <LoginPage /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={paths.dashboard} replace /> },
          { path: paths.dashboard, element: <DashboardPage /> },
          { path: paths.vendas, element: <PlaceholderPage moduloOverride="vendas" /> },
          { path: paths.compras, element: <PlaceholderPage moduloOverride="compras" /> },
          { path: paths.estoque, element: <PlaceholderPage moduloOverride="estoque" /> },
          { path: paths.financeiro, element: <FinanceiroPage /> },
          { path: paths.fiscal, element: <PlaceholderPage moduloOverride="fiscal" /> },
          { path: paths.clientes, element: <ClientesPage /> },
          { path: `${paths.clientes}/:clienteId`, element: <ClienteDetailPage /> },
          { path: paths.configuracoes, element: <PlaceholderPage moduloOverride="configuracoes" /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
