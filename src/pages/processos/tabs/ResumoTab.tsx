import { useOutletContext } from 'react-router';
import type { Processo } from '@/types';
import { useAndamentos } from '@/hooks/useProcessos';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { Timeline } from '@/components/ui/Timeline/Timeline';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { formatDate, formatDayMonth } from '@/utils/format';
import styles from './ResumoTab.module.scss';

export function ResumoTab() {
  const { processo } = useOutletContext<{ processo: Processo }>();
  const { data: andamentos, loading } = useAndamentos(processo.id);

  return (
    <div>
      <div className={styles.kpis}>
        <KpiCard label="Fase processual" value={processo.faseProcessual} sub="Em análise" />
        <KpiCard
          label="Próxima audiência"
          value={processo.proximaAudiencia ? formatDayMonth(processo.proximaAudiencia) : '—'}
          sub={processo.proximaAudiencia ? undefined : 'Nenhuma agendada'}
        />
        <KpiCard
          label="Documentos"
          value={String(processo.qtdDocumentos)}
          sub={`${processo.qtdDocumentosPendentes} pendentes`}
          subTone={processo.qtdDocumentosPendentes > 0 ? 'orange' : 'green'}
        />
      </div>

      <div className={styles.timelineWrap}>
        {loading && <Skeleton height="120px" />}
        {!loading && (andamentos?.length ?? 0) === 0 && (
          <EmptyState title="Nenhum andamento registrado ainda." />
        )}
        {!loading && andamentos && andamentos.length > 0 && (
          <Timeline
            items={andamentos.map((a) => ({
              id: a.id,
              dateLabel: formatDate(a.data).toUpperCase(),
              title: a.titulo,
              description: a.descricao,
            }))}
          />
        )}
      </div>
    </div>
  );
}
