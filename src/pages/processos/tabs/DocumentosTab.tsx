import { useOutletContext } from 'react-router';
import type { Processo } from '@/types';
import { EmptyTab } from './EmptyTab';

export function DocumentosTab() {
  const { processo } = useOutletContext<{ processo: Processo }>();
  return <EmptyTab title={`${processo.qtdDocumentos} documentos vinculados ao processo.`} />;
}
