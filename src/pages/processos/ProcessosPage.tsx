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
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('todos');
  const [novoOpen, setNovoOpen] = useState(false);
  const buscaDebounced = useDebounce(busca);

  const {
    data: processos,
    loading,
    error: errorProcessos,
    reload: reloadProcessos,
  } = useProcessos({
    busca: buscaDebounced,
    ...(status !== 'todos' ? { status } : {}),
  });

  const {
    data: clientes,
    error: errorClientes,
    reload: reloadClientes,
  } = useClientes();

  const erro = errorProcessos || errorClientes;
  const handleReload = () => {
    reloadProcessos();
    reloadClientes();
  };

  const nomeCliente = useMemo(() => {
    const mapa = new Map((clientes ?? []).map((c) => [c.id, c.razaoSocialOuNome]));
    // Cliente pode não estar na lista carregada (filtro/soft-delete); não some a linha por isso.
    return (id: string) => mapa.get(id) ?? '—';
  }, [clientes]);

  const columns = useMemo(() => criarProcessosColumns(nomeCliente), [nomeCliente]);

  return (
    <section>
      <PageHead
        title="Processos"
        subtitle="Carteira contenciosa do escritório — número CNJ, tribunal, vara, fase e valor da causa."
        actions={
          <Button variant="primary" onClick={() => setNovoOpen(true)}>
            + Novo processo
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          placeholder="Buscar por número CNJ, tribunal, vara ou fase..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <SelectField
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </Toolbar>

      <Card>
        {erro ? (
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
            rows={processos ?? []}
            getRowId={(p) => p.id}
            loading={loading}
            emptyMessage="Nenhum processo encontrado para os filtros selecionados."
            onRowClick={(p) => navigate(paths.processo(p.id))}
          />
        )}
      </Card>

      <NovoProcessoModal open={novoOpen} onClose={() => setNovoOpen(false)} onCreated={reloadProcessos} />
    </section>
  );
}
