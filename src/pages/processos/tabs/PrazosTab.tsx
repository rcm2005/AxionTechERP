import { useMemo } from 'react';
import { useOutletContext } from 'react-router';
import type { Processo, EventoAgenda } from '@/types';
import { useAgenda } from '@/hooks/useAgenda';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import type { Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { formatDate } from '@/utils/format';

const PRIOR_MAP: Record<string, { label: string; tone: 'red' | 'orange' | 'neutral' }> = {
  urgente: { label: 'Urgente', tone: 'red' },
  atencao: { label: 'Atenção', tone: 'orange' },
  normal: { label: 'Normal', tone: 'neutral' },
};

const columns: Column<EventoAgenda>[] = [
  { key: 'titulo', header: 'Prazo', render: (e) => e.titulo },
  {
    key: 'inicio',
    header: 'Data',
    width: '110px',
    render: (e) => formatDate(e.inicio.slice(0, 10)),
  },
  {
    key: 'prioridade',
    header: 'Prioridade',
    width: '110px',
    render: (e) => {
      const m = PRIOR_MAP[e.prioridade];
      return <Pill tone={m.tone}>{m.label}</Pill>;
    },
  },
  {
    key: 'concluido',
    header: 'Status',
    width: '100px',
    render: (e) => (
      <Pill tone={e.concluido ? 'green' : 'blue'}>{e.concluido ? 'Concluído' : 'Aberto'}</Pill>
    ),
  },
];

export function PrazosTab() {
  const { processo } = useOutletContext<{ processo: Processo }>();
  const { data: eventos, loading } = useAgenda({});

  const prazos = useMemo(
    () => (eventos ?? []).filter((e) => e.tipo === 'prazo' && e.processoId === processo.id),
    [eventos, processo.id],
  );

  if (loading) return <Skeleton height="160px" />;
  if (prazos.length === 0)
    return <EmptyState title="Nenhum prazo cadastrado para este processo." />;

  return (
    <DataTable
      columns={columns}
      rows={prazos}
      getRowId={(e) => e.id}
      emptyMessage="Nenhum prazo cadastrado."
    />
  );
}
