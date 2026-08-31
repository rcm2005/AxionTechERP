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

/** Status é texto livre no backend; mapeamos os conhecidos e caímos em neutro. */
function toneDoStatus(status: string): Tone {
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
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('todos');
  const [novoOpen, setNovoOpen] = useState(false);
  const buscaDebounced = useDebounce(busca);

  const {
    data: contratos,
    loading,
    reload,
  } = useContratos({
    busca: buscaDebounced,
    ...(status !== 'todos' ? { status } : {}),
  });

  const { data: clientes } = useClientes();
  const nomeCliente = useMemo(() => {
    const mapa = new Map((clientes ?? []).map((c) => [c.id, c.razaoSocialOuNome]));
    return (id: string) => mapa.get(id) ?? '—';
  }, [clientes]);

  const columns: Column<Contrato>[] = useMemo(
    () => [
      {
        key: 'titulo',
        header: 'Contrato',
        render: (c) => (
          <div>
            <div>{c.titulo}</div>
            <small style={{ color: 'var(--color-muted)' }}>{nomeCliente(c.cliente_id)}</small>
          </div>
        ),
      },
      { key: 'tipo', header: 'Tipo', width: '130px', render: (c) => <Pill tone="blue">{c.tipo}</Pill> },
      {
        key: 'valor',
        header: 'Valor',
        width: '130px',
        align: 'right',
        render: (c) => formatBRLDecimal(c.valor),
      },
      {
        key: 'vigencia',
        header: 'Vigência',
        width: '200px',
        render: (c) =>
          `${formatDate(c.data_inicio)} — ${c.data_fim ? formatDate(c.data_fim) : 'indeterminada'}`,
      },
      {
        key: 'status',
        header: 'Status',
        width: '110px',
        render: (c) => <Pill tone={toneDoStatus(c.status)}>{c.status}</Pill>,
      },
    ],
    [nomeCliente],
  );

  return (
    <section>
      <PageHead
        title="Contratos"
        subtitle="Contratos de honorários por cliente — consultoria, mensal, êxito e pareceres."
        actions={
          <Button variant="primary" onClick={() => setNovoOpen(true)}>
            + Novo contrato
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          placeholder="Buscar por título ou tipo de contrato..."
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
        <DataTable
          columns={columns}
          rows={contratos ?? []}
          getRowId={(c) => c.id}
          loading={loading}
          emptyMessage="Nenhum contrato encontrado para os filtros selecionados."
        />
      </Card>

      <NovoContratoModal open={novoOpen} onClose={() => setNovoOpen(false)} onCreated={reload} />
    </section>
  );
}
