import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useClientes } from '@/hooks/useClientes';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/contexts/ToastContext';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Alert } from '@/components/ui/Alert/Alert';
import { Toolbar } from '@/components/ui/Toolbar/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput/SearchInput';
import { Card } from '@/components/ui/Card/Card';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { clientesColumns } from '@/components/clientes/clientesColumns';
import { paths } from '@/routes/paths';
import { NovoClienteModal } from '@/components/modais/NovoClienteModal';
import { downloadCsv } from '@/utils/csv';
import { situacaoCreditoMeta } from '@/utils/statusMaps';
import { formatBRL } from '@/utils/format';

export function ClientesPage() {
  useDocumentTitle('Clientes e Parceiros');
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [newClientOpen, setNewClientOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const {
    data: clients,
    loading,
    error,
    reload,
  } = useClientes({
    busca: debouncedSearch,
  });

  function handleExport() {
    const rows = (clients ?? []).map((client) => [
      client.razaoSocialOuNome,
      client.nomeFantasia ?? '',
      client.tipoPessoa,
      client.documento,
      client.email,
      client.telefone,
      situacaoCreditoMeta[client.situacaoCredito]?.label ?? client.situacaoCredito,
      formatBRL(client.valorEmAtrasoCentavos),
    ]);
    downloadCsv('clientes-axion.csv', [
      'Razão Social / Nome',
      'Nome Fantasia',
      'Tipo',
      'Documento',
      'E-mail',
      'Telefone',
      'Situação de Crédito',
      'Valor em Atraso (R$)',
    ], rows);
    toast.show(`${(clients ?? []).length} parceiro(s) exportado(s) em CSV.`);
  }

  return (
    <section>
      <PageHead
        title="Clientes & Parceiros Comerciais"
        subtitle="Cadastro B2B, análise de crédito e histórico de relacionamento."
        actions={
          <>
            <Button onClick={handleExport}>Exportar</Button>
            <Button variant="primary" onClick={() => setNewClientOpen(true)}>
              + Novo parceiro
            </Button>
          </>
        }
      />

      <Toolbar>
        <SearchInput
          placeholder="Buscar por razão social, fantasia, CNPJ/CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            columns={clientesColumns}
            rows={clients ?? []}
            getRowId={(client) => client.id}
            loading={loading}
            emptyMessage="Nenhum parceiro comercial encontrado para os filtros selecionados."
            onRowClick={(client) => navigate(paths.cliente(client.id))}
          />
        )}
      </Card>

      <NovoClienteModal open={newClientOpen} onClose={() => setNewClientOpen(false)} />
    </section>
  );
}
