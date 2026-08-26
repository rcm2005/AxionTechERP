import { useOutletContext } from 'react-router';
import { useMemo } from 'react';
import type { Processo, EventoAgenda } from '@/types';
import { useAgenda } from '@/hooks/useAgenda';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { formatDateTime, formatDate } from '@/utils/format';
import type { Column } from '@/components/ui/DataTable/DataTable';

const PRIORIDADE_MAP: Record<string, { label: string; tone: 'red' | 'orange' | 'neutral' }> = {
  urgente: { label: 'Urgente', tone: 'red' },
  atencao: { label: 'Atenção', tone: 'orange' },
  normal: { label: 'Normal', tone: 'neutral' },
};

const columns: Column<EventoAgenda>[] = [
  { key: 'titulo', header: 'Audiência', render: (e) => e.titulo },
  {
    key: 'inicio',
    header: 'Data/Hora',
    width: '140px',
    render: (e) => e.diaInteiro ? formatDate(e.inicio.slice(0, 10)) : formatDateTime(e.inicio),
  },
  { key: 'local', header: 'Local', render: (e) => e.local ?? '—' },
  {
    key: 'prioridade',
    header: 'Prioridade',
    width: '110px',
    render: (e) => {
      const m = PRIORIDADE_MAP[e.prioridade];
      return <Pill tone={m.tone}>{m.label}</Pill>;
    },
  },
  {
    key: 'concluido',
    header: 'Status',
    width: '90px',
    render: (e) => <Pill tone={e.concluido ? 'green' : 'blue'}>{e.concluido ? 'Realizada' : 'Agendada'}</Pill>,
  },
];

export function AudienciasTab() {
  const { processo } = useOutletContext<{ processo: Processo }>();
  const { data: eventos, loading } = useAgenda({});

  const audiencias = useMemo(
    () => (eventos ?? []).filter((e) => e.tipo === 'audiencia' && e.processoId === processo.id),
    [eventos, processo.id],
  );

  if (loading) return <Skeleton height="160px" />;
  if (audiencias.length === 0) return <EmptyState title="Nenhuma audiência registrada para este processo." />;

  return (
    <DataTable
      columns={columns}
      rows={audiencias}
      getRowId={(e) => e.id}
      emptyMessage="Nenhuma audiência registrada."
    />
  );
}
