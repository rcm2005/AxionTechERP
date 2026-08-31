import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { BuilderLayout } from '@/layouts/BuilderLayout';
import { LoginPage } from '@/pages/login/LoginPage';
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CopilotPage } from '@/pages/copilot/CopilotPage';
import { ClientesPage } from '@/pages/clientes/ClientesPage';
import { ClienteDetailPage } from '@/pages/clientes/ClienteDetailPage';
import { FinanceiroPage } from '@/pages/financeiro/FinanceiroPage';
import { ProcessosPage } from '@/pages/processos/ProcessosPage';
import { ProcessoDetailPage } from '@/pages/processos/ProcessoDetailPage';
import { PrazosPage } from '@/pages/prazos/PrazosPage';
import { AgendaPage } from '@/pages/agenda/AgendaPage';
import { ContratosPage } from '@/pages/contratos/ContratosPage';
import { PlanosPage } from '@/pages/configuracoes/PlanosPage';
import { PlaceholderPage } from '@/pages/placeholder/PlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LandingPage } from '@/pages/landing/LandingPage';
import { BuilderChatPage } from '@/pages/builder/BuilderChatPage';
import { ProjetosPage } from '@/pages/builder/ProjetosPage';
import { ContaPage } from '@/pages/builder/ContaPage';
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
        children: [
          { path: paths.login, element: <LoginPage /> },
        ],
      },
    ],
  },
  // Área /comecar — a shell de chat que monta o ERP.
  //
  // Sem PublicOnlyRoute de propósito: o tenant é criado NO MEIO do fluxo, o que
  // torna a sessão autenticada. Sob PublicOnlyRoute o usuário seria expulso pro
  // dashboard exatamente no momento de mostrar o preview. O wizard antigo
  // (`OnboardingPage`) continua vivo em /comecar/wizard como fallback.
  {
    element: <BuilderLayout />,
    children: [
      { path: paths.comecar, element: <BuilderChatPage /> },
      { path: paths.comecarProjetos, element: <ProjetosPage /> },
      { path: paths.comecarConta, element: <ContaPage /> },
    ],
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: paths.comecarWizard, element: <OnboardingPage /> }],
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
          { path: paths.financeiro, element: <FinanceiroPage /> },
          { path: paths.fiscal, element: <PlaceholderPage moduloOverride="fiscal" /> },
          { path: paths.clientes, element: <ClientesPage /> },
          { path: `${paths.clientes}/:clienteId`, element: <ClienteDetailPage /> },
          { path: paths.processos, element: <ProcessosPage /> },
          { path: `${paths.processos}/:processoId`, element: <ProcessoDetailPage /> },
          { path: paths.prazos, element: <PrazosPage /> },
          { path: paths.agenda, element: <AgendaPage /> },
          { path: paths.contratos, element: <ContratosPage /> },
          { path: paths.configuracoes, element: <PlanosPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
