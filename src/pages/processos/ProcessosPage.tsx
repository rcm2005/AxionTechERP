import { Outlet, useParams } from 'react-router';
import { useProcesso } from '@/hooks/useProcessos';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/contexts/ToastContext';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Tabs } from '@/components/ui/Tabs/Tabs';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { ProcessoProfileCard } from '@/components/processos/ProcessoProfileCard';
import { paths, processoTabs } from '@/routes/paths';
import styles from './ProcessosPage.module.scss';

export function ProcessosPage() {
  const { processoId } = useParams<{ processoId: string }>();
  const { data: processo, loading } = useProcesso(processoId);
  const toast = useToast();
  useDocumentTitle('Processos');

  return (
    <section>
      <PageHead
        title="Processos"
        subtitle="Gestão completa dos processos e seus principais eventos."
        actions={
          <Button variant="primary" onClick={() => toast.show('Novo processo iniciado')}>
            + Novo processo
          </Button>
        }
      />

      {loading && <Skeleton height="360px" />}

      {!loading && !processo && <EmptyState title="Processo não encontrado." />}

      {!loading && processo && (
        <div className={styles.grid}>
          <ProcessoProfileCard processo={processo} />

          <Card>
            <Tabs
              items={processoTabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                to: paths.processoTab(processo.id, tab.key),
              }))}
            />
            <div className={styles.tabBody}>
              <Outlet context={{ processo }} />
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
