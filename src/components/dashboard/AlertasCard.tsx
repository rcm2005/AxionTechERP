import type { Alerta } from '@/types';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { Pill } from '@/components/ui/Pill/Pill';
import { Alert } from '@/components/ui/Alert/Alert';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';

interface AlertsCardProps {
  alerts: Alerta[];
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  return (
    <Card>
      <CardHead title="Alertas importantes" action={alerts.length > 0 && <Pill tone="red">{alerts.length}</Pill>} />
      <CardBody>
        {alerts.length === 0 && <EmptyState title="Nenhum alerta no momento." icon="✓" />}
        {alerts.map((item) => (
          <Alert
            key={item.id}
            tone={item.tone === 'danger' ? 'danger' : 'warning'}
            title={item.titulo}
            description={item.descricao}
          />
        ))}
      </CardBody>
    </Card>
  );
}
