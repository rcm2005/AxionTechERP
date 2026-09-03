import type { Pessoa, PessoaFiltros } from '@/types';
import { db, saveDB } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export function filterClients(clients: Pessoa[], filters: PessoaFiltros): Pessoa[] {
  const search = filters.busca?.trim().toLowerCase();

  return clients.filter((client) => {
    if (search) {
      const target = `${client.razaoSocialOuNome} ${client.nomeFantasia ?? ''} ${client.documento} ${client.email}`.toLowerCase();
      if (!target.includes(search)) return false;
    }
    if (filters.status && filters.status !== 'todos' && client.status !== filters.status) return false;
    if (filters.relacao && filters.relacao !== 'todos' && client.relacao !== filters.relacao) return false;
    if (filters.tipoPessoa && filters.tipoPessoa !== 'todos' && client.tipoPessoa !== filters.tipoPessoa) return false;
    if (filters.situacaoCredito && filters.situacaoCredito !== 'todos' && client.situacaoCredito !== filters.situacaoCredito) return false;
    return true;
  });
}

// --- Real API shapes (apps/api), local to this file — not part of the frontend's @/types contract ---

interface ApiContato {
  tipo: string;
  valor: string;
}

interface ApiCliente {
  id: string;
  tenant_id: string;
  tipo: 'pf' | 'pj';
  nome: string;
  cpf_cnpj: string;
  contatos: ApiContato[];
  created_at: string;
  deleted_at: string | null;
}

interface ApiFinanceiroLancamento {
  id: string;
  cliente_id: string | null;
  valor: string;
  status: 'pendente' | 'pago' | 'cancelado';
  vencimento: string;
}

/** Parses a decimal string like "4500.00" into integer cents, without float rounding error. */
function parseValorToCentavos(valor: string): number {
  const [reais, centavosRaw = '0'] = valor.split('.');
  const centavos = centavosRaw.padEnd(2, '0').slice(0, 2);
  return parseInt(reais, 10) * 100 + parseInt(centavos, 10);
}

/**
 * Sums pending (`status: 'pendente'`) financeiro-lancamentos whose `vencimento` is in the past,
 * grouped by `cliente_id`. Pass `clienteId` to scope the fetch to a single client (used by
 * `getClient`); omit it to fetch tenant-wide (used by `listClients`).
 */
async function fetchOverdueTotalsByClient(clienteId?: string): Promise<Map<string, number>> {
  const params: Record<string, string> = { status: 'pendente' };
  if (clienteId) params.cliente_id = clienteId;

  const { data } = await http.get<ApiFinanceiroLancamento[]>('/financeiro-lancamentos', { params });
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD', comparable lexicographically

  const totals = new Map<string, number>();
  for (const lancamento of data) {
    if (!lancamento.cliente_id) continue;
    if (lancamento.vencimento >= today) continue; // not overdue yet
    const current = totals.get(lancamento.cliente_id) ?? 0;
    totals.set(lancamento.cliente_id, current + parseValorToCentavos(lancamento.valor));
  }
  return totals;
}

/**
 * Maps a raw API `clientes` row onto the frontend `Pessoa` contract. Fields the backend has no
 * column for (relacao, status, endereco, contatoPrincipal, nomeFantasia, segmento, observacoes,
 * limiteCreditoCentavos, inscricaoEstadual, inscricaoMunicipal, isentoIE, atualizadoEm) are
 * intentionally left unset — do not default them to fabricated values.
 */
function mapApiClientToPessoa(api: ApiCliente, overdueCentavos: number): Pessoa {
  const emailContato = api.contatos.find((c) => c.tipo === 'email');
  const telefoneContato = api.contatos.find((c) => c.tipo === 'telefone');
  const whatsappContato = api.contatos.find((c) => c.tipo === 'whatsapp');

  return {
    id: api.id,
    tenantId: api.tenant_id,
    tipoPessoa: api.tipo === 'pf' ? 'PF' : 'PJ',
    razaoSocialOuNome: api.nome,
    documento: api.cpf_cnpj,
    email: emailContato?.valor ?? '',
    telefone: telefoneContato?.valor ?? whatsappContato?.valor ?? '',
    whatsapp: whatsappContato?.valor,
    situacaoCredito: overdueCentavos > 0 ? 'inadimplente' : 'aprovado',
    valorEmAtrasoCentavos: overdueCentavos,
    criadoEm: api.created_at,
  };
}

export async function listClients(filters: PessoaFiltros = {}): Promise<Pessoa[]> {
  if (USE_MOCKS) {
    await delay();
    return filterClients(db.pessoas, filters);
  }
  const { data } = await http.get<ApiCliente[]>('/clientes');
  const overdueTotals = await fetchOverdueTotalsByClient();
  const mapped = data.map((apiClient) =>
    mapApiClientToPessoa(apiClient, overdueTotals.get(apiClient.id) ?? 0),
  );
  // The backend ignores query params on GET /clientes (no filtering support server-side), so
  // filtering has to happen here, client-side, same as the mock path.
  return filterClients(mapped, filters);
}

export async function getClient(id: string): Promise<Pessoa | undefined> {
  if (USE_MOCKS) {
    await delay();
    return db.pessoas.find((client) => client.id === id);
  }
  const { data } = await http.get<ApiCliente>(`/clientes/${id}`);
  const overdueTotals = await fetchOverdueTotalsByClient(id);
  return mapApiClientToPessoa(data, overdueTotals.get(id) ?? 0);
}

export async function createClient(
  clientData: Omit<Pessoa, 'id' | 'criadoEm'>,
): Promise<Pessoa> {
  if (USE_MOCKS) {
    await delay(300);
    const created: Pessoa = {
      ...clientData,
      id: `pes-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };
    db.pessoas.push(created);
    saveDB();
    return created;
  }

  const contatos: ApiContato[] = [];
  if (clientData.email) contatos.push({ tipo: 'email', valor: clientData.email });
  if (clientData.telefone) contatos.push({ tipo: 'telefone', valor: clientData.telefone });
  if (clientData.whatsapp) contatos.push({ tipo: 'whatsapp', valor: clientData.whatsapp });

  const payload = {
    tipo: clientData.tipoPessoa === 'PF' ? 'pf' : 'pj',
    nome: clientData.razaoSocialOuNome,
    cpf_cnpj: clientData.documento,
    contatos,
  };

  const { data } = await http.post<ApiCliente>('/clientes', payload);
  // A brand-new client has no financeiro-lancamentos yet, so it can't be overdue.
  return mapApiClientToPessoa(data, 0);
}
