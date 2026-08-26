import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useAgenda } from '@/hooks/useAgenda';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { AgendaDoDiaCard } from '@/components/dashboard/AgendaDoDiaCard';
import { AlertasCard } from '@/components/dashboard/AlertasCard';
import { AtalhosCard } from '@/components/dashboard/AtalhosCard';
import { REFERENCE_DATE } from '@/config/app';
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
  const { usuario } = useAuth();
  const toast = useToast();
  const { data: resumo, loading: loadingResumo } = useDashboard();
  const { data: eventos, loading: loadingEventos } = useAgenda({});
  const greeting = useMemo(() => getGreeting(), []);
  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';

  return (
    <section>
      <PageHead
        title={`${greeting}, ${primeiroNome} 👋`}
        subtitle={`Visão geral do escritório em ${formatLongDate(REFERENCE_DATE)}.`}
        actions={
          <Button variant="primary" onClick={() => toast.show('Novo processo iniciado')}>
            + Novo processo
          </Button>
        }
      />

      <div className={styles.kpis}>
        {loadingResumo || !resumo
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="90px" />)
          : resumo.kpis.map((kpi) => (
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

      <div className={styles.grid}>
        <AgendaDoDiaCard eventos={eventos ?? []} loading={loadingEventos} />
        <AlertasCard alertas={resumo?.alertas ?? []} />
      </div>

      <div className={styles.shortcuts}>
        <AtalhosCard />
      </div>
    </section>
  );
}
