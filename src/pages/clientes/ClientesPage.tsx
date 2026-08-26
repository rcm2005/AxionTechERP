import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { db } from '@/mocks';
import { useClientes } from '@/hooks/useClientes';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/contexts/ToastContext';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Toolbar } from '@/components/ui/Toolbar/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput/SearchInput';
import { SelectField } from '@/components/ui/SelectField/SelectField';
import { Card } from '@/components/ui/Card/Card';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { clientesColumns } from '@/components/clientes/clientesColumns';
import { paths } from '@/routes/paths';
import { NovoClienteModal } from '@/components/modais/NovoClienteModal';
import type { ClienteStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'prospect', label: 'Prospect' },
];

export function ClientesPage() {
  useDocumentTitle('Clientes');
  const toast = useToast();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<ClienteStatus | 'todos'>('todos');
  const [responsavelId, setResponsavelId] = useState('todos');
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const buscaDebounced = useDebounce(busca);

  const responsavelOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos os advogados' },
      ...db.usuarios
        .filter((u) => u.role !== 'financeiro')
        .map((u) => ({ value: u.id, label: u.nomeExibicao })),
    ],
    [],
  );

  const { data: clientes, loading } = useClientes({
    busca: buscaDebounced,
    status,
    responsavelId,
  });

  return (
    <section>
      <PageHead
        title="Clientes"
        subtitle="Cadastro, relacionamento e situação financeira dos clientes."
        actions={
          <>
            <Button onClick={() => toast.show('Exportação preparada')}>Exportar</Button>
            <Button variant="primary" onClick={() => setNovoClienteOpen(true)}>
              + Novo cliente
            </Button>
          </>
        }
      />

      <Toolbar>
        <SearchInput
          placeholder="Buscar por nome, CPF/CNPJ..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <SelectField
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value as ClienteStatus | 'todos')}
        />
        <SelectField
          options={responsavelOptions}
          value={responsavelId}
          onChange={(e) => setResponsavelId(e.target.value)}
        />
      </Toolbar>

      <Card>
        <DataTable
          columns={clientesColumns}
          rows={clientes ?? []}
          getRowId={(c) => c.id}
          loading={loading}
          emptyMessage="Nenhum cliente encontrado para os filtros selecionados."
          onRowClick={(c) => navigate(paths.cliente(c.id))}
        />
      </Card>

      <NovoClienteModal open={novoClienteOpen} onClose={() => setNovoClienteOpen(false)} />
    </section>
  );
}
