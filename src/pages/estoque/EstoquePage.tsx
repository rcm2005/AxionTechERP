import { useMemo, useState } from 'react';
import { useEstoque } from '@/hooks/useEstoque';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/contexts/ToastContext';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { Toolbar } from '@/components/ui/Toolbar/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput/SearchInput';
import { SelectField } from '@/components/ui/SelectField/SelectField';
import { Card } from '@/components/ui/Card/Card';
import { KpiCard } from '@/components/ui/KpiCard/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { estoqueColumns } from '@/components/estoque/estoqueColumns';
import { NovoProdutoModal } from '@/components/modais/NovoProdutoModal';
import { calcularResumoEstoque } from '@/services/estoque.service';
import { formatBRL } from '@/utils/format';
import type { TipoProduto, ProdutoStatus } from '@/types';
import styles from './EstoquePage.module.scss';

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'PA', label: 'Produto Acabado (PA)' },
  { value: 'MP', label: 'Matéria-Prima (MP)' },
  { value: 'Consumo', label: 'Uso & Consumo' },
  { value: 'Embalagem', label: 'Embalagens' },
  { value: 'Servico', label: 'Mão de Obra / Serviço' },
];

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'fora_de_linha', label: 'Fora de linha' },
];

export function EstoquePage() {
  useDocumentTitle('Estoque & Inventário');
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<TipoProduto | 'todos'>('todos');
  const [status, setStatus] = useState<ProdutoStatus | 'todos'>('todos');
  const [novoProdutoOpen, setNovoProdutoOpen] = useState(false);
  const buscaDebounced = useDebounce(busca);

  const { data: produtos, loading } = useEstoque({
    busca: buscaDebounced,
    tipo,
    status,
  });

  const resumo = useMemo(() => calcularResumoEstoque(produtos ?? []), [produtos]);

  return (
    <section>
      <PageHead
        title="Estoque & Inventário"
        subtitle="Catálogo de SKUs, saldos físicos e valoração de inventário."
        actions={
          <>
            <Button onClick={() => toast.show('Relatório de inventário exportado!')}>Exportar</Button>
            <Button variant="primary" onClick={() => setNovoProdutoOpen(true)}>
              + Novo Produto
            </Button>
          </>
        }
      />

      {/* 3 KpiCards com o totalizador de custo e indicadores */}
      <div className={styles.kpis}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="90px" />)
        ) : (
          <>
            <KpiCard
              label="Valor Total em Estoque"
              value={formatBRL(resumo.valorTotalEstoqueCentavos)}
              sub={`${resumo.saldoTotalFisico.toLocaleString('pt-BR')} unidades físicas em saldo`}
              subTone="green"
            />
            <KpiCard
              label="Total de Itens / SKUs"
              value={String(resumo.totalItens)}
              sub={`${resumo.totalAtivos} SKUs com status ativo`}
              subTone="blue"
            />
            <KpiCard
              label="Abaixo do Estoque Mínimo"
              value={String(resumo.skusAbaixoMinimo)}
              sub={
                resumo.skusAbaixoMinimo > 0
                  ? 'Necessitam de reposição imediata'
                  : 'Nenhum SKU em nível crítico'
              }
              subTone={resumo.skusAbaixoMinimo > 0 ? 'red' : 'green'}
            />
          </>
        )}
      </div>

      <Toolbar>
        <SearchInput
          placeholder="Buscar por SKU, nome, NCM, EAN, categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <SelectField
          options={TIPO_OPTIONS}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoProduto | 'todos')}
        />
        <SelectField
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value as ProdutoStatus | 'todos')}
        />
      </Toolbar>

      <Card>
        <DataTable
          columns={estoqueColumns}
          rows={produtos ?? []}
          getRowId={(p) => p.id}
          loading={loading}
          emptyMessage="Nenhum produto ou SKU encontrado para os filtros selecionados."
        />
      </Card>

      <NovoProdutoModal open={novoProdutoOpen} onClose={() => setNovoProdutoOpen(false)} />
    </section>
  );
}
