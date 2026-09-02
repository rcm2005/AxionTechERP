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
  const [busca, setBusca] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const paginaAtual = NAV_ITEMS.find((item) =>
    item.path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname === '/'
      : location.pathname.startsWith(item.path),
  );

  const temPortfolioMultiplo = (usuario?.portfolioTenantIds?.length ?? 0) >= 2;
  const podeTrocarEmpresa = USE_MOCKS || temPortfolioMultiplo;

  // Lista de empresas acessíveis ao usuário (modo mock)
  const empresasAcessiveis = useMemo(() => {
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
    const filtradas = db.tenants.filter((t) => ids.includes(t.id));
    return filtradas.length > 0 ? filtradas : db.tenants;
  }, [usuario]);

  // Empresa ativa atual (modo mock)
  const empresaAtiva = useMemo(() => {
    if (!USE_MOCKS) return null;
    return (
      empresasAcessiveis.find((t) => t.id === empresaAtivaId) ??
      empresasAcessiveis[0] ??
      null
    );
  }, [empresasAcessiveis, empresaAtivaId]);

  // Lista de escritórios reais para usuários com 2+ tenants em portfolioTenantIds (modo real)
  const [escritorios, setEscritorios] = useState<EscritorioDaConta[]>([]);

  useEffect(() => {
    if (USE_MOCKS || !usuario || !temPortfolioMultiplo) return;

    let ativo = true;
    listarMeusEscritorios()
      .then((lista) => {
        if (ativo) {
          setEscritorios(lista);
        }
      })
      .catch(() => {
        if (ativo) {
          setEscritorios([]);
        }
      });

    return () => {
      ativo = false;
    };
  }, [usuario, temPortfolioMultiplo]);

  // Nome da empresa ativa (modo real / mock) com fallbacks
  const nomeEmpresaAtiva = useMemo(() => {
    if (USE_MOCKS) {
      return empresaAtiva?.nomeFantasia || empresaAtiva?.razaoSocial || '';
    }
    if (temPortfolioMultiplo) {
      const ativa = escritorios.find((e) => e.id === empresaAtivaId) ?? escritorios[0];
      return (
        ativa?.nomeExibicao ||
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
    empresaAtiva,
    temPortfolioMultiplo,
    escritorios,
    empresaAtivaId,
    tenantBranding,
    usuario,
  ]);

  // Notificações reais: chamada silenciosa a listEntries() quando !USE_MOCKS
  const { data: lancamentosReais } = useAsync(
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

  // Notificações: títulos em atraso ou alertas da empresa ativa
  const notificacoes = useMemo(() => {
    const lancamentos = USE_MOCKS ? (db.lancamentos ?? []) : (lancamentosReais ?? []);
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
  }, [empresaAtivaId, lancamentosReais]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (busca.trim()) {
      toast.show(`Pesquisa por "${busca.trim()}" no ERP`);
    }
  }

  return (
    <header className={styles.root}>
      <div className={styles.crumb}>
        {(USE_MOCKS ? empresaAtiva?.nomeFantasia : nomeEmpresaAtiva) || 'Axion ERP'} /{' '}
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
        <div
          className={styles.tenantSwitcher}
          title={podeTrocarEmpresa ? 'Alternar Empresa Ativa' : undefined}
        >
          <Building2 size={16} className={styles.tenantIcon} />
          <div className={styles.tenantSelectWrap}>
            {podeTrocarEmpresa ? (
              <>
                <label htmlFor="tenant-select" className={styles.tenantLabel}>
                  Empresa
                </label>
                <select
                  id="tenant-select"
                  className={styles.tenantSelect}
                  value={
                    USE_MOCKS
                      ? empresaAtivaId || (empresasAcessiveis[0]?.id ?? '')
                      : empresaAtivaId || (escritorios[0]?.id ?? '')
                  }
                  onChange={(e) => {
                    const novoId = e.target.value;
                    if (USE_MOCKS) {
                      setEmpresaAtivaId(novoId);
                      const selecionada = empresasAcessiveis.find((t) => t.id === novoId);
                      if (selecionada) {
                        toast.show(`Empresa ativa: ${selecionada.nomeFantasia || selecionada.razaoSocial}`);
                      }
                    } else {
                      void (async () => {
                        try {
                          await trocarEscritorio(novoId);
                          const selecionada = escritorios.find((t) => t.id === novoId);
                          if (selecionada) {
                            toast.show(`Empresa ativa: ${selecionada.nomeExibicao}`);
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
                    empresasAcessiveis.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nomeFantasia || empresa.razaoSocial}
                      </option>
                    ))
                  ) : escritorios.length > 0 ? (
                    escritorios.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nomeExibicao}
                      </option>
                    ))
                  ) : (
                    <option value={empresaAtivaId || ''}>{nomeEmpresaAtiva}</option>
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
                  {nomeEmpresaAtiva}
                </span>
              </>
            )}
          </div>
          {podeTrocarEmpresa && <ChevronDown size={14} className={styles.tenantChevron} />}
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
                {(USE_MOCKS ? Boolean(empresaAtiva) : Boolean(nomeEmpresaAtiva)) && (
                  <div className={styles.menuTenant}>
                    <Building2 size={12} />
                    <span>
                      {USE_MOCKS
                        ? empresaAtiva?.nomeFantasia || empresaAtiva?.razaoSocial
                        : nomeEmpresaAtiva}
                    </span>
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
