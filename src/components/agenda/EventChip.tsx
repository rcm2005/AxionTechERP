import clsx from 'clsx';
import type { EventoAgenda } from '@/types';
import { formatTime } from '@/utils/format';
import styles from './EventChip.module.scss';

interface EventChipProps {
  evento: EventoAgenda;
}

export function EventChip({ evento }: EventChipProps) {
  return (
    <div className={clsx(styles.chip, styles[evento.prioridade])}>
      {!evento.diaInteiro && `${formatTime(evento.inicio)} `}
      {evento.titulo}
    </div>
  );
}
