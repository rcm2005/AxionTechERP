import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listarMeusEscritorios, type EscritorioDaConta } from '@/services/auth.service';
import { paths } from '@/routes/paths';
import { formatDate } from '@/utils/format';
import styles from './ProjetosPage.module.scss';

/**
 * Lists firms (tenants) where the current session email is already an admin.
 * Scope comes from the server via Bearer token — nothing is filtered on client.
 */
export function ProjetosPage() {
  useDocumentTitle('Projetos');
  const { isAuthenticated, trocarEscritorio } = useAuth();
  const navigate = useNavigate();

  const [firms, setFirms] = useState<EscritorioDaConta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Starts "loading" when there is a session: thus the effect below doesn't need
  // to trigger a synchronous setState just to turn on the spinner.
  const [loading, setLoading] = useState(isAuthenticated);
  const [enteringId, setEnteringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setFirms(await listarMeusEscritorios());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar seus ERPs.');
      setFirms(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching the list from the server IS synchronization with an external system, which is
    // precisely the legitimate use case for useEffect. State only changes after
    // the await; the lint rule cannot see this through useCallback.
    // oxlint-disable-next-line react/set-state-in-effect
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  function reload() {
    setLoading(true);
    setError(null);
    void load();
  }

  async function enterFirm(firm: EscritorioDaConta) {
    setEnteringId(firm.id);
    setError(null);
    try {
      await trocarEscritorio(firm.id);
      navigate(paths.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar neste ERP.');
      setEnteringId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.pagina}>
        <Header />
        <p className={styles.vazio}>
          Você ainda não está em nenhuma sessão. <Link to={paths.comecar}>Crie o seu ERP</Link> ou{' '}
          <Link to={paths.login}>entre com sua conta</Link> para ver o que já existe aqui.
        </p>
      </div>
    );
  }

  const hasProjects = !loading && Boolean(firms && firms.length > 0);

  return (
    <div className={styles.pagina}>
      <Header showNewProject={hasProjects} />

      {error && (
        <p className={styles.erro} role="alert">
          {error}{' '}
          <button type="button" className={styles.recarregar} onClick={reload}>
            <RefreshCw size={13} aria-hidden="true" /> Tentar de novo
          </button>
        </p>
      )}

      {loading && <p className={styles.vazio}>Carregando seus ERPs...</p>}

      {!loading && firms?.length === 0 && (
        <p className={styles.vazio}>
          Nenhum ERP ainda. <Link to={paths.comecar}>Monte o primeiro</Link>.
        </p>
      )}

      {!loading && firms && firms.length > 0 && (
        <ul className={styles.grade}>
          {firms.map((e) => (
            <li key={e.id} className={styles.card}>
              <span className={styles.amostra} style={{ background: e.corPrimaria }} aria-hidden="true" />
              <h3 className={styles.nome}>{e.nomeExibicao}</h3>
              <p className={styles.meta}>Criado em {formatDate(e.criadoEm)}</p>
              <button
                type="button"
                className={styles.entrar}
                onClick={() => void enterFirm(e)}
                disabled={enteringId !== null}
              >
                {enteringId === e.id ? 'Entrando...' : 'Entrar'}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Header({ showNewProject }: { showNewProject?: boolean }) {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoTopo}>
        <div>
          <h2 className={styles.titulo}>Seus ERPs</h2>
          <p className={styles.sub}>Todos os escritórios em que este e-mail é administrador.</p>
        </div>
        {showNewProject && (
          <Link to={paths.comecar} className={styles.novoProjeto}>
            + Novo projeto
          </Link>
        )}
      </div>
    </header>
  );
}
