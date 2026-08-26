import type { Produto, ProdutoFiltros } from '@/types';
import { db, saveDB } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface ResumoEstoque {
  /** Quantidade total de SKUs cadastrados */
  totalItens: number;
  /** Soma do saldo físico de todas as unidades em estoque */
  saldoTotalFisico: number;
  /** Valor total do inventário em centavos de Real = soma(estoqueAtual * custoMedio) */
  valorTotalEstoqueCentavos: number;
  /** Quantidade de SKUs com estoque atual no ou abaixo do nível mínimo */
  skusAbaixoMinimo: number;
  /** Total de SKUs com status ativo */
  totalAtivos: number;
}

export function calcularResumoEstoque(produtos: Produto[]): ResumoEstoque {
  const totalItens = produtos.length;
  let saldoTotalFisico = 0;
  let valorTotalEstoqueCentavos = 0;
  let skusAbaixoMinimo = 0;
  let totalAtivos = 0;

  for (const prod of produtos) {
    const qtd = prod.estoqueAtual ?? 0;
    const custo = prod.custoMedio ?? 0;

    saldoTotalFisico += qtd;
    valorTotalEstoqueCentavos += qtd * custo;

    if (qtd <= prod.estoqueMinimo) {
      skusAbaixoMinimo++;
    }

    if (prod.status === 'ativo') {
      totalAtivos++;
    }
  }

  return {
    totalItens,
    saldoTotalFisico,
    valorTotalEstoqueCentavos,
    skusAbaixoMinimo,
    totalAtivos,
  };
}

export function filtrarProdutos(produtos: Produto[], filtros: ProdutoFiltros = {}): Produto[] {
  const busca = filtros.busca?.trim().toLowerCase();

  return produtos.filter((p) => {
    if (busca) {
      const alvo = `${p.sku} ${p.nome} ${p.descricao ?? ''} ${p.ean ?? ''} ${p.ncm} ${p.categoria ?? ''} ${p.fabricanteMarca ?? ''}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }

    if (filtros.tipo && filtros.tipo !== 'todos' && p.tipo !== filtros.tipo) {
      return false;
    }

    if (filtros.status && filtros.status !== 'todos' && p.status !== filtros.status) {
      return false;
    }

    if (filtros.categoria && filtros.categoria !== 'todos' && p.categoria !== filtros.categoria) {
      return false;
    }

    if (filtros.abaixoEstoqueMinimo && p.estoqueAtual > p.estoqueMinimo) {
      return false;
    }

    if (filtros.tenantId && p.tenantId !== filtros.tenantId) {
      return false;
    }

    return true;
  });
}

export async function listarProdutos(filtros: ProdutoFiltros = {}): Promise<Produto[]> {
  if (USE_MOCKS) {
    await delay();
    return filtrarProdutos(db.produtos, filtros);
  }
  const { data } = await http.get<Produto[]>('/estoque/produtos', { params: filtros });
  return data;
}

export async function buscarProduto(id: string): Promise<Produto | undefined> {
  if (USE_MOCKS) {
    await delay();
    return db.produtos.find((p) => p.id === id);
  }
  const { data } = await http.get<Produto>(`/estoque/produtos/${id}`);
  return data;
}

export async function buscarResumoEstoque(filtros: ProdutoFiltros = {}): Promise<ResumoEstoque> {
  if (USE_MOCKS) {
    await delay();
    const filtrados = filtrarProdutos(db.produtos, filtros);
    return calcularResumoEstoque(filtrados);
  }
  const { data } = await http.get<ResumoEstoque>('/estoque/resumo', { params: filtros });
  return data;
}

export async function criarProduto(dados: Omit<Produto, 'id' | 'criadoEm'>): Promise<Produto> {
  if (USE_MOCKS) {
    await delay(300);
    const novo: Produto = {
      ...dados,
      id: `prod-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };
    db.produtos.unshift(novo);
    saveDB();
    return novo;
  }
  const { data } = await http.post<Produto>('/estoque/produtos', dados);
  return data;
}

export async function atualizarProduto(id: string, dados: Partial<Produto>): Promise<Produto> {
  if (USE_MOCKS) {
    await delay(300);
    const idx = db.produtos.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Produto ${id} não encontrado.`);
    }
    const atualizado: Produto = {
      ...db.produtos[idx],
      ...dados,
      atualizadoEm: new Date().toISOString(),
    };
    db.produtos[idx] = atualizado;
    saveDB();
    return atualizado;
  }
  const { data } = await http.put<Produto>(`/estoque/produtos/${id}`, dados);
  return data;
}
