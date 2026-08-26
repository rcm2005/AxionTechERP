import type { Alerta } from '@/types';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { Pill } from '@/components/ui/Pill/Pill';
import { Alert } from '@/components/ui/Alert/Alert';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';

interface AlertasCardProps {
  alertas: Alerta[];
}

export function AlertasCard({ alertas }: AlertasCardProps) {
  return (
    <Card>
      <CardHead title="Alertas importantes" action={alertas.length > 0 && <Pill tone="red">{alertas.length}</Pill>} />
      <CardBody>
        {alertas.length === 0 && <EmptyState title="Nenhum alerta no momento." icon="✓" />}
        {alertas.map((alerta) => (
          <Alert
            key={alerta.id}
            tone={alerta.tone === 'danger' ? 'danger' : 'warning'}
            title={alerta.titulo}
            description={alerta.descricao}
          />
        ))}
      </CardBody>
    </Card>
  );
}
