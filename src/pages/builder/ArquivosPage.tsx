import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listarMeusEscritorios, type EscritorioDaConta } from '@/services/auth.service';
import { paths } from '@/routes/paths';
import { formatDate } from '@/utils/format';
import styles from './ArquivosPage.module.scss';

/**
 * Lista os escritórios (tenants) em que o e-mail da sessão atual já é admin.
 * O escopo vem do servidor a partir do Bearer token — nada é filtrado no cliente.
 */
export function ArquivosPage() {
  useDocumentTitle('Arquivos');
  const { isAuthenticated, trocarEscritorio } = useAuth();
  const navigate = useNavigate();

  const [escritorios, setEscritorios] = useState<EscritorioDaConta[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Já começa "carregando" quando há sessão: assim o efeito abaixo não precisa
  // disparar um setState síncrono só pra ligar o spinner.
  const [carregando, setCarregando] = useState(isAuthenticated);
  const [entrandoEm, setEntrandoEm] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setEscritorios(await listarMeusEscritorios());
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível carregar seus ERPs.');
      setEscritorios(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // Buscar a lista no servidor É sincronização com sistema externo, que é
    // justamente o caso de uso legítimo de useEffect. O estado só muda depois
    // do await; a regra não consegue enxergar isso através do useCallback.
    // oxlint-disable-next-line react/set-state-in-effect
    if (isAuthenticated) void carregar();
  }, [isAuthenticated, carregar]);

  function recarregar() {
    setCarregando(true);
    setErro(null);
    void carregar();
  }

  async function entrar(escritorio: EscritorioDaConta) {
    setEntrandoEm(escritorio.id);
    setErro(null);
    try {
      await trocarEscritorio(escritorio.id);
      navigate(paths.dashboard);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar neste ERP.');
      setEntrandoEm(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.pagina}>
        <Cabecalho />
        <p className={styles.vazio}>
          Você ainda não está em nenhuma sessão. <Link to={paths.comecar}>Crie o seu ERP</Link> ou{' '}
          <Link to={paths.login}>entre com sua conta</Link> para ver o que já existe aqui.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <Cabecalho />

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}{' '}
          <button type="button" className={styles.recarregar} onClick={recarregar}>
            <RefreshCw size={13} aria-hidden="true" /> Tentar de novo
          </button>
        </p>
      )}

      {carregando && <p className={styles.vazio}>Carregando seus ERPs...</p>}

      {!carregando && escritorios?.length === 0 && (
        <p className={styles.vazio}>
          Nenhum ERP ainda. <Link to={paths.comecar}>Monte o primeiro</Link>.
        </p>
      )}

      {!carregando && escritorios && escritorios.length > 0 && (
        <ul className={styles.grade}>
          {escritorios.map((e) => (
            <li key={e.id} className={styles.card}>
              <span className={styles.amostra} style={{ background: e.corPrimaria }} aria-hidden="true" />
              <h3 className={styles.nome}>{e.nomeExibicao}</h3>
              <p className={styles.meta}>Criado em {formatDate(e.criadoEm)}</p>
              <button
                type="button"
                className={styles.entrar}
                onClick={() => void entrar(e)}
                disabled={entrandoEm !== null}
              >
                {entrandoEm === e.id ? 'Entrando...' : 'Entrar'}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cabecalho() {
  return (
    <header className={styles.cabecalho}>
      <h2 className={styles.titulo}>Seus ERPs</h2>
      <p className={styles.sub}>Todos os escritórios em que este e-mail é administrador.</p>
    </header>
  );
}
