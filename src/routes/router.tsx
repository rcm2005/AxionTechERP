import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginPage } from '@/pages/login/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CopilotPage } from '@/pages/copilot/CopilotPage';
import { ClientesPage } from '@/pages/clientes/ClientesPage';
import { ClienteDetailPage } from '@/pages/clientes/ClienteDetailPage';
import { FinanceiroPage } from '@/pages/financeiro/FinanceiroPage';
import { EstoquePage } from '@/pages/estoque/EstoquePage';
import { PlanosPage } from '@/pages/configuracoes/PlanosPage';
import { PlaceholderPage } from '@/pages/placeholder/PlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LandingPage } from '@/pages/landing/LandingPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { paths } from './paths';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
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
          { path: paths.dashboard, element: <DashboardPage /> },
          { path: paths.copilot, element: <CopilotPage /> },
          { path: paths.vendas, element: <PlaceholderPage moduloOverride="vendas" /> },
          { path: paths.compras, element: <PlaceholderPage moduloOverride="compras" /> },
          { path: paths.estoque, element: <EstoquePage /> },
          { path: paths.financeiro, element: <FinanceiroPage /> },
          { path: paths.fiscal, element: <PlaceholderPage moduloOverride="fiscal" /> },
          { path: paths.clientes, element: <ClientesPage /> },
          { path: `${paths.clientes}/:clienteId`, element: <ClienteDetailPage /> },
          { path: paths.configuracoes, element: <PlanosPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
