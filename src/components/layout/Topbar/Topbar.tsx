import { useState, useMemo, type FormEvent } from 'react';
import { useLocation } from 'react-router';
import { NAV_ITEMS } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/mocks';
import styles from './Topbar.module.scss';

export function Topbar() {
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const paginaAtual = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));

  // Notificações: eventos urgentes/atenção do dia de referência
  const notificacoes = useMemo(() => {
    return db.eventos.filter((e) => {
      if (e.concluido) return false;
      if (e.prioridade !== 'urgente' && e.prioridade !== 'atencao') return false;
      // verificar se o evento ocorre no dia de referência ou está em atraso
      const dataEvento = new Date(e.inicio.slice(0, 10));
      const refDate = new Date('2026-08-18');
      return dataEvento <= refDate;
    });
  }, []);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (busca.trim()) {
      toast.show(`Pesquisa: ${busca.trim()}`);
    }
  }

  return (
    <header className={styles.root}>
      <div className={styles.crumb}>
        Escritório / <strong>{paginaAtual?.label ?? ''}</strong>
      </div>

      <div className={styles.actions}>
        <form onSubmit={handleSearch}>
          <input
            className={styles.search}
            placeholder="Pesquisar no ERP..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </form>

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
            <span className={styles.notifIcon}>🔔</span>
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
                  {notificacoes.map((e) => (
                    <li key={e.id} className={styles.notifItem}>
                      <span
                        className={styles.notifDot}
                        style={{ background: e.prioridade === 'urgente' ? 'var(--color-danger)' : 'var(--color-warning)' }}
                      />
                      <div className={styles.notifContent}>
                        <div className={styles.notifTitle}>{e.titulo}</div>
                        <div className={styles.notifMeta}>
                          {e.diaInteiro ? e.inicio.slice(0, 10) : e.inicio.slice(0, 16).replace('T', ' ')}
                          {e.local ? ` • ${e.local}` : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className={styles.userMenu}>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => setMenuAberto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAberto}
          >
            <Avatar iniciais={usuario?.iniciais ?? '--'} />
          </button>

          {menuAberto && (
            <div className={styles.menu} role="menu">
              <div className={styles.menuName}>{usuario?.nomeExibicao}</div>
              <Button variant="ghost" onClick={() => void logout()}>
                Sair
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
