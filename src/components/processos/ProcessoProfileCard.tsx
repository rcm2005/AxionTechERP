import type { Processo } from '@/types';
import { db } from '@/mocks';
import { Card } from '@/components/ui/Card/Card';
import { FieldRow } from '@/components/ui/FieldRow/FieldRow';
import { Pill } from '@/components/ui/Pill/Pill';
import { formatBRL, formatDate } from '@/utils/format';
import { processoStatusMeta } from '@/utils/statusMaps';
import styles from './ProcessoProfileCard.module.scss';

interface ProcessoProfileCardProps {
  processo: Processo;
}

export function ProcessoProfileCard({ processo }: ProcessoProfileCardProps) {
  const cliente = db.clientes.find((c) => c.id === processo.clienteId);
  const advogado = db.usuarios.find((u) => u.id === processo.advogadoId);
  const statusMeta = processoStatusMeta[processo.status];

  return (
    <Card padded className={styles.root}>
      <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
      <h2 className={styles.numero}>{processo.numeroCnj}</h2>
      <p className={styles.subtitulo}>
        {processo.titulo} • {processo.faseProcessual}
      </p>

      <FieldRow label="Cliente">{cliente?.nome ?? '—'}</FieldRow>
      <FieldRow label="Parte contrária">{processo.parteContraria}</FieldRow>
      <FieldRow label="Tribunal / Vara">
        {processo.tribunal} • {processo.vara}
      </FieldRow>
      <FieldRow label="Advogado responsável">{advogado?.nomeExibicao ?? '—'}</FieldRow>
      <FieldRow label="Valor da causa">{formatBRL(processo.valorCausaCentavos)}</FieldRow>
      {processo.proximoPrazo && (
        <FieldRow label="Próximo prazo">
          <Pill tone="red">{formatDate(processo.proximoPrazo)}</Pill>
        </FieldRow>
      )}
    </Card>
  );
}
