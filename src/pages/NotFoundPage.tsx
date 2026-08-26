import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button/Button';
import { paths } from '@/routes/paths';
import styles from './NotFoundPage.module.scss';

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada');

  return (
    <div className={styles.root}>
      <div className={styles.code}>404</div>
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe ou foi movido.</p>
      <Button variant="primary" to={paths.dashboard}>
        Voltar ao Dashboard
      </Button>
    </div>
  );
}
