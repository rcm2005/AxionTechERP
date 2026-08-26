import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardBody, CardHead } from '@/components/ui/Card/Card';
import { NovoClienteModal } from '@/components/modais/NovoClienteModal';
import { NovaCobrancaModal } from '@/components/modais/NovaCobrancaModal';
import { paths } from '@/routes/paths';
import styles from './AtalhosCard.module.scss';

export function AtalhosCard() {
  const navigate = useNavigate();
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novaCobrancaOpen, setNovaCobrancaOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHead title="Ações Rápidas" />
        <CardBody>
          <div className={styles.grid}>
            <button type="button" onClick={() => setNovoClienteOpen(true)}>
              + Novo cliente / parceiro
            </button>
            <button type="button" onClick={() => setNovaCobrancaOpen(true)}>
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

      <NovoClienteModal open={novoClienteOpen} onClose={() => setNovoClienteOpen(false)} />
      <NovaCobrancaModal open={novaCobrancaOpen} onClose={() => setNovaCobrancaOpen(false)} />
    </>
  );
}
