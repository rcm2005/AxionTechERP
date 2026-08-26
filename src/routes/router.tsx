import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginPage } from '@/pages/login/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ClientesPage } from '@/pages/clientes/ClientesPage';
import { ClienteDetailPage } from '@/pages/clientes/ClienteDetailPage';
import { ProcessosPage } from '@/pages/processos/ProcessosPage';
import { ProcessosIndexRedirect } from '@/pages/processos/ProcessosIndexRedirect';
import { ProcessoTabIndexRedirect } from '@/pages/processos/ProcessoTabIndexRedirect';
import { ResumoTab } from '@/pages/processos/tabs/ResumoTab';
import { AndamentosTab } from '@/pages/processos/tabs/AndamentosTab';
import { PrazosTab } from '@/pages/processos/tabs/PrazosTab';
import { AudienciasTab } from '@/pages/processos/tabs/AudienciasTab';
import { DocumentosTab } from '@/pages/processos/tabs/DocumentosTab';
import { TarefasTab } from '@/pages/processos/tabs/TarefasTab';
import { FinanceiroTab } from '@/pages/processos/tabs/FinanceiroTab';
import { AgendaPage } from '@/pages/agenda/AgendaPage';
import { FinanceiroPage } from '@/pages/financeiro/FinanceiroPage';
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
          { path: paths.clientes, element: <ClientesPage /> },
          { path: `${paths.clientes}/:clienteId`, element: <ClienteDetailPage /> },
          { path: paths.processos, element: <ProcessosIndexRedirect /> },
          {
            path: `${paths.processos}/:processoId`,
            element: <ProcessosPage />,
            children: [
              { index: true, element: <ProcessoTabIndexRedirect /> },
              { path: 'resumo', element: <ResumoTab /> },
              { path: 'andamentos', element: <AndamentosTab /> },
              { path: 'prazos', element: <PrazosTab /> },
              { path: 'audiencias', element: <AudienciasTab /> },
              { path: 'documentos', element: <DocumentosTab /> },
              { path: 'tarefas', element: <TarefasTab /> },
              { path: 'financeiro', element: <FinanceiroTab /> },
            ],
          },
          { path: paths.agenda, element: <AgendaPage /> },
          { path: paths.financeiro, element: <FinanceiroPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
