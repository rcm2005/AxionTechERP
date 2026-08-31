import { NavLink, Outlet, useLocation } from 'react-router';
import { Bot, DollarSign, FolderClosed, History, Home, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { paths } from '@/routes/paths';
import styles from './BuilderLayout.module.scss';

interface ItemRail {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Ausente = seção ainda não existe; renderiza desabilitada ("Em breve"). */
  to?: string;
}

// Financeiro, o bot e o histórico aparecem por fidelidade visual à referência,
// mas não têm destino real ainda. Preferimos um botão desabilitado honesto a
// uma página falsa.
const ITENS_TOPO: ItemRail[] = [
  { key: 'home', label: 'Início', icon: Home, to: paths.comecar },
  { key: 'arquivos', label: 'Arquivos', icon: FolderClosed, to: paths.comecarArquivos },
  { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { key: 'assistente', label: 'Assistente', icon: Bot },
  { key: 'historico', label: 'Histórico', icon: History },
];

const TITULOS: Record<string, string> = {
  [paths.comecar]: 'Início',
  [paths.comecarArquivos]: 'Arquivos',
  [paths.comecarConta]: 'Conta',
};

export function BuilderLayout() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const secao = TITULOS[pathname] ?? 'Início';

  return (
    <div className={`theme-builder ${styles.root}`}>
      <nav className={styles.rail} aria-label="Navegação principal">
        <span className={styles.logo} aria-hidden="true" />

        <ul className={styles.railList}>
          {ITENS_TOPO.map((item) => (
            <li key={item.key}>
              <ItemDoRail item={item} />
            </li>
          ))}
        </ul>

        <div className={styles.railFooter}>
          <ItemDoRail item={{ key: 'conta', label: 'Conta', icon: UserRound, to: paths.comecarConta }} />
        </div>
      </nav>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <h1 className={styles.tituloBarra}>
            <span className={styles.marca}>Axion Tech</span>
            <span className={styles.divisor} aria-hidden="true" />
            <span className={styles.secao}>{secao}</span>
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

function ItemDoRail({ item }: { item: ItemRail }) {
  const Icone = item.icon;

  if (!item.to) {
    return (
      <button
        type="button"
        className={styles.railBtn}
        disabled
        aria-disabled="true"
        title={`${item.label} — em breve`}
      >
        <Icone size={19} aria-hidden="true" />
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
      <Icone size={19} aria-hidden="true" />
      <span className={styles.srOnly}>{item.label}</span>
    </NavLink>
  );
}
