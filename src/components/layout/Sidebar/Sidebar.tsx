import { useMemo } from 'react';
import { NavLink } from 'react-router';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
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
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { path: '/compras', label: 'Compras', icon: ShoppingBag },
  { path: '/estoque', label: 'Estoque', icon: Package },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/fiscal', label: 'Fiscal', icon: FileText },
  { path: '/clientes', label: 'Clientes / Pessoas', icon: Users },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const { usuario, empresaAtivaId } = useAuth();

  const empresaAtiva = useMemo(() => {
    if (!empresaAtivaId) return null;
    return db.tenants.find((t) => t.id === empresaAtivaId);
  }, [empresaAtivaId]);

  const nomeEmpresa =
    empresaAtiva?.nomeFantasia ||
    empresaAtiva?.razaoSocial ||
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
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
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
            <span className={styles.userRole} title={nomeEmpresa}>
              {nomeEmpresa}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
