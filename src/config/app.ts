import { paths } from '@/routes/paths';

export const APP_NAME = 'Law ERP';
export const APP_TAGLINE = 'ERP JURÍDICO';
export const COMPANY_NAME = 'AXION TECH';
export const SUPPORT_EMAIL = 'suporte@axiontech.com.br';
export const OFFICE_NAME = 'Escritório Silva & Associados';

// Data usada como "hoje" enquanto os dados forem mockados — troque por
// `new Date().toISOString()` quando um backend real fornecer os dados.
export const REFERENCE_DATE = '2026-08-18';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: paths.dashboard, label: 'Dashboard', icon: '▦' },
  { path: paths.clientes, label: 'Clientes', icon: '♙' },
  { path: paths.processos, label: 'Processos', icon: '§' },
  { path: paths.agenda, label: 'Agenda & Prazos', icon: '◷' },
  { path: paths.financeiro, label: 'Financeiro', icon: 'R$' },
];
