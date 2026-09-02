import { NavLink, Outlet, useLocation } from 'react-router';
import { Bot, DollarSign, FolderClosed, History, Home, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { paths } from '@/routes/paths';
import styles from './BuilderLayout.module.scss';

interface RailItem {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Missing = section does not exist yet; renders disabled ("Em breve"). */
  to?: string;
}

// Financial, bot and history appear for visual fidelity to reference,
// but do not have a real destination yet. We prefer an honest disabled button
// over a fake page.
const TOP_ITEMS: RailItem[] = [
  { key: 'home', label: 'Início', icon: Home, to: paths.comecar },
  { key: 'projetos', label: 'Projetos', icon: FolderClosed, to: paths.comecarProjetos },
  { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { key: 'assistente', label: 'Assistente', icon: Bot },
  { key: 'historico', label: 'Histórico', icon: History },
];

const TITLES: Record<string, string> = {
  [paths.comecar]: 'Início',
  [paths.comecarProjetos]: 'Projetos',
  [paths.comecarConta]: 'Conta',
};

export function BuilderLayout() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const section = TITLES[pathname] ?? 'Início';

  return (
    <div className={`theme-builder ${styles.root}`}>
      <nav className={styles.rail} aria-label="Navegação principal">
        <span className={styles.logo} aria-hidden="true" />

        <ul className={styles.railList}>
          {TOP_ITEMS.map((item) => (
            <li key={item.key}>
              <RailNavItem item={item} />
            </li>
          ))}
        </ul>

        <div className={styles.railFooter}>
          <RailNavItem item={{ key: 'conta', label: 'Conta', icon: UserRound, to: paths.comecarConta }} />
        </div>
      </nav>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <h1 className={styles.tituloBarra}>
            <span className={styles.marca}>Axion Tech</span>
            <span className={styles.divisor} aria-hidden="true" />
            <span className={styles.secao}>{section}</span>
          </h1>

          <div className={styles.usuario}>
            <span className={styles.avatar} aria-hidden="true">
              {usuario?.iniciais ?? '—'}
            </span>
            <span className={styles.usuarioNome}>{usuario?.nome ?? 'Visitante'}</span>
          </div>
        </header>

        <main className={styles.conteudo}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RailNavItem({ item }: { item: RailItem }) {
  const Icon = item.icon;

  if (!item.to) {
    return (
      <button
        type="button"
        className={styles.railBtn}
        disabled
        aria-disabled="true"
        title={`${item.label} — em breve`}
      >
        <Icon size={19} aria-hidden="true" />
        <span className={styles.srOnly}>{item.label} (em breve)</span>
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) => (isActive ? `${styles.railBtn} ${styles.railBtnAtivo}` : styles.railBtn)}
      title={item.label}
    >
      <Icon size={19} aria-hidden="true" />
      <span className={styles.srOnly}>{item.label}</span>
    </NavLink>
  );
}
