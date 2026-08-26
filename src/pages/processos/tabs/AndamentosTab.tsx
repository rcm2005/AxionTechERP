import { useOutletContext } from 'react-router';
import type { Processo } from '@/types';
import { useAndamentos } from '@/hooks/useProcessos';
import { Timeline } from '@/components/ui/Timeline/Timeline';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { formatDate } from '@/utils/format';

export function AndamentosTab() {
  const { processo } = useOutletContext<{ processo: Processo }>();
  const { data: andamentos, loading } = useAndamentos(processo.id);

  if (loading) return <Skeleton height="200px" />;
  if (!andamentos || andamentos.length === 0)
    return <EmptyState title="Nenhum andamento registrado para este processo." />;

  return (
    <Timeline
      items={andamentos.map((a) => ({
        id: a.id,
        dateLabel: formatDate(a.data).toUpperCase(),
        title: a.titulo,
        description: a.descricao,
      }))}
    />
  );
}
