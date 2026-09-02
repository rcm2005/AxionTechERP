import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useProcessos } from '@/hooks/useProcessos';
import { useClientes } from '@/hooks/useClientes';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Alert } from '@/components/ui/Alert/Alert';
import { Toolbar } from '@/components/ui/Toolbar/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput/SearchInput';
import { SelectField } from '@/components/ui/SelectField/SelectField';
import { Card } from '@/components/ui/Card/Card';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { criarProcessosColumns } from '@/components/processos/processosColumns';
import { NovoProcessoModal } from '@/components/modais/NovoProcessoModal';
import { paths } from '@/routes/paths';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Suspenso', label: 'Suspenso' },
  { value: 'Arquivado', label: 'Arquivado' },
];

export function ProcessosPage() {
  useDocumentTitle('Processos');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todos');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const {
    data: cases,
    loading,
    error: casesError,
    reload: reloadCases,
  } = useProcessos({
    busca: debouncedSearch,
    ...(status !== 'todos' ? { status } : {}),
  });

  const {
    data: clients,
    error: clientsError,
    reload: reloadClients,
  } = useClientes();

  const hasError = casesError || clientsError;
  const handleReload = () => {
    reloadCases();
    reloadClients();
  };

  const clientName = useMemo(() => {
    const clientMap = new Map((clients ?? []).map((client) => [client.id, client.razaoSocialOuNome]));
    // Client might not be in the loaded list (filter/soft-delete); don't hide the row because of that.
    return (id: string) => clientMap.get(id) ?? '—';
  }, [clients]);

  const columns = useMemo(() => criarProcessosColumns(clientName), [clientName]);

  return (
    <section>
      <PageHead
        title="Processos"
        subtitle="Carteira contenciosa do escritório — número CNJ, tribunal, vara, fase e valor da causa."
        actions={
          <Button variant="primary" onClick={() => setNewModalOpen(true)}>
            + Novo processo
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          placeholder="Buscar por número CNJ, tribunal, vara ou fase..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </Toolbar>

      <Card>
        {hasError ? (
          <Alert
            tone="danger"
            title="Erro ao carregar dados"
            description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
            action={
              <Button variant="ghost" onClick={handleReload}>
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={cases ?? []}
            getRowId={(caseItem) => caseItem.id}
            loading={loading}
            emptyMessage="Nenhum processo encontrado para os filtros selecionados."
            onRowClick={(caseItem) => navigate(paths.processo(caseItem.id))}
          />
        )}
      </Card>

      <NovoProcessoModal open={newModalOpen} onClose={() => setNewModalOpen(false)} onCreated={reloadCases} />
    </section>
  );
}
