import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';
import styles from './ContaPage.module.scss';

export function ContaPage() {
  useDocumentTitle('Conta');
  const { usuario, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    try {
      await logout();
      navigate(paths.comecar);
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <h2 className={styles.titulo}>Conta</h2>

      {!isAuthenticated || !usuario ? (
        <p className={styles.vazio}>
          Nenhuma sessão ativa. <Link to={paths.comecar}>Crie um ERP</Link> ou{' '}
          <Link to={paths.login}>entre com sua conta</Link>.
        </p>
      ) : (
        <div className={styles.cartao}>
          <span className={styles.avatar} aria-hidden="true">
            {usuario.iniciais}
          </span>
          <dl className={styles.dados}>
            <div>
              <dt>Nome</dt>
              <dd>{usuario.nome}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{usuario.email}</dd>
            </div>
          </dl>
          <button type="button" className={styles.sair} onClick={() => void sair()} disabled={saindo}>
            <LogOut size={15} aria-hidden="true" />
            {saindo ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      )}
    </div>
  );
}
