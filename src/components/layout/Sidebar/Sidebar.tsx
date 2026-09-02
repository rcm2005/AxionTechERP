import { useMemo } from 'react';
import { NavLink } from 'react-router';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Bot,
  Scale,
  AlarmClock,
  CalendarDays,
  FileSignature,
  DollarSign,
  FileText,
  Users,
  Settings,
  Building2,
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/mocks';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import styles from './Sidebar.module.scss';

interface SidebarNavItem {
  id: string;
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const CANONICAL_ITEMS: Record<string, { path: string; icon: typeof LayoutDashboard }> = {
  dashboard: { path: '/dashboard', icon: LayoutDashboard },
  copilot: { path: '/copilot', icon: Bot },
  processos: { path: '/processos', icon: Scale },
  prazos: { path: '/prazos', icon: AlarmClock },
  agenda: { path: '/agenda', icon: CalendarDays },
  clientes: { path: '/clientes', icon: Users },
  contratos: { path: '/contratos', icon: FileSignature },
  financeiro: { path: '/financeiro', icon: DollarSign },
  fiscal: { path: '/fiscal', icon: FileText },
  configuracoes: { path: '/configuracoes', icon: Settings },
};

const DEFAULT_SIDEBAR_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'copilot', path: '/copilot', label: 'Copilot', icon: Bot },
  { id: 'processos', path: '/processos', label: 'Processos', icon: Scale },
  { id: 'prazos', path: '/prazos', label: 'Prazos', icon: AlarmClock },
  { id: 'agenda', path: '/agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'clientes', path: '/clientes', label: 'Clientes', icon: Users },
  { id: 'contratos', path: '/contratos', label: 'Contratos', icon: FileSignature },
  { id: 'financeiro', path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'fiscal', path: '/fiscal', label: 'Fiscal', icon: FileText },
  { id: 'configuracoes', path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const { usuario, empresaAtivaId, tenantBranding, tenantNavegacao } = useAuth();

  const activeCompany = useMemo(() => {
    if (!empresaAtivaId) return null;
    return db.tenants.find((t) => t.id === empresaAtivaId);
  }, [empresaAtivaId]);

  const items = useMemo<SidebarNavItem[]>(() => {
    if (!tenantNavegacao) {
      return DEFAULT_SIDEBAR_ITEMS;
    }

    const result: SidebarNavItem[] = [];
    for (const item of tenantNavegacao) {
      if (!item.visivel) continue;
      const canonicalItem = CANONICAL_ITEMS[item.id];
      if (!canonicalItem) continue;
      result.push({
        id: item.id,
        path: canonicalItem.path,
        label: item.label,
        icon: canonicalItem.icon,
      });
    }
    return result;
  }, [tenantNavegacao]);

  const companyName =
    tenantBranding?.nomeExibicao ||
    activeCompany?.nomeFantasia ||
    activeCompany?.razaoSocial ||
    usuario?.escritorioContabilNome ||
    'Empresa Ativa';

  return (
    <aside className={styles.root}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <Building2 size={20} color="#fff" />
        </div>
        <div>
          <span className={styles.brandName}>{APP_NAME}</span>
          <small className={styles.brandTagline}>{APP_TAGLINE}</small>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Navegação principal">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                clsx(styles.navButton, isActive && styles.active)
              }
              title={item.label}
            >
              <span className={styles.icon}>
                <Icon size={18} />
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userFooter}>
          <Avatar iniciais={usuario?.iniciais ?? 'AD'} />
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {usuario?.nomeExibicao ?? usuario?.nome ?? 'Administrador'}
            </span>
            <span className={styles.userRole} title={companyName}>
              {companyName}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
