import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { NovoClienteModal } from '@/components/modais/NovoClienteModal';
import { NovaCobrancaModal } from '@/components/modais/NovaCobrancaModal';
import { paths } from '@/routes/paths';
import styles from './AtalhosCard.module.scss';

export function QuickActionsCard() {
  const navigate = useNavigate();
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newChargeOpen, setNewChargeOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHead title="Ações Rápidas" />
        <CardBody>
          <div className={styles.grid}>
            <button type="button" onClick={() => setNewClientOpen(true)}>
              + Novo cliente / parceiro
            </button>
            <button type="button" onClick={() => setNewChargeOpen(true)}>
              + Novo lançamento financeiro
            </button>
            <button type="button" onClick={() => navigate(paths.clientes)}>
              Ver todos os clientes
            </button>
            <button type="button" onClick={() => navigate(paths.financeiro)}>
              Fluxo financeiro
            </button>
          </div>
        </CardBody>
      </Card>

      <NovoClienteModal open={newClientOpen} onClose={() => setNewClientOpen(false)} />
      <NovaCobrancaModal open={newChargeOpen} onClose={() => setNewChargeOpen(false)} />
    </>
  );
}
