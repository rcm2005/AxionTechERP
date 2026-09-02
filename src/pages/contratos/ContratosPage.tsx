import { useMemo, useState } from 'react';
import { useContratos } from '@/hooks/useContratos';
import { useClientes } from '@/hooks/useClientes';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Toolbar } from '@/components/ui/Toolbar/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput/SearchInput';
import { SelectField } from '@/components/ui/SelectField/SelectField';
import { Card } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import { DataTable, type Column } from '@/components/ui/DataTable/DataTable';
import { Pill } from '@/components/ui/Pill/Pill';
import { NovoContratoModal } from '@/components/modais/NovoContratoModal';
import { formatBRLDecimal, formatDate } from '@/utils/format';
import type { Contrato, Tone } from '@/types';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'encerrado', label: 'Encerrados' },
  { value: 'cancelado', label: 'Cancelados' },
];

/** Status is free-form text in the backend; we map known ones and fall back to neutral. */
function statusTone(status: string): Tone {
  switch (status.toLowerCase()) {
    case 'ativo':
      return 'green';
    case 'encerrado':
      return 'neutral';
    case 'cancelado':
      return 'red';
    default:
      return 'blue';
  }
}

export function ContratosPage() {
  useDocumentTitle('Contratos');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todos');
  const [newOpen, setNewOpen] = useState(false);
  const searchDebounced = useDebounce(search);

  const {
    data: contracts,
    loading,
    error,
    reload,
  } = useContratos({
    busca: searchDebounced,
    ...(status !== 'todos' ? { status } : {}),
  });

  const { data: clients } = useClientes();
  const clientName = useMemo(() => {
    const map = new Map((clients ?? []).map((client) => [client.id, client.razaoSocialOuNome]));
    return (id: string) => map.get(id) ?? '—';
  }, [clients]);

  const columns: Column<Contrato>[] = useMemo(
    () => [
      {
        key: 'titulo',
        header: 'Contrato',
        render: (contract) => (
          <div>
            <div>{contract.titulo}</div>
            <small style={{ color: 'var(--color-muted)' }}>{clientName(contract.cliente_id)}</small>
          </div>
        ),
      },
      { key: 'tipo', header: 'Tipo', width: '130px', render: (contract) => <Pill tone="blue">{contract.tipo}</Pill> },
      {
        key: 'valor',
        header: 'Valor',
        width: '130px',
        align: 'right',
        render: (contract) => formatBRLDecimal(contract.valor),
      },
      {
        key: 'vigencia',
        header: 'Vigência',
        width: '200px',
        render: (contract) =>
          `${formatDate(contract.data_inicio)} — ${contract.data_fim ? formatDate(contract.data_fim) : 'indeterminada'}`,
      },
      {
        key: 'status',
        header: 'Status',
        width: '110px',
        render: (contract) => <Pill tone={statusTone(contract.status)}>{contract.status}</Pill>,
      },
    ],
    [clientName],
  );

  return (
    <section>
      <PageHead
        title="Contratos"
        subtitle="Contratos de honorários por cliente — consultoria, mensal, êxito e pareceres."
        actions={
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            + Novo contrato
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          placeholder="Buscar por título ou tipo de contrato..."
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
        {error ? (
          <Alert
            tone="danger"
            title="Erro ao carregar dados"
            description="Não foi possível carregar as informações. Verifique sua conexão e tente novamente."
            action={
              <Button variant="ghost" onClick={reload}>
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={contracts ?? []}
            getRowId={(contract) => contract.id}
            loading={loading}
            emptyMessage="Nenhum contrato encontrado para os filtros selecionados."
          />
        )}
      </Card>

      <NovoContratoModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={reload} />
    </section>
  );
}
