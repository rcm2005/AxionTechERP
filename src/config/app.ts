import { paths } from '@/routes/paths';

export const APP_NAME = 'Axion ERP';
export const APP_TAGLINE = 'ERP CORPORATIVO MULTI-TENANT';
export const COMPANY_NAME = 'AXION ENTERPRISE';
export const SUPPORT_EMAIL = 'suporte@axionerp.com.br';
export const OFFICE_NAME = 'Corporativo Multi-tenant';

// Data usada como "hoje" enquanto os dados forem mockados — troque por
// `new Date().toISOString()` quando um backend real fornecer os dados.
export const REFERENCE_DATE = '2026-08-18';

export interface NavItem {
  path: string;
  label: string;
  icon?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: paths.dashboard, label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: paths.processos, label: 'Processos', icon: 'Scale' },
  { path: paths.prazos, label: 'Prazos', icon: 'AlarmClock' },
  { path: paths.agenda, label: 'Agenda', icon: 'CalendarDays' },
  { path: paths.clientes, label: 'Clientes', icon: 'Users' },
  { path: paths.contratos, label: 'Contratos', icon: 'FileSignature' },
  { path: paths.financeiro, label: 'Financeiro', icon: 'DollarSign' },
  { path: paths.fiscal, label: 'Fiscal', icon: 'FileText' },
  { path: paths.configuracoes, label: 'Configurações', icon: 'Settings' },
];
