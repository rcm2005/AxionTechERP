import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Alert } from '@/components/ui/Alert/Alert';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { AlertsCard } from '@/components/dashboard/AlertasCard';
import { QuickActionsCard } from '@/components/dashboard/AtalhosCard';
import { NovoClienteModal } from '@/components/modais/NovoClienteModal';
import { formatLongDate } from '@/utils/format';
import styles from './DashboardPage.module.scss';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { usuario: user } = useAuth();
  const [newClientOpen, setNewClientOpen] = useState(false);
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    reload: reloadSummary,
  } = useDashboard();
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = user?.nome.split(' ')[0] ?? 'Usuário';

  return (
    <section>
      <PageHead
        title={`${greeting}, ${firstName} 👋`}
        subtitle={`Visão geral da operação em ${formatLongDate(new Date().toISOString())}.`}
        actions={
          <Button variant="primary" onClick={() => setNewClientOpen(true)}>
            + Novo cliente / parceiro
          </Button>
        }
      />

      {summaryLoading ? (
        <div className={styles.kpis}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="90px" />
          ))}
        </div>
      ) : summaryError || !summary ? (
        <div style={{ marginBottom: 16 }}>
          <Alert
            tone="danger"
            title="Erro ao carregar dados"
            description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
            action={
              <Button variant="ghost" onClick={reloadSummary}>
                Tentar novamente
              </Button>
            }
          />
        </div>
      ) : (
        <div className={styles.kpis}>
          {summary.kpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.valor}
              sub={kpi.sub}
              subTone={kpi.subTone}
              showDot
            />
          ))}
        </div>
      )}

      <div className={styles.grid}>
        <AlertsCard alerts={summary?.alerts ?? []} />
      </div>

      <div className={styles.shortcuts}>
        <QuickActionsCard />
      </div>

      <NovoClienteModal open={newClientOpen} onClose={() => setNewClientOpen(false)} />
    </section>
  );
}
