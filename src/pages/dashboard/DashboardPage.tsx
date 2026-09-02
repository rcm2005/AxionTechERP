import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Alert } from '@/components/ui/Alert/Alert';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { AlertasCard } from '@/components/dashboard/AlertasCard';
import { AtalhosCard } from '@/components/dashboard/AtalhosCard';
import { NovoClienteModal } from '@/components/modais/NovoClienteModal';
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
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const {
    data: resumo,
    loading: loadingResumo,
    error: erroResumo,
    reload: recarregarResumo,
  } = useDashboard();
  const greeting = useMemo(() => getGreeting(), []);
  const primeiroNome = usuario?.nome.split(' ')[0] ?? 'Usuário';

  return (
    <section>
      <PageHead
        title={`${greeting}, ${primeiroNome} 👋`}
        subtitle={`Visão geral da operação em ${formatLongDate(REFERENCE_DATE)}.`}
        actions={
          <Button variant="primary" onClick={() => setNovoClienteOpen(true)}>
            + Novo cliente / parceiro
          </Button>
        }
      />

      {loadingResumo ? (
        <div className={styles.kpis}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="90px" />
          ))}
        </div>
      ) : erroResumo || !resumo ? (
        <div style={{ marginBottom: 16 }}>
          <Alert
            tone="danger"
            title="Erro ao carregar dados"
            description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
            action={
              <Button variant="ghost" onClick={recarregarResumo}>
                Tentar novamente
              </Button>
            }
          />
        </div>
      ) : (
        <div className={styles.kpis}>
          {resumo.kpis.map((kpi) => (
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
        <AlertasCard alertas={resumo?.alertas ?? []} />
      </div>

      <div className={styles.shortcuts}>
        <AtalhosCard />
      </div>

      <NovoClienteModal open={novoClienteOpen} onClose={() => setNovoClienteOpen(false)} />
    </section>
  );
}
