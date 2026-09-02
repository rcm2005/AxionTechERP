import { useState, useMemo, type FormEvent } from 'react';
import { useLocation } from 'react-router';
import { Building2, Bell, Search, ChevronDown, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/mocks';
import { formatBRL, formatDate } from '@/utils/format';
import styles from './Topbar.module.scss';

export function Topbar() {
  const location = useLocation();
  const { usuario, empresaAtivaId, setEmpresaAtivaId, logout } = useAuth();
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const paginaAtual = NAV_ITEMS.find((item) =>
    item.path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname === '/'
      : location.pathname.startsWith(item.path),
  );

  // Lista de empresas acessíveis ao usuário
  const empresasAcessiveis = useMemo(() => {
    if (!usuario) return [];
    const ids = Array.from(
      new Set([
        ...(usuario.tenantIds ?? []),
        ...(usuario.portfolioTenantIds ?? []),
      ]),
    );
    if (ids.length === 0) {
      return db.tenants;
    }
    const filtradas = db.tenants.filter((t) => ids.includes(t.id));
    return filtradas.length > 0 ? filtradas : db.tenants;
  }, [usuario]);

  // Empresa ativa atual
  const empresaAtiva = useMemo(() => {
    return (
      empresasAcessiveis.find((t) => t.id === empresaAtivaId) ??
      empresasAcessiveis[0] ??
      null
    );
  }, [empresasAcessiveis, empresaAtivaId]);

  // Notificações: títulos em atraso ou alertas da empresa ativa
  const notificacoes = useMemo(() => {
    const lancamentos = db.lancamentos ?? [];
    return lancamentos
      .filter(
        (l) =>
          l.status === 'atrasado' &&
          (!empresaAtivaId || l.tenantId === empresaAtivaId),
      )
      .map((l) => ({
        id: l.id,
        titulo: `${l.tipo === 'receita' ? 'Receita' : 'Despesa'} em atraso: ${l.descricao}`,
        meta: `${formatBRL(l.valorCentavos)} • Vencimento ${formatDate(l.vencimento)}`,
        prioridade: 'urgente' as const,
      }));
  }, [empresaAtivaId]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (busca.trim()) {
      toast.show(`Pesquisa por "${busca.trim()}" no ERP`);
    }
  }

  return (
    <header className={styles.root}>
      <div className={styles.crumb}>
        {empresaAtiva?.nomeFantasia || 'Axion ERP'} /{' '}
        <strong>{paginaAtual?.label ?? 'Dashboard'}</strong>
      </div>

      <div className={styles.actions}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.search}
            placeholder="Pesquisar no ERP..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </form>

        {/* Tenant Switcher */}
        <div className={styles.tenantSwitcher} title="Alternar Empresa Ativa">
          <Building2 size={16} className={styles.tenantIcon} />
          <div className={styles.tenantSelectWrap}>
            <label htmlFor="tenant-select" className={styles.tenantLabel}>
              Empresa
            </label>
            <select
              id="tenant-select"
              className={styles.tenantSelect}
              value={empresaAtivaId || (empresasAcessiveis[0]?.id ?? '')}
              onChange={(e) => {
                const novoId = e.target.value;
                setEmpresaAtivaId(novoId);
                const selecionada = empresasAcessiveis.find((t) => t.id === novoId);
                if (selecionada) {
                  toast.show(`Empresa ativa: ${selecionada.nomeFantasia || selecionada.razaoSocial}`);
                }
              }}
              aria-label="Selecionar Empresa / Tenant Ativo"
            >
              {empresasAcessiveis.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nomeFantasia || empresa.razaoSocial}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown size={14} className={styles.tenantChevron} />
        </div>

        {/* Sino de notificações */}
        <div className={styles.notifWrap}>
          <button
            type="button"
            className={styles.notifBtn}
            onClick={() => setNotifOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={notifOpen}
            aria-label={`Notificações${notificacoes.length > 0 ? ` (${notificacoes.length})` : ''}`}
          >
            <Bell size={18} className={styles.notifIcon} />
            {notificacoes.length > 0 && (
              <span className={styles.badge}>{notificacoes.length}</span>
            )}
          </button>

          {notifOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <strong>Notificações</strong>
                <span className={styles.notifCount}>{notificacoes.length} pendentes</span>
              </div>
              {notificacoes.length === 0 ? (
                <div className={styles.notifEmpty}>Nenhuma notificação urgente.</div>
              ) : (
                <ul className={styles.notifList}>
                  {notificacoes.map((item) => (
                    <li key={item.id} className={styles.notifItem}>
                      <span
                        className={styles.notifDot}
                        style={{ background: 'var(--color-danger)' }}
                      />
                      <div className={styles.notifContent}>
                        <div className={styles.notifTitle}>{item.titulo}</div>
                        <div className={styles.notifMeta}>{item.meta}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Menu do Usuário */}
        <div className={styles.userMenu}>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => setMenuAberto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAberto}
            aria-label="Menu do Usuário"
          >
            <Avatar iniciais={usuario?.iniciais ?? '--'} />
          </button>

          {menuAberto && (
            <div className={styles.menu} role="menu">
              <div className={styles.menuHeader}>
                <div className={styles.menuName}>{usuario?.nomeExibicao || usuario?.nome}</div>
                <div className={styles.menuEmail}>{usuario?.email}</div>
                {empresaAtiva && (
                  <div className={styles.menuTenant}>
                    <Building2 size={12} />
                    <span>{empresaAtiva.nomeFantasia || empresaAtiva.razaoSocial}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setMenuAberto(false);
                  void (async () => {
                    try {
                      await logout();
                    } catch {
                      // cleanup local de sessão já é garantido dentro do próprio logout() (ver AuthContext)
                    }
                  })();
                }}
                className={styles.logoutBtn}
              >
                <LogOut size={14} />
                <span>Sair</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
