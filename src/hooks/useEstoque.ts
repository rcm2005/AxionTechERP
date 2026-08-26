import { buscarProduto, buscarResumoEstoque, listarProdutos } from '@/services/estoque.service';
import type { ProdutoFiltros } from '@/types';
import { useAsync } from './useAsync';

export function useEstoque(filtros: ProdutoFiltros = {}) {
  return useAsync(() => listarProdutos(filtros), [JSON.stringify(filtros)]);
}

export function useProduto(id: string | undefined) {
  return useAsync(() => (id ? buscarProduto(id) : Promise.resolve(undefined)), [id]);
}

export function useResumoEstoque(filtros: ProdutoFiltros = {}) {
  return useAsync(() => buscarResumoEstoque(filtros), [JSON.stringify(filtros)]);
}
