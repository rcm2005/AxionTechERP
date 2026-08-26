import { useState } from 'react';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { NovoProcessoModal } from '@/components/modais/NovoProcessoModal';
import { NovoClienteModal } from '@/components/modais/NovoClienteModal';
import { NovaTarefaModal } from '@/components/modais/NovaTarefaModal';
import styles from './AtalhosCard.module.scss';

export function AtalhosCard() {
  const [novoProcessoOpen, setNovoProcessoOpen] = useState(false);
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novaTarefaOpen, setNovaTarefaOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHead title="Atalhos" />
        <CardBody>
          <div className={styles.grid}>
            <button type="button" onClick={() => setNovoClienteOpen(true)}>
              + Novo cliente
            </button>
            <button type="button" onClick={() => setNovoProcessoOpen(true)}>
              + Novo processo
            </button>
            <button type="button" onClick={() => setNovaTarefaOpen(true)}>
              + Nova tarefa
            </button>
            <button type="button" onClick={() => setNovaTarefaOpen(true)}>
              + Novo compromisso
            </button>
          </div>
        </CardBody>
      </Card>

      <NovoProcessoModal open={novoProcessoOpen} onClose={() => setNovoProcessoOpen(false)} />
      <NovoClienteModal open={novoClienteOpen} onClose={() => setNovoClienteOpen(false)} />
      <NovaTarefaModal open={novaTarefaOpen} onClose={() => setNovaTarefaOpen(false)} />
    </>
  );
}
