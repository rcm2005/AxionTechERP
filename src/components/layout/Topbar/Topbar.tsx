import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useLocation } from 'react-router';
import { Building2, Bell, Search, ChevronDown, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/mocks';
import { formatBRL, formatDate } from '@/utils/format';
import { USE_MOCKS } from '@/services/mockAdapter';
import { listarMeusEscritorios, type EscritorioDaConta } from '@/services/auth.service';
import { listEntries } from '@/services/financeiro.service';
import { useAsync } from '@/hooks/useAsync';
import styles from './Topbar.module.scss';

export function Topbar() {
  const location = useLocation();
  const { usuario, empresaAtivaId, setEmpresaAtivaId, logout, tenantBranding, trocarEscritorio } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const currentPage = NAV_ITEMS.find((item) =>
    item.path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname === '/'
      : location.pathname.startsWith(item.path),
  );

  const hasMultiplePortfolio = (usuario?.portfolioTenantIds?.length ?? 0) >= 2;
  const canSwitchCompany = USE_MOCKS || hasMultiplePortfolio;

  // List of companies accessible to the user (mock mode)
  const accessibleCompanies = useMemo(() => {
    if (!USE_MOCKS) return [];
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
    const filtered = db.tenants.filter((t) => ids.includes(t.id));
    return filtered.length > 0 ? filtered : db.tenants;
  }, [usuario]);

  // Current active company (mock mode)
  const activeCompany = useMemo(() => {
    if (!USE_MOCKS) return null;
    return (
      accessibleCompanies.find((t) => t.id === empresaAtivaId) ??
      accessibleCompanies[0] ??
      null
    );
  }, [accessibleCompanies, empresaAtivaId]);

  // List of real firms for users with 2+ tenants in portfolioTenantIds (real mode)
  const [firms, setFirms] = useState<EscritorioDaConta[]>([]);

  useEffect(() => {
    if (USE_MOCKS || !usuario || !hasMultiplePortfolio) return;

    let active = true;
    listarMeusEscritorios()
      .then((list) => {
        if (active) {
          setFirms(list);
        }
      })
      .catch(() => {
        if (active) {
          setFirms([]);
        }
      });

    return () => {
      active = false;
    };
  }, [usuario, hasMultiplePortfolio]);

  // Active company name (real / mock mode) with fallbacks
  const activeCompanyName = useMemo(() => {
    if (USE_MOCKS) {
      return activeCompany?.nomeFantasia || activeCompany?.razaoSocial || '';
    }
    if (hasMultiplePortfolio) {
      const activeFirm = firms.find((e) => e.id === empresaAtivaId) ?? firms[0];
      return (
        activeFirm?.nomeExibicao ||
        tenantBranding?.nomeExibicao ||
        usuario?.escritorioContabilNome ||
        'Empresa Ativa'
      );
    }
    return (
      tenantBranding?.nomeExibicao ||
      usuario?.escritorioContabilNome ||
      'Empresa Ativa'
    );
  }, [
    activeCompany,
    hasMultiplePortfolio,
    firms,
    empresaAtivaId,
    tenantBranding,
    usuario,
  ]);

  // Real notifications: silent call to listEntries() when !USE_MOCKS
  const { data: realEntries } = useAsync(
    async () => {
      if (USE_MOCKS) return [];
      try {
        return await listEntries();
      } catch {
        return [];
      }
    },
    [empresaAtivaId],
  );

  // Notifications: overdue entries or active company alerts
  const notifications = useMemo(() => {
    const entries = USE_MOCKS ? (db.lancamentos ?? []) : (realEntries ?? []);
    return entries
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
  }, [empresaAtivaId, realEntries]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (search.trim()) {
      toast.show(`Pesquisa por "${search.trim()}" no ERP`);
    }
  }

  return (
    <header className={styles.root}>
      <div className={styles.crumb}>
        {(USE_MOCKS ? activeCompany?.nomeFantasia : activeCompanyName) || 'Axion ERP'} /{' '}
        <strong>{currentPage?.label ?? 'Dashboard'}</strong>
      </div>

      <div className={styles.actions}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.search}
            placeholder="Pesquisar no ERP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* Tenant Switcher */}
        <div
          className={styles.tenantSwitcher}
          title={canSwitchCompany ? 'Alternar Empresa Ativa' : undefined}
        >
          <Building2 size={16} className={styles.tenantIcon} />
          <div className={styles.tenantSelectWrap}>
            {canSwitchCompany ? (
              <>
                <label htmlFor="tenant-select" className={styles.tenantLabel}>
                  Empresa
                </label>
                <select
                  id="tenant-select"
                  className={styles.tenantSelect}
                  value={
                    USE_MOCKS
                      ? empresaAtivaId || (accessibleCompanies[0]?.id ?? '')
                      : empresaAtivaId || (firms[0]?.id ?? '')
                  }
                  onChange={(e) => {
                    const newId = e.target.value;
                    if (USE_MOCKS) {
                      setEmpresaAtivaId(newId);
                      const selected = accessibleCompanies.find((t) => t.id === newId);
                      if (selected) {
                        toast.show(`Empresa ativa: ${selected.nomeFantasia || selected.razaoSocial}`);
                      }
                    } else {
                      void (async () => {
                        try {
                          await trocarEscritorio(newId);
                          const selected = firms.find((t) => t.id === newId);
                          if (selected) {
                            toast.show(`Empresa ativa: ${selected.nomeExibicao}`);
                          }
                        } catch {
                          toast.show('Não foi possível trocar de empresa.');
                        }
                      })();
                    }
                  }}
                  aria-label="Selecionar Empresa / Tenant Ativo"
                >
                  {USE_MOCKS ? (
                    accessibleCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.nomeFantasia || company.razaoSocial}
                      </option>
                    ))
                  ) : firms.length > 0 ? (
                    firms.map((firm) => (
                      <option key={firm.id} value={firm.id}>
                        {firm.nomeExibicao}
                      </option>
                    ))
                  ) : (
                    <option value={empresaAtivaId || ''}>{activeCompanyName}</option>
                  )}
                </select>
              </>
            ) : (
              <>
                <span className={styles.tenantLabel}>Empresa</span>
                <span
                  className={styles.tenantSelect}
                  style={{ cursor: 'default', paddingRight: 0 }}
                >
                  {activeCompanyName}
                </span>
              </>
            )}
          </div>
          {canSwitchCompany && <ChevronDown size={14} className={styles.tenantChevron} />}
        </div>

        {/* Notification bell */}
        <div className={styles.notifWrap}>
          <button
            type="button"
            className={styles.notifBtn}
            onClick={() => setNotifOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={notifOpen}
            aria-label={`Notificações${notifications.length > 0 ? ` (${notifications.length})` : ''}`}
          >
            <Bell size={18} className={styles.notifIcon} />
            {notifications.length > 0 && (
              <span className={styles.badge}>{notifications.length}</span>
            )}
          </button>

          {notifOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <strong>Notificações</strong>
                <span className={styles.notifCount}>{notifications.length} pendentes</span>
              </div>
              {notifications.length === 0 ? (
                <div className={styles.notifEmpty}>Nenhuma notificação urgente.</div>
              ) : (
                <ul className={styles.notifList}>
                  {notifications.map((item) => (
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

        {/* User menu */}
        <div className={styles.userMenu}>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-label="Menu do Usuário"
          >
            <Avatar iniciais={usuario?.iniciais ?? '--'} />
          </button>

          {userMenuOpen && (
            <div className={styles.menu} role="menu">
              <div className={styles.menuHeader}>
                <div className={styles.menuName}>{usuario?.nomeExibicao || usuario?.nome}</div>
                <div className={styles.menuEmail}>{usuario?.email}</div>
                {(USE_MOCKS ? Boolean(activeCompany) : Boolean(activeCompanyName)) && (
                  <div className={styles.menuTenant}>
                    <Building2 size={12} />
                    <span>
                      {USE_MOCKS
                        ? activeCompany?.nomeFantasia || activeCompany?.razaoSocial
                        : activeCompanyName}
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setUserMenuOpen(false);
                  void (async () => {
                    try {
                      await logout();
                    } catch {
                      // local session cleanup is already guaranteed inside logout() itself (see AuthContext)
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
